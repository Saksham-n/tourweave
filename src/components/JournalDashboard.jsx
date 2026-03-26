import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createEntry, getEntries, updateEntry, deleteEntry } from '../services/user/journalService';
import './JournalDashboard.css';

export default function JournalDashboard() {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ title: '', content: '' });
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState(null);
  const [toast, setToast] = useState('');

  // Fetch entries on mount
  useEffect(() => {
    if (user) {
      loadEntries();
    }
  }, [user]);

  const loadEntries = async () => {
    setLoading(true);
    const result = await getEntries(user.id);
    if (result.success) {
      setEntries(result.data);
    }
    setLoading(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      setToast('⚠ Please fill in all fields');
      setTimeout(() => setToast(""), 3000);
      return;
    }

    setSubmitting(true);
    let result;

    if (editingId) {
      result = await updateEntry(editingId, formData);
    } else {
      result = await createEntry(user.id, formData);
    }

    if (result.success) {
      setFormData({ title: '', content: '' });
      setShowForm(false);
      setEditingId(null);
      await loadEntries();
      setToast(`✨ ${editingId ? 'Memory Updated' : 'Memory Saved'}`);
      setTimeout(() => setToast(""), 3000);
    } else {
      setToast(`❌ Error: ${result.error}`);
      setTimeout(() => setToast(""), 4000);
    }
    setSubmitting(false);
  };

  const handleEdit = (entry) => {
    setFormData({ title: entry.title, content: entry.content });
    setEditingId(entry.id);
    setShowForm(true);
  };

  const initiateDelete = (entry) => {
    setEntryToDelete(entry);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!entryToDelete) return;
    
    setShowDeleteModal(false);
    const result = await deleteEntry(entryToDelete.id);
    
    if (result.success) {
      await loadEntries();
      setToast("🗑 Memory deleted");
      setTimeout(() => setToast(""), 3000);
    } else {
      setToast(`❌ Error: ${result.error}`);
      setTimeout(() => setToast(""), 4000);
    }
    setEntryToDelete(null);
  };

  const handleCancel = () => {
    setFormData({ title: '', content: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const getSentimentColor = (label) => {
    switch (label) {
      case 'positive':
        return '#10b981';
      case 'negative':
        return '#ef4444';
      default:
        return '#f59e0b';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const navigate = useNavigate();

  return (
    <div className="journal-page-container">
      <div className="journal-overlay"></div>
      
      <div className="journal-wrapper">
        <nav className="profile-nav">
          <div className="profile-logo" onClick={() => navigate('/')}>TourWeave</div>
          <div className="nav-links">
            <span onClick={() => navigate('/trips')}>Trips</span>
            <span onClick={() => navigate('/profile')}>Profile</span>
            <button className="profile-back-btn" onClick={() => navigate('/')}>&larr; Home</button>
          </div>
        </nav>

        <div className="journal-header">
          <h1>Memory Journal</h1>
          {!showForm && (
            <button className="btn-primary" onClick={() => setShowForm(true)}>
              + New Entry
            </button>
          )}
        </div>

      {/* Form Section */}
      {showForm && (
        <div className="modal-overlay">
          <div className="journal-form-wrapper">
            <div className="modal-header">
              <h2>{editingId ? 'Edit Memory' : 'New Memory'}</h2>
            </div>
            <form className="journal-form" onSubmit={handleSave}>
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Give your memory a title..."
                  disabled={submitting}
                />
              </div>

              <div className="form-group">
                <label>Content</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Write your travel memory..."
                  rows="6"
                  disabled={submitting}
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-save" disabled={submitting}>
                  {submitting ? 'Saving...' : editingId ? 'Update' : 'Save'}
                </button>
                <button type="button" className="btn-cancel" onClick={handleCancel} disabled={submitting}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Entries List */}
      <div className="journal-entries">
        {loading ? (
          <p className="loading">Loading your memories...</p>
        ) : entries.length === 0 ? (
          <div className="empty-state">
            <p>No memories yet</p>
            <p className="empty-hint">Start writing your travel stories!</p>
          </div>
        ) : (
          entries.map((entry) => (
            <div key={entry.id} className="journal-entry">
              <div className="entry-header">
                <div className="entry-title-section">
                  <h3>{entry.title}</h3>
                  <span
                    className="sentiment-badge"
                    style={{ backgroundColor: getSentimentColor(entry.sentiment_label) }}
                    title={`Sentiment: ${entry.sentiment_label}`}
                  >
                    {entry.sentiment_label}
                  </span>
                </div>
                <div className="entry-date">{formatDate(entry.created_at)}</div>
              </div>

              <p className="entry-content">{entry.content}</p>

              <div className="entry-footer">
                <div className="sentiment-score">
                  Mood: {Math.round(entry.sentiment_score * 100)}%
                </div>
                <div className="entry-actions">
                  <button className="btn-edit" onClick={() => handleEdit(entry)}>
                    Edit
                  </button>
                  <button className="btn-delete" onClick={() => initiateDelete(entry)}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* DELETE MODAL */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-box delete-modal">
            <h3>Delete Memory?</h3>
            <p>Are you sure you want to delete <strong>{entryToDelete?.title}</strong>? This memory will be lost forever.</p>
            <div style={{ marginTop: 20, display: 'flex', gap: '10px' }}>
              <button 
                onClick={confirmDelete} 
                style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '12px', padding: '10px 20px', cursor: 'pointer', fontWeight: 700 }}
              >
                Delete Memory
              </button>
              <button 
                onClick={() => setShowDeleteModal(false)} 
                style={{ background: '#f0f0f0', color: '#666', border: 'none', borderRadius: '12px', padding: '10px 20px', cursor: 'pointer', fontWeight: 700 }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST UI */}
      {toast && <div className={`toast ${toast.includes('⚠') || toast.includes('❌') ? 'toast-error' : ''}`}>{toast}</div>}
      </div>
    </div>
  );
}
