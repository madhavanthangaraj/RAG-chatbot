import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { ThemeContext } from '../../context/ThemeContext';
import { MessageSquare, Ticket, BarChart3, Database, LogOut, Sun, Moon, Mail, Shield, ChevronRight, Activity } from 'lucide-react';

export default function ProfilePage() {
  const { user, handleLogout, loading } = useContext(AuthContext);
  const { theme, setTheme } = useContext(ThemeContext);
  const navigate = useNavigate();
  
  const isDarkMode = theme === 'dark';
  const setIsDarkMode = (val) => setTheme(val ? 'dark' : 'light');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  const onLogout = async () => {
    try {
      await handleLogout();
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  if (loading || !user) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', justifyContent: 'center', alignItems: 'center', background: '#0f172a', color: '#fff' }}>
        <h3>Loading user session...</h3>
      </div>
    );
  }

  const isStaff = user.role === 'admin' || user.role === 'support_agent';

  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case 'admin':
        return {
          background: 'rgba(239, 68, 68, 0.12)',
          color: '#f87171',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          boxShadow: '0 0 10px rgba(239, 68, 68, 0.15)'
        };
      case 'support_agent':
        return {
          background: 'rgba(6, 182, 212, 0.12)',
          color: '#22d3ee',
          border: '1px solid rgba(6, 182, 212, 0.3)',
          boxShadow: '0 0 10px rgba(6, 182, 212, 0.15)'
        };
      default:
        return {
          background: 'rgba(139, 92, 246, 0.12)',
          color: '#a78bfa',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          boxShadow: '0 0 10px rgba(139, 92, 246, 0.15)'
        };
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin': return 'Administrator';
      case 'support_agent': return 'Support Agent';
      default: return 'End User';
    }
  };

  // Theme Variables
  const pageBg = isDarkMode 
    ? 'var(--bg-gradient)' 
    : 'radial-gradient(circle at top left, #f8fafc, #cbd5e1)';
  const cardBg = isDarkMode ? 'var(--glass-bg)' : 'rgba(255, 255, 255, 0.85)';
  const cardBorder = isDarkMode ? 'var(--glass-border)' : '1px solid rgba(0, 0, 0, 0.08)';
  const textColor = isDarkMode ? '#fff' : '#0f172a';
  const textMuted = isDarkMode ? 'var(--text-muted)' : '#475569';
  const itemBg = isDarkMode ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.04)';
  const inputBorder = isDarkMode ? 'var(--glass-border)' : '1px solid rgba(0, 0, 0, 0.12)';

  return (
    <div className="profile-page-wrapper" style={{ 
      display: 'flex', 
      minHeight: '100vh', 
      justifyContent: 'center', 
      alignItems: 'center', 
      padding: '6rem 2rem 2rem',
      background: pageBg,
      color: textColor,
      fontFamily: 'var(--font-family)',
      position: 'relative',
      transition: 'background 0.3s ease, color 0.3s ease'
    }}>
      {/* Decorative Blur Blobs */}
      <div style={{
        position: 'absolute',
        width: '400px',
        height: '400px',
        background: isDarkMode ? 'rgba(139, 92, 246, 0.12)' : 'rgba(139, 92, 246, 0.05)',
        filter: 'blur(100px)',
        borderRadius: '50%',
        top: '10%',
        left: '5%',
        zIndex: 0,
        pointerEvents: 'none'
      }}></div>
      <div style={{
        position: 'absolute',
        width: '500px',
        height: '500px',
        background: isDarkMode ? 'rgba(6, 182, 212, 0.1)' : 'rgba(6, 182, 212, 0.04)',
        filter: 'blur(120px)',
        borderRadius: '50%',
        bottom: '5%',
        right: '5%',
        zIndex: 0,
        pointerEvents: 'none'
      }}></div>

      {/* Premium Header */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem 3rem',
        background: isDarkMode ? 'rgba(15, 23, 42, 0.4)' : 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(16px)',
        borderBottom: cardBorder,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        transition: 'background 0.3s ease, border-bottom 0.3s ease'
      }}>
        {/* Left Side: Application Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--accent-color) 0%, var(--primary-color) 100%)',
            width: '12px',
            height: '24px',
            borderRadius: '4px',
            boxShadow: '0 0 15px var(--primary-color)'
          }}></div>
          <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: textColor, transition: 'color 0.3s ease' }}>
            KnowledgeBridge
          </span>
        </div>

        {/* Right Side: Theme Toggle & Sign Out */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          {/* Light/Dark Toggle */}
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            style={{
              background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
              border: inputBorder,
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              color: textColor,
              cursor: 'pointer',
              boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
              transition: 'var(--transition-all)'
            }}
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? <Sun size={18} style={{ color: '#fbbf24' }} /> : <Moon size={18} style={{ color: '#4f46e5' }} />}
          </button>

          <button 
            onClick={onLogout} 
            className="btn-danger" 
            style={{ 
              width: 'auto', 
              padding: '0.6rem 1.2rem', 
              fontSize: '0.875rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              fontWeight: 700
            }}
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </header>

      {/* Main Dashboard Container */}
      <div className="dashboard-container" style={{
        display: 'flex',
        width: '100%',
        maxWidth: '1200px',
        gap: '2.5rem',
        zIndex: 1,
        position: 'relative'
      }}>
        {/* Left Section: User Card */}
        <div className="glass-card animate-fade-in" style={{ 
          flex: '0 0 380px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          background: cardBg,
          border: cardBorder,
          padding: '2.5rem 2rem',
          boxShadow: isDarkMode ? '0 20px 40px rgba(0,0,0,0.4)' : '0 20px 40px rgba(0,0,0,0.06)',
          height: '100%',
          justifyContent: 'space-between',
          transition: 'background 0.3s ease, border 0.3s ease, box-shadow 0.3s ease'
        }}>
          {/* Avatar and Main Info Container */}
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Avatar with dynamic glow */}
            <div style={{
              width: '110px',
              height: '110px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent-color) 0%, var(--primary-color) 100%)',
              margin: '0 auto 1.5rem',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              fontSize: '3rem',
              fontWeight: 900,
              color: '#fff',
              position: 'relative',
              boxShadow: isDarkMode ? '0 8px 30px rgba(139, 92, 246, 0.4)' : '0 8px 30px rgba(139, 92, 246, 0.25)'
            }}>
              {user.username.charAt(0).toUpperCase()}
              {/* Outer ring decorator */}
              <div style={{
                position: 'absolute',
                top: '-6px',
                left: '-6px',
                right: '-6px',
                bottom: '-6px',
                border: '2px solid var(--accent-color)',
                borderRadius: '50%',
                opacity: 0.4
              }}></div>
            </div>

            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.4rem', color: textColor, letterSpacing: '-0.01em' }}>
              {user.username}
            </h2>
            
            {/* Role Badge */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
              <span style={{
                padding: '0.4rem 1.25rem',
                borderRadius: '50px',
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                ...getRoleBadgeStyle(user.role)
              }}>
                {getRoleLabel(user.role)}
              </span>
            </div>

            {/* User Details Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: itemBg, padding: '1rem', borderRadius: '12px', border: cardBorder }}>
                <Mail size={18} style={{ color: 'var(--primary-color)', flexShrink: 0 }} />
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: '0.75rem', color: textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Email Address</div>
                  <div style={{ fontSize: '0.9rem', color: textColor, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: itemBg, padding: '1rem', borderRadius: '12px', border: cardBorder }}>
                <Shield size={18} style={{ color: 'var(--accent-color)', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '0.75rem', color: textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em' }}>System Role</div>
                  <div style={{ fontSize: '0.9rem', color: textColor, fontWeight: 700 }}>{user.role}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Account Metadata Details */}
          <div style={{
            width: '100%',
            textAlign: 'left',
            background: itemBg,
            borderRadius: '12px',
            padding: '1.25rem 1.5rem',
            border: cardBorder,
            fontSize: '0.85rem',
            transition: 'background 0.3s ease, border 0.3s ease',
            marginTop: '1.5rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ color: textMuted, fontWeight: 500 }}>Account ID</span>
              <code style={{ color: textColor, fontSize: '0.8rem', fontFamily: 'monospace', fontWeight: 700 }}>{user.id}</code>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: textMuted, fontWeight: 500 }}>Registration Date</span>
              <span style={{ color: textColor, fontWeight: 700 }}>{new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>
        </div>

        {/* Right Section: Workspace Navigation Grid */}
        <div style={{ 
          flex: '1', 
          display: 'flex', 
          flexDirection: 'column', 
          height: '100%',
          justifyContent: 'space-between'
        }}>
          {/* Header Title */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ 
              fontSize: '1.5rem', 
              fontWeight: 800, 
              color: textColor, 
              letterSpacing: '-0.02em',
              marginBottom: '0.25rem'
            }}>
              Available Portals
            </h3>
            <p style={{ color: textMuted, fontSize: '0.9rem', fontWeight: 500 }}>
              Select a workspace below to access features, configuration, or analytics.
            </p>
          </div>
          
          {/* Workspaces Grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gridAutoRows: '1fr',
            gap: '1.5rem', 
            flex: 1 
          }}>
            {/* Chat Workspace */}
            <button 
              onClick={() => navigate('/chat')}
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'flex-start', 
                padding: '2rem', 
                gap: '1rem',
                borderRadius: '16px',
                background: isDarkMode ? 'rgba(139, 92, 246, 0.05)' : 'rgba(139, 92, 246, 0.07)',
                border: isDarkMode ? '1px solid rgba(139, 92, 246, 0.15)' : '1px solid rgba(139, 92, 246, 0.22)',
                cursor: 'pointer',
                color: textColor,
                textAlign: 'left',
                justifyContent: 'space-between',
                transition: 'var(--transition-all)'
              }}
              className="workspace-card"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                <div style={{
                  background: 'rgba(139, 92, 246, 0.15)',
                  padding: '0.75rem',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <MessageSquare size={28} style={{ color: 'var(--primary-color)' }} />
                </div>
                <ChevronRight className="arrow-icon" size={20} style={{ color: textMuted, transition: 'var(--transition-all)' }} />
              </div>
              <div>
                <h4 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.5rem', color: textColor }}>AI Support Chat</h4>
                <p style={{ fontSize: '0.825rem', color: textMuted, lineHeight: 1.4 }}>
                  Interact with the RAG chatbot to search and resolve portal/academic queries instantly.
                </p>
              </div>
            </button>

            {/* Ticket Workspace */}
            <button 
              onClick={() => navigate('/tickets')}
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'flex-start', 
                padding: '2rem', 
                gap: '1rem',
                borderRadius: '16px',
                background: isDarkMode ? 'rgba(6, 182, 212, 0.05)' : 'rgba(6, 182, 212, 0.07)',
                border: isDarkMode ? '1px solid rgba(6, 182, 212, 0.15)' : '1px solid rgba(6, 182, 212, 0.22)',
                cursor: 'pointer',
                color: textColor,
                textAlign: 'left',
                justifyContent: 'space-between',
                transition: 'var(--transition-all)'
              }}
              className="workspace-card"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                <div style={{
                  background: 'rgba(6, 182, 212, 0.15)',
                  padding: '0.75rem',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Ticket size={28} style={{ color: 'var(--accent-color)' }} />
                </div>
                <ChevronRight className="arrow-icon" size={20} style={{ color: textMuted, transition: 'var(--transition-all)' }} />
              </div>
              <div>
                <h4 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.5rem', color: textColor }}>Ticket Center</h4>
                <p style={{ fontSize: '0.825rem', color: textMuted, lineHeight: 1.4 }}>
                  Log new issues, view history, add comments, and track resolution timelines.
                </p>
              </div>
            </button>

            {/* Analytics Workspace (Staff only or fallback) */}
            {isStaff ? (
              <button 
                onClick={() => navigate('/analytics')}
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'flex-start', 
                  padding: '2rem', 
                  gap: '1rem',
                  borderRadius: '16px',
                  background: isDarkMode ? 'rgba(16, 185, 129, 0.05)' : 'rgba(16, 185, 129, 0.07)',
                  border: isDarkMode ? '1px solid rgba(16, 185, 129, 0.15)' : '1px solid rgba(16, 185, 129, 0.22)',
                  cursor: 'pointer',
                  color: textColor,
                  textAlign: 'left',
                  justifyContent: 'space-between',
                  transition: 'var(--transition-all)'
                }}
                className="workspace-card"
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                  <div style={{
                    background: 'rgba(16, 185, 129, 0.15)',
                    padding: '0.75rem',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <BarChart3 size={28} style={{ color: 'var(--success-color)' }} />
                  </div>
                  <ChevronRight className="arrow-icon" size={20} style={{ color: textMuted, transition: 'var(--transition-all)' }} />
                </div>
                <div>
                  <h4 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.5rem', color: textColor }}>System Analytics</h4>
                  <p style={{ fontSize: '0.825rem', color: textMuted, lineHeight: 1.4 }}>
                    Monitor search hit rates, agent effectiveness, and user feedback ratings.
                  </p>
                </div>
              </button>
            ) : (
              /* Informative placeholder card for non-staff */
              <div style={{
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'flex-start', 
                padding: '2rem', 
                gap: '1.25rem',
                borderRadius: '16px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px dashed var(--glass-border)',
                color: textMuted,
                textAlign: 'left',
                justifyContent: 'center',
                cursor: 'default',
                boxSizing: 'border-box'
              }}>
                <Activity size={32} style={{ color: textMuted, opacity: 0.4, marginBottom: '0.25rem' }} />
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: textMuted }}>Staff Access Only</h4>
                <p style={{ fontSize: '0.8rem', color: textMuted, lineHeight: 1.4 }}>
                  Analytics dashboards and Knowledge Base ingestion tools are restricted to staff administrators.
                </p>
              </div>
            )}

            {/* Knowledge Base Ingestion (Staff only or fallback) */}
            {isStaff ? (
              <button 
                onClick={() => navigate('/kb')}
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'flex-start', 
                  padding: '2rem', 
                  gap: '1rem',
                  borderRadius: '16px',
                  background: isDarkMode ? 'rgba(245, 158, 11, 0.05)' : 'rgba(245, 158, 11, 0.07)',
                  border: isDarkMode ? '1px solid rgba(245, 158, 11, 0.15)' : '1px solid rgba(245, 158, 11, 0.22)',
                  cursor: 'pointer',
                  color: textColor,
                  textAlign: 'left',
                  justifyContent: 'space-between',
                  transition: 'var(--transition-all)'
                }}
                className="workspace-card"
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                  <div style={{
                    background: 'rgba(245, 158, 11, 0.15)',
                    padding: '0.75rem',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Database size={28} style={{ color: '#fbbf24' }} />
                  </div>
                  <ChevronRight className="arrow-icon" size={20} style={{ color: textMuted, transition: 'var(--transition-all)' }} />
                </div>
                <div>
                  <h4 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.5rem', color: textColor }}>KB Ingestion</h4>
                  <p style={{ fontSize: '0.825rem', color: textMuted, lineHeight: 1.4 }}>
                    Upload markdown guides, inspect synchronized article content, and compile database indices.
                  </p>
                </div>
              </button>
            ) : (
              /* Dynamic motivational banner for non-staff */
              <div style={{
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'flex-start', 
                padding: '2rem', 
                gap: '1rem',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(6, 182, 212, 0.08) 100%)',
                border: '1px solid rgba(139, 92, 246, 0.15)',
                color: textColor,
                textAlign: 'left',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{
                  position: 'absolute',
                  right: '-10px',
                  bottom: '-10px',
                  opacity: 0.08,
                  transform: 'rotate(-15deg)'
                }}>
                  <Database size={100} />
                </div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: textColor }}>Need Help?</h4>
                <p style={{ fontSize: '0.8rem', color: textMuted, lineHeight: 1.4 }}>
                  Use the AI Support Chat to search our student handbooks or write a support request directly in the Ticket Center.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Workspace Button Hover styling override & responsive behaviors */}
      <style>{`
        .profile-page-wrapper {
          height: 100vh;
          overflow: hidden;
        }
        .dashboard-container {
          flex-direction: row;
          height: calc(100vh - 9rem);
        }
        .workspace-card {
          position: relative;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
        }
        .workspace-card:hover {
          transform: translateY(-4px);
          box-shadow: ${isDarkMode ? '0 10px 25px rgba(0, 0, 0, 0.3)' : '0 10px 25px rgba(0, 0, 0, 0.06)'};
          border-color: var(--primary-color) !important;
        }
        .workspace-card:hover .arrow-icon {
          transform: translateX(4px);
          color: var(--primary-color) !important;
        }
        @media (max-width: 968px) {
          .profile-page-wrapper {
            height: auto;
            overflow: auto;
            padding-top: 7rem;
            padding-bottom: 3rem;
          }
          .dashboard-container {
            flex-direction: column;
            height: auto;
          }
          .glass-card {
            flex: none !important;
            width: 100% !important;
          }
          .dashboard-container > div {
            flex: none !important;
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}


