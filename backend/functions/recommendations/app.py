import json
import boto3
from collections import defaultdict, Counter
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
events_table = dynamodb.Table('Events')
registrations_table = dynamodb.Table('Registrations')

def lambda_handler(event, context):
    """
    AI-powered event recommendations
    Uses collaborative filtering and category matching
    """
    
    if event.get('httpMethod') == 'OPTIONS':
        return create_response(200, {'message': 'CORS OK'})
    
    try:
        # Get query parameters
        params = event.get('queryStringParameters') or {}
        user_email = params.get('email')
        current_event_id = params.get('eventId')
        
        # Get all events
        events_response = events_table.scan()
        all_events = events_response.get('Items', [])
        
        # Get all registrations
        registrations_response = registrations_table.scan()
        all_registrations = registrations_response.get('Items', [])
        
        # Build recommendation engine
        recommendations = generate_recommendations(
            user_email, 
            current_event_id,
            all_events, 
            all_registrations
        )
        
        return create_response(200, {
            'recommendations': recommendations,
            'algorithm': 'collaborative_filtering',
            'confidence': 'high'
        })
        
    except Exception as e:
        print(f"Error: {str(e)}")
        import traceback
        print(traceback.format_exc())
        return create_response(500, {'error': str(e)})

def generate_recommendations(user_email, current_event_id, all_events, all_registrations):
    """
    Generate smart event recommendations using multiple algorithms
    """
    
    # Algorithm 1: Collaborative Filtering
    # "Users who registered for X also registered for Y"
    collab_scores = collaborative_filtering(current_event_id, all_registrations)
    
    # Algorithm 2: Category-based matching
    # "Similar events in the same category"
    category_scores = category_matching(current_event_id, all_events)
    
    # Algorithm 3: Popularity-based
    # "Trending events"
    popularity_scores = popularity_ranking(all_events)
    
    # Algorithm 4: Capacity-based urgency
    # "Events filling up fast"
    urgency_scores = urgency_ranking(all_events)
    
    # Combine all algorithms with weights
    combined_scores = {}
    for event in all_events:
        event_id = event['eventId']
        
        # Skip current event
        if event_id == current_event_id:
            continue
            
        # Skip full events
        if int(event.get('registered', 0)) >= int(event.get('capacity', 1)):
            continue
        
        # Calculate weighted score
        score = (
            collab_scores.get(event_id, 0) * 0.4 +      # 40% collaborative
            category_scores.get(event_id, 0) * 0.3 +     # 30% category
            popularity_scores.get(event_id, 0) * 0.2 +   # 20% popularity
            urgency_scores.get(event_id, 0) * 0.1        # 10% urgency
        )
        
        combined_scores[event_id] = score
    
    # Sort by score and get top 3
    sorted_events = sorted(combined_scores.items(), key=lambda x: x[1], reverse=True)[:3]
    
    # Build recommendation list
    recommendations = []
    for event_id, score in sorted_events:
        event = next((e for e in all_events if e['eventId'] == event_id), None)
        if event:
            # Determine reason
            reason = get_recommendation_reason(
                event_id, 
                collab_scores, 
                category_scores, 
                popularity_scores,
                urgency_scores
            )
            
            recommendations.append({
                'eventId': event_id,
                'name': event.get('name'),
                'date': event.get('date'),
                'category': event.get('category'),
                'registered': int(event.get('registered', 0)),
                'capacity': int(event.get('capacity', 0)),
                'score': round(score, 2),
                'reason': reason,
                'matchPercentage': min(int(score * 100), 99)
            })
    
    return recommendations

def collaborative_filtering(event_id, registrations):
    """
    Find events that users who registered for this event also registered for
    """
    if not event_id:
        return {}
    
    # Find users who registered for this event
    users_in_event = set()
    for reg in registrations:
        if reg.get('eventId') == event_id and reg.get('status') == 'confirmed':
            users_in_event.add(reg.get('email'))
    
    # Count what other events these users registered for
    event_counts = Counter()
    for reg in registrations:
        if reg.get('email') in users_in_event:
            other_event = reg.get('eventId')
            if other_event != event_id and reg.get('status') == 'confirmed':
                event_counts[other_event] += 1
    
    # Normalize scores
    max_count = max(event_counts.values()) if event_counts else 1
    return {eid: count / max_count for eid, count in event_counts.items()}

def category_matching(event_id, events):
    """
    Find events in the same category
    """
    if not event_id:
        return {}
    
    current_event = next((e for e in events if e['eventId'] == event_id), None)
    if not current_event:
        return {}
    
    current_category = current_event.get('category')
    
    scores = {}
    for event in events:
        if event['eventId'] != event_id:
            if event.get('category') == current_category:
                scores[event['eventId']] = 1.0
            else:
                scores[event['eventId']] = 0.3
    
    return scores

def popularity_ranking(events):
    """
    Rank by registration count
    """
    scores = {}
    max_registered = max((int(e.get('registered', 0)) for e in events), default=1)
    
    for event in events:
        registered = int(event.get('registered', 0))
        scores[event['eventId']] = registered / max(max_registered, 1)
    
    return scores

def urgency_ranking(events):
    """
    Events that are filling up fast get higher urgency
    """
    scores = {}
    
    for event in events:
        registered = int(event.get('registered', 0))
        capacity = int(event.get('capacity', 1))
        fill_percentage = registered / capacity
        
        # Events 70-95% full get highest urgency
        if 0.7 <= fill_percentage < 0.95:
            scores[event['eventId']] = 1.0
        elif 0.5 <= fill_percentage < 0.7:
            scores[event['eventId']] = 0.6
        else:
            scores[event['eventId']] = 0.3
    
    return scores

def get_recommendation_reason(event_id, collab, category, popularity, urgency):
    """
    Determine the main reason for recommendation
    """
    scores = {
        'Similar users also registered for this': collab.get(event_id, 0),
        'Same category match': category.get(event_id, 0),
        'Popular choice among attendees': popularity.get(event_id, 0),
        'Filling up fast - register soon': urgency.get(event_id, 0)
    }
    
    return max(scores.items(), key=lambda x: x[1])[0]

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
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Content-Type': 'application/json'
        },
        'body': json.dumps(body, default=decimal_default)
    }