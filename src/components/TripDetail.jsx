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

  if (loading) return <div className="loading-screen">Loading Trip Architecture...</div>;

  const groupedItems = groupItineraryByDay(items);
  const sortedDates = Object.keys(groupedItems).sort();

  return (
    <div className="trip-detail-page">
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
                  onChange={e => setNewItem({...newItem, title: e.target.value})}
                  required
                />
                <input 
                  type="text" 
                  placeholder="Location Name" 
                  value={newItem.location_name}
                  onChange={e => setNewItem({...newItem, location_name: e.target.value})}
                />
                <div className="form-row">
                  <input 
                    type="date" 
                    value={newItem.date}
                    onChange={e => setNewItem({...newItem, date: e.target.value})}
                  />
                  <input 
                    type="time" 
                    value={newItem.time}
                    onChange={e => setNewItem({...newItem, time: e.target.value})}
                  />
                </div>
                <textarea 
                  placeholder="Notes/Description" 
                  value={newItem.description}
                  onChange={e => setNewItem({...newItem, description: e.target.value})}
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
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
};

export default TripDetail;
