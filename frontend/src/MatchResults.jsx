import React, { useEffect } from 'react';
import { Heart, Mail, Building, Award, Sparkles, TrendingUp, Users, ArrowLeft, MessageCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import CompatibilityChart from './CompatibilityChart';

function MatchResults({ matches, event, onBack }) {
  
  // Trigger confetti when component loads
  useEffect(() => {
    if (matches.length > 0) {
      // Fire confetti after a short delay
      setTimeout(() => {
        fireConfetti();
      }, 300);
    }
  }, [matches]);

  const fireConfetti = () => {
    const duration = 3000;
    const end = Date.now() + duration;

    const colors = ['#9333ea', '#ec4899', '#3b82f6', '#10b981'];

    // Play celebration sound (optional - browser will play built-in sound)
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
      // Sound not supported, continue silently
    }

    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());

    // Big burst in the middle
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: colors
    });
  };
  
  const getMatchLevel = (score) => {
    if (score >= 80) return { label: 'Perfect Match', color: 'from-pink-500 to-red-500', emoji: '💖' };
    if (score >= 60) return { label: 'Great Match', color: 'from-purple-500 to-pink-500', emoji: '💜' };
    if (score >= 40) return { label: 'Good Match', color: 'from-blue-500 to-purple-500', emoji: '💙' };
    return { label: 'Potential Match', color: 'from-green-500 to-blue-500', emoji: '💚' };
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-pink-400';
    if (score >= 60) return 'text-purple-400';
    if (score >= 40) return 'text-blue-400';
    return 'text-green-400';
  };

  if (matches.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-red-900 py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-12 border border-white/20">
            <div className="text-6xl mb-4">😔</div>
            <h2 className="text-3xl font-bold text-white mb-4">No Matches Found Yet</h2>
            <p className="text-purple-200 mb-6">
              Be the first to register for this event, or try again later when more people join!
            </p>
            <button
              onClick={onBack}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-6 rounded-xl transition-all"
            >
              Try Another Event
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-red-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md px-4 py-2 rounded-full mb-4 text-white transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Find More Matches
          </button>
          
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-6 py-2 rounded-full mb-4">
            <Sparkles className="w-5 h-5 text-yellow-400" />
            <span className="text-white font-semibold">{event?.name || 'Event'}</span>
          </div>
          
          <h1 className="text-5xl font-bold text-white mb-4">
            🎉 Found {matches.length} Perfect {matches.length === 1 ? 'Match' : 'Matches'}!
          </h1>
          <p className="text-xl text-purple-200">
            Connect with these amazing people at your event
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 text-center">
            <Users className="w-8 h-8 text-purple-400 mx-auto mb-2" />
            <div className="text-3xl font-bold text-white mb-1">{matches.length}</div>
            <div className="text-purple-200 text-sm">Total Matches</div>
          </div>
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 text-center">
            <Award className="w-8 h-8 text-pink-400 mx-auto mb-2" />
            <div className="text-3xl font-bold text-white mb-1">
              {matches.filter(m => m.compatibilityScore >= 80).length}
            </div>
            <div className="text-purple-200 text-sm">Perfect Matches</div>
          </div>
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 text-center">
            <TrendingUp className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <div className="text-3xl font-bold text-white mb-1">
              {Math.round(matches.reduce((sum, m) => sum + m.compatibilityScore, 0) / matches.length)}%
            </div>
            <div className="text-purple-200 text-sm">Avg Compatibility</div>
          </div>
        </div>

        {/* Match Cards */}
        <div className="space-y-6">
          {matches.map((match, index) => {
            const matchLevel = getMatchLevel(match.compatibilityScore);
            
            return (
              <div
                key={match.userId}
                className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 hover:bg-white/15 transition-all hover:scale-[1.02] hover:shadow-2xl"
              >
                <div className="flex flex-col md:flex-row gap-6">
                  
                  {/* Left: Profile */}
                  <div className="flex-shrink-0">
                    <div className="relative">
                      {/* Avatar Circle */}
                      <div className="w-24 h-24 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white text-3xl font-bold">
                        {match.name.charAt(0).toUpperCase()}
                      </div>
                      
                      {/* Match Badge */}
                      <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-2 shadow-lg">
                        <div className="text-2xl">{matchLevel.emoji}</div>
                      </div>
                    </div>
                  </div>

                  {/* Middle: Info */}
                  <div className="flex-1 space-y-3">
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-1">{match.name}</h3>
                      <div className="flex items-center gap-2 text-purple-200">
                        <Building className="w-4 h-4" />
                        <span>{match.organization}</span>
                        <span className="text-purple-400">•</span>
                        <span className="bg-purple-600/50 px-2 py-1 rounded text-xs">
                          {match.experienceLevel}
                        </span>
                      </div>
                    </div>

                    {/* Skills */}
                    {match.skills && match.skills.length > 0 && (
                      <div>
                        <p className="text-purple-300 text-sm mb-1">Skills:</p>
                        <div className="flex flex-wrap gap-2">
                          {match.skills.slice(0, 5).map(skill => (
                            <span
                              key={skill}
                              className="bg-blue-600/30 text-blue-200 px-2 py-1 rounded-lg text-xs border border-blue-500/30"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Match Reasons */}
                    {match.matchReasons && match.matchReasons.length > 0 && (
                      <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                        <p className="text-purple-300 text-sm mb-2 font-semibold">✨ Why you match:</p>
                        <ul className="space-y-1">
                          {match.matchReasons.map((reason, idx) => (
                            <li key={idx} className="text-purple-200 text-sm flex items-start gap-2">
                              <span className="text-green-400">•</span>
                              <span>{reason}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Ice Breaker */}
                    {match.icebreaker && (
                      <div className="bg-gradient-to-r from-pink-600/20 to-purple-600/20 rounded-xl p-3 border border-pink-500/30">
                        <p className="text-pink-300 text-sm mb-1 font-semibold flex items-center gap-2">
                          <MessageCircle className="w-4 h-4" />
                          Ice Breaker:
                        </p>
                        <p className="text-white text-sm">{match.icebreaker}</p>
                      </div>
                    )}

                    {/* Compatibility Chart - NEW */}
                    {match.breakdown && (
                      <CompatibilityChart 
                        breakdown={match.breakdown} 
                        totalScore={match.compatibilityScore} 
                      />
                    )}
                  </div>

                  {/* Right: Score */}
                  <div className="flex-shrink-0 text-center">
                    <div className="bg-white/10 rounded-2xl p-4 border border-white/20">
                      <div className={`text-5xl font-bold mb-2 ${getScoreColor(match.compatibilityScore)}`}>
                        {match.compatibilityScore}%
                      </div>
                      <div className={`bg-gradient-to-r ${matchLevel.color} text-white text-xs font-bold px-3 py-1 rounded-full mb-3`}>
                        {matchLevel.label}
                      </div>

                      {/* Contact Button */}
                      <a
                        href={`mailto:${match.email}?subject=Let's connect at ${event?.name || 'the event'}!`}
                        className="mt-4 w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-2 px-4 rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
                      >
                        <Mail className="w-4 h-4" />
                        Connect
                      </a>
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20">
            <h3 className="text-2xl font-bold text-white mb-3">🎊 Ready to Connect?</h3>
            <p className="text-purple-200 mb-6">
              Reach out to your matches via email and start building meaningful connections!
            </p>
            <button
              onClick={onBack}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-8 rounded-xl transition-all"
            >
              Find More Matches
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default MatchResults;