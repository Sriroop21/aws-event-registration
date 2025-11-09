import json
import boto3
from datetime import datetime, timedelta
from decimal import Decimal

# Initialize DynamoDB
dynamodb = boto3.resource('dynamodb')
events_table = dynamodb.Table('Events')
registrations_table = dynamodb.Table('Registrations')

def lambda_handler(event, context):
    """
    Fetch dashboard statistics and data
    """
    
    # Handle CORS preflight
    if event.get('httpMethod') == 'OPTIONS':
        return create_response(200, {'message': 'CORS preflight successful'})
    
    try:
        # Get all events
        events_response = events_table.scan()
        events = events_response.get('Items', [])
        
        # Get all registrations
        registrations_response = registrations_table.scan()
        registrations = registrations_response.get('Items', [])
        
        # Calculate statistics
        total_registrations = len([r for r in registrations if r.get('status') == 'confirmed'])
        waitlist_count = len([r for r in registrations if r.get('status') == 'waitlist'])
        active_events = len(events)
        
        # Today's registrations
        today = datetime.now().date()
        today_registrations = 0
        for reg in registrations:
            reg_date_str = reg.get('registeredAt', '')
            if reg_date_str:
                try:
                    reg_date = datetime.fromisoformat(reg_date_str.replace('Z', '+00:00')).date()
                    if reg_date == today:
                        today_registrations += 1
                except:
                    pass
        
        # Format events data
        events_data = []
        for event_item in events:
            events_data.append({
                'id': event_item.get('eventId'),
                'name': event_item.get('name'),
                'date': event_item.get('date'),
                'time': event_item.get('time'),
                'location': event_item.get('location'),
                'capacity': int(event_item.get('capacity', 0)),
                'registered': int(event_item.get('registered', 0)),
                'category': event_item.get('category', 'Event')
            })
        
        # Format registrations data (last 50 for performance)
        registrations_data = []
        sorted_registrations = sorted(
            registrations, 
            key=lambda x: x.get('registeredAt', ''), 
            reverse=True
        )[:50]
        
        for reg in sorted_registrations:
            registrations_data.append({
                'id': reg.get('registrationId', '')[:8],
                'name': reg.get('fullName'),
                'email': reg.get('email'),
                'event': reg.get('eventName'),
                'eventId': reg.get('eventId'),
                'date': reg.get('registeredAt', '')[:10],
                'status': reg.get('status', 'confirmed'),
                'organization': reg.get('organization', ''),
                'phone': reg.get('phone', '')
            })
        
        # Registration trend (last 7 days)
        trend_data = []
        for i in range(6, -1, -1):
            date = today - timedelta(days=i)
            date_str = date.isoformat()
            count = len([r for r in registrations 
                        if r.get('registeredAt', '').startswith(date_str)])
            trend_data.append({
                'date': date.strftime('%b %d'),
                'registrations': count
            })
        
        # Event capacity data for pie chart
        capacity_data = []
        for event_item in events_data:
            capacity_data.append({
                'name': event_item['name'],
                'value': event_item['registered'],
                'capacity': event_item['capacity']
            })
        
        response_data = {
            'stats': {
                'totalRegistrations': total_registrations,
                'activeEvents': active_events,
                'todayRegistrations': today_registrations,
                'waitlistCount': waitlist_count
            },
            'events': events_data,
            'registrations': registrations_data,
            'trend': trend_data,
            'capacityData': capacity_data
        }
        
        return create_response(200, response_data)
        
    except Exception as e:
        print(f"Error: {str(e)}")
        import traceback
        print(traceback.format_exc())
        return create_response(500, {
            'error': 'Internal server error',
            'message': str(e)
        })

def create_response(status_code, body):
    """Create API response with CORS headers"""
    
    # Convert Decimal to int/float for JSON serialization
    def decimal_default(obj):
        if isinstance(obj, Decimal):
            return int(obj) if obj % 1 == 0 else float(obj)
        raise TypeError
    
    return {
        'statusCode': status_code,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Content-Type': 'application/json'
        },
        'body': json.dumps(body, default=decimal_default)
    }