"""
CloudiQS MSP AI Summary Generator
Generates AI-powered summaries of access sessions using AWS Bedrock
"""
import json
import boto3
import os
from datetime import datetime

bedrock_runtime = boto3.client('bedrock-runtime', region_name=os.environ.get('AWS_REGION', 'us-east-1'))
cloudtrail = boto3.client('cloudtraillake', region_name=os.environ.get('AWS_REGION', 'us-east-1'))
dynamodb = boto3.resource('dynamodb')

def get_cloudtrail_events(account_id, username, start_time, end_time, event_data_store_id):
    """Fetch CloudTrail events for the session"""
    try:
        query_statement = f"""
        SELECT eventName, eventSource, eventTime, userIdentity, requestParameters, responseElements, errorCode, errorMessage
        FROM {event_data_store_id}
        WHERE userIdentity.principalId LIKE '%{username}%'
        AND eventTime >= '{start_time}'
        AND eventTime <= '{end_time}'
        AND recipientAccountId = '{account_id}'
        ORDER BY eventTime DESC
        LIMIT 1000
        """
        
        response = cloudtrail.start_query(
            QueryStatement=query_statement
        )
        
        query_id = response['QueryId']
        
        # Wait for query to complete
        while True:
            status_response = cloudtrail.get_query_results(QueryId=query_id)
            status = status_response['QueryStatus']
            
            if status == 'FINISHED':
                return status_response.get('QueryResultRows', [])
            elif status == 'FAILED' or status == 'CANCELLED' or status == 'TIMED_OUT':
                print(f"Query failed with status: {status}")
                return []
            
            # Wait a bit before checking again
            import time
            time.sleep(2)
    
    except Exception as e:
        print(f"Error fetching CloudTrail events: {e}")
        return []

def generate_ai_summary(events, customer_name, account_name, role, username):
    """Generate AI summary using AWS Bedrock"""
    
    if not events:
        return "No activity recorded during this access session."
    
    # Prepare event summary for AI
    event_summary = []
    for event in events[:50]:  # Limit to first 50 events
        event_name = event.get('eventName', 'Unknown')
        event_source = event.get('eventSource', 'Unknown')
        event_time = event.get('eventTime', 'Unknown')
        error_code = event.get('errorCode', '')
        
        event_summary.append({
            'action': event_name,
            'service': event_source,
            'time': event_time,
            'status': 'Error' if error_code else 'Success'
        })
    
    # Create prompt for Bedrock
    prompt = f"""
You are an AWS security analyst creating a summary for a customer approval email. 

Analyze the following AWS access session and create a concise, customer-friendly summary.

Session Details:
- Customer: {customer_name}
- Account: {account_name}
- Role: {role}
- User: {username}

Activity Log ({len(events)} total actions):
{json.dumps(event_summary, indent=2)}

Please provide:
1. A brief overview (2-3 sentences) of what actions were performed
2. Key services accessed
3. Any notable or high-risk actions
4. Overall assessment (routine maintenance, investigation, configuration change, etc.)

Keep the summary professional, clear, and suitable for a non-technical customer.
Focus on business impact rather than technical details.
"""
    
    try:
        # Call Bedrock with Claude model
        model_id = "anthropic.claude-3-sonnet-20240229-v1:0"
        
        request_body = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 500,
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 0.5
        }
        
        response = bedrock_runtime.invoke_model(
            modelId=model_id,
            contentType="application/json",
            accept="application/json",
            body=json.dumps(request_body)
        )
        
        response_body = json.loads(response['body'].read())
        summary = response_body['content'][0]['text']
        
        return summary
    
    except Exception as e:
        print(f"Error generating AI summary with Bedrock: {e}")
        
        # Fallback to simple summary
        return generate_fallback_summary(event_summary, len(events))

def generate_fallback_summary(event_summary, total_events):
    """Generate a simple summary without AI"""
    
    services = set()
    actions = {}
    errors = 0
    
    for event in event_summary:
        services.add(event['service'])
        action = event['action']
        actions[action] = actions.get(action, 0) + 1
        if event['status'] == 'Error':
            errors += 1
    
    # Create summary
    summary_parts = []
    summary_parts.append(f"Session Summary: {total_events} actions performed across {len(services)} AWS services.")
    summary_parts.append(f"\nServices accessed: {', '.join(list(services)[:5])}")
    
    top_actions = sorted(actions.items(), key=lambda x: x[1], reverse=True)[:5]
    summary_parts.append(f"\nTop actions: {', '.join([f'{action} ({count}x)' for action, count in top_actions])}")
    
    if errors > 0:
        summary_parts.append(f"\nNote: {errors} actions resulted in errors.")
    
    summary_parts.append("\n\nThis appears to be routine administrative activity.")
    
    return '\n'.join(summary_parts)

def handler(event, context):
    """
    Generate AI summary for an access session
    """
    print(f"Event: {json.dumps(event)}")
    
    try:
        # Parse input
        session_id = event.get('sessionId')
        request_id = event.get('requestId')
        account_id = event.get('accountId')
        username = event.get('username')
        start_time = event.get('startTime')
        end_time = event.get('endTime')
        customer_name = event.get('customerName', 'Customer')
        account_name = event.get('accountName', 'AWS Account')
        role = event.get('role', 'Unknown Role')
        event_data_store_id = event.get('eventDataStoreId')
        
        if not all([account_id, username, start_time, end_time]):
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Missing required parameters'})
            }
        
        # Fetch CloudTrail events
        print("Fetching CloudTrail events...")
        events = get_cloudtrail_events(account_id, username, start_time, end_time, event_data_store_id)
        
        # Generate AI summary
        print("Generating AI summary...")
        summary = generate_ai_summary(events, customer_name, account_name, role, username)
        
        # Store summary in sessions table if session_id provided
        if session_id:
            sessions_table = dynamodb.Table(os.environ['API_TEAM_SESSIONSTABLE_NAME'])
            sessions_table.update_item(
                Key={'id': session_id},
                UpdateExpression='SET aiSummary = :summary',
                ExpressionAttributeValues={
                    ':summary': summary
                }
            )
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'summary': summary,
                'eventCount': len(events),
                'sessionId': session_id
            })
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
