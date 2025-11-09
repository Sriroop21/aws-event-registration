import json
import boto3
import re
from datetime import datetime
from decimal import Decimal
from difflib import SequenceMatcher

dynamodb = boto3.resource('dynamodb')
events_table = dynamodb.Table('Events')
registrations_table = dynamodb.Table('Registrations')

def lambda_handler(event, context):
    """
    AI Chatbot for event queries using NLP intent recognition
    """
    
    if event.get('httpMethod') == 'OPTIONS':
        return create_response(200, {'message': 'CORS OK'})
    
    try:
        body = json.loads(event.get('body', '{}'))
        user_message = body.get('message', '').lower().strip()
        
        if not user_message:
            return create_response(400, {'error': 'Message is required'})
        
        # Get all events data
        events_response = events_table.scan()
        events = events_response.get('Items', [])
        
        # Analyze intent and generate response
        response_data = process_message(user_message, events)
        
        return create_response(200, response_data)
        
    except Exception as e:
        print(f"Error: {str(e)}")
        import traceback
        print(traceback.format_exc())
        return create_response(500, {'error': str(e)})

def process_message(message, events):
    """
    Process user message and determine intent
    """
    
    # Intent detection patterns
    intents = detect_intent(message)
    
    # Generate response based on intent
    if 'list_events' in intents:
        return list_all_events(events)
    
    elif 'event_details' in intents or 'explain' in intents or 'what_happens' in intents:
        event_name = extract_event_name(message, events)
        if event_name:
            return get_event_details(event_name, events)
        else:
            return ask_which_event(events)
    
    elif 'available_spots' in intents:
        event_name = extract_event_name(message, events)
        if event_name:
            return get_availability(event_name, events)
        else:
            return ask_which_event(events)
    
    elif 'when_event' in intents:
        event_name = extract_event_name(message, events)
        if event_name:
            return get_event_date(event_name, events)
        else:
            return ask_which_event(events)
    
    elif 'where_event' in intents:
        event_name = extract_event_name(message, events)
        if event_name:
            return get_event_location(event_name, events)
        else:
            return ask_which_event(events)
    
    elif 'register' in intents:
        return provide_registration_help(events)
    
    elif 'help' in intents:
        return provide_help()
    
    elif 'greeting' in intents:
        return greeting_response()
    
    elif 'category' in intents:
        return filter_by_category(message, events)
    
    elif 'upcoming' in intents:
        return get_upcoming_events(events)
    
    else:
        return default_response(message, events)

def detect_intent(message):
    """
    Detect user intent from message using keyword matching
    """
    intents = []
    
    # Greeting patterns
    if any(word in message for word in ['hi', 'hello', 'hey', 'good morning', 'good evening', 'greetings']):
        intents.append('greeting')
    
    # List events patterns
    if any(phrase in message for phrase in ['list events', 'show events', 'what events', 'all events', 'available events', 'see events']):
        intents.append('list_events')
    
    # Explain/What happens patterns - NEW
    if any(phrase in message for phrase in ['explain', 'what happens', 'what will', 'what do', 'activities', 'agenda', 'schedule', 'program']):
        intents.append('explain')
        intents.append('what_happens')
    
    # Event details patterns
    if any(word in message for word in ['details', 'about', 'info', 'information', 'tell me', 'describe']):
        intents.append('event_details')
    
    # Availability patterns
    if any(phrase in message for phrase in ['spots left', 'seats available', 'capacity', 'full', 'available', 'space', 'how many']):
        intents.append('available_spots')
    
    # Date/time patterns
    if any(word in message for word in ['when', 'date', 'time', 'schedule', 'timing']):
        intents.append('when_event')
    
    # Location patterns
    if any(word in message for word in ['where', 'location', 'venue', 'place', 'address']):
        intents.append('where_event')
    
    # Registration patterns
    if any(word in message for word in ['register', 'sign up', 'enroll', 'join', 'participate']):
        intents.append('register')
    
    # Help patterns
    if any(word in message for word in ['help', 'what can you do', 'commands', 'guide']):
        intents.append('help')
    
    # Category patterns
    if any(word in message for word in ['category', 'type', 'kind', 'tech', 'business', 'workshop']):
        intents.append('category')
    
    # Upcoming patterns
    if any(word in message for word in ['upcoming', 'next', 'soon', 'this week', 'this month']):
        intents.append('upcoming')
    
    return intents

