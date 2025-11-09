import json
import boto3
import uuid
from datetime import datetime
import base64
import urllib.parse
import urllib.request
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.image import MIMEImage


dynamodb = boto3.resource('dynamodb')
ses = boto3.client('ses', region_name='eu-north-1')
events_table = dynamodb.Table('Events')
registrations_table = dynamodb.Table('Registrations')

SENDER_EMAIL = "sriroop123@gmail.com"

def generate_qr_code(qr_data):
    """
    Generate QR code using API and return image data
    """
    try:
        qr_code_url_safe = urllib.parse.quote(qr_data)
        qr_api_url = f"https://api.qrserver.com/v1/create-qr-code/?size=400x400&data={qr_code_url_safe}"
        
        response = urllib.request.urlopen(qr_api_url)
        qr_image_data = response.read()
        
        print(f"QR code generated successfully")
        return qr_image_data
        
    except Exception as e:
        print(f"Error generating QR code: {str(e)}")
        return None

def send_confirmation_email(recipient, name, event_name, event_date, event_time, event_location, registration_id, qr_image_data):
    """
    Send confirmation email with inline QR code attachment
    """
    
    subject = f"Registration Confirmed: {event_name}"
    
    # Create multipart message with proper structure
    msg = MIMEMultipart('mixed')
    msg['Subject'] = subject
    msg['From'] = SENDER_EMAIL
    msg['To'] = recipient
    
    # Create alternative part for text and HTML
    msg_alternative = MIMEMultipart('alternative')
    msg.attach(msg_alternative)
    
    # Create related part for HTML and inline images
    msg_related = MIMEMultipart('related')
    msg_alternative.attach(msg_related)
    
    # HTML body with inline image reference
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {{ 
                font-family: Arial, sans-serif; 
                line-height: 1.6; 
                color: #333; 
                margin: 0; 
                padding: 0; 
                background-color: #f4f4f4;
            }}
            .container {{ 
                max-width: 600px; 
                margin: 20px auto; 
                background: white;
                border-radius: 10px;
                overflow: hidden;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }}
            .header {{ 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                color: white; 
                padding: 40px 30px; 
                text-align: center; 
            }}
            .content {{ 
                padding: 30px; 
            }}
            .ticket {{ 
                background: #f8f9fa; 
                padding: 25px; 
                margin: 20px 0; 
                border-radius: 10px; 
                border-left: 5px solid #667eea; 
            }}
            .qr-code {{ 
                background: white; 
                padding: 30px; 
                text-align: center; 
                margin: 20px 0; 
                border-radius: 10px; 
                border: 2px solid #667eea;
            }}
            .qr-code img {{ 
                max-width: 300px; 
                width: 100%;
                height: auto; 
                border: 3px solid #667eea; 
                border-radius: 10px; 
                padding: 10px;
                background: white;
                display: block;
                margin: 0 auto;
            }}
            .important {{ 
                background: #fff3cd; 
                border-left: 4px solid #ffc107; 
                padding: 15px; 
                margin: 20px 0; 
                border-radius: 5px; 
            }}
            .footer {{ 
                text-align: center; 
                padding: 20px; 
                background: #f8f9fa;
                font-size: 12px;
                color: #666;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎉 Registration Confirmed!</h1>
            </div>
            <div class="content">
                <p>Dear <strong>{name}</strong>,</p>
                <p>Thank you for registering! We're excited to see you at the event.</p>
                
                <div class="ticket">
                    <h2 style="color: #667eea; margin-top: 0;">📅 Event Details</h2>
                    <p><strong>Event:</strong> {event_name}</p>
                    <p><strong>Date:</strong> {event_date}</p>
                    <p><strong>Time:</strong> {event_time}</p>
                    <p><strong>Location:</strong> {event_location}</p>
                    <p><strong>Registration ID:</strong> <span style="background: #e0e7ff; padding: 3px 8px; border-radius: 3px; font-family: monospace;">{registration_id}</span></p>
                </div>
                
                <div class="qr-code">
                    <h3 style="margin-top: 0;">🎫 Your Digital Ticket</h3>
                    <p style="color: #666; margin-bottom: 15px;">Save this QR code to your phone or print it</p>
                    
                    <img 
                        src="cid:qr_code_image" 
                        alt="Event QR Code"
                        style="max-width: 300px; width: 100%; height: auto;"
                    />
                    
                    <p style="font-size: 14px; color: #666; margin-top: 15px;">
                        Scan this at the event entrance
                    </p>
                </div>
                
                <div class="important">
                    <p style="margin: 0 0 10px 0;"><strong>⚠️ Important:</strong></p>
                    <ul style="margin: 5px 0; padding-left: 20px;">
                        <li>Arrive 15 minutes early</li>
                        <li>Bring a valid photo ID</li>
                        <li>Save or print this QR code</li>
                    </ul>
                </div>
                
                <p style="margin-top: 20px;"><strong>See you at the event!</strong><br>Event Management Team</p>
            </div>
            <div class="footer">
                <p>🔒 Powered by AWS Cloud</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    # Plain text version
    text_body = f"""
    Registration Confirmed!
    
    Dear {name},
    
    Event: {event_name}
    Date: {event_date}
    Time: {event_time}
    Location: {event_location}
    Registration ID: {registration_id}
    
    Your QR code is attached to this email.
    
    See you at the event!
    """
    
    # Plain text version (fallback)
    text_part = MIMEText(text_body, 'plain')
    msg_alternative.attach(text_part)
    
    # HTML version
    html_part = MIMEText(html_body, 'html')
    msg_related.attach(html_part)
    
    # Attach QR code image inline (related to HTML)
    if qr_image_data:
        img = MIMEImage(qr_image_data)
        img.add_header('Content-ID', '<qr_code_image>')
        img.add_header('Content-Disposition', 'inline')
        msg_related.attach(img)
    
    # Send raw email via SES
    ses.send_raw_email(
        Source=SENDER_EMAIL,
        Destinations=[recipient],
        RawMessage={'Data': msg.as_string()}
    )
    
    print(f"Email sent successfully to {recipient}")

def send_waitlist_promotion_email(recipient, name, event_name, event_date, event_time, event_location, registration_id, qr_image_data):
    """
    Send promotion email to waitlisted user
    """
    
    subject = f"Great News! You're Confirmed for {event_name}"
    
    # Create multipart message
    msg = MIMEMultipart('mixed')
    msg['Subject'] = subject
    msg['From'] = SENDER_EMAIL
    msg['To'] = recipient
    
    msg_alternative = MIMEMultipart('alternative')
    msg.attach(msg_alternative)
    
    msg_related = MIMEMultipart('related')
    msg_alternative.attach(msg_related)
    
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {{ 
                font-family: Arial, sans-serif; 
                line-height: 1.6; 
                color: #333; 
                margin: 0; 
                padding: 0; 
                background-color: #f4f4f4;
            }}
            .container {{ 
                max-width: 600px; 
                margin: 20px auto; 
                background: white;
                border-radius: 10px;
                overflow: hidden;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }}
            .header {{ 
                background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
                color: white; 
                padding: 40px 30px; 
                text-align: center; 
            }}
            .content {{ 
                padding: 30px; 
            }}
            .ticket {{ 
                background: #f8f9fa; 
                padding: 25px; 
                margin: 20px 0; 
                border-radius: 10px; 
                border-left: 5px solid #10b981; 
            }}
            .qr-code {{ 
                background: white; 
                padding: 30px; 
                text-align: center; 
                margin: 20px 0; 
                border-radius: 10px; 
                border: 2px solid #10b981;
            }}
            .qr-code img {{ 
                max-width: 300px; 
                width: 100%;
                height: auto; 
                border: 3px solid #10b981; 
                border-radius: 10px; 
                padding: 10px;
                background: white;
                display: block;
                margin: 0 auto;
            }}
            .promotion-notice {{ 
                background: #d1fae5; 
                border-left: 4px solid #10b981; 
                padding: 15px; 
                margin: 20px 0; 
                border-radius: 5px; 
            }}
            .footer {{ 
                text-align: center; 
                padding: 20px; 
                background: #f8f9fa;
                font-size: 12px;
                color: #666;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎊 You're Off the Waitlist!</h1>
            </div>
            <div class="content">
                <p>Dear <strong>{name}</strong>,</p>
                
                <div class="promotion-notice">
                    <p style="margin: 0;"><strong>✨ Great news!</strong> A spot has opened up and you've been automatically confirmed for the event!</p>
                </div>
                
                <p>We're excited to see you at the event.</p>
                
                <div class="ticket">
                    <h2 style="color: #10b981; margin-top: 0;">📅 Event Details</h2>
                    <p><strong>Event:</strong> {event_name}</p>
                    <p><strong>Date:</strong> {event_date}</p>
                    <p><strong>Time:</strong> {event_time}</p>
                    <p><strong>Location:</strong> {event_location}</p>
                    <p><strong>Registration ID:</strong> <span style="background: #d1fae5; padding: 3px 8px; border-radius: 3px; font-family: monospace;">{registration_id}</span></p>
                </div>
                
                <div class="qr-code">
                    <h3 style="margin-top: 0;">🎫 Your Digital Ticket</h3>
                    <p style="color: #666; margin-bottom: 15px;">Save this QR code to your phone or print it</p>
                    
                    <img 
                        src="cid:qr_code_image" 
                        alt="Event QR Code"
                        style="max-width: 300px; width: 100%; height: auto;"
                    />
                    
                    <p style="font-size: 14px; color: #666; margin-top: 15px;">
                        Scan this at the event entrance
                    </p>
                </div>
                
                <p style="margin-top: 20px;"><strong>See you at the event!</strong><br>Event Management Team</p>
            </div>
            <div class="footer">
                <p>🔒 Powered by AWS Cloud</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    text_body = f"""
    You're Off the Waitlist!
    
    Dear {name},
    
    Great news! A spot has opened up and you've been automatically confirmed for the event!
    
    Event: {event_name}
    Date: {event_date}
    Time: {event_time}
    Location: {event_location}
    Registration ID: {registration_id}
    
    Your QR code is attached to this email.
    
    See you at the event!
    """
    
    text_part = MIMEText(text_body, 'plain')
    msg_alternative.attach(text_part)
    
    html_part = MIMEText(html_body, 'html')
    msg_related.attach(html_part)
    
    if qr_image_data:
        img = MIMEImage(qr_image_data)
        img.add_header('Content-ID', '<qr_code_image>')
        img.add_header('Content-Disposition', 'inline')
        msg_related.attach(img)
    
    ses.send_raw_email(
        Source=SENDER_EMAIL,
        Destinations=[recipient],
        RawMessage={'Data': msg.as_string()}
    )
    
    print(f"Waitlist promotion email sent successfully to {recipient}")

def promote_waitlisted_users(event_id, available_slots):
    """
    Promote waitlisted users when capacity increases
    """
    promoted_count = 0
    
    try:
        # Get event details
        event_response = events_table.get_item(Key={'eventId': event_id})
        if 'Item' not in event_response:
            return 0
        
        event_data = event_response['Item']
        
        # Get waitlisted users sorted by registration time
        response = registrations_table.scan(
            FilterExpression='eventId = :eid AND #status = :waitlist',
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={':eid': event_id, ':waitlist': 'waitlist'}
        )
        
        waitlisted_users = sorted(
            response.get('Items', []),
            key=lambda x: x.get('registeredAt', '')
        )
        
        # Promote users up to available slots
        for user in waitlisted_users[:available_slots]:
            try:
                # Update user status to confirmed
                registrations_table.update_item(
                    Key={'registrationId': user['registrationId']},
                    UpdateExpression='SET #status = :confirmed, promotedAt = :promoted_time REMOVE waitlistPosition',
                    ExpressionAttributeNames={'#status': 'status'},
                    ExpressionAttributeValues={
                        ':confirmed': 'confirmed',
                        ':promoted_time': datetime.utcnow().isoformat()
                    }
                )
                
                # Increment registered count
                events_table.update_item(
                    Key={'eventId': event_id},
                    UpdateExpression='SET registered = if_not_exists(registered, :zero) + :inc',
                    ExpressionAttributeValues={':inc': 1, ':zero': 0}
                )
                
                # Generate QR code
                qr_code_data = f"EVENT:{event_id}|REG:{user['registrationId'][:8]}|NAME:{user['fullName']}|EMAIL:{user['email']}"
                qr_image_data = generate_qr_code(qr_code_data)
                
                # Send promotion email
                send_waitlist_promotion_email(
                    recipient=user['email'],
                    name=user['fullName'],
                    event_name=event_data.get('name'),
                    event_date=event_data.get('date'),
                    event_time=event_data.get('time'),
                    event_location=event_data.get('location'),
                    registration_id=user['registrationId'][:8],
                    qr_image_data=qr_image_data
                )
                
                promoted_count += 1
                print(f"Promoted user {user['email']} from waitlist")
                
            except Exception as e:
                print(f"Error promoting user {user.get('email')}: {str(e)}")
                continue
        
        # Update waitlist positions for remaining users
        update_waitlist_positions(event_id)
        
    except Exception as e:
        print(f"Error in promote_waitlisted_users: {str(e)}")
    
    return promoted_count

def update_waitlist_positions(event_id):
    """
    Update waitlist positions after promotions
    """
    try:
        response = registrations_table.scan(
            FilterExpression='eventId = :eid AND #status = :waitlist',
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={':eid': event_id, ':waitlist': 'waitlist'}
        )
        
        waitlisted_users = sorted(
            response.get('Items', []),
            key=lambda x: x.get('registeredAt', '')
        )
        
        for position, user in enumerate(waitlisted_users, start=1):
            registrations_table.update_item(
                Key={'registrationId': user['registrationId']},
                UpdateExpression='SET waitlistPosition = :pos',
                ExpressionAttributeValues={':pos': position}
            )
            
    except Exception as e:
        print(f"Error updating waitlist positions: {str(e)}")

def lambda_handler(event, context):
    """Main handler for event registration"""
    
    if event.get('httpMethod') == 'OPTIONS':
        return create_response(200, {'message': 'CORS OK'})
    
    try:
        body = json.loads(event.get('body', '{}'))
        
        # Check if this is a capacity update request
        if body.get('action') == 'update_capacity':
            event_id = body.get('eventId')
            new_capacity = body.get('newCapacity')
            
            if not event_id or new_capacity is None:
                return create_response(400, {'error': 'Missing eventId or newCapacity'})
            
            # Get current event data
            event_response = events_table.get_item(Key={'eventId': event_id})
            if 'Item' not in event_response:
                return create_response(404, {'error': 'Event not found'})
            
            event_data = event_response['Item']
            old_capacity = int(event_data.get('capacity', 0))
            current_registered = int(event_data.get('registered', 0))
            
            # Update capacity
            events_table.update_item(
                Key={'eventId': event_id},
                UpdateExpression='SET capacity = :new_cap',
                ExpressionAttributeValues={':new_cap': new_capacity}
            )
            
            # If capacity increased, promote waitlisted users
            promoted_count = 0
            if new_capacity > old_capacity:
                available_slots = new_capacity - current_registered
                if available_slots > 0:
                    promoted_count = promote_waitlisted_users(event_id, available_slots)
            
            return create_response(200, {
                'message': 'Capacity updated successfully',
                'oldCapacity': old_capacity,
                'newCapacity': new_capacity,
                'promotedUsers': promoted_count
            })
        
        # Regular registration flow
        event_id = body.get('eventId')
        full_name = body.get('fullName')
        email = body.get('email')
        phone = body.get('phone')
        organization = body.get('organization')
        interest = body.get('interest', '')
        
        # Validate required fields
        if not all([event_id, full_name, email, phone, organization]):
            return create_response(400, {'error': 'Missing required fields'})
        
        # Get event details
        event_response = events_table.get_item(Key={'eventId': event_id})
        if 'Item' not in event_response:
            return create_response(404, {'error': 'Event not found'})
        
        event_data = event_response['Item']
        current_registered = int(event_data.get('registered', 0))
        capacity = int(event_data.get('capacity', 0))
        
        # Generate registration ID and QR code data
        registration_id = str(uuid.uuid4())
        timestamp = datetime.utcnow().isoformat()
        
        qr_code_data = f"EVENT:{event_id}|REG:{registration_id[:8]}|NAME:{full_name}|EMAIL:{email}"
        qr_code_encoded = base64.b64encode(qr_code_data.encode()).decode()
        
        # Generate QR code image
        qr_image_data = generate_qr_code(qr_code_data)
        
        # Check capacity - Add to waitlist if full
        if current_registered >= capacity:
            registration_data = {
                'registrationId': registration_id,
                'eventId': event_id,
                'eventName': event_data.get('name'),
                'fullName': full_name,
                'email': email,
                'phone': phone,
                'organization': organization,
                'interest': interest,
                'registeredAt': timestamp,
                'status': 'waitlist',
                'waitlistPosition': get_waitlist_count(event_id) + 1,
                'qrCode': qr_code_encoded
            }
            
            registrations_table.put_item(Item=registration_data)
            
            return create_response(200, {
                'message': 'Event is full. Added to waitlist.',
                'status': 'waitlist',
                'registrationId': registration_id,
                'waitlistPosition': registration_data['waitlistPosition'],
                'eventName': event_data.get('name')
            })
        
        # Confirm registration
        registration_data = {
            'registrationId': registration_id,
            'eventId': event_id,
            'eventName': event_data.get('name'),
            'fullName': full_name,
            'email': email,
            'phone': phone,
            'organization': organization,
            'interest': interest,
            'registeredAt': timestamp,
            'status': 'confirmed',
            'qrCode': qr_code_encoded
        }
        
        registrations_table.put_item(Item=registration_data)
        
        # Update event registration count
        events_table.update_item(
            Key={'eventId': event_id},
            UpdateExpression='SET registered = if_not_exists(registered, :zero) + :inc',
            ExpressionAttributeValues={':inc': 1, ':zero': 0}
        )
        
        # Send confirmation email with inline QR code
        try:
            send_confirmation_email(
                recipient=email,
                name=full_name,
                event_name=event_data.get('name'),
                event_date=event_data.get('date'),
                event_time=event_data.get('time'),
                event_location=event_data.get('location'),
                registration_id=registration_id[:8],
                qr_image_data=qr_image_data
            )
            print("Confirmation email sent successfully")
        except Exception as e:
            print(f"Email sending failed: {str(e)}")
            import traceback
            print(traceback.format_exc())
        
        return create_response(200, {
            'message': 'Registration successful!',
            'status': 'confirmed',
            'registrationId': registration_id,
            'qrCode': qr_code_encoded,
            'eventName': event_data.get('name'),
            'eventDate': event_data.get('date'),
            'eventTime': event_data.get('time'),
            'eventLocation': event_data.get('location')
        })
        
    except Exception as e:
        print(f"Lambda error: {str(e)}")
        import traceback
        print(traceback.format_exc())
        return create_response(500, {'error': str(e)})

def get_waitlist_count(event_id):
    """Get current waitlist count for an event"""
    try:
        response = registrations_table.scan(
            FilterExpression='eventId = :eid AND #status = :waitlist',
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={':eid': event_id, ':waitlist': 'waitlist'}
        )
        return len(response.get('Items', []))
    except Exception as e:
        print(f"Error getting waitlist count: {str(e)}")
        return 0

def create_response(status_code, body):
    """Create API Gateway response"""
    return {
        'statusCode': status_code,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Content-Type': 'application/json'
        },
        'body': json.dumps(body)
    }