import React, { useState, useEffect } from 'react';
import { Heart, Users, Sparkles, TrendingUp, Award, Zap, ArrowRight,ArrowLeft, CheckCircle } from 'lucide-react';
import MatchResults from './MatchResults';

const API_BASE_URL = 'https://6q1uzeiewc.execute-api.eu-north-1.amazonaws.com';
const MATCH_API_URL = 'https://6q1uzeiewc.execute-api.eu-north-1.amazonaws.com/find-matches'; // Replace with your Match API URL

const SKILL_OPTIONS = [
  'Python', 'JavaScript', 'React', 'Node.js', 'AWS', 'Machine Learning',
  'Data Science', 'UI/UX Design', 'Product Management', 'Marketing',
  'Public Speaking', 'Leadership', 'Blockchain', 'DevOps', 'Mobile Development',
  'Java', 'C++', 'Flutter', 'Django', 'Docker'
];

const LOOKING_FOR_OPTIONS = [
  'Mentors', 'Mentees', 'Co-founders', 'Team Members', 'Job Opportunities',
  'Investors', 'Learning Partners', 'Networking', 'Collaboration Partners'
];

const EXPERIENCE_LEVELS = [
  'Beginner', 'Intermediate', 'Advanced', 'Expert'
];

const GOAL_OPTIONS = [
  'Learn New Skills', 'Find a Job', 'Start a Startup', 'Network with Professionals',
  'Find Hackathon Team', 'Hire Talent', 'Share Knowledge', 'Get Funding',
  'Build Projects', 'Career Guidance'
];

const INTEREST_OPTIONS = [
  'Artificial Intelligence', 'Web Development', 'Mobile Apps', 'Cloud Computing',
  'Cybersecurity', 'Blockchain', 'IoT', 'Data Analytics', 'Entrepreneurship',
  'Design Thinking', 'Agile Methodologies', 'Open Source', 'Game Development',
  'AR/VR', 'Robotics', 'Fintech'
];