def similarity_score(a, b):
    """Calculate similarity between two strings"""
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()

def extract_event_name(message, events):
    """
    Try to extract event name from message with fuzzy matching
    """
    message_lower = message.lower()
    best_match = None
    best_score = 0
    
    for event in events:
        event_name = event.get('name', '')
        event_name_lower = event_name.lower()
        
        # Direct substring match
        if event_name_lower in message_lower:
            return event_name
        
        # Check individual words
        event_words = event_name_lower.split()
        message_words = message_lower.split()
        
        matching_words = sum(1 for word in event_words if word in message_words)
        if matching_words >= 2:  # At least 2 words match
            return event_name
        
        # Check for keywords in event name
        keywords = ['workshop', 'hackathon', 'summit', 'conference', 'tech', 'ai', 'startup']
        for keyword in keywords:
            if keyword in message_lower and keyword in event_name_lower:
                return event_name
        
        # Fuzzy matching for single word queries
        for word in message_words:
            if len(word) > 3:  # Skip short words
                score = similarity_score(word, event_name_lower)
                if score > best_score and score > 0.6:
                    best_score = score
                    best_match = event_name
    
    return best_match

def greeting_response():
    """Friendly greeting"""
    return {
        'message': "👋 Hello! I'm your AI event assistant. I can help you with:\n\n• Finding available events\n• Getting event details\n• Explaining what happens at events\n• Checking availability\n• Registration information\n\nWhat would you like to know?",
        'type': 'greeting',
        'suggestions': ['Show all events', 'Explain the hackathon', 'How do I register?']
    }

def list_all_events(events):
    """List all available events"""
    if not events:
        return {
            'message': "😔 No events are currently available.",
            'type': 'list',
            'events': []
        }
    
    event_list = []
    for event in events:
        registered = int(event.get('registered', 0))
        capacity = int(event.get('capacity', 0))
        spots_left = capacity - registered
        
        event_info = {
            'name': event.get('name'),
            'date': event.get('date'),
            'category': event.get('category'),
            'spotsLeft': spots_left,
            'status': 'Available' if spots_left > 0 else 'Full'
        }
        event_list.append(event_info)
    
    message = f"📅 We have {len(events)} upcoming events:\n\n"
    for i, e in enumerate(event_list, 1):
        message += f"{i}. **{e['name']}**\n   📆 {e['date']}\n   🎫 {e['spotsLeft']} spots left\n\n"
    
    message += "\nWant to know what happens at any event? Just ask!"
    
    return {
        'message': message,
        'type': 'list',
        'events': event_list,
        'suggestions': [f"Explain {event_list[0]['name']}", 'How do I register?']
    }

def get_event_details(event_name, events):
    """Get detailed info about specific event with enhanced description"""
    event = next((e for e in events if e.get('name') == event_name), None)
    
    if not event:
        return ask_which_event(events)
    
    registered = int(event.get('registered', 0))
    capacity = int(event.get('capacity', 0))
    spots_left = capacity - registered
    percentage = (registered / capacity * 100) if capacity > 0 else 0
    
    # Enhanced descriptions with what happens at the event
    event_activities = get_event_activities(event)
    
    message = f"📋 **{event.get('name')}**\n\n"
    message += f"📝 **About this event:**\n{event.get('description', 'No description available')}\n\n"
    
    # Add what happens section
    if event_activities:
        message += f"✨ **What you'll do:**\n{event_activities}\n\n"
    
    message += f"📅 **Date:** {event.get('date')}\n"
    message += f"⏰ **Time:** {event.get('time')}\n"
    message += f"📍 **Location:** {event.get('location')}\n"
    message += f"🎫 **Capacity:** {registered}/{capacity} registered\n"
    message += f"✨ **Status:** {spots_left} spots available ({percentage:.0f}% full)"
    
    return {
        'message': message,
        'type': 'details',
        'event': {
            'name': event.get('name'),
            'date': event.get('date'),
            'time': event.get('time'),
            'location': event.get('location'),
            'registered': registered,
            'capacity': capacity,
            'spotsLeft': spots_left
        },
        'suggestions': ['How do I register?', 'Show other events', 'Check availability']
    }

