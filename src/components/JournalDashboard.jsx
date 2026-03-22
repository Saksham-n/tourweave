import { useState, useEffect } from 'react';
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
      alert('Please fill in all fields');
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
    } else {
      alert(`Error: ${result.error}`);
    }
    setSubmitting(false);
  };

  const handleEdit = (entry) => {
    setFormData({ title: entry.title, content: entry.content });
    setEditingId(entry.id);
    setShowForm(true);
  };

  const handleDelete = async (entryId) => {
    if (!window.confirm('Delete this entry?')) return;

    const result = await deleteEntry(entryId);
    if (result.success) {
      await loadEntries();
    } else {
      alert(`Error: ${result.error}`);
    }
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

  return (
    <div className="journal-container">
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
        <div className="journal-form-wrapper">
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
              ></textarea>
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
                  <button className="btn-delete" onClick={() => handleDelete(entry.id)}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
