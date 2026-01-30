"""
CloudiQS MSP Email Approval Handler
Handles customer approval/rejection via secure email tokens
"""
import json
import boto3
import os
from datetime import datetime
import hashlib
import hmac

dynamodb = boto3.resource('dynamodb')
requests_table = dynamodb.Table(os.environ['API_TEAM_REQUESTSTABLE_NAME'])

def generate_approval_token(request_id, secret_key):
    """Generate secure approval token"""
    message = f"{request_id}:{datetime.utcnow().isoformat()}"
    signature = hmac.new(
        secret_key.encode('utf-8'),
        message.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    return f"{message}:{signature}"

def verify_approval_token(token, request_id, secret_key):
    """Verify approval token"""
    try:
        parts = token.split(':')
        if len(parts) != 3:
            return False
        
        message = f"{parts[0]}:{parts[1]}"
        expected_signature = hmac.new(
            secret_key.encode('utf-8'),
            message.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        return parts[2] == expected_signature and parts[0] == request_id
    except Exception as e:
        print(f"Token verification error: {e}")
        return False

def handler(event, context):
    """
    Handle customer approval/rejection via email link
    """
    print(f"Event: {json.dumps(event)}")
    
    try:
        # Parse query parameters
        params = event.get('queryStringParameters', {})
        request_id = params.get('requestId')
        action = params.get('action')  # 'approve' or 'reject'
        token = params.get('token')
        
        if not all([request_id, action, token]):
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'text/html',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': '<html><body><h1>Invalid Request</h1><p>Missing required parameters</p></body></html>'
            }
        
        # Verify token
        secret_key = os.environ.get('APPROVAL_SECRET_KEY', 'default-secret-key')
        if not verify_approval_token(token, request_id, secret_key):
            return {
                'statusCode': 403,
                'headers': {
                    'Content-Type': 'text/html',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': '<html><body><h1>Invalid Token</h1><p>The approval link is invalid or expired</p></body></html>'
            }
        
        # Get request from DynamoDB
        response = requests_table.get_item(Key={'id': request_id})
        
        if 'Item' not in response:
            return {
                'statusCode': 404,
                'headers': {
                    'Content-Type': 'text/html',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': '<html><body><h1>Request Not Found</h1></body></html>'
            }
        
        request_item = response['Item']
        
        # Check if request is still in pending state
        if request_item.get('status') != 'pending':
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'text/html',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': f'<html><body><h1>Request Already Processed</h1><p>Current status: {request_item.get("status")}</p></body></html>'
            }
        
        # Update request status
        new_status = 'approved' if action == 'approve' else 'rejected'
        current_time = datetime.utcnow().isoformat()
        
        requests_table.update_item(
            Key={'id': request_id},
            UpdateExpression='SET #status = :status, approver = :approver, comment = :comment, updatedAt = :updatedAt',
            ExpressionAttributeNames={
                '#status': 'status'
            },
            ExpressionAttributeValues={
                ':status': new_status,
                ':approver': request_item.get('customerApprovalEmail', 'Customer'),
                ':comment': f'Customer {action}d via email',
                ':updatedAt': current_time
            }
        )
        
        # Return success HTML page
        customer_name = request_item.get('customerName', 'Customer')
        requester_email = request_item.get('email', 'Unknown')
        account_name = request_item.get('accountName', 'Unknown')
        role = request_item.get('role', 'Unknown')
        
        success_message = f"""
        <html>
        <head>
            <title>Access Request {action.title()}</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 50px; background-color: #f0f0f0; }}
                .container {{ background-color: white; padding: 30px; border-radius: 10px; max-width: 600px; margin: auto; }}
                h1 {{ color: {'#28a745' if action == 'approve' else '#dc3545'}; }}
                .info {{ background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }}
                .label {{ font-weight: bold; }}
            </style>
        </head>
        <body>
            <div class="container">
                <h1>✓ Access Request {action.title()}d</h1>
                <p>Thank you for your response!</p>
                <div class="info">
                    <p><span class="label">Customer:</span> {customer_name}</p>
                    <p><span class="label">Requester:</span> {requester_email}</p>
                    <p><span class="label">AWS Account:</span> {account_name}</p>
                    <p><span class="label">Permission Set:</span> {role}</p>
                    <p><span class="label">Action:</span> {action.title()}d</p>
                </div>
                <p>The requester has been notified of your decision.</p>
            </div>
        </body>
        </html>
        """
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'text/html',
                'Access-Control-Allow-Origin': '*'
            },
            'body': success_message
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'text/html',
                'Access-Control-Allow-Origin': '*'
            },
            'body': f'<html><body><h1>Error</h1><p>{str(e)}</p></body></html>'
        }