def get_event_activities(event):
    """
    Generate detailed activities based on event type/name
    """
    event_name = event.get('name', '').lower()
    category = event.get('category', '').lower()
    
    # Workshop activities
    if 'workshop' in event_name or 'workshop' in category:
        return """• Hands-on coding sessions with industry experts
• Build real-world projects using latest technologies
• Interactive Q&A and live demonstrations
• Networking with fellow developers
• Take home starter kits and resources
• Certificate of completion"""
    
    # Hackathon activities
    elif 'hackathon' in event_name or 'competition' in category:
        return """• Form teams and brainstorm innovative ideas
• 24-hour intensive coding marathon
• Mentor support throughout the event
• Pitch your project to judges
• Win exciting prizes and recognition
• Free meals, snacks, and energy drinks
• Networking with sponsors and investors"""
    
    # Summit/Conference activities
    elif 'summit' in event_name or 'conference' in event_name or 'conference' in category:
        return """• Keynote speeches from industry leaders
• Panel discussions on latest trends
• Networking sessions with entrepreneurs
• Startup pitch competitions
• Exhibition booths from top companies
• One-on-one mentoring opportunities
• Exclusive swag and goodie bags"""
    
    # AI/ML specific
    elif 'ai' in event_name or 'machine learning' in event_name:
        return """• Deep dive into AI/ML algorithms
• Live demos of cutting-edge AI tools
• Workshops on neural networks and deep learning
• Case studies from real-world AI projects
• Hands-on training with popular frameworks
• Networking with AI researchers and engineers
• Career guidance in AI field"""
    
    # Tech events
    elif 'tech' in event_name:
        return """• Technical workshops and coding sessions
• Product demonstrations and launches
• Networking with tech professionals
• Career fair and recruitment opportunities
• Hands-on experience with new technologies
• Panel discussions on industry trends"""
    
    # Default activities
    else:
        return """• Interactive sessions with industry experts
• Networking opportunities with peers
• Hands-on activities and demonstrations
• Q&A sessions with speakers
• Refreshments and networking breaks
• Certificate of participation"""

def get_availability(event_name, events):
    """Check event availability"""
    event = next((e for e in events if e.get('name') == event_name), None)
    
    if not event:
        return ask_which_event(events)
    
    registered = int(event.get('registered', 0))
    capacity = int(event.get('capacity', 0))
    spots_left = capacity - registered
    
    if spots_left > 10:
        message = f"✅ Great news! **{event.get('name')}** has {spots_left} spots available. You can register anytime!"
    elif spots_left > 0:
        message = f"⚠️ **{event.get('name')}** is filling up fast! Only {spots_left} spots left. Register soon!"
    else:
        message = f"😔 Sorry, **{event.get('name')}** is currently full. You can join the waitlist when registering."
    
    return {
        'message': message,
        'type': 'availability',
        'spotsLeft': spots_left,
        'suggestions': ['What happens at this event?', 'Show other events']
    }

def get_event_date(event_name, events):
    """Get event date and time"""
    event = next((e for e in events if e.get('name') == event_name), None)
    
    if not event:
        return ask_which_event(events)
    
    message = f"📅 **{event.get('name')}** is scheduled for:\n\n"
    message += f"**Date:** {event.get('date')}\n"
    message += f"**Time:** {event.get('time')}"
    
    return {
        'message': message,
        'type': 'date',
        'suggestions': ['What happens at this event?', 'Register for this event']
    }

