import React, { useState, useEffect } from 'react';
import { 
  Users, TrendingUp, Calendar, Mail, Search, 
  Download, Send, Settings, BarChart3, PieChart, Activity, RefreshCw 
} from 'lucide-react';
import { LineChart, Line, PieChart as RePieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './AdminDashboard.css';

const API_BASE_URL = 'https://6q1uzeiewc.execute-api.eu-north-1.amazonaws.com';

function AdminDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  // Real data from API
  const [stats, setStats] = useState({
    totalRegistrations: 0,
    activeEvents: 0,
    todayRegistrations: 0,
    waitlistCount: 0
  });
  const [events, setEvents] = useState([]);
  const [registrants, setRegistrants] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [capacityData, setCapacityData] = useState([]);

  const COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe'];

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/dashboard`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Validate data structure
      if (data && typeof data === 'object') {
        setStats(data.stats || stats);
        setEvents(data.events || []);
        setRegistrants(data.registrations || []);
        setTrendData(data.trend || []);
        setCapacityData(data.capacityData || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Please try refreshing.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    fetchDashboardData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredRegistrants = registrants.filter(reg => 
    (reg.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (reg.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (reg.event?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const exportToCSV = () => {
    if (registrants.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = ['Name', 'Email', 'Event', 'Date', 'Status', 'Organization', 'Phone'];
    const csvData = [
      headers.join(','),
      ...registrants.map(reg => [
        `"${reg.name || ''}"`,
        `"${reg.email || ''}"`,
        `"${reg.event || ''}"`,
        `"${reg.date || ''}"`,
        `"${reg.status || ''}"`,
        `"${reg.organization || ''}"`,
        `"${reg.phone || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `registrations-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="text-center">
          <div className="loading-spinner" />
          <p className="text-white text-xl mt-4">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <div>
            <h1 className="dashboard-title">Admin Dashboard</h1>
            <p className="dashboard-subtitle">Event Registration Management System</p>
          </div>
          <div className="header-actions">
            <button 
              onClick={fetchDashboardData}
              disabled={refreshing}
              className="action-button refresh-button"
            >
              <RefreshCw className={`icon ${refreshing ? 'spinning' : ''}`} />
              Refresh
            </button>
            <button className="action-button">
              <Settings className="icon" />
              Settings
            </button>
            <button 
              onClick={() => setShowEmailModal(true)}
              className="action-button primary-button"
            >
              <Send className="icon" />
              Send Announcement
            </button>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="error-banner">
          <p>{error}</p>
          <button onClick={fetchDashboardData}>Retry</button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon blue">
              <Users className="icon" />
            </div>
            <span className="stat-badge green">Live</span>
          </div>
          <h3 className="stat-value">{stats.totalRegistrations}</h3>
          <p className="stat-label">Total Registrations</p>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon purple">
              <Calendar className="icon" />
            </div>
            <span className="stat-badge blue">{stats.activeEvents}</span>
          </div>
          <h3 className="stat-value">{stats.activeEvents}</h3>
          <p className="stat-label">Active Events</p>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon green">
              <TrendingUp className="icon" />
            </div>
            <span className="stat-badge green">Today</span>
          </div>
          <h3 className="stat-value">{stats.todayRegistrations}</h3>
          <p className="stat-label">New Registrations</p>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon orange">
              <Mail className="icon" />
            </div>
            <span className="stat-badge orange">Waitlist</span>
          </div>
          <h3 className="stat-value">{stats.waitlistCount}</h3>
          <p className="stat-label">On Waitlist</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="charts-grid">
        {/* Registration Trend Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <Activity className="icon" />
            <h3>Registration Trend (Last 7 Days)</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
              <XAxis dataKey="date" stroke="#a78bfa" />
              <YAxis stroke="#a78bfa" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e1b4b', border: '1px solid #6366f1', borderRadius: '8px' }}
                labelStyle={{ color: '#fff' }}
              />
              <Line 
                type="monotone" 
                dataKey="registrations" 
                stroke="#667eea" 
                strokeWidth={3} 
                dot={{ fill: '#667eea', r: 6 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Event Capacity Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <PieChart className="icon" />
            <h3>Event Capacity Overview</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <RePieChart>
              <Pie
                data={capacityData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name.split(' ')[0]}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {capacityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e1b4b', border: '1px solid #6366f1', borderRadius: '8px' }}
              />
            </RePieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Event Status Cards */}
      <div className="events-section">
        <div className="section-header">
          <BarChart3 className="icon" />
          <h3>Event Status</h3>
        </div>
        <div className="events-grid">
          {events.length === 0 ? (
            <div className="empty-state">
              <p>No events found</p>
            </div>
          ) : (
            events.map((event) => {
              const percentage = (event.registered / event.capacity) * 100;
              const statusColor = percentage >= 95 ? 'red' : percentage >= 70 ? 'orange' : 'green';
              
              return (
                <div key={event.id} className="event-status-card">
                  <h4 className="event-name">{event.name}</h4>
                  <p className="event-date">{event.date}</p>
                  <div className="event-stats">
                    <span>{event.registered}/{event.capacity}</span>
                    <span className="percentage">{percentage.toFixed(0)}%</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className={`progress-fill ${statusColor}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Registrants Table */}
      <div className="registrants-section">
        <div className="section-header space-between">
          <div className="flex-center">
            <Users className="icon" />
            <h3>Recent Registrations ({registrants.length})</h3>
          </div>
          <div className="table-actions">
            <div className="search-box">
              <Search className="search-icon" />
              <input
                type="text"
                placeholder="Search registrants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            <button onClick={exportToCSV} className="export-button">
              <Download className="icon" />
              Export CSV
            </button>
          </div>
        </div>

        <div className="table-container">
          <table className="registrants-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Event</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredRegistrants.length === 0 ? (
                <tr>
                  <td colSpan="5" className="empty-row">
                    {searchTerm ? 'No matching registrations found' : 'No registrations yet'}
                  </td>
                </tr>
              ) : (
                filteredRegistrants.map((registrant) => (
                  <tr key={registrant.id}>
                    <td className="name-cell">{registrant.name}</td>
                    <td>{registrant.email}</td>
                    <td>{registrant.event}</td>
                    <td>{registrant.date}</td>
                    <td>
                      <span className={`status-badge ${registrant.status}`}>
                        {registrant.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Email Modal */}
      {showEmailModal && (
        <div className="modal-overlay">
          <div className="email-modal">
            <h3 className="modal-title">Send Announcement</h3>
            <div className="modal-content">
              <div className="form-group">
                <label>Subject</label>
                <input
                  type="text"
                  placeholder="Event Update"
                  className="modal-input"
                />
              </div>
              <div className="form-group">
                <label>Message</label>
                <textarea
                  rows={4}
                  placeholder="Enter your announcement message..."
                  className="modal-textarea"
                />
              </div>
            </div>
            <div className="modal-actions">
              <button
                onClick={() => setShowEmailModal(false)}
                className="modal-button secondary"
              >
                Cancel
              </button>
              <button className="modal-button primary">
                Send to All ({registrants.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;