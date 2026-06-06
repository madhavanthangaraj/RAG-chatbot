import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import * as kbService from '../../services/kb.service';
import * as analyticsService from '../../services/analytics.service';
import { 
  ArrowLeft, Search, Plus, Trash2, History, RefreshCw, FileText, 
  FileSpreadsheet, FileCode, UploadCloud, BookOpen, Clock, Edit3, 
  Eye, Check, AlertCircle, BarChart2, HelpCircle, ArrowRight, ShieldAlert 
} from 'lucide-react';

export default function KnowledgeBasePage() {
  const { user, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  // State Management
  const [articles, setArticles] = useState([]);
  const [filteredArticles, setFilteredArticles] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [versions, setVersions] = useState([]);
  
  // Analytics and Stats
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Search and Filters
  const [searchQuery, setSearchQuery] = useState('');
  
  // Editor state
  const [isEditing, setIsEditing] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editorTab, setEditorTab] = useState('edit'); // 'edit' | 'preview'
  const [saveLoading, setSaveLoading] = useState(false);

  // Drag & Drop Ingestion Zone state
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState(null);
  const [uploadError, setUploadError] = useState(null);

  // General loaders/notifiers
  const [loadingList, setLoadingList] = useState(true);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Current tab for layout: 'articles' | 'ingestion' | 'analytics'
  const [activeTab, setActiveTab] = useState('articles');

  // Auth Guard & Staff Role Check
  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  const isStaff = user && (user.role === 'admin' || user.role === 'support_agent');

  // Load database articles and statistics
  useEffect(() => {
    if (user && isStaff) {
      loadData();
    }
  }, [user]);

  // Handle client-side search & filtering
  useEffect(() => {
    let result = articles;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(a => 
        a.title.toLowerCase().includes(q) || 
        a.content.toLowerCase().includes(q)
      );
    }

    setFilteredArticles(result);
  }, [searchQuery, articles]);

  const loadData = async () => {
    setLoadingList(true);
    setLoadingStats(true);
    setErrorMsg(null);
    try {
      const artList = await kbService.listArticles();
      setArticles(artList);
      setFilteredArticles(artList);

      // Fetch analytics for dashboard views mapping
      const stats = await analyticsService.getDashboardData();
      setAnalyticsData(stats);
    } catch (err) {
      console.error('Error fetching knowledge base data:', err);
      setErrorMsg('Failed to load KB articles database.');
    } finally {
      setLoadingList(false);
      setLoadingStats(false);
    }
  };

  const loadVersions = async (articleId) => {
    setLoadingVersions(true);
    try {
      const vHistory = await kbService.getVersions(articleId);
      setVersions(vHistory);
    } catch (err) {
      console.error('Error fetching versions:', err);
    } finally {
      setLoadingVersions(false);
    }
  };

  const handleSelectArticle = (article) => {
    setSelectedArticle(article);
    setIsEditing(false);
    setIsCreatingNew(false);
    setEditTitle(article.title);
    setEditContent(article.content);
    setEditorTab('edit');
    loadVersions(article.id);
  };

  const handleCreateNewClick = () => {
    setSelectedArticle(null);
    setIsEditing(false);
    setIsCreatingNew(true);
    setEditTitle('');
    setEditContent('');
    setEditorTab('edit');
    setVersions([]);
  };

  // Drag and Drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setUploadError(null);
    setUploadMessage(null);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      validateAndSetFile(file);
    }
  };

  const handleFileChange = (e) => {
    setUploadError(null);
    setUploadMessage(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file) => {
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext === 'md') {
      setSelectedFile(file);
    } else {
      setUploadError('Invalid file type. Please upload only .md files.');
      setSelectedFile(null);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;
    setUploadLoading(true);
    setUploadError(null);
    setUploadMessage(null);

    try {
      const result = await kbService.uploadFile(selectedFile);
      setUploadMessage(`Successfully ingested ${result.results || 1} knowledge article(s) from "${selectedFile.name}".`);
      setSelectedFile(null);
      await loadData();
    } catch (err) {
      console.error('Upload sync error:', err);
      setUploadError(err.message || 'File ingestion failed. Verify structure format.');
    } finally {
      setUploadLoading(false);
    }
  };

  // Manual Creation or Save Handler
  const handleSaveArticle = async (e) => {
    e.preventDefault();
    if (!editTitle.trim() || !editContent.trim()) return;

    setSaveLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (isCreatingNew) {
        const newArt = await kbService.createArticle({ title: editTitle, content: editContent });
        setSuccessMsg(`Article "${newArt.title}" created successfully.`);
        await loadData();
        setSelectedArticle(newArt);
        setIsCreatingNew(false);
        loadVersions(newArt.id);
      } else if (selectedArticle) {
        const updated = await kbService.updateArticle(selectedArticle.id, { title: editTitle, content: editContent });
        setSuccessMsg(`Article details updated and version log advanced to v${updated.version}.`);
        await loadData();
        setSelectedArticle(updated);
        setIsEditing(false);
        loadVersions(updated.id);
      }
    } catch (err) {
      console.error('Save error:', err);
      setErrorMsg(err.message || 'Failed to save article details.');
    } finally {
      setSaveLoading(false);
    }
  };

  // Rollback to specific version handler
  const handleRollback = async (versionNumber) => {
    if (!selectedArticle) return;
    
    setLoadingVersions(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const rolled = await kbService.rollbackVersion(selectedArticle.id, versionNumber);
      setSuccessMsg(`Successfully rolled back article to historical version ${versionNumber}. Generated as version v${rolled.version}.`);
      
      // Refresh details
      setEditTitle(rolled.title);
      setEditContent(rolled.content);
      setSelectedArticle(rolled);
      await loadData();
      await loadVersions(rolled.id);
    } catch (err) {
      console.error('Rollback error:', err);
      setErrorMsg(err.message || 'Failed to execute version rollback.');
    } finally {
      setLoadingVersions(false);
    }
  };

  // Delete article handler
  const handleDeleteArticle = async (id, title) => {
    if (user.role !== 'admin') {
      setErrorMsg('Unauthorized: Only administrators can delete knowledge base articles.');
      return;
    }
    
    if (!window.confirm(`Are you sure you want to permanently delete "${title}"? This cannot be undone.`)) {
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await kbService.deleteArticle(id);
      setSuccessMsg(`Article "${title}" has been deleted.`);
      setSelectedArticle(null);
      setIsEditing(false);
      setIsCreatingNew(false);
      await loadData();
    } catch (err) {
      console.error('Delete error:', err);
      setErrorMsg(err.message || 'Failed to delete article.');
    }
  };

  // Helper styles for source type labels
  const getSourceBadgeStyle = (source) => {
    return { background: 'rgba(139, 92, 246, 0.12)', color: '#c084fc', border: '1px solid rgba(139, 92, 246, 0.2)' };
  };

  const getSourceIcon = (source, size = 14) => {
    return <FileText size={size} />;
  };

  // Calculate views for specific article from Top Articles list
  const getArticleViews = (articleId) => {
    if (!analyticsData || !analyticsData.topArticles) return 0;
    const match = analyticsData.topArticles.find(a => a.id === articleId);
    return match ? match.views : 0;
  };

  // Get color depending on effectiveness rating
  const getEffectivenessColor = (score) => {
    if (score >= 0.75) return '#10b981'; // Green
    if (score >= 0.40) return '#fbbf24'; // Yellow
    return '#f87171'; // Red
  };

  // Simple safe client-side Markdown rendering
  const renderMarkdown = (text) => {
    if (!text) return <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No content provided</p>;
    
    // Simple sanitization & replacement
    let html = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Headers
    html = html.replace(/^### (.*$)/gim, '<h4 style="font-size: 1.05rem; font-weight: 700; margin-top: 1rem; margin-bottom: 0.5rem; color: var(--accent-color)">$1</h4>');
    html = html.replace(/^## (.*$)/gim, '<h3 style="font-size: 1.2rem; font-weight: 700; margin-top: 1.25rem; margin-bottom: 0.5rem; color: var(--primary-color)">$1</h3>');
    html = html.replace(/^# (.*$)/gim, '<h2 style="font-size: 1.4rem; font-weight: 800; margin-top: 1.5rem; margin-bottom: 0.75rem; border-bottom: 1px solid var(--glass-border); padding-bottom: 0.25rem; color: #fff">$1</h2>');

    // Code blocks
    html = html.replace(/```([\s\S]*?)```/gm, '<pre style="background: rgba(0,0,0,0.4); border: 1px solid var(--glass-border); border-radius: 6px; padding: 0.85rem; font-family: monospace; font-size: 0.85rem; overflow-x: auto; color: #a5f3fc; margin: 1rem 0;"><code>$1</code></pre>');
    
    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code style="background: rgba(255,255,255,0.08); padding: 0.15rem 0.35rem; border-radius: 4px; font-family: monospace; font-size: 0.85em; color: var(--accent-color)">$1</code>');

    // Bold
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong style="font-weight: 700; color: #fff">$1</strong>');
    
    // Italics
    html = html.replace(/\*([^*]+)\*/g, '<em style="font-style: italic">$1</em>');

    // Blockquotes
    html = html.replace(/^\>\s+(.*$)/gim, '<blockquote style="border-left: 3px solid var(--primary-color); background: rgba(255,255,255,0.02); padding: 0.5rem 1rem; margin: 1rem 0; border-radius: 0 4px 4px 0; color: var(--text-muted); font-style: italic">$1</blockquote>');

    // Lists
    html = html.replace(/^\s*-\s+(.*$)/gim, '<li style="margin-left: 1.25rem; margin-bottom: 0.25rem; list-style-type: disc;">$1</li>');
    html = html.replace(/^\s*\*\s+(.*$)/gim, '<li style="margin-left: 1.25rem; margin-bottom: 0.25rem; list-style-type: disc;">$1</li>');
    html = html.replace(/^\s*\d+\.\s+(.*$)/gim, '<li style="margin-left: 1.25rem; margin-bottom: 0.25rem; list-style-type: decimal;">$1</li>');

    // Line breaks
    html = html.replace(/\n/g, '<br />');

    return (
      <div 
        dangerouslySetInnerHTML={{ __html: html }} 
        style={{ 
          lineHeight: '1.6', 
          fontSize: '0.925rem', 
          color: '#e2e8f0', 
          wordBreak: 'break-word' 
        }} 
      />
    );
  };

  // Access Guards Screen
  if (loading || !user) return null;

  if (!isStaff) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', justifyContent: 'center', alignItems: 'center', background: 'var(--bg-gradient)', padding: '2rem' }}>
        <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '480px', textAlign: 'center', border: '1px solid rgba(239,68,68,0.2)' }}>
          <ShieldAlert size={64} style={{ color: 'var(--error-color)', margin: '0 auto 1.5rem', opacity: 0.8 }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Access Restricted</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem', lineHeight: '1.5' }}>
            The Knowledge Base Management workspace is staff-only. You must be authenticated as an Administrator or a Support Agent to manage articles.
          </p>
          <button onClick={() => navigate('/profile')} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 auto' }}>
            <ArrowLeft size={16} /> Return to Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-gradient)', padding: '2rem', display: 'flex', flexDirection: 'column' }}>
      
      {/* 1. Header Area */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <button onClick={() => navigate('/profile')} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
            <ArrowLeft size={16} /> Profile
          </button>
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BookOpen size={28} style={{ color: 'var(--accent-color)' }} /> Knowledge Base Ingestion
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Ingest files, manage manual articles, and inspect documentation feedback loops</p>
          </div>
        </div>

        {/* Global tab toggler */}
        <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(0,0,0,0.2)', padding: '0.25rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
          <button 
            onClick={() => { setActiveTab('articles'); setErrorMsg(null); setSuccessMsg(null); }}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.8rem',
              fontWeight: 600,
              background: activeTab === 'articles' ? 'rgba(255,255,255,0.08)' : 'transparent',
              color: activeTab === 'articles' ? '#fff' : 'var(--text-muted)',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'var(--transition-all)'
            }}
          >
            Database Articles
          </button>
          <button 
            onClick={() => { setActiveTab('ingestion'); setErrorMsg(null); setSuccessMsg(null); }}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.8rem',
              fontWeight: 600,
              background: activeTab === 'ingestion' ? 'rgba(255,255,255,0.08)' : 'transparent',
              color: activeTab === 'ingestion' ? '#fff' : 'var(--text-muted)',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'var(--transition-all)'
            }}
          >
            Upload & Sync Hub
          </button>
          <button 
            onClick={() => { setActiveTab('analytics'); setErrorMsg(null); setSuccessMsg(null); }}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.8rem',
              fontWeight: 600,
              background: activeTab === 'analytics' ? 'rgba(255,255,255,0.08)' : 'transparent',
              color: activeTab === 'analytics' ? '#fff' : 'var(--text-muted)',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'var(--transition-all)'
            }}
          >
            KB Analytics
          </button>
        </div>
      </div>

      {/* Global Alerts feedback banner */}
      {errorMsg && (
        <div className="alert alert-error animate-fade-in" style={{ display: 'flex', justifyBetween: 'space-between', gap: '0.5rem' }}>
          <AlertCircle size={16} /> <span>{errorMsg}</span>
          <button style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => setErrorMsg(null)}>×</button>
        </div>
      )}
      {successMsg && (
        <div className="alert alert-success animate-fade-in" style={{ display: 'flex', justifyBetween: 'space-between', gap: '0.5rem' }}>
          <Check size={16} /> <span>{successMsg}</span>
          <button style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => setSuccessMsg(null)}>×</button>
        </div>
      )}

      {/* Main Layout Views */}
      
      {/* 2. TAB: DATABASE ARTICLES */}
      {activeTab === 'articles' && (
        <div style={{ display: 'flex', gap: '2rem', flex: 1, height: 'calc(100vh - 200px)', overflow: 'hidden' }}>
          
          {/* LEFT: Articles List Drawer */}
          <div className="glass-card" style={{ width: '380px', display: 'flex', flexDirection: 'column', padding: '1.5rem', height: '100%', flexShrink: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                Articles Database ({filteredArticles.length})
              </span>
              <button 
                onClick={handleCreateNewClick}
                className="btn-primary" 
                style={{ width: 'auto', padding: '0.4rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
              >
                <Plus size={14} /> New Article
              </button>
            </div>

            {/* In-sidebar Filters */}
            <div className="glass-input-wrapper" style={{ marginBottom: '1rem', position: 'relative', display: 'flex', gap: '0.5rem' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <input
                  type="text"
                  className="glass-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search articles..."
                  style={{ paddingLeft: '2.5rem', fontSize: '0.85rem', width: '100%' }}
                />
                <Search size={15} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--text-muted)' }} />
              </div>
              <button 
                onClick={loadData} 
                className="btn-secondary" 
                style={{ padding: '0 0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}
                title="Refresh database"
              >
                <RefreshCw size={14} className={loadingList ? "spin-anim" : ""} />
              </button>
            </div>

            {/* List panel */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingRight: '0.25rem' }}>
              {loadingList ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem' }}>
                  <RefreshCw size={20} className="spin-anim" style={{ color: 'var(--text-muted)' }} />
                </div>
              ) : filteredArticles.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem', fontSize: '0.85rem' }}>
                  No articles found matching filters.
                </div>
              ) : (
                filteredArticles.map((art) => {
                  const views = getArticleViews(art.id);
                  const isSelected = selectedArticle?.id === art.id;
                  return (
                    <div
                      key={art.id}
                      onClick={() => handleSelectArticle(art)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        textAlign: 'left',
                        padding: '1rem',
                        background: isSelected ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.15)',
                        border: '1px solid',
                        borderColor: isSelected ? 'var(--accent-color)' : 'var(--glass-border)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'var(--transition-all)',
                        position: 'relative'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.35rem' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%' }}>
                          {art.title}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          v{art.version}
                        </span>
                      </div>
                      
                      <p style={{ 
                        fontSize: '0.75rem', 
                        color: 'var(--text-muted)', 
                        marginBottom: '0.75rem',
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis', 
                        display: '-webkit-box', 
                        WebkitLineClamp: 2, 
                        WebkitBoxOrient: 'vertical',
                        lineHeight: '1.4'
                      }}>
                        {art.content}
                      </p>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                          <span style={{ 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '0.25rem', 
                            fontSize: '0.65rem', 
                            padding: '0.15rem 0.4rem', 
                            borderRadius: '4px',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            ...getSourceBadgeStyle(art.source_type)
                          }}>
                            {getSourceIcon(art.source_type, 10)} {art.source_type}
                          </span>
                          
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                            <Eye size={10} /> {views} views
                          </span>
                        </div>

                        {art.effectiveness_score > 0 && (
                          <span 
                            style={{ 
                              fontSize: '0.7rem', 
                              fontWeight: 700, 
                              color: getEffectivenessColor(art.effectiveness_score),
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.2rem'
                            }}
                            title="Helpful rating computed from resolution matches vs ticket escalations"
                          >
                            {Math.round(art.effectiveness_score * 100)}% rating
                          </span>
                        )}
                      </div>

                      {/* Floating Admin delete trigger */}
                      {user.role === 'admin' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteArticle(art.id, art.title);
                          }}
                          style={{
                            position: 'absolute',
                            right: '8px',
                            top: '8px',
                            background: 'none',
                            border: 'none',
                            color: 'rgba(239, 68, 68, 0.4)',
                            cursor: 'pointer',
                            padding: '0.25rem',
                            display: isSelected ? 'block' : 'none',
                            transition: 'color 0.2s',
                          }}
                          onMouseEnter={(e) => e.target.style.color = 'var(--error-color)'}
                          onMouseLeave={(e) => e.target.style.color = 'rgba(239, 68, 68, 0.4)'}
                          title="Delete article"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT: Detail View, Editor, & Version Timeline */}
          <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '2rem', height: '100%', overflow: 'hidden' }}>
            
            {!selectedArticle && !isCreatingNew ? (
              // 1. Placeholder screen
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                <BookOpen size={48} style={{ marginBottom: '1.25rem', opacity: 0.3 }} />
                <p style={{ fontSize: '0.95rem', marginBottom: '1.5rem' }}>Select an article from the database panel, or create a new article manually.</p>
                <button onClick={handleCreateNewClick} className="btn-primary" style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.25rem', fontSize: '0.85rem' }}>
                  <Plus size={16} /> Create Manual Article
                </button>
              </div>
            ) : isEditing || isCreatingNew ? (
              // 2. Editor Workspace
              <form onSubmit={handleSaveArticle} style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.75rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                      {isCreatingNew ? 'Create New Article' : `Editing Article: ${selectedArticle?.title}`}
                    </h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {isCreatingNew ? 'Manual entry editor documentation draft' : `Article UID: ${selectedArticle?.id}`}
                    </p>
                  </div>
                  
                  {/* Editor view toggle tabs */}
                  <div style={{ display: 'flex', background: 'rgba(0,0,0,0.15)', border: '1px solid var(--glass-border)', padding: '0.2rem', borderRadius: '6px' }}>
                    <button 
                      type="button"
                      onClick={() => setEditorTab('edit')}
                      className={`btn-secondary`}
                      style={{ 
                        border: 'none', 
                        padding: '0.3rem 0.75rem', 
                        fontSize: '0.75rem',
                        background: editorTab === 'edit' ? 'rgba(255,255,255,0.08)' : 'transparent',
                        color: editorTab === 'edit' ? '#fff' : 'var(--text-muted)'
                      }}
                    >
                      Draft Editor
                    </button>
                    <button 
                      type="button"
                      onClick={() => setEditorTab('preview')}
                      className={`btn-secondary`}
                      style={{ 
                        border: 'none', 
                        padding: '0.3rem 0.75rem', 
                        fontSize: '0.75rem',
                        background: editorTab === 'preview' ? 'rgba(255,255,255,0.08)' : 'transparent',
                        color: editorTab === 'preview' ? '#fff' : 'var(--text-muted)'
                      }}
                    >
                      Markdown Preview
                    </button>
                  </div>
                </div>

                {editorTab === 'edit' ? (
                  // Editor form elements
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto' }}>
                    <div className="glass-input-wrapper" style={{ marginBottom: 0 }}>
                      <label className="glass-input-label">Document Title</label>
                      <input
                        type="text"
                        className="glass-input"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="e.g., How to Setup Webpack Configurations"
                        required
                        style={{ fontSize: '0.95rem' }}
                      />
                    </div>

                    <div className="glass-input-wrapper" style={{ flex: 1, marginBottom: 0 }}>
                      <label className="glass-input-label">Content Body (Markdown Format)</label>
                      <textarea
                        className="glass-input"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        placeholder="# Setup Guide&#10;&#10;To initialize webpack, run:&#10;```bash&#10;npm install webpack&#10;```"
                        required
                        style={{ 
                          flex: 1, 
                          resize: 'none', 
                          fontFamily: 'monospace', 
                          fontSize: '0.875rem', 
                          lineHeight: '1.5',
                          height: '100%',
                          minHeight: '200px'
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  // Rendered preview mode
                  <div style={{ flex: 1, overflowY: 'auto', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', padding: '1.5rem', borderRadius: '8px' }}>
                    <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
                      {editTitle || 'Untitled Draft'}
                    </h1>
                    {renderMarkdown(editContent)}
                  </div>
                )}

                {/* Editor Action buttons */}
                <div style={{ display: 'flex', gap: '1rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>
                  <button 
                    type="button" 
                    onClick={() => { 
                      setIsEditing(false); 
                      setIsCreatingNew(false); 
                      if (selectedArticle) {
                        setEditTitle(selectedArticle.title);
                        setEditContent(selectedArticle.content);
                      }
                    }} 
                    className="btn-secondary" 
                    style={{ flex: 1 }}
                  >
                    Cancel Draft
                  </button>
                  <button 
                    type="submit" 
                    className="btn-primary" 
                    disabled={saveLoading || !editTitle.trim() || !editContent.trim()} 
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                  >
                    {saveLoading ? (
                      <>
                        <RefreshCw size={16} className="spin-anim" /> Committing...
                      </>
                    ) : (
                      'Publish & Sync'
                    )}
                  </button>
                </div>
              </form>
            ) : (
              // 3. Document Details & History panel
              <div style={{ display: 'flex', gap: '1.5rem', height: '100%', overflow: 'hidden' }}>
                
                {/* Main Article display */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', paddingRight: '1rem' }}>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '0.25rem', 
                          fontSize: '0.65rem', 
                          padding: '0.15rem 0.4rem', 
                          borderRadius: '4px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          ...getSourceBadgeStyle(selectedArticle.source_type)
                        }}>
                          {getSourceIcon(selectedArticle.source_type, 10)} {selectedArticle.source_type}
                        </span>
                        
                        {selectedArticle.checksum && (
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'monospace', background: 'rgba(255,255,255,0.03)', padding: '0.15rem 0.3rem', borderRadius: '3px' }}>
                            SHA256: {selectedArticle.checksum.substring(0, 8)}...
                          </span>
                        )}
                      </div>
                      
                      <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff' }}>{selectedArticle.title}</h3>
                    </div>

                    <button 
                      onClick={() => setIsEditing(true)} 
                      className="btn-primary" 
                      style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                    >
                      <Edit3 size={14} /> Edit Article
                    </button>
                  </div>

                  <div style={{ flex: 1, background: 'rgba(0,0,0,0.12)', border: '1px solid var(--glass-border)', padding: '1.5rem', borderRadius: '8px', overflowY: 'auto', marginBottom: '1rem' }}>
                    {renderMarkdown(selectedArticle.content)}
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>Created: <strong>{new Date(selectedArticle.created_at).toLocaleString()}</strong></span>
                    <span>Last Updated: <strong>{new Date(selectedArticle.updated_at).toLocaleString()}</strong></span>
                  </div>
                </div>

                {/* Right drawer of details: Version History logs */}
                <div style={{ width: '260px', display: 'flex', flexDirection: 'column', borderLeft: '1px solid var(--glass-border)', paddingLeft: '1.5rem', flexShrink: 0, overflowY: 'auto' }}>
                  <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff', textTransform: 'uppercase', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <History size={14} /> Version History
                  </h4>

                  {loadingVersions ? (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem' }}>
                      <RefreshCw size={18} className="spin-anim" style={{ color: 'var(--text-muted)' }} />
                    </div>
                  ) : versions.length === 0 ? (
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No audit history found.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: '2px solid rgba(255,255,255,0.05)', paddingLeft: '1rem', marginLeft: '0.5rem' }}>
                      {versions.map((ver, idx) => {
                        const isCurrent = ver.version === selectedArticle.version;
                        return (
                          <div key={ver.id} style={{ position: 'relative', fontSize: '0.8rem' }}>
                            {/* Dot indicator on timeline */}
                            <span style={{
                              position: 'absolute',
                              left: '-17px',
                              top: '4px',
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              background: isCurrent ? 'var(--accent-color)' : 'rgba(255,255,255,0.15)',
                              boxShadow: isCurrent ? '0 0 8px var(--accent-color)' : 'none',
                              zIndex: 2
                            }} />

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                              <strong style={{ color: isCurrent ? 'var(--accent-color)' : '#fff' }}>Version v{ver.version}</strong>
                              {isCurrent && (
                                <span style={{ fontSize: '0.65rem', background: 'rgba(6,182,212,0.1)', color: 'var(--accent-color)', padding: '0.05rem 0.3rem', borderRadius: '3px', fontWeight: 700 }}>
                                  active
                                </span>
                              )}
                            </div>

                            <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginBottom: '0.35rem' }}>
                              Edited: {new Date(ver.created_at).toLocaleDateString()}<br/>
                              By: {ver.creator_name || 'System Sync'}
                            </p>

                            {!isCurrent && (
                              <button
                                onClick={() => handleRollback(ver.version)}
                                className="btn-secondary"
                                style={{
                                  padding: '0.2rem 0.5rem',
                                  fontSize: '0.65rem',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.2rem'
                                }}
                              >
                                Rollback <ArrowRight size={10} />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            )}

          </div>

        </div>
      )}

      {/* 3. TAB: UPLOAD & SYNC HUB (DRAG & DROP) */}
      {activeTab === 'ingestion' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', flex: 1, maxWidth: '900px', margin: '0 auto', width: '100%' }}>
          
          <div className="glass-card" style={{ padding: '2.5rem', textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Drag & Drop Bulk Synchronizer</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '2rem' }}>
              Upload single documents or structured arrays to feed directly into the Vector Embedding system.
            </p>

            {/* Dropzone container */}
            <div 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              style={{
                border: '2px dashed',
                borderColor: dragActive ? 'var(--accent-color)' : 'var(--glass-border)',
                background: dragActive ? 'rgba(6, 182, 212, 0.05)' : 'rgba(0, 0, 0, 0.2)',
                boxShadow: dragActive ? '0 0 20px var(--accent-glow)' : 'none',
                padding: '3rem 2rem',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'var(--transition-all)',
                marginBottom: '1.5rem',
                position: 'relative'
              }}
            >
              {/* Native hidden input trigger */}
              <input
                type="file"
                id="file-upload-input"
                style={{ display: 'none' }}
                accept=".md"
                onChange={handleFileChange}
              />

              <label 
                htmlFor="file-upload-input" 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  cursor: 'pointer' 
                }}
              >
                <div style={{ 
                  width: '64px', 
                  height: '64px', 
                  borderRadius: '50%', 
                  background: 'rgba(255,255,255,0.03)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  border: '1px solid var(--glass-border)',
                  marginBottom: '1.25rem',
                  color: dragActive ? 'var(--accent-color)' : 'var(--text-muted)',
                  boxShadow: dragActive ? '0 0 15px var(--accent-glow)' : 'none',
                  transition: 'all 0.3s'
                }}>
                  <UploadCloud size={30} className={uploadLoading ? "spin-anim" : ""} />
                </div>

                <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#fff', marginBottom: '0.25rem' }}>
                  {dragActive ? 'Drop files here!' : 'Select file, or drag and drop here'}
                </h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', maxWidth: '300px', lineHeight: '1.4' }}>
                  Supports Markdown (.md) up to 5MB
                </p>
              </label>
            </div>

            {/* Ingestion status/warnings feedback */}
            {uploadError && (
              <div className="alert alert-error animate-fade-in" style={{ marginBottom: '1.5rem' }}>
                <AlertCircle size={16} style={{ marginRight: '0.5rem' }} />
                <span>{uploadError}</span>
              </div>
            )}
            {uploadMessage && (
              <div className="alert alert-success animate-fade-in" style={{ marginBottom: '1.5rem' }}>
                <Check size={16} style={{ marginRight: '0.5rem' }} />
                <span>{uploadMessage}</span>
              </div>
            )}

            {/* Selected file preview detail box */}
            {selectedFile && (
              <div 
                className="animate-fade-in"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '8px',
                  padding: '1rem 1.25rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  textAlign: 'left',
                  marginBottom: '1.5rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ color: 'var(--accent-color)' }}>
                    <FileText size={24} />
                  </div>
                  <div>
                    <h5 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>{selectedFile.name}</h5>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {(selectedFile.size / 1024).toFixed(1)} KB • format confirmed
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button 
                    onClick={() => setSelectedFile(null)} 
                    className="btn-secondary"
                    style={{ padding: '0.45rem 1rem', fontSize: '0.75rem' }}
                    disabled={uploadLoading}
                  >
                    Clear
                  </button>
                  <button 
                    onClick={handleFileUpload} 
                    className="btn-primary"
                    style={{ width: 'auto', padding: '0.45rem 1.25rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                    disabled={uploadLoading}
                  >
                    {uploadLoading ? (
                      <>
                        <RefreshCw size={12} className="spin-anim" /> Injecting...
                      </>
                    ) : (
                      'Synchronize Now'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Guidelines documentation cards */}
          <div style={{ maxWidth: '600px', margin: '0 auto', width: '100%' }}>
            <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{ color: 'var(--accent-color)', flexShrink: 0, padding: '0.5rem', background: 'rgba(6, 182, 212, 0.1)', borderRadius: '8px' }}><FileText size={24} /></div>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem', color: '#fff' }}>Markdown Guidelines</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                  Single article sync. The parser will extract the main title from the first line header starting with <code>#</code>. If not found, it defaults to the file name.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. TAB: KB ANALYTICS PANEL */}
      {activeTab === 'analytics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', flex: 1, maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
          
          {/* Header Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
            <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Articles Database Size</span>
              <strong style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-color)' }}>{articles.length}</strong>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Synchronized documentation records</span>
            </div>

            <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Avg Effectiveness</span>
              <strong style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10b981' }}>
                {articles.length > 0 
                  ? `${Math.round((articles.reduce((acc, curr) => acc + (curr.effectiveness_score || 0.0), 0) / articles.length) * 100)}%`
                  : '100%'
                }
              </strong>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Helpful clicks vs ticket escalations</span>
            </div>

            <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Search Resolutions</span>
              <strong style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-color)' }}>
                {analyticsData?.summary?.resolvedQuestions || 0}
              </strong>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Total queries matched successfully</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
            
            {/* Top performing articles list */}
            <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '1.25rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <BarChart2 size={16} style={{ color: 'var(--accent-color)' }} /> Top Performing Articles
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1, overflowY: 'auto' }}>
                {loadingStats ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><RefreshCw size={18} className="spin-anim" /></div>
                ) : !analyticsData || !analyticsData.topArticles || analyticsData.topArticles.length === 0 ? (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No article resolution stats logged.</p>
                ) : (
                  analyticsData.topArticles.map((art, index) => (
                    <div 
                      key={art.id || index}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: 'rgba(0,0,0,0.15)',
                        border: '1px solid var(--glass-border)',
                        padding: '0.75rem 1rem',
                        borderRadius: '6px'
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1, marginRight: '1rem' }}>
                        <h5 style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {index + 1}. {art.title}
                        </h5>
                        <span style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '0.2rem', 
                          fontSize: '0.6rem', 
                          padding: '0.05rem 0.3rem', 
                          borderRadius: '3px',
                          marginTop: '0.25rem',
                          textTransform: 'uppercase',
                          fontWeight: 700,
                          ...getSourceBadgeStyle(art.source_type)
                        }}>
                          {art.source_type}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600, flexShrink: 0 }}>
                        <span style={{ color: 'var(--text-muted)' }}>{art.views} views</span>
                        <span style={{ color: getEffectivenessColor(art.effectiveness_score) }}>
                          {Math.round(art.effectiveness_score * 100)}% CSAT
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Failed search gaps: highlighting KB holes */}
            <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '1.25rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <HelpCircle size={16} style={{ color: 'var(--error-color)' }} /> Search Gaps & Misses
              </h4>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Search terms logged by users that returned zero relevant results. Address these gaps to decrease agent escalation rates.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1, overflowY: 'auto' }}>
                {loadingStats ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><RefreshCw size={18} className="spin-anim" /></div>
                ) : !analyticsData || !analyticsData.failedSearches || analyticsData.failedSearches.length === 0 ? (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Excellent: No search gaps logged! AI answered all queries.</p>
                ) : (
                  analyticsData.failedSearches.map((fail, index) => (
                    <div 
                      key={index}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: 'rgba(239, 68, 68, 0.03)',
                        border: '1px solid rgba(239, 68, 68, 0.1)',
                        padding: '0.75rem 1rem',
                        borderRadius: '6px'
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1, marginRight: '1rem' }}>
                        <code style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--error-color)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          "{fail.query}"
                        </code>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                          Last occurrence: {new Date(fail.last_occurred).toLocaleDateString()}
                        </span>
                      </div>

                      <div style={{ flexShrink: 0, fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                        {fail.count} queries missed
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Embedded keyframe spin utility */}
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