def get_event_location(event_name, events):
    """Get event location"""
    event = next((e for e in events if e.get('name') == event_name), None)
    
    if not event:
        return ask_which_event(events)
    
    message = f"📍 **{event.get('name')}** will be held at:\n\n**{event.get('location')}**"
    
    return {
        'message': message,
        'type': 'location',
        'suggestions': ['What happens at this event?', 'How do I register?']
    }

def filter_by_category(message, events):
    """Filter events by category"""
    categories = ['tech', 'business', 'workshop', 'conference', 'hackathon', 'summit']
    found_category = None
    
    for cat in categories:
        if cat in message.lower():
            found_category = cat
            break
    
    if not found_category:
        return list_all_events(events)
    
    filtered = [e for e in events if found_category.lower() in e.get('category', '').lower()]
    
    if not filtered:
        return {
            'message': f"😔 No {found_category} events found. Try:\n\n'Show all events'",
            'type': 'filter',
            'suggestions': ['Show all events']
        }
    
    return list_all_events(filtered)

def get_upcoming_events(events):
    """Get upcoming events (next 7 days)"""
    # For simplicity, just return all events
    # You could add date filtering here
    return list_all_events(events)

def provide_registration_help(events):
    """Help with registration"""
    message = "📝 **How to Register:**\n\n"
    message += "1. Browse the events above\n"
    message += "2. Click on an event card to select it\n"
    message += "3. Fill out the registration form on the right\n"
    message += "4. Submit and receive your QR code ticket via email!\n\n"
    message += "Would you like to see available events?"
    
    return {
        'message': message,
        'type': 'help',
        'suggestions': ['Show all events', 'Explain the hackathon']
    }

def provide_help():
    """General help"""
    message = "🤖 **I can help you with:**\n\n"
    message += "• 'Show all events' - List upcoming events\n"
    message += "• 'Explain the hackathon' - Learn what happens\n"
    message += "• 'When is the hackathon?' - Get event dates\n"
    message += "• 'Where is the AI conference?' - Get locations\n"
    message += "• 'Spots left for workshop?' - Check availability\n"
    message += "• 'What will I do at summit?' - Event activities\n"
    message += "• 'How to register?' - Registration help\n\n"
    message += "Just ask me anything about events!"
    
    return {
        'message': message,
        'type': 'help',
        'suggestions': ['Show all events', 'Explain the hackathon']
    }

def ask_which_event(events):
    """Ask user to specify which event"""
    event_names = [e.get('name') for e in events[:3]]
    
    message = "🤔 Which event would you like to know about?\n\n"
    for i, name in enumerate(event_names, 1):
        message += f"{i}. {name}\n"
    
    return {
        'message': message,
        'type': 'clarification',
        'suggestions': event_names
    }

def default_response(message, events):
    """Default fallback response with smart suggestions"""
    # Try to find any event keywords
    event_name = extract_event_name(message, events)
    if event_name:
        return get_event_details(event_name, events)
    
    return {
        'message': "🤔 I'm not sure I understood that. I can help you with:\n\n• Finding events\n• Explaining what happens at events\n• Getting event details\n• Checking availability\n• Registration info\n\nTry asking 'Show all events' or 'Explain the hackathon'",
        'type': 'default',
        'suggestions': ['Show all events', 'Explain the hackathon', 'Help']
    }

def create_response(status_code, body):
    """API response with CORS"""
    def decimal_default(obj):
        if isinstance(obj, Decimal):
            return int(obj) if obj % 1 == 0 else float(obj)
        raise TypeError
    
    return {
        'statusCode': status_code,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Content-Type': 'application/json'
        },
        'body': json.dumps(body, default=decimal_default)
    }