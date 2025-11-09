import json
import boto3
from decimal import Decimal
from datetime import datetime
import uuid

dynamodb = boto3.resource('dynamodb')
profiles_table = dynamodb.Table('MatchingProfiles')
registrations_table = dynamodb.Table('Registrations')

def lambda_handler(event, context):
    """
    DNA Matching Algorithm - Find compatible event buddies
    """
    
    if event.get('httpMethod') == 'OPTIONS':
        return create_response(200, {'message': 'CORS OK'})
    
    try:
        body = json.loads(event.get('body', '{}'))
        action = body.get('action')
        
        if action == 'submit_profile':
            # User submits their matching profile
            return submit_profile(body)
        
        elif action == 'get_matches':
            # Get matches for a user
            return get_matches(body)
        
        else:
            return create_response(400, {'error': 'Invalid action'})
            
    except Exception as e:
        print(f"Error: {str(e)}")
        import traceback
        print(traceback.format_exc())
        return create_response(500, {'error': str(e)})

def submit_profile(body):
    """
    Save user's matching profile and return matches
    """
    # Extract profile data
    user_id = body.get('userId', str(uuid.uuid4()))
    event_id = body.get('eventId')
    name = body.get('name')
    email = body.get('email')
    organization = body.get('organization')
    skills = body.get('skills', [])
    looking_for = body.get('lookingFor', [])
    experience_level = body.get('experienceLevel')
    goals = body.get('goals', [])
    interests = body.get('interests', [])
    
    # Validate required fields
    if not all([event_id, name, email, skills, looking_for, experience_level]):
        return create_response(400, {'error': 'Missing required fields'})
    
    # Save profile to DynamoDB
    profile_item = {
        'userId': user_id,
        'eventId': event_id,
        'name': name,
        'email': email,
        'organization': organization,
        'skills': skills,
        'lookingFor': looking_for,
        'experienceLevel': experience_level,
        'goals': goals,
        'interests': interests,
        'createdAt': datetime.now().isoformat()
    }
    
    profiles_table.put_item(Item=profile_item)
    
    # Find matches for this user
    matches = find_matches(user_id, event_id, profile_item)
    
    return create_response(200, {
        'message': 'Profile saved successfully',
        'userId': user_id,
        'matches': matches
    })

def get_matches(body):
    """
    Get existing matches for a user
    """
    user_id = body.get('userId')
    event_id = body.get('eventId')
    
    if not user_id or not event_id:
        return create_response(400, {'error': 'userId and eventId required'})
    
    # Get user's profile
    try:
        response = profiles_table.get_item(
            Key={'userId': user_id, 'eventId': event_id}
        )
        user_profile = response.get('Item')
        
        if not user_profile:
            return create_response(404, {'error': 'Profile not found'})
        
        matches = find_matches(user_id, event_id, user_profile)
        
        return create_response(200, {'matches': matches})
        
    except Exception as e:
        return create_response(500, {'error': str(e)})

def find_matches(user_id, event_id, user_profile):
    """
    Find and score all compatible matches for a user
    """
    # Get all profiles for this event
    response = profiles_table.query(
        IndexName='eventId-index',  # You'll need to create this GSI
        KeyConditionExpression='eventId = :event_id',
        ExpressionAttributeValues={':event_id': event_id}
    )
    
    all_profiles = response.get('Items', [])
    
    # Calculate compatibility with each profile
    matches = []
    for profile in all_profiles:
        # Skip self
        if profile.get('userId') == user_id:
            continue
        
        # Calculate compatibility score
        score_data = calculate_compatibility(user_profile, profile)
        
        if score_data['total_score'] > 20:  # Only show matches above threshold
            match_info = {
                'userId': profile.get('userId'),
                'name': profile.get('name'),
                'organization': profile.get('organization'),
                'experienceLevel': profile.get('experienceLevel'),
                'skills': profile.get('skills', []),
                'lookingFor': profile.get('lookingFor', []),
                'interests': profile.get('interests', []),
                'compatibilityScore': score_data['total_score'],
                'breakdown': score_data['breakdown'],
                'matchReasons': score_data['reasons'],
                'icebreaker': generate_icebreaker(user_profile, profile, score_data)
            }
            matches.append(match_info)
    
    # Sort by compatibility score (highest first)
    matches.sort(key=lambda x: x['compatibilityScore'], reverse=True)
    
    # Return top 10 matches
    return matches[:10]

