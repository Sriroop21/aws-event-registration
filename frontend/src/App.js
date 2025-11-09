import React, { useState, useEffect } from 'react';
import { Calendar, Users, MapPin, Clock, Mail, Phone, Building, Sparkles, Award, TrendingUp, Shield, Heart } from 'lucide-react';
import AdminDashboard from './AdminDashboard';
import SuccessModal from './SuccessModal';
import './App.css';
import EventRecommendations from './EventRecommendations';
import ChatBot from './ChatBot';
import FindMatch from './FindMatch';

const API_BASE_URL = 'https://6q1uzeiewc.execute-api.eu-north-1.amazonaws.com';

function App() {
  const [isAdminView, setIsAdminView] = useState(false);
  const [showFindMatch, setShowFindMatch] = useState(false); // ADD THIS LINE
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showRecommendations, setShowRecommendations] = useState(true);
  const [registrationData, setRegistrationData] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    organization: '',
    interest: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [particles, setParticles] = useState([]);
  const [events, setEvents] = useState([
    {
      id: 'tech-workshop',
      name: 'Tech Innovation Workshop 2025',
      date: '2025-11-15',
      time: '10:00 AM - 4:00 PM',
      location: 'Tech Hub, Building A',
      capacity: 50,
      registered: 0,
      category: 'Workshop',
      description: 'Learn cutting-edge technologies and build real projects',
      image: '🚀',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'hackathon',
      name: 'Annual 24-Hour Hackathon',
      date: '2025-11-20',
      time: '9:00 AM (Nov 20) - 9:00 AM (Nov 21)',
      location: 'Innovation Center',
      capacity: 100,
      registered: 0,
      category: 'Competition',
      description: 'Code, create, and compete for amazing prizes',
      image: '💻',
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: 'startup-summit',
      name: 'Startup Summit 2025',
      date: '2025-12-05',
      time: '2:00 PM - 8:00 PM',
      location: 'Convention Hall',
      capacity: 200,
      registered: 0,
      category: 'Conference',
      description: 'Meet entrepreneurs, investors, and industry leaders',
      image: '🎯',
      color: 'from-orange-500 to-red-500'
    },
    {
      id: 'ai-conference',
      name: 'AI & Machine Learning Summit',
      date: '2025-12-10',
      time: '9:00 AM - 5:00 PM',
      location: 'Research Complex',
      capacity: 75,
      registered: 0,
      category: 'Conference',
      description: 'Explore the future of artificial intelligence',
      image: '🤖',
      color: 'from-green-500 to-teal-500'
    }
  ]);

  // Fetch live event data from API
  useEffect(() => {
    const fetchLiveEventData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/dashboard`);
        if (response.ok) {
          const data = await response.json();
          if (data.events && Array.isArray(data.events)) {
            // Merge live data with static UI data
            setEvents(prevEvents => prevEvents.map(event => {
              const liveEvent = data.events.find(e => e.id === event.id);
              if (liveEvent) {
                return { 
                  ...event, 
                  registered: liveEvent.registered || 0,
                  capacity: liveEvent.capacity || event.capacity 
                };
              }
              return event;
            }));
          }
        }
      } catch (error) {
        console.error('Error fetching live event data:', error);
      }
    };

    // Initial fetch
    fetchLiveEventData();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchLiveEventData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Generate background particles
  useEffect(() => {
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 10 + 10
    }));
    setParticles(newParticles);
  }, []);

  const getCapacityStatus = (event) => {
    const percentage = (event.registered / event.capacity) * 100;
    if (percentage >= 95) return { status: 'Almost Full', color: 'text-red-500', bgColor: 'bg-red-500' };
    if (percentage >= 70) return { status: 'Filling Fast', color: 'text-orange-500', bgColor: 'bg-orange-500' };
    return { status: 'Available', color: 'text-green-500', bgColor: 'bg-green-500' };
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Name is required';
    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) newErrors.email = 'Valid email required';
    if (!formData.phone.match(/^[+]?[\d\s-]{10,}$/)) newErrors.phone = 'Valid phone required';
    if (!formData.organization.trim()) newErrors.organization = 'Organization is required';
    if (!selectedEvent) newErrors.event = 'Please select an event';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId: selectedEvent.id,
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          organization: formData.organization,
          interest: formData.interest
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setIsSubmitting(false);
        
        // Check if waitlisted or confirmed
        if (data.status === 'waitlist') {
          alert(`⏳ Event Full!\n\nYou've been added to the waitlist.\nPosition: #${data.waitlistPosition}\n\nWe'll email you if a spot opens up!`);
          setFormData({ fullName: '', email: '', phone: '', organization: '', interest: '' });
          setSelectedEvent(null);
        } else {
          // Show success modal for confirmed registrations
          setRegistrationData(data);
        }
      } else {
        setIsSubmitting(false);
        alert(data.message || 'Registration failed. Please try again.');
      }
      
    } catch (error) {
      console.error('Registration error:', error);
      setIsSubmitting(false);
      alert('Network error. Please check your connection and try again.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  if (showFindMatch) {
    return <FindMatch />;
  }

  // Admin view
  if (isAdminView) {
    return (
      <div>
        <div className="fixed top-4 right-4 z-50">
          <button
            onClick={() => setIsAdminView(false)}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-xl text-white px-4 py-2 rounded-xl transition-all border border-white/20"
          >
            Switch to User View
          </button>
        </div>
        <AdminDashboard />
      </div>
    );
  }

  // User registration view
  return (
    <div className="app-container">
      {/* Admin Toggle Button */}
      <div className="fixed top-4 right-4 z-50 flex gap-3">
        <button
          onClick={() => setShowFindMatch(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 backdrop-blur-xl text-white px-4 py-2 rounded-xl transition-all border border-white/20 shadow-lg"
        >
          <Heart className="w-4 h-4" />
          Find Match
        </button>
        
        <button
          onClick={() => setIsAdminView(true)}
          className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-xl text-white px-4 py-2 rounded-xl transition-all border border-white/20"
        >
          <Shield className="w-4 h-4" />
          Admin Dashboard
        </button>
      </div>

      {/* Animated Background Particles */}
      <div className="particles-container">
        {particles.map(particle => (
          <div
            key={particle.id}
            className="particle"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              animationDuration: `${particle.duration}s`,
              animationDelay: `${particle.id * 0.2}s`
            }}
          />
        ))}
      </div>

      <div className="content-wrapper">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-6 py-2 rounded-full mb-4">
            <Sparkles className="w-5 h-5 text-yellow-400" />
            <span className="text-white font-semibold">Powered by AWS Cloud</span>
          </div>
          <h1 className="main-title">
            Event Registration Portal
          </h1>
          <p className="text-xl text-purple-200">Discover, Register, and Experience Amazing Events</p>
        </div>

        {/* Success Modal */}
        {registrationData && (
          <SuccessModal
            registrationData={registrationData}
            onClose={() => {
              setRegistrationData(null);
              setFormData({ fullName: '', email: '', phone: '', organization: '', interest: '' });
              setSelectedEvent(null);
            }}
          />
        )}

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {/* Events List */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="w-6 h-6 text-purple-400" />
              <h2 className="text-3xl font-bold text-white">Upcoming Events</h2>
            </div>
            
            {events.map((event) => {
              const capacityInfo = getCapacityStatus(event);
              const percentage = (event.registered / event.capacity) * 100;
              const isSelected = selectedEvent?.id === event.id;
              
              return (
                <div
                  key={event.id}
                  onClick={() => setSelectedEvent({ ...event, fromRecommendation: false })}
                  className={`event-card ${isSelected ? 'selected' : ''}`}
                >
                  <div className={`event-card-inner ${isSelected ? 'selected-border' : ''}`}>
                    <div className="event-emoji">
                      {event.image}
                    </div>
                    
                    <div className="ml-12">
                      <span className={`category-badge bg-gradient-to-r ${event.color}`}>
                        {event.category}
                      </span>
                      
                      <h3 className="event-title">
                        {event.name}
                      </h3>
                      
                      <p className="text-purple-200 mb-4">{event.description}</p>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-purple-200">
                          <Calendar className="w-4 h-4" />
                          <span className="text-sm">{event.date}</span>
                        </div>
                        <div className="flex items-center gap-2 text-purple-200">
                          <Clock className="w-4 h-4" />
                          <span className="text-sm">{event.time}</span>
                        </div>
                        <div className="flex items-center gap-2 text-purple-200">
                          <MapPin className="w-4 h-4" />
                          <span className="text-sm">{event.location}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-purple-300" />
                            <span className="text-purple-200">
                              {event.registered}/{event.capacity} registered
                            </span>
                          </div>
                          <span className={`font-bold ${capacityInfo.color}`}>
                            {capacityInfo.status}
                          </span>
                        </div>
                        <div className="capacity-bar-container">
                          <div 
                            className={`capacity-bar ${capacityInfo.bgColor}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    
                    {isSelected && (
                      <div className="selected-badge">
                        <div className="bg-purple-500 text-white px-4 py-2 rounded-full font-bold">
                          Selected ✓
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {selectedEvent && selectedEvent.fromRecommendation !== true && (
            <EventRecommendations 
              currentEventId={selectedEvent.id}
              onSelectEvent={(eventId) => {
                const event = events.find(e => e.id === eventId);
                if (event) {
                  // Mark that this event was selected from recommendations
                  setSelectedEvent({ ...event, fromRecommendation: true });
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
            />
          )}

          {/* Registration Form */}
          <div className="lg:sticky lg:top-8 h-fit">
            <div className="registration-form-container">
              <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                <Sparkles className="w-8 h-8 text-yellow-400" />
                Register Now
              </h2>
              
              {!selectedEvent ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">👈</div>
                  <p className="text-xl text-purple-200">Select an event to begin registration</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="form-label">Full Name *</label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="John Doe"
                    />
                    {errors.fullName && <p className="error-message">{errors.fullName}</p>}
                  </div>

                  <div>
                    <label className="form-label flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="john@example.com"
                    />
                    {errors.email && <p className="error-message">{errors.email}</p>}
                  </div>

                  <div>
                    <label className="form-label flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="+91 98765 43210"
                    />
                    {errors.phone && <p className="error-message">{errors.phone}</p>}
                  </div>

                  <div>
                    <label className="form-label flex items-center gap-2">
                      <Building className="w-4 h-4" />
                      Organization/College *
                    </label>
                    <input
                      type="text"
                      name="organization"
                      value={formData.organization}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="Your college or company"
                    />
                    {errors.organization && <p className="error-message">{errors.organization}</p>}
                  </div>

                  <div>
                    <label className="form-label">Why do you want to attend?</label>
                    <textarea
                      name="interest"
                      value={formData.interest}
                      onChange={handleInputChange}
                      rows={3}
                      className="form-input resize-none"
                      placeholder="Tell us about your interest..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`submit-button ${isSubmitting ? 'disabled' : ''}`}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="spinner" />
                        Processing...
                      </span>
                    ) : (
                      'Complete Registration 🚀'
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        <div className="text-center mt-16 text-purple-300">
          <p className="text-sm">🔒 Secured by AWS | Smart Event Management System</p>
        </div>
      </div>
      <ChatBot />
    </div>
  );
}

export default App;