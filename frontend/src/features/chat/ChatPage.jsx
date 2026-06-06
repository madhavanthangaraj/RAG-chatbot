import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { ThemeContext } from '../../context/ThemeContext';
import * as chatService from '../../services/chat.service';
import { jsPDF } from 'jspdf';
import { ArrowLeft, MessageSquare, Send, Award, BookOpen, ThumbsUp, LogOut, Download, Menu, Star, Check, Sun, Moon, Copy, MoreHorizontal } from 'lucide-react';

export default function ChatPage() {
  const { user, loading } = useContext(AuthContext);
  const { theme, setTheme } = useContext(ThemeContext);
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Feedback Modal
  const [feedbackMsgId, setFeedbackMsgId] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  const messagesEndRef = useRef(null);

  const isDarkMode = theme === 'dark';
  const textColor = isDarkMode ? '#fff' : '#0f172a';
  const textMuted = isDarkMode ? 'var(--text-muted)' : '#475569';
  const sidebarBg = isDarkMode ? 'var(--glass-bg)' : 'rgba(255, 255, 255, 0.85)';
  const sidebarBorder = isDarkMode ? 'var(--glass-border)' : '1px solid rgba(0, 0, 0, 0.08)';
  const headerBg = isDarkMode ? 'rgba(15, 23, 42, 0.2)' : 'rgba(255, 255, 255, 0.7)';
  const footerBg = isDarkMode ? 'rgba(15, 23, 42, 0.3)' : 'rgba(255, 255, 255, 0.8)';
  const messageUserBg = isDarkMode ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.2)';
  const messageUserBorder = isDarkMode ? 'rgba(139, 92, 246, 0.25)' : 'rgba(139, 92, 246, 0.35)';
  const messageAiBg = isDarkMode ? 'var(--glass-bg)' : 'rgba(255, 255, 255, 0.75)';
  const messageAiBorder = isDarkMode ? 'var(--glass-border)' : '1px solid rgba(0, 0, 0, 0.08)';

  const [copiedMsgId, setCopiedMsgId] = useState(null);

  const handleCopyMessage = (msgId, content) => {
    navigator.clipboard.writeText(content);
    setCopiedMsgId(msgId);
    setTimeout(() => {
      setCopiedMsgId(null);
    }, 2000);
  };

  // Custom Titles, Pinned Chats, Menu Dropdown, and Rename States
  const [customTitles, setCustomTitles] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('chat_titles')) || {};
    } catch {
      return {};
    }
  });

  const [pinnedChats, setPinnedChats] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('chat_pinned')) || {};
    } catch {
      return {};
    }
  });

  const [activeMenuId, setActiveMenuId] = useState(null);
  const [renamingConvId, setRenamingConvId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const formatTime = (isoString) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };
  const [renameText, setRenameText] = useState('');

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('chat_titles', JSON.stringify(customTitles));
  }, [customTitles]);

  useEffect(() => {
    localStorage.setItem('chat_pinned', JSON.stringify(pinnedChats));
  }, [pinnedChats]);

  // Handlers
  const handleRename = (convId, newName) => {
    if (!newName.trim()) return;
    setCustomTitles(prev => ({
      ...prev,
      [convId]: newName.trim()
    }));
    setRenamingConvId(null);
    setActiveMenuId(null);
  };

  const handleTogglePin = (convId) => {
    setPinnedChats(prev => ({
      ...prev,
      [convId]: !prev[convId]
    }));
    setActiveMenuId(null);
  };

  const handleDeleteChat = async (convId) => {
    try {
      await chatService.deleteConversation(convId);
      // Remove from list
      setConversations(prev => prev.filter(c => c.id !== convId));
      // Clean up localStorage keys
      setCustomTitles(prev => {
        const copy = { ...prev };
        delete copy[convId];
        return copy;
      });
      setPinnedChats(prev => {
        const copy = { ...prev };
        delete copy[convId];
        return copy;
      });
      // If deleted was active, reset activeConvId
      if (activeConvId === convId) {
        setActiveConvId(null);
      }
      setActiveMenuId(null);
    } catch (err) {
      console.error('Failed to delete chat:', err);
    }
  };

  const handleClearAllHistory = async () => {
    if (!window.confirm('Are you sure you want to clear all chat history? This cannot be undone.')) return;
    try {
      await chatService.clearAllHistory();
      setConversations([]);
      setCustomTitles({});
      setPinnedChats({});
      setActiveConvId(null);
      setActiveMenuId(null);
    } catch (err) {
      console.error('Failed to clear all history:', err);
    }
  };

  // Auth Guard
  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  // Load sessions on mount
  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  // Load messages when conversationId changes
  useEffect(() => {
    if (activeConvId) {
      loadMessages(activeConvId);
    } else {
      setMessages([]);
      setSuggestedQuestions([]);
    }
  }, [activeConvId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      const list = await chatService.listConversations();
      setConversations(list);
    } catch (err) {
      console.error('Error loading conversations:', err);
    }
  };

  const loadMessages = async (convId) => {
    try {
      const history = await chatService.getHistory(convId);
      setMessages(history);
      // Derive followups from last message if it is AI
      if (history.length > 0) {
        const lastMsg = history[history.length - 1];
        if (lastMsg.sender === 'ai') {
          // Set some fallback followups
          setSuggestedQuestions([
            'Can you explain that in more detail?',
            'How do I configure related settings?'
          ]);
        } else {
          setSuggestedQuestions([]);
        }
      }
    } catch (err) {
      console.error('Error loading messages:', err);
    }
  };

  const handleSend = async (textToSend) => {
    const query = textToSend || inputText;
    if (!query.trim() || sending) return;

    setInputText('');
    setSending(true);

    // Optimistic user update
    const tempUserMsg = {
      id: 'temp_user',
      sender: 'user',
      content: query,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const data = await chatService.sendMessage(query, activeConvId);
      
      // Update active conversation ID if we created a new one
      if (!activeConvId) {
        setActiveConvId(data.conversationId);
        loadConversations();
      }

      // Append bot response
      const tempAiMsg = {
        id: data.aiMessageId,
        sender: 'ai',
        content: data.reply,
        confidence_score: data.confidenceScore,
        citations: data.citations,
        created_at: new Date().toISOString()
      };

      setMessages(prev => prev.filter(m => m.id !== 'temp_user').concat(tempUserMsg, tempAiMsg));
      setSuggestedQuestions(data.suggestedFollowups || []);
    } catch (err) {
      console.error('Error sending message:', err);
      setMessages(prev => prev.filter(m => m.id !== 'temp_user'));
    } finally {
      setSending(false);
    }
  };

  const startNewChat = () => {
    setActiveConvId(null);
    setMessages([]);
    setSuggestedQuestions([]);
  };

  const triggerFeedback = (msgId) => {
    setFeedbackMsgId(msgId);
    setRating(5);
    setComment('');
    setShowFeedbackModal(true);
  };

  const submitFeedback = async () => {
    try {
      await chatService.submitFeedback(feedbackMsgId, rating, comment);
      
      // Optimistically update rating in message bubble
      setMessages(prev => prev.map(m => m.id === feedbackMsgId ? { ...m, feedback_rating: rating } : m));
      setShowFeedbackModal(false);
    } catch (err) {
      console.error('Feedback submit failed:', err);
    }
  };

  const exportPDF = () => {
    if (messages.length === 0) return;

    const doc = new jsPDF();
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(16);
    doc.text('Support Conversation Transcript', 20, 20);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 28);
    doc.line(20, 32, 190, 32);

    let y = 40;
    messages.forEach((msg) => {
      const sender = msg.sender.toUpperCase();
      const date = new Date(msg.created_at || Date.now()).toLocaleTimeString();
      
      doc.setFont('Helvetica', 'bold');
      doc.text(`[${date}] ${sender}:`, 20, y);
      y += 6;
      
      doc.setFont('Helvetica', 'normal');
      const splitContent = doc.splitTextToSize(msg.content, 160);
      splitContent.forEach((line) => {
        if (y > 280) {
          doc.addPage();
          y = 20;
        }
        doc.text(line, 25, y);
        y += 6;
      });

      if (msg.citations && msg.citations.length > 0) {
        doc.setFont('Helvetica', 'italic');
        doc.text('Citations:', 25, y);
        y += 5;
        msg.citations.forEach((cit) => {
          doc.text(`- ${cit.title}`, 30, y);
          y += 5;
        });
      }
      y += 5;
    });

    doc.save(`chat-history-${activeConvId || 'new'}.pdf`);
  };

  if (loading || !user) return null;

  const sortedConversations = [...conversations].sort((a, b) => {
    const aPinned = pinnedChats[a.id] ? 1 : 0;
    const bPinned = pinnedChats[b.id] ? 1 : 0;
    if (aPinned !== bPinned) {
      return bPinned - aPinned;
    }
    return new Date(b.created_at) - new Date(a.created_at);
  });

  const filteredConversations = sortedConversations.filter(c => {
    const chatName = (customTitles[c.id] || c.id).toLowerCase();
    return chatName.includes(searchQuery.toLowerCase());
  });

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-gradient)' }}>
      {/* 1. Conversations history sidebar */}
      {sidebarOpen && (
        <div className="glass-card animate-fade-in" style={{
          width: '280px',
          height: '100%',
          borderRadius: 0,
          borderTop: 'none',
          borderBottom: 'none',
          borderLeft: 'none',
          display: 'flex',
          flexDirection: 'column',
          padding: '1.5rem 1rem 1rem',
          background: sidebarBg,
          borderRight: sidebarBorder,
          transition: 'background 0.3s ease, border-right 0.3s ease'
        }}>
          <button onClick={() => navigate('/profile')} className="btn-secondary" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1rem',
            justifyContent: 'center',
            fontSize: '0.8rem',
            color: textColor
          }}>
            <ArrowLeft size={16} /> Back to Profile
          </button>

          <button onClick={startNewChat} className="btn-primary" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            marginBottom: '1.5rem',
            fontSize: '0.9rem',
            padding: '0.75rem'
          }}>
            <MessageSquare size={18} /> New Conversation
          </button>

          <h4 style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: textMuted, marginBottom: '0.75rem', letterSpacing: '0.05em' }}>
            History Sessions
          </h4>

          {/* Search Bar */}
          <div style={{ marginBottom: '0.75rem', position: 'relative' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search history..."
              style={{
                width: '100%',
                padding: '0.45rem 0.65rem',
                fontSize: '0.8rem',
                background: isDarkMode ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.85)',
                border: isDarkMode ? '1px solid var(--glass-border)' : '1px solid rgba(0,0,0,0.08)',
                borderRadius: '6px',
                color: textColor,
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {filteredConversations.map((c) => {
              const isSelected = activeConvId === c.id;
              const isPinned = pinnedChats[c.id];
              const chatName = customTitles[c.id] || `${c.id.substring(0, 8)} (${new Date(c.created_at).toLocaleDateString()})`;

              if (renamingConvId === c.id) {
                return (
                  <div key={c.id} style={{ display: 'flex', gap: '0.25rem', width: '100%', padding: '0.25rem' }}>
                    <input
                      type="text"
                      value={renameText}
                      onChange={(e) => setRenameText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRename(c.id, renameText);
                        if (e.key === 'Escape') setRenamingConvId(null);
                      }}
                      style={{
                        flex: 1,
                        padding: '0.35rem 0.5rem',
                        background: isDarkMode ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.85)',
                        border: '1px solid var(--accent-color)',
                        borderRadius: '6px',
                        color: textColor,
                        fontSize: '0.8rem',
                        outline: 'none',
                        boxSizing: 'border-box',
                        minWidth: 0
                      }}
                      autoFocus
                    />
                    <button onClick={() => handleRename(c.id, renameText)} style={{
                      background: 'var(--primary-color)',
                      border: 'none',
                      borderRadius: '6px',
                      color: '#fff',
                      padding: '0.35rem 0.6rem',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      fontWeight: 700
                    }}>
                      Save
                    </button>
                  </div>
                );
              }

              return (
                <div 
                  key={c.id} 
                  className="history-item-container"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                    position: 'relative',
                    borderRadius: '8px',
                    background: isSelected ? (isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)') : 'transparent',
                    transition: 'background 0.2s ease',
                    paddingRight: '0.25rem'
                  }}
                >
                  <button
                    onClick={() => setActiveConvId(c.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.65rem',
                      flex: 1,
                      padding: '0.65rem 0.5rem 0.65rem 0.65rem',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: '8px',
                      color: isSelected ? textColor : textMuted,
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontSize: '0.85rem',
                      fontWeight: isSelected ? 600 : 500,
                      overflow: 'hidden'
                    }}
                  >
                    <MessageSquare size={16} style={{ flexShrink: 0, color: isPinned ? 'var(--accent-color)' : (isSelected ? 'var(--primary-color)' : textMuted) }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }} title={chatName}>
                      {isPinned ? `📌 ${chatName}` : chatName}
                    </span>
                  </button>

                  {/* 3-dots Menu trigger */}
                  <div style={{ position: 'relative' }}>
                    <button
                      className="menu-dots-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuId(activeMenuId === c.id ? null : c.id);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: textMuted,
                        cursor: 'pointer',
                        padding: '0.35rem',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: activeMenuId === c.id ? 1 : 0.4,
                        transition: 'opacity 0.2s ease, background 0.2s ease'
                      }}
                    >
                      <MoreHorizontal size={15} />
                    </button>

                    {/* Actions Dropdown */}
                    {activeMenuId === c.id && (
                      <div style={{
                        position: 'absolute',
                        right: 0,
                        top: '100%',
                        zIndex: 100,
                        width: '120px',
                        background: isDarkMode ? '#1e293b' : '#ffffff',
                        border: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.1)',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                        borderRadius: '8px',
                        padding: '0.35rem 0',
                        display: 'flex',
                        flexDirection: 'column'
                      }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setRenamingConvId(c.id);
                            setRenameText(customTitles[c.id] || c.id.substring(0, 8));
                            setActiveMenuId(null);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: textColor,
                            textAlign: 'left',
                            padding: '0.5rem 1rem',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            width: '100%',
                            fontWeight: 500,
                            transition: 'background 0.2s ease'
                          }}
                          className="menu-option"
                        >
                          Rename
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTogglePin(c.id);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: textColor,
                            textAlign: 'left',
                            padding: '0.5rem 1rem',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            width: '100%',
                            fontWeight: 500,
                            transition: 'background 0.2s ease'
                          }}
                          className="menu-option"
                        >
                          {isPinned ? 'Unpin' : 'Pin'}
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm('Delete this conversation?')) {
                              handleDeleteChat(c.id);
                            }
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--error-color)',
                            textAlign: 'left',
                            padding: '0.5rem 1rem',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            width: '100%',
                            fontWeight: 600,
                            transition: 'background 0.2s ease'
                          }}
                          className="menu-option"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {conversations.length > 0 && (
            <button 
              onClick={handleClearAllHistory} 
              className="btn-danger" 
              style={{
                marginTop: '1.25rem',
                padding: '0.65rem',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                fontWeight: 700,
                width: '100%',
                flexShrink: 0
              }}
            >
              Clear All History
            </button>
          )}
        </div>
      )}

      {/* 2. Main Chat dialog Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        {/* Chat Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.25rem 2rem',
          borderBottom: isDarkMode ? '1px solid var(--glass-border)' : '1px solid rgba(0, 0, 0, 0.08)',
          background: headerBg,
          color: textColor,
          transition: 'background 0.3s ease, border-bottom 0.3s ease, color 0.3s ease'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'none', border: 'none', color: textColor, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <Menu size={20} />
            </button>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: textColor }}>Support Chatbot</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--success-color)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success-color)' }}></span> 
                <span>AI service active</span>
                <span style={{ color: textMuted }}>•</span>
                <span style={{ 
                  background: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.05)', 
                  color: isDarkMode ? '#38bdf8' : '#0369a1',
                  padding: '0.1rem 0.4rem', 
                  borderRadius: '4px', 
                  fontSize: '0.65rem', 
                  fontWeight: 700, 
                  letterSpacing: '0.02em',
                  border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(0, 0, 0, 0.08)' 
                }}>
                  Ollama: llama3.2
                </span>
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Theme Toggle Button */}
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              style={{
                background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                border: isDarkMode ? '1px solid var(--glass-border)' : '1px solid rgba(0, 0, 0, 0.12)',
                borderRadius: '50%',
                width: '38px',
                height: '38px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                color: textColor,
                cursor: 'pointer',
                transition: 'var(--transition-all)'
              }}
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? <Sun size={18} style={{ color: '#fbbf24' }} /> : <Moon size={18} style={{ color: '#4f46e5' }} />}
            </button>

            {messages.length > 0 && (
              <button onClick={exportPDF} className="btn-secondary" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.8rem',
                padding: '0.5rem 0.85rem',
                color: textColor
              }}>
                <Download size={15} /> Export PDF
              </button>
            )}
          </div>
        </div>

        {/* Message bubble panels */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {messages.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: textMuted }}>
              <MessageSquare size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
              <p style={{ fontSize: '0.95rem' }}>Hello! Ask me any question, and I will search the Knowledge Base to resolve it.</p>
            </div>
          ) : (
            messages.map((m) => {
              const isUser = m.sender === 'user';
              return (
                <div key={m.id} style={{
                  display: 'flex',
                  justifyContent: isUser ? 'flex-end' : 'flex-start',
                  width: '100%'
                }}>
                  <div className="glass-card animate-fade-in" style={{
                    maxWidth: '70%',
                    padding: '1.25rem',
                    borderRadius: '12px',
                    borderTopRightRadius: isUser ? '2px' : '12px',
                    borderTopLeftRadius: isUser ? '12px' : '2px',
                    background: isUser ? messageUserBg : messageAiBg,
                    borderColor: isUser ? messageUserBorder : messageAiBorder,
                    color: textColor,
                    transition: 'background 0.3s ease, border-color 0.3s ease, color 0.3s ease'
                  }}>
                    {/* Content text */}
                    <div style={{ fontSize: '0.95rem', lineHeight: '1.5', whiteSpace: 'pre-line' }}>{m.content}</div>

                    {/* Tiny Timestamp */}
                    <div style={{ 
                      fontSize: '0.65rem', 
                      color: textMuted, 
                      textAlign: 'right', 
                      marginTop: '0.4rem',
                      opacity: 0.75,
                      fontWeight: 500
                    }}>
                      {formatTime(m.created_at)}
                    </div>

                    {/* Metadata elements: confidence score & feedback stars */}
                    {!isUser && m.id !== 'temp_ai' && (
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: '1rem',
                        paddingTop: '0.75rem',
                        borderTop: isDarkMode ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.08)',
                        fontSize: '0.75rem',
                        color: textMuted
                      }}>
                        {/* Match Rating Indicator */}
                        {m.confidence_score !== null && (
                          <span style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            color: m.confidence_score >= 0.75 ? 'var(--success-color)' : '#fbbf24',
                            fontWeight: 600
                          }}>
                            <Award size={14} /> {Math.round(m.confidence_score * 100)}% Match
                          </span>
                        )}

                        {/* CSAT & Utility actions */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <button 
                            onClick={() => handleCopyMessage(m.id, m.content)} 
                            style={{
                              background: 'none',
                              border: 'none',
                              color: textMuted,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              transition: 'color 0.2s ease'
                            }}
                            title="Copy response to clipboard"
                          >
                            {copiedMsgId === m.id ? (
                              <>
                                <Check size={13} style={{ color: 'var(--success-color)' }} />
                                <span style={{ color: 'var(--success-color)', fontWeight: 600 }}>Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy size={13} />
                                <span>Copy</span>
                              </>
                            )}
                          </button>

                          <div style={{ width: '1px', height: '12px', background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}></div>

                          {m.feedback_rating ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#f59e0b', fontWeight: 600 }}>
                              <Star size={13} fill="#f59e0b" /> {m.feedback_rating}
                            </span>
                          ) : (
                            <button onClick={() => triggerFeedback(m.id)} style={{
                              background: 'none',
                              border: 'none',
                              color: textMuted,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}>
                              <ThumbsUp size={13} /> Feedback
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Citations accordion */}
                    {!isUser && m.citations && m.citations.length > 0 && (
                      <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: 600, color: isDarkMode ? 'var(--accent-color)' : 'var(--primary-color)' }}>
                          <BookOpen size={13} /> Citations Reference
                        </div>
                        {m.citations.map((c, idx) => (
                          <div key={idx} style={{
                            fontSize: '0.75rem',
                            background: isDarkMode ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.04)',
                            padding: '0.5rem 0.75rem',
                            borderRadius: '6px',
                            border: isDarkMode ? '1px solid rgba(255,255,255,0.03)' : '1px solid rgba(0,0,0,0.05)',
                            color: textColor
                          }}>
                            <strong>{c.title}</strong>
                            <p style={{ color: textMuted, marginTop: '0.25rem' }}>{c.snippet}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* AI Typing Indicator */}
          {sending && (
            <div style={{ display: 'flex', justifyContent: 'flex-start', width: '100%' }}>
              <div className="glass-card animate-fade-in" style={{
                maxWidth: '70%',
                padding: '1rem 1.5rem',
                borderRadius: '12px',
                borderTopLeftRadius: '2px',
                background: messageAiBg,
                borderColor: messageAiBorder,
                color: textColor,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                transition: 'background 0.3s ease, border-color 0.3s ease'
              }}>
                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', height: '18px', padding: '0 0.25rem' }}>
                  <span className="dot-typing" style={{ width: '6px', height: '6px', borderRadius: '50%', background: textColor }}></span>
                  <span className="dot-typing" style={{ width: '6px', height: '6px', borderRadius: '50%', background: textColor }}></span>
                  <span className="dot-typing" style={{ width: '6px', height: '6px', borderRadius: '50%', background: textColor }}></span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input box & Suggested followups panel */}
        <div style={{ 
          padding: '1.5rem 2rem', 
          background: footerBg, 
          borderTop: isDarkMode ? '1px solid var(--glass-border)' : '1px solid rgba(0,0,0,0.08)',
          transition: 'background 0.3s ease, border-top 0.3s ease'
        }}>
          {/* Suggested follow-up list */}
          {suggestedQuestions.length > 0 && (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              {suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(q)}
                  style={{
                    background: isDarkMode ? 'rgba(139,92,246,0.08)' : 'rgba(139,92,246,0.12)',
                    border: isDarkMode ? '1px solid rgba(139,92,246,0.2)' : '1px solid rgba(139,92,246,0.3)',
                    borderRadius: '50px',
                    padding: '0.45rem 1rem',
                    fontSize: '0.75rem',
                    color: textColor,
                    cursor: 'pointer',
                    transition: 'var(--transition-all)'
                  }}
                >
                  💡 {q}
                </button>
              ))}
            </div>
          )}

          {/* Form input */}
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} style={{ display: 'flex', gap: '1rem' }}>
            <input
              type="text"
              className="glass-input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask a support question... (e.g. Vite Setup Guide)"
              disabled={sending}
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn-primary" disabled={sending || !inputText.trim()} style={{ width: 'auto', padding: '0 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Send size={16} /> Send
            </button>
          </form>
        </div>
      </div>

      {/* 3. Feedback ratings modal popup */}
      {showFeedbackModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="glass-card animate-fade-in" style={{
            width: '100%',
            maxWidth: '400px',
            background: isDarkMode ? 'var(--glass-bg)' : 'rgba(255, 255, 255, 0.95)',
            borderColor: isDarkMode ? 'var(--glass-border)' : 'rgba(0, 0, 0, 0.1)',
            color: textColor,
            transition: 'background 0.3s ease, border-color 0.3s ease, color 0.3s ease'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', textAlign: 'center', color: textColor }}>Helpfulness Rating</h3>
            <p style={{ color: textMuted, fontSize: '0.8rem', textAlign: 'center', marginBottom: '1.5rem' }}>
              Rate the AI response to help us improve the Knowledge Base references.
            </p>

            {/* Stars Selector */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <Star size={32} fill={star <= rating ? '#fbbf24' : 'transparent'} stroke={star <= rating ? '#fbbf24' : (isDarkMode ? '#64748b' : '#94a3b8')} />
                </button>
              ))}
            </div>

            {/* Comment Box */}
            <div className="glass-input-wrapper">
              <label className="glass-input-label" style={{ color: textMuted }}>Comment (Optional)</label>
              <textarea
                className="glass-input"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="What could be improved about this guide?"
                rows={3}
                style={{ resize: 'none', fontFamily: 'inherit' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button onClick={() => setShowFeedbackModal(false)} className="btn-secondary" style={{ flex: 1, color: textColor }}>
                Cancel
              </button>
              <button onClick={submitFeedback} className="btn-primary" style={{ flex: 1 }}>
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`
        @keyframes typing-bounce {
          0%, 100% { transform: translateY(0); opacity: 0.35; }
          50% { transform: translateY(-5px); opacity: 1; }
        }
        .dot-typing {
          animation: typing-bounce 1.2s infinite ease-in-out;
        }
        .dot-typing:nth-child(2) {
          animation-delay: 0.2s;
        }
        .dot-typing:nth-child(3) {
          animation-delay: 0.4s;
        }
        .history-item-container:hover .menu-dots-btn {
          opacity: 1 !important;
          background: ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'};
        }
        .menu-option:hover {
          background: ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} !important;
        }
      `}</style>
    </div>
  );
}
