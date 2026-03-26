import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';
import {
  getItineraryItems,
  addItineraryItem,
  deleteItineraryItem,
  subscribeToItinerary,
  groupItineraryByDay
} from '../services/user/itineraryService';
import './TripDetail.css';

const TripDetail = () => {
  const { id: tripId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [trip, setTrip] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newItem, setNewItem] = useState({
    title: '',
    location_name: '',
    date: '',
    time: '',
    description: ''
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [toast, setToast] = useState('');
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [viewDate, setViewDate] = useState(new Date());

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.input-with-icon')) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (activeDropdown === 'date' && newItem.date) {
      const [y, m, d] = newItem.date.split('-');
      setViewDate(new Date(y, m - 1, d));
    }
  }, [activeDropdown, newItem.date]);

  useEffect(() => {
    const fetchTripData = async () => {
      // Fetch trip details
      const { data: tripData, error: tripError } = await supabase
        .from('trips')
        .select('*, trip_members(role)')
        .eq('id', tripId)
        .single();

      if (tripError) {
        console.error('Error fetching trip:', tripError);
        navigate('/trips');
        return;
      }
      setTrip(tripData);

      // Fetch itinerary items
      const { items: itineraryData } = await getItineraryItems(tripId);
      setItems(itineraryData);
      setLoading(false);
    };

    fetchTripData();

    // Subscribe to realtime updates
    const subscription = subscribeToItinerary(tripId, (payload) => {
      if (payload.eventType === 'INSERT') {
        setItems((prev) => {
          // Prevent duplicates if the initiator already added it to local state
          if (prev.some(item => item.id === payload.new.id)) return prev;

          return [...prev, payload.new].sort((a, b) =>
            new Date(a.date + 'T' + (a.time || '00:00')) - new Date(b.date + 'T' + (b.time || '00:00'))
          );
        });
      } else if (payload.eventType === 'DELETE') {
        setItems((prev) => prev.filter((item) => item.id !== (payload.old.id || payload.old_id)));
      } else if (payload.eventType === 'UPDATE') {
        setItems((prev) => prev.map((item) => item.id === payload.new.id ? payload.new : item));
      }
    });

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [tripId, navigate]);

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItem.title) return;

    // Create a temporary ID for optimistic update
    const tempId = crypto.randomUUID();
    const optimisticItem = {
      ...newItem,
      id: tempId,
      trip_id: tripId,
      added_by: user.id,
      created_at: new Date().toISOString()
    };

    // Optimistically add to state
    setItems((prev) => [...prev, optimisticItem].sort((a, b) =>
      new Date(a.date + 'T' + (a.time || '00:00')) - new Date(b.date + 'T' + (b.time || '00:00'))
    ));
    setNewItem({ title: '', location_name: '', date: '', time: '', description: '' });
    setShowAddForm(false);

    const { item, error } = await addItineraryItem({
      title: optimisticItem.title,
      location_name: optimisticItem.location_name,
      date: optimisticItem.date,
      time: optimisticItem.time,
      description: optimisticItem.description,
      trip_id: tripId,
      added_by: user.id
    });

    if (error) {
      setToast(`❌ ${error.message}`);
      setTimeout(() => setToast(""), 4000);
      // Rollback on error
      setItems((prev) => prev.filter(i => i.id !== tempId));
    } else {
      // Replace optimistic item with real one from DB (to get real ID)
      setItems((prev) => prev.map(i => i.id === tempId ? item : i));
      setToast("✅ Stop added to itinerary");
      setTimeout(() => setToast(""), 3000);
    }
  };

  const initiateItemDelete = (item) => {
    setItemToDelete(item);
    setShowDeleteModal(true);
  };

  const confirmItemDelete = async () => {
    if (!itemToDelete) return;

    const previousItems = [...items];
    setItems((prev) => prev.filter(i => i.id !== itemToDelete.id));
    setShowDeleteModal(false);

    const { error } = await deleteItineraryItem(itemToDelete.id);
    if (error) {
      setToast(`❌ ${error.message}`);
      setTimeout(() => setToast(""), 4000);
      setItems(previousItems); // Rollback
    } else {
      setToast("🗑 Stop removed");
      setTimeout(() => setToast(""), 3000);
    }
    setItemToDelete(null);
  };

  const renderDatePicker = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startDay = new Date(year, month, 1).getDay(); // 0 = Sunday

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    return (
      <div className={`datepicker-card ${activeDropdown === 'date' ? 'show' : ''}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 'bold', marginBottom: '10px', color: '#0b5851' }}>
          <span style={{ cursor: 'pointer', padding: '0 5px' }} onClick={() => setViewDate(new Date(year, month - 1, 1))}>&lt;</span>
          <span>{monthNames[month]} {year}</span>
          <span style={{ cursor: 'pointer', padding: '0 5px' }} onClick={() => setViewDate(new Date(year, month + 1, 1))}>&gt;</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '8px', textAlign: 'center', fontSize: '0.75rem', fontWeight: 600, color: '#666' }}>
          <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
          {Array.from({ length: startDay }).map((_, i) => (
            <div key={`empty-${i}`} className="dp-date empty" style={{ cursor: 'default' }}></div>
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            return (
              <div key={day} className={`dp-date ${newItem.date === dateStr ? 'selected' : ''}`} onClick={() => {
                setNewItem({ ...newItem, date: dateStr });
                setActiveDropdown(null);
              }}>
                {day}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderTimePicker = () => {
    const times = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 30) {
        times.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
      }
    }

    return (
      <div className={`datepicker-card ${activeDropdown === 'time' ? 'show' : ''}`} style={{ padding: '10px' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#0b5851', textAlign: 'center' }}>Select Time</div>
        <div className="timepicker-options">
          {times.map(t => (
            <div key={t} className={`tp-time ${newItem.time === t ? 'selected' : ''}`} onClick={() => {
              setNewItem({ ...newItem, time: t });
              setActiveDropdown(null);
            }}>
              {t}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) return <div className="loading-screen">Loading Trip Architecture...</div>;

  const groupedItems = groupItineraryByDay(items);
  const sortedDates = Object.keys(groupedItems).sort();

  return (
    <div className="trip-detail-page">
      <style>{`
        .itinerary-form-modal {
          backdrop-filter: none !important;
        }
        .input-with-icon {
          position: relative;
          display: flex;
          align-items: center;
          flex: 1;
        }
        .input-with-icon .icon {
          position: absolute;
          left: 1rem;
          color: #888;
          pointer-events: none;
        }
        .input-with-icon input {
          padding-left: 3rem !important;
        }
        .datepicker-card {
            position: absolute; 
            top: 100%; 
            left: 0; 
            margin-top: 8px;
            width: 100%; 
            background: white; 
            border-radius: 16px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.15); 
            padding: 20px;
            z-index: 1000; 
            display: none; 
            border: 1px solid #EAECF0;
        }
        .datepicker-card.show { 
            display: block; 
            animation: fadeIn 0.2s; 
        }
        .dp-date {
            width: 70%; 
            aspect-ratio: 1; 
            display: flex; 
            align-items: center; 
            justify-content: center;
            border-radius: 8px; 
            font-size: 0.9rem; 
            font-weight: 500; 
            color: #101828;
            cursor: pointer; 
            transition: 0.2s;
            margin: 0 auto;
        }
        .dp-date:hover:not(.selected):not(.empty) { background-color: #F9FAFB; }
        .dp-date.selected { background-color: #0b5851; color: white; font-weight: 600; }
        
        .timepicker-options {
            display: flex; flex-direction: column; gap: 4px;
            max-height: 200px; overflow-y: auto;
        }
        .tp-time {
            padding: 8px; border-radius: 8px; text-align: center;
            cursor: pointer; font-size: 0.9rem; color: #333; transition: 0.2s;
        }
        .tp-time:hover:not(.selected) { background-color: #F9FAFB; }
        .tp-time.selected { background-color: #0b5851; color: white; font-weight: 600; }
        
        .timepicker-options::-webkit-scrollbar { width: 6px; }
        .timepicker-options::-webkit-scrollbar-track { background: transparent; }
        .timepicker-options::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 4px; }
        }
      `}</style>
      <div className="detail-overlay"></div>

      <div className="detail-wrapper">
        <nav className="profile-nav">
          <div className="profile-logo" onClick={() => navigate('/')}>TourWeave</div>
          <div className="nav-links">
            <span onClick={() => navigate('/trips')}>&larr; All Trips</span>
            <span onClick={() => navigate('/journal')}>Journal</span>
            <button className="profile-back-btn" onClick={() => navigate('/')}>&larr; Home</button>
          </div>
        </nav>

        <header className="trip-header">
          <div className="trip-info-main">
            <h1>{trip.name}</h1>
            {trip.destination && (
              <p className="trip-location">
                <i className="fa-solid fa-location-dot"></i> {trip.destination}
              </p>
            )}
            <div className="trip-meta-tags">
              <span className="meta-tag date">
                <i className="fa-solid fa-calendar-days"></i>
                {trip.start_date ? `${new Date(trip.start_date).toLocaleDateString()} - ${trip.end_date ? new Date(trip.end_date).toLocaleDateString() : 'TBD'}` : 'Dates TBD'}
              </span>
              <span className={`meta-tag role ${trip.trip_members[0]?.role}`}>
                {trip.trip_members[0]?.role}
              </span>
            </div>
          </div>

          <button className="add-item-trigger" onClick={() => setShowAddForm(true)}>
            <i className="fa-solid fa-plus"></i> Add Place
          </button>
        </header>

        {showAddForm && (
          <div className="itinerary-form-modal">
            <div className="form-content">
              <h3>Plan New Stop</h3>
              <form onSubmit={handleAddItem}>
                <input
                  type="text"
                  placeholder="Title (e.g. Breakfast at Kochi Fort)"
                  value={newItem.title}
                  onChange={e => setNewItem({ ...newItem, title: e.target.value })}
                  required
                />
                <input
                  type="text"
                  placeholder="Location Name"
                  value={newItem.location_name}
                  onChange={e => setNewItem({ ...newItem, location_name: e.target.value })}
                />
                <div className="form-row">
                  <div className="input-with-icon" style={{ position: 'relative' }}>
                    <i className="fa-solid fa-calendar-days icon"></i>
                    <input
                      type="text"
                      value={newItem.date}
                      onClick={() => setActiveDropdown(activeDropdown === 'date' ? null : 'date')}
                      readOnly
                      placeholder="Date"
                      style={{ cursor: 'pointer' }}
                      required
                    />
                    {renderDatePicker()}
                  </div>
                  <div className="input-with-icon" style={{ position: 'relative' }}>
                    <i className="fa-solid fa-clock icon"></i>
                    <input
                      type="text"
                      value={newItem.time}
                      onClick={() => setActiveDropdown(activeDropdown === 'time' ? null : 'time')}
                      readOnly
                      placeholder="Time"
                      style={{ cursor: 'pointer' }}
                    />
                    {renderTimePicker()}
                  </div>
                </div>
                <textarea
                  placeholder="Notes/Description"
                  value={newItem.description}
                  onChange={e => setNewItem({ ...newItem, description: e.target.value })}
                />
                <div className="form-actions">
                  <button type="button" onClick={() => setShowAddForm(false)} className="cancel-btn">Cancel</button>
                  <button type="submit" className="save-btn">Add to Itinerary</button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="itinerary-timeline">
          {items.length === 0 ? (
            <div className="empty-itinerary">
              <i className="fa-solid fa-map-location-dot"></i>
              <h2>Empty Itinerary</h2>
              <p>Start mapping out your collective journey by adding places, events, or stops.</p>
              <button onClick={() => setShowAddForm(true)}>Add Your First Stop</button>
            </div>
          ) : (
            sortedDates.map(date => (
              <section key={date} className="timeline-day">
                <h2 className="day-title">
                  {date === 'Unscheduled' ? 'Unscheduled' : new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </h2>
                <div className="day-items">
                  {groupedItems[date].map(item => (
                    <div key={item.id} className="itinerary-card">
                      <div className="card-time">{item.time ? item.time.substring(0, 5) : '--:--'}</div>
                      <div className="card-content">
                        <h4>{item.title}</h4>
                        {item.location_name && (
                          <p className="card-location">
                            <i className="fa-solid fa-location-arrow"></i> {item.location_name}
                          </p>
                        )}
                        {item.description && <p className="card-desc">{item.description}</p>}
                      </div>
                      <button className="delete-item-btn" onClick={() => initiateItemDelete(item)}>
                        <i className="fa-solid fa-xmark"></i>
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      </div>

      {/* DELETE MODAL */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-box delete-modal">
            <h3>Delete Stop?</h3>
            <p>Remove <strong>{itemToDelete?.title}</strong> from your itinerary?</p>
            <div style={{ marginTop: 20, display: 'flex', gap: '10px' }}>
              <button onClick={confirmItemDelete} style={{ background: '#ff5252', color: 'white' }}>Remove Stop</button>
              <button onClick={() => setShowDeleteModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST UI */}
      {toast && <div className={`toast ${toast.includes('⚠') || toast.includes('❌') ? 'toast-error' : ''}`}>{toast}</div>}
    </div>
  );
};

export default TripDetail;