def calculate_compatibility(user1, user2):
    """
    Calculate compatibility score between two users
    """
    score = 0
    breakdown = {}
    reasons = []
    
    # 1. Shared Interests (0-30 points)
    user1_interests = set(user1.get('interests', []))
    user2_interests = set(user2.get('interests', []))
    shared_interests = user1_interests & user2_interests
    
    interest_score = len(shared_interests) * 10
    if interest_score > 30:
        interest_score = 30
    
    score += interest_score
    breakdown['interests'] = interest_score
    
    if shared_interests:
        reasons.append(f"Both interested in: {', '.join(list(shared_interests)[:2])}")
    
    # 2. Complementary Skills (0-30 points)
    user1_skills = set(user1.get('skills', []))
    user2_skills = set(user2.get('skills', []))
    
    # Check if what user1 is looking for matches user2's skills
    user1_looking = set(user1.get('lookingFor', []))
    user2_looking = set(user2.get('lookingFor', []))
    
    complementary = False
    if 'Mentors' in user1_looking and user2.get('experienceLevel') in ['Advanced', 'Expert']:
        score += 25
        breakdown['mentorship'] = 25
        reasons.append(f"{user2.get('name')} can mentor you")
        complementary = True
    
    if 'Mentees' in user1_looking and user2.get('experienceLevel') in ['Beginner', 'Intermediate']:
        score += 20
        breakdown['mentorship'] = 20
        reasons.append(f"You can mentor {user2.get('name')}")
        complementary = True
    
    # Complementary skills for collaboration
    skill_overlap = user1_skills & user2_skills
    if len(skill_overlap) > 0 and len(skill_overlap) < 3:
        score += 15
        breakdown['skills'] = 15
        reasons.append(f"Complementary skills for collaboration")
    
    # 3. Goal Alignment (0-25 points)
    user1_goals = set(user1.get('goals', []))
    user2_goals = set(user2.get('goals', []))
    shared_goals = user1_goals & user2_goals
    
    goal_score = len(shared_goals) * 8
    if goal_score > 25:
        goal_score = 25
    
    score += goal_score
    breakdown['goals'] = goal_score
    
    if shared_goals:
        reasons.append(f"Similar goals: {list(shared_goals)[0]}")
    
    # 4. Looking For Match (0-15 points)
    # Check if they're looking for each other
    if 'Co-founders' in user1_looking and 'Co-founders' in user2_looking:
        score += 15
        breakdown['lookingFor'] = 15
        reasons.append("Both looking for co-founders!")
    elif 'Team Members' in user1_looking and 'Team Members' in user2_looking:
        score += 12
        breakdown['lookingFor'] = 12
        reasons.append("Both looking for team members")
    
    # 5. Same Organization Penalty (-10 points)
    # Encourage meeting new people
    if user1.get('organization', '').lower() == user2.get('organization', '').lower():
        score -= 10
        breakdown['sameOrg'] = -10
    
    return {
        'total_score': max(0, score),  # Ensure non-negative
        'breakdown': breakdown,
        'reasons': reasons
    }

def generate_icebreaker(user1, user2, score_data):
    """
    Generate personalized conversation starter
    """
    reasons = score_data['reasons']
    
    if not reasons:
        return "Ask about their experience at previous events!"
    
    # Create contextual icebreakers
    icebreakers = [
        f"💡 Start with: \"{reasons[0]}\"",
        f"Ask about their work with {user2.get('skills', ['technology'])[0]}",
        f"Discuss your shared interest in {user1.get('interests', ['tech'])[0] if user1.get('interests') else 'technology'}"
    ]
    
    return icebreakers[0]

def create_response(status_code, body):
    """
    Create API response with CORS headers
    """
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