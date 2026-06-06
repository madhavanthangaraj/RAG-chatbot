import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  const { handleLogin, handleRegister } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (isLogin) {
        await handleLogin({ email, password });
      } else {
        await handleRegister({ username, email, password, role });
      }
      navigate('/profile');
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <div style={{ display: 'flex', minHeight: '100vh', justifyContent: 'center', alignItems: 'center', padding: '1rem' }}>
      <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '440px' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, textAlign: 'center', marginBottom: '0.5rem' }}>
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h2>
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', fontSize: '0.875rem', marginBottom: '2rem' }}>
          {isLogin ? 'Enter details to log in to support platform' : 'Register to access support chatbot'}
        </p>

        {error && (
          <div className="alert alert-error">
            <span>⚠️ {error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="glass-input-wrapper">
              <label className="glass-input-label">Username</label>
              <input
                type="text"
                className="glass-input"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. johndoe"
              />
            </div>
          )}

          <div className="glass-input-wrapper">
            <label className="glass-input-label">Email Address</label>
            <input
              type="email"
              className="glass-input"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. john@example.com"
            />
          </div>

          <div className="glass-input-wrapper">
            <label className="glass-input-label">Password</label>
            <input
              type="password"
              className="glass-input"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {!isLogin && (
            <div className="glass-input-wrapper">
              <label className="glass-input-label">Select Role</label>
              <select
                className="glass-input"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={{ 
                  appearance: 'none', 
                  background: 'rgba(0,0,0,0.2) url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2394a3b8\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'><polyline points=\'6 9 12 15 18 9\'></polyline></svg>") no-repeat right 12px center', 
                  backgroundSize: '16px' 
                }}
              >
                <option value="user" style={{ background: '#0f172a', color: '#fff' }}>End User</option>
                <option value="support_agent" style={{ background: '#0f172a', color: '#fff' }}>Support Agent</option>
                <option value="admin" style={{ background: '#0f172a', color: '#fff' }}>Administrator</option>
              </select>
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={submitting} style={{ marginTop: '1rem' }}>
            {submitting ? 'Authenticating...' : isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.875rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>
            {isLogin ? "Don't have an account? " : 'Already registered? '}
          </span>
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
            }}
            style={{ background: 'none', border: 'none', color: 'var(--accent-color)', fontWeight: 600, cursor: 'pointer', outline: 'none' }}
          >
            {isLogin ? 'Create one' : 'Sign in'}
          </button>
        </div>
      </div>

    </div>
  );
}
