import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import * as analyticsService from '../../services/analytics.service';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { ArrowLeft, RefreshCw, BarChart2, Star, AlertTriangle, Users, BookOpen, Award } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function AnalyticsPage() {
  const { user, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && (!user || (user.role !== 'admin' && user.role !== 'support_agent'))) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'support_agent')) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    setFetching(true);
    try {
      const data = await analyticsService.getDashboardData();
      setMetrics(data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setFetching(false);
    }
  };

  if (loading || !user || !metrics) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', justifyContent: 'center', alignItems: 'center', background: 'var(--bg-gradient)' }}>
        <h3 style={{ color: 'var(--text-muted)' }}>Loading analytics...</h3>
      </div>
    );
  }

  const chartData = {
    labels: metrics.trendingIssues.map(i => i.category),
    datasets: [
      {
        label: 'Support Cases',
        data: metrics.trendingIssues.map(i => i.count),
        backgroundColor: 'rgba(139, 92, 246, 0.45)',
        borderColor: '#8b5cf6',
        borderWidth: 1.5,
        borderRadius: 4
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#94a3b8' }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8' }
      }
    }
  };

  const total = metrics.summary.totalQuestions || 1;
  const resolveRate = Math.round((metrics.summary.resolvedQuestions / total) * 100);
  const escalateRate = Math.round((metrics.summary.escalatedQuestions / total) * 100);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-gradient)', padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <button onClick={() => navigate('/profile')} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
            <ArrowLeft size={16} /> Profile
          </button>
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Operations Dashboard</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Real-time analytics and chatbot effectiveness stats</p>
          </div>
        </div>

        <button onClick={loadDashboardData} disabled={fetching} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
          <RefreshCw size={15} className={fetching ? 'spin-anim' : ''} /> {fetching ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Total Inquiries
          </span>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>{metrics.summary.totalQuestions}</h1>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Conversations logged across web & Discord</span>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Auto-Resolution Rate
          </span>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--success-color)' }}>{resolveRate}%</h1>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Resolved by AI without support escalation</span>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Ticket Escalation Rate
          </span>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--error-color)' }}>{escalateRate}%</h1>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Issues forwarded to help desk ticket queues</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '2rem', marginBottom: '2.5rem' }}>
        <div className="glass-card" style={{ padding: '2rem', overflowX: 'auto' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BookOpen size={18} style={{ color: 'var(--accent-color)' }} /> Popular Knowledge Base Articles
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.75rem 0.5rem' }}>Article Title</th>
                <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>Hits</th>
                <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Effectiveness Rating</th>
              </tr>
            </thead>
            <tbody>
              {metrics.topArticles.map((art) => (
                <tr key={art.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <td style={{ padding: '0.85rem 0.5rem', fontWeight: 500 }}>{art.title}</td>
                  <td style={{ padding: '0.85rem 0.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>{art.views}</td>
                  <td style={{ padding: '0.85rem 0.5rem', textAlign: 'right' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: art.effectiveness_score >= 0.75 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      color: art.effectiveness_score >= 0.75 ? 'var(--success-color)' : 'var(--error-color)'
                    }}>
                      {Math.round(art.effectiveness_score * 100)}% Effective
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BarChart2 size={18} style={{ color: 'var(--accent-color)' }} /> Trending Support Topics
          </h3>
          <div style={{ flex: 1, minHeight: '260px' }}>
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '2rem' }}>
        <div className="glass-card" style={{ padding: '2rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fbbf24' }}>
            <AlertTriangle size={18} /> Top Failed Searches (Knowledge Gaps)
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1.25rem' }}>
            Customer queries that returned below-threshold confidence, indicating missing articles.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {metrics.failedSearches.length === 0 ? (
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>No failed searches recorded.</p>
            ) : (
              metrics.failedSearches.map((fail, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'rgba(0,0,0,0.15)',
                  border: '1px solid var(--glass-border)',
                  padding: '0.85rem 1rem',
                  borderRadius: '8px'
                }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '75%' }}>
                    "{fail.query}"
                  </span>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: '#fbbf24',
                    background: 'rgba(251, 191, 36, 0.1)',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '4px'
                  }}>
                    {fail.count} Failures
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={18} style={{ color: 'var(--accent-color)' }} /> User Engagement & CSAT Ratings
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
              <div style={{ background: 'rgba(0,0,0,0.15)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Active Chat Users</span>
                <span style={{ fontSize: '1.75rem', fontWeight: 800 }}>{metrics.userMetrics.activeUsers}</span>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.15)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>CSAT Feedback Count</span>
                <span style={{ fontSize: '1.75rem', fontWeight: 800 }}>{metrics.userMetrics.totalFeedbackCount}</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', background: 'rgba(0,0,0,0.15)', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'rgba(245, 158, 11, 0.1)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                color: '#f59e0b',
                fontSize: '1.25rem',
                fontWeight: 700,
                border: '1.5px solid rgba(245, 158, 11, 0.3)',
                flexShrink: 0
              }}>
                {metrics.userMetrics.averageSatisfaction || '5.0'}
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Average CSAT Score</span>
                <div style={{ display: 'flex', gap: '0.2rem', margin: '0.25rem 0' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={16}
                      fill={star <= Math.round(metrics.userMetrics.averageSatisfaction || 5) ? '#f59e0b' : 'transparent'}
                      stroke={star <= Math.round(metrics.userMetrics.averageSatisfaction || 5) ? '#f59e0b' : '#64748b'}
                    />
                  ))}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--success-color)', fontWeight: 600 }}>
                  {metrics.userMetrics.satisfactionRatePct}% Positive Feedback
                </span>
              </div>
            </div>
          </div>
          
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2rem', display: 'block', textAlign: 'center' }}>
            Data aggregates sync instantly on client inquiry responses.
          </span>
        </div>
      </div>
      
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin-anim {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}
