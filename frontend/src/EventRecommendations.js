import React, { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, Target, Brain } from 'lucide-react';

const API_BASE_URL = 'https://6q1uzeiewc.execute-api.eu-north-1.amazonaws.com';

function EventRecommendations({ currentEventId, onSelectEvent }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentEventId) {
      fetchRecommendations();
    }
  }, [currentEventId]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/recommendations?eventId=${currentEventId}`);
      const data = await response.json();
      setRecommendations(data.recommendations || []);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEvent = (eventId) => {
    onSelectEvent(eventId);
    // Scroll to top to see the registration form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!currentEventId || loading) {
    return null;
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <div className="recommendations-container">
      <div className="recommendations-header">
        <Brain className="icon animate-pulse" />
        <div>
          <h3 className="recommendations-title">AI Recommended Events</h3>
          <p className="recommendations-subtitle">Based on your interests and similar users</p>
        </div>
      </div>

      <div className="recommendations-grid">
        {recommendations.map((rec, index) => {
          const fillPercentage = (rec.registered / rec.capacity) * 100;
          
          return (
            <div 
              key={rec.eventId}
              className="recommendation-card"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Match Badge */}
              <div className="match-badge">
                <Target className="icon-small" />
                <span>{rec.matchPercentage}% Match</span>
              </div>

              {/* Event Info */}
              <h4 className="rec-event-name">{rec.name}</h4>
              <p className="rec-event-date">{rec.date}</p>
              
              {/* AI Reason */}
              <div className="ai-reason">
                <Sparkles className="icon-small sparkle" />
                <p>{rec.reason}</p>
              </div>

              {/* Progress Bar */}
              <div className="rec-progress">
                <div className="progress-label">
                  <span>{rec.registered}/{rec.capacity} registered</span>
                  <span className="percentage">{fillPercentage.toFixed(0)}%</span>
                </div>
                <div className="progress-bar-bg">
                  <div 
                    className={`progress-bar-fill ${fillPercentage >= 90 ? 'red' : fillPercentage >= 70 ? 'orange' : 'green'}`}
                    style={{ width: `${fillPercentage}%` }}
                  />
                </div>
              </div>

              {/* View Button - FIXED: Only button triggers selection */}
              <button 
                className="view-button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectEvent(rec.eventId);
                }}
              >
                View Event →
              </button>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .recommendations-container {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(16px);
          border-radius: 1.5rem;
          padding: 2rem;
          margin-top: 2rem;
          border: 2px solid rgba(167, 139, 250, 0.3);
          animation: slideIn 0.6s ease-out;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .recommendations-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .recommendations-header .icon {
          width: 2.5rem;
          height: 2.5rem;
          color: #a78bfa;
        }

        .recommendations-title {
          font-size: 1.5rem;
          font-weight: bold;
          color: white;
          margin: 0;
        }

        .recommendations-subtitle {
          color: #d8b4fe;
          font-size: 0.875rem;
          margin: 0;
        }

        .recommendations-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1rem;
        }

        .recommendation-card {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(8px);
          border-radius: 1rem;
          padding: 1.5rem;
          border: 2px solid rgba(255, 255, 255, 0.1);
          transition: all 0.3s ease;
          position: relative;
          animation: fadeInUp 0.6s ease-out;
          animation-fill-mode: both;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .recommendation-card:hover {
          border-color: #a78bfa;
          transform: translateY(-4px);
          box-shadow: 0 10px 30px rgba(167, 139, 250, 0.3);
        }

        .match-badge {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          padding: 0.35rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: bold;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .icon-small {
          width: 0.875rem;
          height: 0.875rem;
        }

        .rec-event-name {
          color: white;
          font-size: 1.125rem;
          font-weight: 600;
          margin: 0 0 0.5rem 0;
          padding-right: 80px;
        }

        .rec-event-date {
          color: #d8b4fe;
          font-size: 0.875rem;
          margin: 0 0 1rem 0;
        }

        .ai-reason {
          background: rgba(167, 139, 250, 0.2);
          border-left: 3px solid #a78bfa;
          padding: 0.75rem;
          border-radius: 0.5rem;
          margin-bottom: 1rem;
          display: flex;
          align-items: start;
          gap: 0.5rem;
        }

        .ai-reason p {
          color: #e9d5ff;
          font-size: 0.875rem;
          margin: 0;
          line-height: 1.4;
        }

        .sparkle {
          color: #fbbf24;
          animation: sparkle 2s ease-in-out infinite;
          flex-shrink: 0;
        }

        @keyframes sparkle {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(0.9); }
        }

        .rec-progress {
          margin-bottom: 1rem;
        }

        .progress-label {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.75rem;
          color: #d8b4fe;
          margin-bottom: 0.5rem;
        }

        .percentage {
          font-weight: 600;
        }

        .progress-bar-bg {
          width: 100%;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 9999px;
          height: 6px;
          overflow: hidden;
        }

        .progress-bar-fill {
          height: 100%;
          border-radius: 9999px;
          transition: width 0.8s ease;
        }

        .progress-bar-fill.green { background: #22c55e; }
        .progress-bar-fill.orange { background: #f97316; }
        .progress-bar-fill.red { background: #ef4444; }

        .view-button {
          width: 100%;
          background: rgba(167, 139, 250, 0.2);
          color: white;
          border: 1px solid #a78bfa;
          padding: 0.75rem;
          border-radius: 0.5rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .view-button:hover {
          background: rgba(167, 139, 250, 0.3);
          transform: translateX(4px);
        }
      `}</style>
    </div>
  );
}

export default EventRecommendations;