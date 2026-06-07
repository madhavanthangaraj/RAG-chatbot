import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from '../../context/ThemeContext';
import { 
  ArrowRight, 
  Bot, 
  Database, 
  ShieldAlert, 
  BarChart3, 
  Sun, 
  Moon, 
  Layers, 
  Cpu, 
  Settings 
} from 'lucide-react';

export default function LandingPage() {
  const { theme, setTheme } = useContext(ThemeContext);
  const navigate = useNavigate();

  const handleToggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const features = [
    {
      icon: <Bot size={28} className="text-primary-color" style={{ color: 'var(--primary-color)' }} />,
      title: "RAG Conversational AI",
      description: "Powered by local LLMs (llama3.2) & embeddings (nomic-embed-text) for precise, context-aware answers to student and staff queries."
    },
    {
      icon: <Database size={28} style={{ color: 'hsl(187, 90%, 50%)' }} />,
      title: "Knowledge Base Manager",
      description: "Drag-and-drop ingestion strictly optimized for Markdown (.md) documents with automatic checksumming and full version history tracking."
    },
    {
      icon: <ShieldAlert size={28} style={{ color: 'hsl(0, 84%, 60%)' }} />,
      title: "Automated Ticket Escalation",
      description: "Custom confidence evaluation that auto-escalates low-confidence queries (below 30% match) into priority-tiered support tickets."
    },
    {
      icon: <BarChart3 size={28} style={{ color: 'hsl(142, 70%, 45%)' }} />,
      title: "Real-time Analytics",
      description: "Interactive dashboard tracking query success rates, unresolved search terms, CSAT metrics, and team resolution times."
    }
  ];

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background neon glow blobs */}
      <div style={{
        position: 'absolute',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'rgba(99, 102, 241, 0.15)',
        filter: 'blur(120px)',
        top: '-10%',
        right: '-10%',
        zIndex: 0,
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'rgba(6, 182, 212, 0.1)',
        filter: 'blur(100px)',
        bottom: '10%',
        left: '-10%',
        zIndex: 0,
        pointerEvents: 'none'
      }} />

      {/* Header bar */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1.5rem 2rem',
        borderBottom: '1px solid var(--glass-border)',
        backdropFilter: 'var(--glass-blur)',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--primary-color) 0%, hsl(187, 90%, 50%) 100%)',
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 800,
            fontSize: '1.25rem',
            boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)'
          }}>
            K
          </div>
          <span style={{ 
            fontSize: '1.5rem', 
            fontWeight: 800, 
            letterSpacing: '-0.025em',
            background: 'linear-gradient(to right, var(--text-main) 60%, var(--text-muted))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            KnowledgeBridge
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            onClick={handleToggleTheme}
            style={{
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              borderRadius: '50%',
              width: '42px',
              height: '42px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-main)',
              cursor: 'pointer',
              transition: 'var(--transition-all)'
            }}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="hover-scale"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>

      {/* Main hero & info content */}
      <main style={{ 
        flex: 1, 
        zIndex: 1, 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '4rem 2rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4rem'
      }}>
        {/* Hero title info */}
        <section style={{ textAlign: 'center', maxWidth: '800px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.35rem 1rem',
            borderRadius: '9999px',
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
            fontSize: '0.75rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '1.5rem',
            color: 'var(--accent-color)'
          }}>
            <Bot size={14} /> Next-Gen AI Support Suite
          </div>
          
          <h1 style={{
            fontSize: '3.5rem',
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            marginBottom: '1.5rem'
          }}>
            Automate Support Operations With{' '}
            <span style={{
              background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--accent-color) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 40px var(--primary-glow)'
            }}>
              Agentic Intelligence
            </span>
          </h1>

          <p style={{
            fontSize: '1.125rem',
            color: 'var(--text-muted)',
            lineHeight: 1.6,
            marginBottom: '2.5rem',
            maxWidth: '640px',
            marginLeft: 'auto',
            marginRight: 'auto'
          }}>
            KnowledgeBridge integrates a local-first Retrieval-Augmented Generation (RAG) agent loop to instantly resolve level 0 questions and escalate tickets seamlessly when required.
          </p>

          <button
            onClick={() => navigate('/login')}
            style={{
              padding: '1rem 2.25rem',
              fontSize: '1.125rem',
              fontWeight: 700,
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, var(--primary-color) 0%, hsl(var(--primary), 80%, 45%) 100%)',
              color: '#fff',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.75rem',
              boxShadow: '0 8px 30px rgba(139, 92, 246, 0.4)',
              transition: 'var(--transition-all)'
            }}
            className="hover-scale"
          >
            Get Started
            <ArrowRight size={20} />
          </button>
        </section>

        {/* Feature Grid */}
        <section style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '2rem',
          width: '100%'
        }}>
          {features.map((feat, idx) => (
            <div 
              key={idx} 
              className="glass-card" 
              style={{
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
                borderRadius: '16px'
              }}
            >
              <div style={{
                background: 'var(--glass-bg)',
                width: '56px',
                height: '56px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid var(--glass-border)'
              }}>
                {feat.icon}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{feat.title}</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  {feat.description}
                </p>
              </div>
            </div>
          ))}
        </section>

        {/* Stack info / details */}
        <section style={{
          width: '100%',
          background: 'var(--glass-bg)',
          border: '1px solid var(--glass-border)',
          borderRadius: '20px',
          padding: '2.5rem',
          backdropFilter: 'var(--glass-blur)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '2.5rem',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ flex: '1 1 400px' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem' }}>
              🔒 Local-First, Private Architecture
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem', lineHeight: 1.6 }}>
              KnowledgeBridge runs entirely within your secure campus parameters. By employing Ollama for local model execution, student data never leaves the network, complying with strict privacy standards.
            </p>
          </div>

          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '1rem', 
            flex: '1 1 300px',
            justifyContent: 'flex-start'
          }}>
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--glass-border)',
              padding: '0.75rem 1.25rem',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.875rem'
            }}>
              <Layers size={16} /> Node.js / SQLite
            </div>
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--glass-border)',
              padding: '0.75rem 1.25rem',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.875rem'
            }}>
              <Cpu size={16} /> FastAPI / FAISS
            </div>
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--glass-border)',
              padding: '0.75rem 1.25rem',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.875rem'
            }}>
              <Settings size={16} /> Ollama & Llama3
            </div>
          </div>
        </section>
      </main>

      {/* Footer bar */}
      <footer style={{
        marginTop: 'auto',
        textAlign: 'center',
        padding: '2rem',
        borderTop: '1px solid var(--glass-border)',
        fontSize: '0.875rem',
        color: 'var(--text-muted)',
        zIndex: 10
      }}>
        <p>© 2026 KnowledgeBridge. All rights reserved. Locally executed for complete security.</p>
      </footer>
    </div>
  );
}
