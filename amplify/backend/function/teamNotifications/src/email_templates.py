"""
CloudiQS MSP Email Templates
Enhanced email templates for customer approvals with AI summaries
"""

def get_customer_approval_email_template(
    customer_name,
    requester_email,
    requester_name,
    account_name,
    account_id,
    role,
    duration,
    start_time,
    justification,
    ticket_no,
    approve_url,
    reject_url,
    ai_summary=None
):
    """Generate customer approval email with AI summary"""
    
    ai_summary_section = ""
    if ai_summary:
        ai_summary_section = f"""
        <div style="background-color: #f8f9fa; border-left: 4px solid #007bff; padding: 15px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #007bff;">
                <span style="font-size: 20px;">🤖</span> AI-Powered Access Summary
            </h3>
            <p style="white-space: pre-wrap; line-height: 1.6;">{ai_summary}</p>
        </div>
        """
    
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Access Request Approval Required</title>
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
        <div style="max-width: 650px; margin: 30px auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); overflow: hidden;">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">
                    CloudiQS MSP Access Request
                </h1>
                <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">
                    Approval Required for AWS Account Access
                </p>
            </div>
            
            <!-- Content -->
            <div style="padding: 30px;">
                <p style="font-size: 16px; color: #333333; margin-bottom: 20px;">
                    Dear <strong>{customer_name}</strong>,
                </p>
                
                <p style="font-size: 15px; color: #555555; line-height: 1.6; margin-bottom: 25px;">
                    A CloudiQS DevOps engineer has requested temporary access to your AWS account. 
                    Please review the details below and approve or reject this request.
                </p>
                
                <!-- Request Details Card -->
                <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                    <h2 style="color: #333333; font-size: 18px; margin-top: 0; margin-bottom: 15px; border-bottom: 2px solid #667eea; padding-bottom: 10px;">
                        Request Details
                    </h2>
                    
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 10px 0; color: #666666; font-weight: 600; width: 40%;">Requester:</td>
                            <td style="padding: 10px 0; color: #333333;">{requester_name} ({requester_email})</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0; color: #666666; font-weight: 600;">AWS Account:</td>
                            <td style="padding: 10px 0; color: #333333;">{account_name} ({account_id})</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0; color: #666666; font-weight: 600;">Permission Set:</td>
                            <td style="padding: 10px 0; color: #333333;">{role}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0; color: #666666; font-weight: 600;">Start Time:</td>
                            <td style="padding: 10px 0; color: #333333;">{start_time}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0; color: #666666; font-weight: 600;">Duration:</td>
                            <td style="padding: 10px 0; color: #333333;">{duration}</td>
                        </tr>
                        {f'<tr><td style="padding: 10px 0; color: #666666; font-weight: 600;">Ticket Reference:</td><td style="padding: 10px 0; color: #333333;">{ticket_no}</td></tr>' if ticket_no else ''}
                    </table>
                </div>
                
                <!-- Justification -->
                <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
                    <h3 style="margin-top: 0; color: #856404; font-size: 16px;">Justification:</h3>
                    <p style="margin: 0; color: #856404; line-height: 1.6;">{justification}</p>
                </div>
                
                {ai_summary_section}
                
                <!-- Action Buttons -->
                <div style="text-align: center; margin: 30px 0;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 10px; text-align: center;">
                                <a href="{approve_url}" style="display: inline-block; background-color: #28a745; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600; box-shadow: 0 2px 6px rgba(40, 167, 69, 0.3);">
                                    ✓ Approve Request
                                </a>
                            </td>
                            <td style="padding: 10px; text-align: center;">
                                <a href="{reject_url}" style="display: inline-block; background-color: #dc3545; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600; box-shadow: 0 2px 6px rgba(220, 53, 69, 0.3);">
                                    ✗ Reject Request
                                </a>
                            </td>
                        </tr>
                    </table>
                </div>
                
                <!-- Important Notice -->
                <div style="background-color: #d1ecf1; border-left: 4px solid #0c5460; padding: 15px; margin-top: 25px; border-radius: 4px;">
                    <p style="margin: 0; color: #0c5460; font-size: 14px; line-height: 1.6;">
                        <strong>Important:</strong> This access request will expire in 1 hour if not approved. 
                        All actions taken during the access period will be logged and available for audit.
                        You will receive a detailed summary after the access session ends.
                    </p>
                </div>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
                <p style="margin: 0; color: #6c757d; font-size: 13px;">
                    © 2024 CloudiQS MSP - Secure AWS Access Management
                </p>
                <p style="margin: 10px 0 0 0; color: #6c757d; font-size: 12px;">
                    This is an automated notification. Please do not reply to this email.
                </p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return html_body


