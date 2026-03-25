import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import {
  getItinerary,
  addItineraryItem,
  updateItineraryItem,
  deleteItineraryItem,
} from "../services/user/itineraryService";

import { subscribeToItinerary } from "../services/realtime";
import "./Itinerary.css";

/* ================= ICONS ================= */

const CalendarIcon = () => (
  <svg width="18" height="18" stroke="#0f766e" fill="none" strokeWidth="2">
    <rect x="2" y="4" width="14" height="12" rx="2" />
    <line x1="2" y1="8" x2="16" y2="8" />
  </svg>
);

const ClockIcon = () => (
  <svg width="16" height="16" stroke="#0f766e" fill="none" strokeWidth="2">
    <circle cx="8" cy="8" r="6" />
    <line x1="8" y1="4" x2="8" y2="8" />
    <line x1="8" y1="8" x2="11" y2="10" />
  </svg>
);

const LocationIcon = () => (
  <svg width="16" height="16" stroke="#0f766e" fill="none" strokeWidth="2">
    <path d="M8 14s4-4.5 4-7a4 4 0 10-8 0c0 2.5 4 7 4 7z" />
    <circle cx="8" cy="7" r="1.5" />
  </svg>
);

/* ✅ NEW PROFESSIONAL ICONS */

const EditIcon = () => (
  <svg width="16" height="16" fill="none" stroke="#2563eb" strokeWidth="2">
    <path d="M12 2l2 2-8 8H4v-2l8-8z" />
  </svg>
);

const DeleteIcon = () => (
  <svg width="16" height="16" fill="none" stroke="#dc2626" strokeWidth="2">
    <path d="M3 6h10" />
    <path d="M8 6v6" />
    <path d="M5 6l1-2h4l1 2" />
    <rect x="4" y="6" width="8" height="8" rx="1" />
  </svg>
);

const Itinerary = () => {
  const { id: tripId } = useParams();

  const [items, setItems] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
  });

  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const groupByDate = (items) => {
    return items.reduce((groups, item) => {
      if (!item.start_time) return groups;
      const date = new Date(item.start_time).toDateString();
      if (!groups[date]) groups[date] = [];
      groups[date].push(item);
      return groups;
    }, {});
  };

  const fetchItems = async () => {
    if (!tripId) return;
    const data = await getItinerary(tripId);
    setItems(data || []);
  };

  useEffect(() => {
    fetchItems();
    const channel = subscribeToItinerary(tripId, fetchItems);
    return () => channel?.unsubscribe();
  }, [tripId]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setForm({ title: "", description: "", location: "" });
    setStartDate(null);
    setEndDate(null);
    setEditingId(null);
  };

  const handleAdd = async () => {
    if (!form.title || !startDate) return;

    await addItineraryItem({
      ...form,
      trip_id: tripId,
      start_time: new Date(startDate).toISOString(),
      end_time: endDate ? new Date(endDate).toISOString() : null,
    });

    await fetchItems();
    resetForm();
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      description: item.description,
      location: item.location,
    });
    setStartDate(new Date(item.start_time));
    setEndDate(item.end_time ? new Date(item.end_time) : null);
  };

  const handleUpdate = async () => {
    await updateItineraryItem(editingId, {
      ...form,
      start_time: new Date(startDate).toISOString(),
      end_time: endDate ? new Date(endDate).toISOString() : null,
    });

    await fetchItems();
    resetForm();
  };

  /* ❌ REMOVED POPUP */
  const handleDelete = async (id) => {
    await deleteItineraryItem(id);
    await fetchItems();
  };

  const grouped = groupByDate(items);
  const days = Object.keys(grouped);

  useEffect(() => {
    if (days.length && !selectedDay) setSelectedDay(days[0]);
  }, [days]);

  return (
    <div className="itinerary-page">
      <div className="itinerary-container">
        <h1 className="title">Trip Itinerary</h1>

        <div className="form-card">
          <input name="title" placeholder="Activity Title" value={form.title} onChange={handleChange} />
          <input name="location" placeholder="Location" value={form.location} onChange={handleChange} />

          <DatePicker selected={startDate} onChange={setStartDate} showTimeSelect timeIntervals={15} dateFormat="MMM d, yyyy h:mm aa" placeholderText="Start Date & Time" />
          <DatePicker selected={endDate} onChange={setEndDate} showTimeSelect timeIntervals={15} dateFormat="MMM d, yyyy h:mm aa" placeholderText="End Date & Time" />

          <textarea name="description" placeholder="Description" value={form.description} onChange={handleChange} />

          <button onClick={editingId ? handleUpdate : handleAdd}>
            {editingId ? "Update Activity" : "+ Add Activity"}
          </button>
        </div>

        <div className="day-tabs">
          {days.map((day, index) => (
            <button key={day} className={selectedDay === day ? "active-tab" : ""} onClick={() => setSelectedDay(day)}>
              Day {index + 1}
            </button>
          ))}
        </div>

        {selectedDay && (
          <div className="day-card">
            <h2 className="day-heading">
              <CalendarIcon /> {selectedDay}
            </h2>

            {grouped[selectedDay].map((item) => (
              <div key={item.id} className="activity-row">
                <div className="time">
                  <ClockIcon />
                  {new Date(item.start_time).toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </div>

                <div className="activity-content">
                  <h3>{item.title}</h3>
                  <p className="location">
                    <LocationIcon /> {item.location}
                  </p>
                  <p className="desc">{item.description}</p>
                </div>

                {/* ✅ PROFESSIONAL BUTTONS */}
                <div className="actions">
                  <button className="edit-btn" onClick={() => handleEdit(item)}>
                    <EditIcon />
                  </button>
                  <button className="delete-btn" onClick={() => handleDelete(item.id)}>
                    <DeleteIcon />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Itinerary;