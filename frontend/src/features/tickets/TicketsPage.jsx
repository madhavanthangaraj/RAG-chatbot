import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import * as ticketService from '../../services/ticket.service';
import { ArrowLeft, Plus, Search, User, Clock, AlertCircle, MessageSquare, ShieldAlert, RefreshCw, Send, History, Trash2 } from 'lucide-react';

export default function TicketsPage() {
  const { user, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [selectedDetails, setSelectedDetails] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  
  const [newComment, setNewComment] = useState('');
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPriority, setNewPriority] = useState('medium');
  const [newCategory, setNewCategory] = useState('General');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      loadTickets();
    }
  }, [user, statusFilter, priorityFilter]);

  useEffect(() => {
    if (selectedTicket) {
      loadTicketDetails(selectedTicket.id);
    } else {
      setSelectedDetails(null);
    }
  }, [selectedTicket]);

  const loadTickets = async () => {
    setLoadingList(true);
    try {
      const list = await ticketService.listTickets({
        status: statusFilter || undefined,
        priority: priorityFilter || undefined
      });
      setTickets(list);
      
      if (selectedTicket) {
        const matching = list.find(t => t.id === selectedTicket.id);
        if (matching) setSelectedTicket(matching);
      }
    } catch (err) {
      console.error('Error loading tickets:', err);
    } finally {
      setLoadingList(false);
    }
  };

  const loadTicketDetails = async (id) => {
    setLoadingDetails(true);
    try {
      const data = await ticketService.getTicketById(id);
      setSelectedDetails(data);
    } catch (err) {
      console.error('Error loading ticket details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleUpdateField = async (field, value) => {
    if (!selectedTicket) return;
    try {
      const updates = {};
      if (field === 'status') updates.status = value;
      if (field === 'priority') updates.priority = value;
      if (field === 'assignedTo') updates.assignedTo = value; 
      
      await ticketService.updateTicket(selectedTicket.id, updates);
      await loadTickets();
      await loadTicketDetails(selectedTicket.id);
    } catch (err) {
      console.error(`Error updating ticket ${field}:`, err);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedTicket) return;

    try {
      await ticketService.addComment(selectedTicket.id, newComment);
      setNewComment('');
      await loadTicketDetails(selectedTicket.id);
    } catch (err) {
      console.error('Error posting comment:', err);
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!newSubject.trim() || !newDescription.trim() || creating) return;

    setCreating(true);
    try {
      const ticket = await ticketService.createTicket({
        subject: newSubject,
        description: newDescription,
        priority: newPriority,
        category: newCategory
      });
      
      setNewSubject('');
      setNewDescription('');
      setShowCreateModal(false);
      await loadTickets();
      setSelectedTicket(ticket);
    } catch (err) {
      console.error('Error creating ticket:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteTicket = async (id) => {
    if (!window.confirm('Are you sure you want to delete this support ticket? This action cannot be undone.')) {
      return;
    }

    try {
      await ticketService.deleteTicket(id);
      setSelectedTicket(null);
      setSelectedDetails(null);
      await loadTickets();
    } catch (err) {
      console.error('Error deleting ticket:', err);
    }
  };


  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'urgent':
        return { background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' };
      case 'high':
        return { background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' };
      case 'medium':
        return { background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)' };
      default:
        return { background: 'rgba(100, 116, 139, 0.1)', color: '#64748b', border: '1px solid rgba(100,116,139,0.2)' };
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'resolved':
        return { background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' };
      case 'in_progress':
        return { background: 'rgba(6, 182, 212, 0.1)', color: '#06b6d4', border: '1px solid rgba(6,182,212,0.2)' };
      case 'closed':
        return { background: 'rgba(100, 116, 139, 0.1)', color: '#64748b', border: '1px solid rgba(100,116,139,0.2)' };
      default:
        return { background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' };
    }
  };

  const filteredTickets = tickets.filter(t => 
    t.subject.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading || !user) return null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-gradient)', padding: '2rem', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <button onClick={() => navigate('/profile')} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
            <ArrowLeft size={16} /> Profile
          </button>
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Ticket Center</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>View, track, and manage support tickets</p>
          </div>
        </div>

        <button onClick={() => setShowCreateModal(true)} className="btn-primary" style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.25rem', fontSize: '0.85rem' }}>
          <Plus size={16} /> New Support Ticket
        </button>
      </div>

      <div style={{ display: 'flex', gap: '2rem', flex: 1, height: 'calc(100vh - 160px)', overflow: 'hidden' }}>
        <div className="glass-card" style={{ width: '380px', display: 'flex', flexDirection: 'column', padding: '1.5rem', height: '100%', flexShrink: 0 }}>
          <div className="glass-input-wrapper" style={{ marginBottom: '1rem', position: 'relative' }}>
            <input
              type="text"
              className="glass-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by keywords..."
              style={{ paddingLeft: '2.5rem' }}
            />
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <select className="glass-input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: '0.45rem', fontSize: '0.8rem', flex: 1 }}>
              <option value="">All Statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
            <select className="glass-input" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} style={{ padding: '0.45rem', fontSize: '0.8rem', flex: 1 }}>
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {loadingList ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading tickets list...</p>
            ) : filteredTickets.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>No tickets found matching options.</p>
            ) : (
              filteredTickets.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTicket(t)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'stretch',
                    textAlign: 'left',
                    width: '100%',
                    padding: '1rem',
                    background: selectedTicket?.id === t.id ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.15)',
                    border: '1px solid',
                    borderColor: selectedTicket?.id === t.id ? 'var(--accent-color)' : 'var(--glass-border)',
                    borderRadius: '8px',
                    color: 'inherit',
                    cursor: 'pointer',
                    transition: 'var(--transition-all)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.subject}
                    </span>
                    {t.escalated === 1 && (
                      <span style={{ display: 'flex', alignItems: 'center', color: 'var(--error-color)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>
                        <ShieldAlert size={12} style={{ marginRight: '2px' }} /> Escalated
                      </span>
                    )}
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', marginBottom: '0.75rem', lineHeight: '1.4' }}>
                    {t.description}
                  </p>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginTop: 'auto' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.7rem' }}>
                      <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 700, ...getPriorityStyle(t.priority) }}>
                        {t.priority}
                      </span>
                      <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 700, ...getStatusStyle(t.status) }}>
                        {t.status}
                      </span>
                    </div>

                    {(user.role !== 'user' || t.user_id === user.id) && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTicket(t.id);
                        }}
                        style={{
                          color: 'rgba(239, 68, 68, 0.6)',
                          cursor: 'pointer',
                          padding: '0.25rem',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'color 0.2s ease, background 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = 'var(--error-color)';
                          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = 'rgba(239, 68, 68, 0.6)';
                          e.currentTarget.style.background = 'none';
                        }}
                        title="Delete Support Ticket"
                      >
                        <Trash2 size={14} />
                      </div>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '2rem', height: '100%', overflowY: 'auto' }}>
          {!selectedTicket ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
              <AlertCircle size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
              <p style={{ fontSize: '0.95rem' }}>Select a ticket from the left panel to load detail tracking files.</p>
            </div>
          ) : loadingDetails || !selectedDetails ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <RefreshCw size={24} className="spin-anim" />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1.5rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.5rem' }}>{selectedDetails.subject}</h3>
                  <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <User size={14} /> Created by: <strong>{selectedDetails.creator_name || 'System Auto'}</strong>
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Clock size={14} /> Logged: {new Date(selectedDetails.created_at).toLocaleString()}
                    </span>
                    <span>
                      Assignee: <strong>{selectedDetails.assignee_name || 'Unassigned'}</strong>
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ padding: '0.35rem 0.75rem', borderRadius: '4px', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 700, ...getPriorityStyle(selectedDetails.priority) }}>
                    {selectedDetails.priority}
                  </span>
                  <span style={{ padding: '0.35rem 0.75rem', borderRadius: '4px', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 700, ...getStatusStyle(selectedDetails.status) }}>
                    {selectedDetails.status}
                  </span>
                  {(user.role !== 'user' || selectedDetails.user_id === user.id) && (
                    <button 
                      onClick={() => handleDeleteTicket(selectedDetails.id)} 
                      className="btn-danger"
                      title="Delete Support Ticket"
                      style={{ 
                        padding: '0.35rem', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        borderRadius: 'var(--radius-input)',
                        cursor: 'pointer' 
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

              </div>

              <div>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Case Description
                </h4>
                <div style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid var(--glass-border)', padding: '1.25rem', borderRadius: '8px', fontSize: '0.95rem', lineHeight: '1.5', whiteSpace: 'pre-line' }}>
                  {selectedDetails.description}
                </div>
              </div>

              {selectedDetails.escalated === 1 && (
                <div style={{ background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '1.25rem', borderRadius: '8px' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-color)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <ShieldAlert size={15} /> AI Diagnosis Assistant
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Escalation Category:</span> <strong>{selectedDetails.category}</strong>
                    </div>
                    {selectedDetails.escalation_reason && (
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Escalation Trigger:</span> <em style={{ fontSize: '0.8rem' }}>{selectedDetails.escalation_reason}</em>
                      </div>
                    )}
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Suggested Root Cause Suggestion:</span>
                      <p style={{ marginTop: '0.25rem', padding: '0.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '4px', borderLeft: '3px solid var(--accent-color)' }}>
                        {selectedDetails.root_cause_suggestion || 'No suggestion computed yet.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {user.role !== 'user' && (
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', padding: '1.25rem', borderRadius: '8px', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '150px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>Update Status</span>
                    <select className="glass-input" value={selectedDetails.status} onChange={(e) => handleUpdateField('status', e.target.value)} style={{ padding: '0.5rem' }}>
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                  <div style={{ flex: 1, minWidth: '150px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>Update Priority</span>
                    <select className="glass-input" value={selectedDetails.priority} onChange={(e) => handleUpdateField('priority', e.target.value)} style={{ padding: '0.5rem' }}>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>
              )}

              <div>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <MessageSquare size={16} /> Comments History Thread
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                  {selectedDetails.comments.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontStyle: 'italic' }}>No comments logged yet on this ticket.</p>
                  ) : (
                    selectedDetails.comments.map((c) => (
                      <div key={c.id} style={{
                        background: 'rgba(0,0,0,0.15)',
                        border: '1px solid var(--glass-border)',
                        padding: '1rem',
                        borderRadius: '8px'
                      }}>
                        <div style={{ display: 'flex', justifyBetween: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.45rem' }}>
                          <span style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                            <span><strong>{c.commenter_name || 'System Auto'}</strong> ({c.commenter_role || 'user'})</span>
                            <span>{new Date(c.created_at).toLocaleString()}</span>
                          </span>
                        </div>
                        <p style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>{c.comment}</p>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <input
                    type="text"
                    className="glass-input"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Type a response comment..."
                    style={{ flex: 1 }}
                  />
                  <button type="submit" className="btn-primary" disabled={!newComment.trim()} style={{ width: 'auto', padding: '0 1.25rem', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}>
                    <Send size={14} /> Post
                  </button>
                </form>
              </div>

              <div>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <History size={16} /> Ticket History Log
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '150px', overflowY: 'auto', paddingRight: '0.5rem', fontSize: '0.8rem' }}>
                  {selectedDetails.history.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)' }}>No audit events logged.</p>
                  ) : (
                    selectedDetails.history.map((h) => (
                      <div key={h.id} style={{ color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '0.35rem' }}>
                        <span>
                          [{new Date(h.created_at).toLocaleDateString()}] Field: <strong>{h.field_changed}</strong> from <code>{h.old_value || 'None'}</code> to <code>{h.new_value || 'None'}</code> by <strong>{h.changer_name || 'System'}</strong>
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
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
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '500px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', textAlign: 'center' }}>Log Support Ticket</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', marginBottom: '1.5rem' }}>
              Create a support ticket manually to escalate an issue to our engineering team.
            </p>

            <form onSubmit={handleCreateTicket}>
              <div className="glass-input-wrapper">
                <label className="glass-input-label">Ticket Subject</label>
                <input
                  type="text"
                  className="glass-input"
                  required
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="e.g. Database locked exceptions"
                />
              </div>

              <div className="glass-input-wrapper">
                <label className="glass-input-label">Detailed Description</label>
                <textarea
                  className="glass-input"
                  required
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Explain the steps to reproduce or what error output is showing..."
                  rows={4}
                  style={{ resize: 'none', fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="glass-input-wrapper" style={{ flex: 1 }}>
                  <label className="glass-input-label">Priority</label>
                  <select className="glass-input" value={newPriority} onChange={(e) => setNewPriority(e.target.value)}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div className="glass-input-wrapper" style={{ flex: 1 }}>
                  <label className="glass-input-label">Category</label>
                  <input
                    type="text"
                    className="glass-input"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="e.g. Billing, Auth"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={creating} style={{ flex: 1 }}>
                  {creating ? 'Submitting...' : 'Log Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
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
