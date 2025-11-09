import json
import boto3
from datetime import datetime, timedelta
from decimal import Decimal

# Initialize AWS services
dynamodb = boto3.resource('dynamodb')
ses = boto3.client('ses', region_name='eu-north-1')  # Change to your region
events_table = dynamodb.Table('Events')
registrations_table = dynamodb.Table('Registrations')

# IMPORTANT: Replace with your verified SES email
SENDER_EMAIL = "sriroop123@gmail.com"  # CHANGE THIS!

def lambda_handler(event, context):
    """
    Automated reminder system - runs daily
    Sends reminder emails for events happening tomorrow
    """
    
    try:
        print("Starting reminder check...")
        
        # Calculate tomorrow's date
        tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
        print(f"Looking for events on: {tomorrow}")
        
        # Get all events
        events_response = events_table.scan()
        events = events_response.get('Items', [])
        
        reminder_count = 0
        
        # Find events happening tomorrow
        for event_item in events:
            event_date = event_item.get('date', '')
            event_id = event_item.get('eventId')
            
            print(f"Checking event: {event_item.get('name')} - Date: {event_date}")
            
            if event_date == tomorrow:
                print(f"Found upcoming event: {event_item.get('name')}")
                
                # Get all registrations for this event
                registrations_response = registrations_table.scan(
                    FilterExpression='eventId = :eid AND #status = :confirmed',
                    ExpressionAttributeNames={'#status': 'status'},
                    ExpressionAttributeValues={
                        ':eid': event_id,
                        ':confirmed': 'confirmed'
                    }
                )
                
                registrations = registrations_response.get('Items', [])
                print(f"Found {len(registrations)} registrations for this event")
                
                # Send reminder to each registrant
                for registration in registrations:
                    try:
                        send_reminder_email(
                            recipient=registration.get('email'),
                            name=registration.get('fullName'),
                            event_name=event_item.get('name'),
                            event_date=event_item.get('date'),
                            event_time=event_item.get('time'),
                            event_location=event_item.get('location'),
                            registration_id=registration.get('registrationId', '')[:8]
                        )
                        reminder_count += 1
                        print(f"Sent reminder to: {registration.get('email')}")
                    except Exception as email_error:
                        print(f"Failed to send to {registration.get('email')}: {str(email_error)}")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': f'Reminder check complete',
                'reminders_sent': reminder_count,
                'date_checked': tomorrow
            })
        }
        
    except Exception as e:
        print(f"Error in reminder system: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e)
            })
        }

def send_reminder_email(recipient, name, event_name, event_date, event_time, event_location, registration_id):
    """
    Send reminder email for upcoming event
    """
    
    subject = f"⏰ Reminder: {event_name} is Tomorrow!"
    
    # HTML email body
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }}
            .container {{ max-width: 600px; margin: 0 auto; }}
            .header {{ background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 40px 30px; text-align: center; }}
            .content {{ background: #f9f9f9; padding: 30px; }}
            .reminder-box {{ background: #fff3cd; border-left: 5px solid #ffc107; padding: 20px; margin: 20px 0; border-radius: 5px; }}
            .event-details {{ background: white; padding: 25px; margin: 20px 0; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }}
            .event-details h2 {{ color: #f5576c; margin-top: 0; }}
            .checklist {{ background: #e7f3ff; padding: 20px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #2196F3; }}
            .footer {{ text-align: center; padding: 20px; color: #666; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1 style="margin: 0; font-size: 32px;">⏰ Event Reminder</h1>
                <p style="margin: 10px 0 0 0; font-size: 18px;">Your event is tomorrow!</p>
            </div>
            <div class="content">
                <p style="font-size: 16px;">Dear <strong>{name}</strong>,</p>
                
                <div class="reminder-box">
                    <h2 style="margin: 0 0 10px 0; color: #856404;">🔔 Don't Forget!</h2>
                    <p style="margin: 0; font-size: 18px; font-weight: bold;">
                        Your event is scheduled for <span style="color: #f5576c;">TOMORROW</span>!
                    </p>
                </div>
                
                <div class="event-details">
                    <h2>📅 Event Details</h2>
                    <p style="margin: 8px 0;"><strong>Event:</strong> {event_name}</p>
                    <p style="margin: 8px 0;"><strong>Date:</strong> {event_date}</p>
                    <p style="margin: 8px 0;"><strong>Time:</strong> {event_time}</p>
                    <p style="margin: 8px 0;"><strong>Location:</strong> {event_location}</p>
                    <p style="margin: 8px 0;"><strong>Your Registration ID:</strong> {registration_id}</p>
                </div>
                
                <div class="checklist">
                    <h3 style="margin-top: 0; color: #1976D2;">✅ Pre-Event Checklist</h3>
                    <ul style="margin: 10px 0; padding-left: 20px;">
                        <li>Bring your QR code ticket (check your registration email)</li>
                        <li>Arrive 15 minutes early for check-in</li>
                        <li>Bring a valid photo ID</li>
                        <li>Review the event location and parking information</li>
                        <li>Prepare any questions you'd like to ask</li>
                    </ul>
                </div>
                
                <div style="background: white; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0;">
                    <p style="margin: 0; font-size: 16px;">
                        <strong>Need your ticket?</strong><br>
                        Check your original registration confirmation email for your QR code.
                    </p>
                </div>
                
                <p>We look forward to seeing you tomorrow!</p>
                <p style="margin-top: 20px;"><strong>See you soon!</strong><br>Event Management Team</p>
            </div>
            <div class="footer">
                <p>🔒 Powered by AWS Cloud | Smart Event Registration System</p>
                <p>This is an automated reminder. You're receiving this because you registered for this event.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    # Plain text version
    text_body = f"""
    Event Reminder - Tomorrow!
    
    Dear {name},
    
    This is a reminder that your event is scheduled for TOMORROW!
    
    Event Details:
    - Event: {event_name}
    - Date: {event_date}
    - Time: {event_time}
    - Location: {event_location}
    - Registration ID: {registration_id}
    
    Pre-Event Checklist:
    - Bring your QR code ticket
    - Arrive 15 minutes early
    - Bring a valid photo ID
    - Review event location
    
    We look forward to seeing you!
    Event Management Team
    """
    
    # Send email via SES
    response = ses.send_email(
        Source=SENDER_EMAIL,
        Destination={'ToAddresses': [recipient]},
        Message={
            'Subject': {'Data': subject, 'Charset': 'UTF-8'},
            'Body': {
                'Text': {'Data': text_body, 'Charset': 'UTF-8'},
                'Html': {'Data': html_body, 'Charset': 'UTF-8'}
            }
        }
    )
    
    return response