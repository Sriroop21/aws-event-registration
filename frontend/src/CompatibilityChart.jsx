import React from 'react';

function CompatibilityChart({ breakdown, totalScore }) {
  // Define metrics with colors and icons
  const metrics = [
    { key: 'interests', label: 'Interests', color: '#3b82f6', emoji: '💙' },
    { key: 'skills', label: 'Skills', color: '#10b981', emoji: '💚' },
    { key: 'goals', label: 'Goals', color: '#f59e0b', emoji: '🎯' },
    { key: 'mentorship', label: 'Mentorship', color: '#8b5cf6', emoji: '🎓' },
    { key: 'lookingFor', label: 'Looking For', color: '#ec4899', emoji: '🔍' },
    { key: 'sameOrg', label: 'Same Org', color: '#ef4444', emoji: '🏢' }
  ];

  // Calculate percentages for each metric
  const getPercentage = (value) => {
    const maxScore = 30; // Max possible score per category
    return Math.min((Math.abs(value) / maxScore) * 100, 100);
  };

  // Create circular progress ring
  const CircularProgress = ({ percentage, color, label, value, emoji }) => {
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    const isNegative = value < 0;

    return (
      <div className="flex flex-col items-center">
        <div className="relative w-24 h-24">
          <svg className="w-24 h-24 transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="48"
              cy="48"
              r={radius}
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="8"
              fill="transparent"
            />
            {/* Progress circle */}
            <circle
              cx="48"
              cy="48"
              r={radius}
              stroke={color}
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
              style={{
                filter: 'drop-shadow(0 0 6px ' + color + ')'
              }}
            />
          </svg>
          {/* Center emoji */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl">{emoji}</span>
          </div>
        </div>
        {/* Label and value */}
        <div className="mt-2 text-center">
          <p className="text-white text-xs font-semibold">{label}</p>
          <p className={`text-sm font-bold ${isNegative ? 'text-red-400' : 'text-green-400'}`}>
            {value > 0 ? '+' : ''}{value}
          </p>
        </div>
      </div>
    );
  };

  // Filter out metrics that don't exist in breakdown
  const activeMetrics = metrics.filter(metric => 
    breakdown && breakdown[metric.key] !== undefined
  );

  if (!breakdown || activeMetrics.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 rounded-2xl p-6 border border-white/20">
      <h4 className="text-white font-bold text-center mb-4 flex items-center justify-center gap-2">
        <span className="text-2xl">📊</span>
        Compatibility Breakdown
      </h4>
      
      {/* Circular charts grid */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        {activeMetrics.map(metric => (
          <CircularProgress
            key={metric.key}
            percentage={getPercentage(breakdown[metric.key])}
            color={metric.color}
            label={metric.label}
            value={breakdown[metric.key]}
            emoji={metric.emoji}
          />
        ))}
      </div>

      {/* Total score bar */}
      <div className="mt-6 pt-4 border-t border-white/10">
        <div className="flex justify-between items-center mb-2">
          <span className="text-purple-200 text-sm font-semibold">Overall Compatibility</span>
          <span className="text-white text-xl font-bold">{totalScore}%</span>
        </div>
        <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 rounded-full transition-all duration-1000 ease-out"
            style={{ 
              width: `${totalScore}%`,
              boxShadow: '0 0 10px rgba(236, 72, 153, 0.5)'
            }}
          />
        </div>
      </div>

      {/* Score interpretation */}
      <div className="mt-4 text-center">
        {totalScore >= 80 && (
          <p className="text-pink-300 text-sm">
            🌟 Exceptional compatibility! You have a lot in common.
          </p>
        )}
        {totalScore >= 60 && totalScore < 80 && (
          <p className="text-purple-300 text-sm">
            ✨ Great match! Strong potential for collaboration.
          </p>
        )}
        {totalScore >= 40 && totalScore < 60 && (
          <p className="text-blue-300 text-sm">
            💫 Good match! You complement each other well.
          </p>
        )}
        {totalScore < 40 && (
          <p className="text-green-300 text-sm">
            🌱 Potential match! You could learn from each other.
          </p>
        )}
      </div>
    </div>
  );
}

export default CompatibilityChart;