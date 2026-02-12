// src/components/BookingModal.js
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

const BookingModal = ({ car, existingBookings = [], onClose }) => {
  const { currentUser, userProfile } = useAuth();
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    purpose: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Check if the selected time slot conflicts with existing bookings
  const hasTimeConflict = (startDate, endDate) => {
    const newStart = new Date(startDate);
    const newEnd = new Date(endDate);

    return existingBookings.some(booking => {
      const bookingStart = new Date(booking.startDate);
      const bookingEnd = new Date(booking.endDate);

      // Check if time slots overlap
      return (
        (newStart >= bookingStart && newStart < bookingEnd) || // New starts during existing
        (newEnd > bookingStart && newEnd <= bookingEnd) ||     // New ends during existing
        (newStart <= bookingStart && newEnd >= bookingEnd)      // New encompasses existing
      );
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate dates
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    const now = new Date();

    if (startDate < now) {
      setError('Start date cannot be in the past');
      setLoading(false);
      return;
    }

    if (endDate <= startDate) {
      setError('End date must be after start date');
      setLoading(false);
      return;
    }

    // Check for time conflicts
    if (hasTimeConflict(formData.startDate, formData.endDate)) {
      setError('This time slot conflicts with an existing booking. Please choose a different time.');
      setLoading(false);
      return;
    }

    try {
      const bookingData = {
        carId: car.id,
        userId: currentUser.uid,
        userName: userProfile.name,
        userEmail: userProfile.email || currentUser.email,
        startDate: formData.startDate,
        endDate: formData.endDate,
        purpose: formData.purpose,
        status: 'active',
        tripStarted: false,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'bookings'), bookingData);
      alert('Booking confirmed successfully!');
      onClose();
    } catch (error) {
      console.error('Error creating booking:', error);
      setError('Failed to create booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Book {car.model}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {existingBookings.length > 0 && (
          <div className="existing-bookings-info">
            <strong>Existing Bookings:</strong>
            <div className="bookings-list">
              {existingBookings.map(booking => (
                <div key={booking.id} className="booking-item">
                  📅 {new Date(booking.startDate).toLocaleString()} → {new Date(booking.endDate).toLocaleString()}
                </div>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="startDate">Start Date & Time</label>
            <input
              type="datetime-local"
              id="startDate"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="endDate">End Date & Time</label>
            <input
              type="datetime-local"
              id="endDate"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="purpose">Purpose</label>
            <textarea
              id="purpose"
              name="purpose"
              value={formData.purpose}
              onChange={handleChange}
              rows="3"
              placeholder="Meeting, client visit, etc."
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Checking availability...' : 'Confirm Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingModal;