function FindMatch() {
  const [step, setStep] = useState(1);
  const [events, setEvents] = useState([]);
  const [matches, setMatches] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    eventId: '',
    name: '',
    email: '',
    organization: '',
    skills: [],
    lookingFor: [],
    experienceLevel: '',
    goals: [],
    interests: []
  });
  const [errors, setErrors] = useState({});

  // Fetch events
  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard`);
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const toggleSelection = (field, value, maxLimit = null) => {
    setFormData(prev => {
      const currentArray = prev[field] || [];
      
      if (currentArray.includes(value)) {
        // Remove if already selected
        return { ...prev, [field]: currentArray.filter(item => item !== value) };
      } else {
        // Add if under limit
        if (maxLimit && currentArray.length >= maxLimit) {
          return prev; // Don't add if at limit
        }
        return { ...prev, [field]: [...currentArray, value] };
      }
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateStep = (stepNumber) => {
    const newErrors = {};

    if (stepNumber === 1) {
      if (!formData.eventId) newErrors.eventId = 'Please select an event';
      if (!formData.name.trim()) newErrors.name = 'Name is required';
      if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) newErrors.email = 'Valid email required';
      if (!formData.organization.trim()) newErrors.organization = 'Organization is required';
    }

    if (stepNumber === 2) {
      if (formData.skills.length === 0) newErrors.skills = 'Select at least 1 skill';
      if (!formData.experienceLevel) newErrors.experienceLevel = 'Select your experience level';
    }

    if (stepNumber === 3) {
      if (formData.lookingFor.length === 0) newErrors.lookingFor = 'Select at least 1 option';
      if (formData.goals.length === 0) newErrors.goals = 'Select at least 1 goal';
      if (formData.interests.length === 0) newErrors.interests = 'Select at least 1 interest';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;

    setIsSubmitting(true);

    try {
      const response = await fetch(MATCH_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'submit_profile',
          eventId: formData.eventId,
          name: formData.name,
          email: formData.email,
          organization: formData.organization,
          skills: formData.skills,
          lookingFor: formData.lookingFor,
          experienceLevel: formData.experienceLevel,
          goals: formData.goals,
          interests: formData.interests
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMatches(data.matches || []);
        setStep(4); // Go to results
      } else {
        alert(data.error || 'Failed to find matches. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedEvent = events.find(e => e.id === formData.eventId);

  // Show results
  if (step === 4 && matches !== null) {
    return <MatchResults matches={matches} event={selectedEvent} onBack={() => setStep(1)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-red-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
            <button
                onClick={() => window.location.reload()} // Simple way to go back
                className="fixed top-4 left-4 z-50 flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-xl text-white px-4 py-2 rounded-xl transition-all border border-white/20"
                >
                <ArrowLeft className="w-4 h-4" />
                Back to Events
            </button>
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-6 py-2 rounded-full mb-4">
            <Heart className="w-5 h-5 text-pink-400" />
            <span className="text-white font-semibold">DNA Matching System</span>
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">
            Find Your Event Buddy 🧬
          </h1>
          <p className="text-xl text-purple-200">
            Get matched with like-minded attendees based on skills, interests, and goals
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {[1, 2, 3].map(s => (
              <div key={s} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  s <= step ? 'bg-purple-600 text-white' : 'bg-white/20 text-purple-300'
                }`}>
                  {s < step ? <CheckCircle className="w-6 h-6" /> : s}
                </div>
                {s < 3 && (
                  <div className={`w-24 h-1 mx-2 ${s < step ? 'bg-purple-600' : 'bg-white/20'}`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm text-purple-200 px-2">
            <span>Basic Info</span>
            <span>Skills</span>
            <span>Preferences</span>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
          
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Users className="w-6 h-6 text-purple-400" />
                Tell Us About Yourself
              </h2>

              {/* Event Selection */}
              <div>
                <label className="block text-white font-semibold mb-2">
                  Select Event *
                </label>
                <select
                  name="eventId"
                  value={formData.eventId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl bg-white/20 border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="" className="text-gray-800">Choose an event...</option>
                  {events.map(event => (
                    <option key={event.id} value={event.id} className="text-gray-800">
                      {event.name}
                    </option>
                  ))}
                </select>
                {errors.eventId && <p className="text-red-300 text-sm mt-1">{errors.eventId}</p>}
              </div>

              {/* Name */}
              <div>
                <label className="block text-white font-semibold mb-2">Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl bg-white/20 border border-white/30 text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="John Doe"
                />
                {errors.name && <p className="text-red-300 text-sm mt-1">{errors.name}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-white font-semibold mb-2">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl bg-white/20 border border-white/30 text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="john@example.com"
                />
                {errors.email && <p className="text-red-300 text-sm mt-1">{errors.email}</p>}
              </div>

              {/* Organization */}
              <div>
                <label className="block text-white font-semibold mb-2">Organization/College *</label>
                <input
                  type="text"
                  name="organization"
                  value={formData.organization}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl bg-white/20 border border-white/30 text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Your college or company"
                />
                {errors.organization && <p className="text-red-300 text-sm mt-1">{errors.organization}</p>}
              </div>

              <button
                onClick={handleNext}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                Continue <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Step 2: Skills & Experience */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Zap className="w-6 h-6 text-yellow-400" />
                Your Skills & Experience
              </h2>

              {/* Skills */}
              <div>
                <label className="block text-white font-semibold mb-2">
                  Your Skills & Expertise * <span className="text-sm text-purple-300">(Select up to 5)</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {SKILL_OPTIONS.map(skill => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSelection('skills', skill, 5)}
                      className={`px-3 py-2 rounded-lg text-sm transition-all ${
                        formData.skills.includes(skill)
                          ? 'bg-purple-600 text-white border-2 border-purple-400 scale-105'
                          : 'bg-white/10 text-purple-200 border border-white/30 hover:bg-white/20'
                      }`}
                    >
                      {formData.skills.includes(skill) ? '✓ ' : ''}{skill}
                    </button>
                  ))}
                </div>
                <p className="text-sm text-purple-300 mt-2">Selected: {formData.skills.length}/5</p>
                {errors.skills && <p className="text-red-300 text-sm mt-1">{errors.skills}</p>}
              </div>

              {/* Experience Level */}
              <div>
                <label className="block text-white font-semibold mb-2">Experience Level *</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {EXPERIENCE_LEVELS.map(level => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, experienceLevel: level }))}
                      className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                        formData.experienceLevel === level
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white scale-105'
                          : 'bg-white/10 text-purple-200 border border-white/30 hover:bg-white/20'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
                {errors.experienceLevel && <p className="text-red-300 text-sm mt-1">{errors.experienceLevel}</p>}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-4 rounded-xl transition-all"
                >
                  Back
                </button>
                <button
                  onClick={handleNext}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  Continue <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Preferences */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-green-400" />
                Your Goals & Interests
              </h2>

              {/* Looking For */}
              <div>
                <label className="block text-white font-semibold mb-2">
                  I'm Looking For * <span className="text-sm text-purple-300">(Select all that apply)</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {LOOKING_FOR_OPTIONS.map(option => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => toggleSelection('lookingFor', option)}
                      className={`px-3 py-2 rounded-lg text-sm transition-all ${
                        formData.lookingFor.includes(option)
                          ? 'bg-pink-600 text-white border-2 border-pink-400 scale-105'
                          : 'bg-white/10 text-purple-200 border border-white/30 hover:bg-white/20'
                      }`}
                    >
                      {formData.lookingFor.includes(option) ? '✓ ' : ''}{option}
                    </button>
                  ))}
                </div>
                {errors.lookingFor && <p className="text-red-300 text-sm mt-1">{errors.lookingFor}</p>}
              </div>

              {/* Goals */}
              <div>
                <label className="block text-white font-semibold mb-2">
                  My Goals * <span className="text-sm text-purple-300">(Select up to 3)</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {GOAL_OPTIONS.map(goal => (
                    <button
                      key={goal}
                      type="button"
                      onClick={() => toggleSelection('goals', goal, 3)}
                      className={`px-3 py-2 rounded-lg text-sm transition-all ${
                        formData.goals.includes(goal)
                          ? 'bg-green-600 text-white border-2 border-green-400 scale-105'
                          : 'bg-white/10 text-purple-200 border border-white/30 hover:bg-white/20'
                      }`}
                    >
                      {formData.goals.includes(goal) ? '✓ ' : ''}{goal}
                    </button>
                  ))}
                </div>
                <p className="text-sm text-purple-300 mt-2">Selected: {formData.goals.length}/3</p>
                {errors.goals && <p className="text-red-300 text-sm mt-1">{errors.goals}</p>}
              </div>

              {/* Interests */}
              <div>
                <label className="block text-white font-semibold mb-2">
                  Topics of Interest * <span className="text-sm text-purple-300">(Select up to 5)</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {INTEREST_OPTIONS.map(interest => (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => toggleSelection('interests', interest, 5)}
                      className={`px-3 py-2 rounded-lg text-sm transition-all ${
                        formData.interests.includes(interest)
                          ? 'bg-blue-600 text-white border-2 border-blue-400 scale-105'
                          : 'bg-white/10 text-purple-200 border border-white/30 hover:bg-white/20'
                      }`}
                    >
                      {formData.interests.includes(interest) ? '✓ ' : ''}{interest}
                    </button>
                  ))}
                </div>
                <p className="text-sm text-purple-300 mt-2">Selected: {formData.interests.length}/5</p>
                {errors.interests && <p className="text-red-300 text-sm mt-1">{errors.interests}</p>}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-4 rounded-xl transition-all"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Finding Matches...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Find My Matches!
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Features Highlight */}
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 text-center">
            <div className="bg-purple-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-white font-bold mb-2">Smart Matching</h3>
            <p className="text-purple-200 text-sm">AI-powered algorithm finds your perfect event buddy</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 text-center">
            <div className="bg-pink-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              <Award className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-white font-bold mb-2">Compatibility Score</h3>
            <p className="text-purple-200 text-sm">See detailed breakdown of why you match</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 text-center">
            <div className="bg-blue-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-white font-bold mb-2">Ice Breakers</h3>
            <p className="text-purple-200 text-sm">Get personalized conversation starters</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FindMatch;