def get_access_completion_email_template(
    customer_name,
    requester_name,
    account_name,
    role,
    start_time,
    end_time,
    duration_actual,
    ai_summary,
    actions_count=0
):
    """Generate access completion email with AI summary"""
    
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Access Session Completed</title>
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
        <div style="max-width: 650px; margin: 30px auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); overflow: hidden;">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); padding: 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">
                    Access Session Completed
                </h1>
                <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">
                    Summary of AWS Account Access
                </p>
            </div>
            
            <!-- Content -->
            <div style="padding: 30px;">
                <p style="font-size: 16px; color: #333333; margin-bottom: 20px;">
                    Dear <strong>{customer_name}</strong>,
                </p>
                
                <p style="font-size: 15px; color: #555555; line-height: 1.6; margin-bottom: 25px;">
                    The temporary AWS account access session has been completed. 
                    Below is a summary of the activities performed during this session.
                </p>
                
                <!-- Session Details Card -->
                <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                    <h2 style="color: #333333; font-size: 18px; margin-top: 0; margin-bottom: 15px; border-bottom: 2px solid #11998e; padding-bottom: 10px;">
                        Session Details
                    </h2>
                    
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 10px 0; color: #666666; font-weight: 600; width: 40%;">Engineer:</td>
                            <td style="padding: 10px 0; color: #333333;">{requester_name}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0; color: #666666; font-weight: 600;">AWS Account:</td>
                            <td style="padding: 10px 0; color: #333333;">{account_name}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0; color: #666666; font-weight: 600;">Permission Set:</td>
                            <td style="padding: 10px 0; color: #333333;">{role}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0; color: #666666; font-weight: 600;">Start Time:</td>
                            <td style="padding: 10px 0; color: #333333;">{start_time}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0; color: #666666; font-weight: 600;">End Time:</td>
                            <td style="padding: 10px 0; color: #333333;">{end_time}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0; color: #666666; font-weight: 600;">Duration:</td>
                            <td style="padding: 10px 0; color: #333333;">{duration_actual}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0; color: #666666; font-weight: 600;">Actions Performed:</td>
                            <td style="padding: 10px 0; color: #333333;"><strong>{actions_count}</strong></td>
                        </tr>
                    </table>
                </div>
                
                <!-- AI Summary -->
                <div style="background-color: #e3f2fd; border-left: 4px solid #2196f3; padding: 20px; margin: 20px 0; border-radius: 4px;">
                    <h3 style="margin-top: 0; color: #1565c0; font-size: 18px;">
                        <span style="font-size: 24px;">🤖</span> AI-Generated Activity Summary
                    </h3>
                    <div style="color: #1565c0; line-height: 1.8; white-space: pre-wrap;">
{ai_summary}
                    </div>
                </div>
                
                <!-- Audit Information -->
                <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin-top: 25px; border-radius: 4px;">
                    <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.6;">
                        <strong>Audit Trail:</strong> Complete logs of all actions are available in CloudTrail. 
                        Full audit reports can be generated upon request through your CloudiQS account manager.
                    </p>
                </div>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
                <p style="margin: 0; color: #6c757d; font-size: 13px;">
                    © 2024 CloudiQS MSP - Secure AWS Access Management
                </p>
                <p style="margin: 10px 0 0 0; color: #6c757d; font-size: 12px;">
                    This is an automated notification. Please do not reply to this email.
                </p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return html_body
