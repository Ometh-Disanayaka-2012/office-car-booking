// src/components/BookingModal.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc, getDocs, query } from 'firebase/firestore';
import { db } from '../services/firebase';

const BookingModal = ({ car, existingBookings = [], isUnavailableToday = false, onClose }) => {
  const { currentUser, userProfile, isAdmin } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    purpose: '',
    selectedEmployeeId: 'self'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Today's date as YYYY-MM-DD for comparisons
  const todayStr = new Date().toISOString().split('T')[0];

  // Minimum start datetime: if car unavailable today, minimum is tomorrow 00:00
  const getMinStartDate = () => {
    if (isUnavailableToday) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      return tomorrow.toISOString().slice(0, 16); // "YYYY-MM-DDTHH:MM"
    }
    // Otherwise minimum is now
    return new Date().toISOString().slice(0, 16);
  };

  // Check if a given datetime string falls on today
  const isToday = (dateStr) => {
    if (!dateStr) return false;
    return dateStr.split('T')[0] === todayStr;
  };

  // Load employees list for admin
  useEffect(() => {
    if (!isAdmin()) return;

    const loadEmployees = async () => {
      try {
        const empSnap = await getDocs(query(collection(db, 'employees')));
        const empList = empSnap.docs.map(doc => ({ id: doc.id, source: 'employees', ...doc.data() }));

        const usersSnap = await getDocs(query(collection(db, 'users')));
        const usersList = usersSnap.docs.map(doc => ({ id: doc.id, source: 'users', ...doc.data() }));

        const emailsSeen = new Set(empList.map(e => e.email));
        const merged = [
          ...empList,
          ...usersList.filter(u => !emailsSeen.has(u.email))
        ];

        const filtered = merged
          .filter(e => e.name && e.email && e.email !== currentUser.email)
          .sort((a, b) => a.name.localeCompare(b.name));

        setEmployees(filtered);
      } catch (err) {
        console.error('Error loading employees:', err);
      }
    };

    loadEmployees();
  }, [isAdmin, currentUser.email]);

  const getBookingFor = () => {
    if (!isAdmin() || formData.selectedEmployeeId === 'self') {
      return {
        userId: currentUser.uid,
        userName: userProfile.name,
        userEmail: userProfile.email || currentUser.email,
        bookedByAdmin: false
      };
    }

    const employee = employees.find(e => e.id === formData.selectedEmployeeId);
    if (!employee) return null;

    return {
      userId: employee.userId || employee.id,
      userName: employee.name,
      userEmail: employee.email,
      bookedByAdmin: true,
      bookedByName: userProfile.name,
      bookedById: currentUser.uid
    };
  };

  const hasTimeConflict = (startDate, endDate) => {
    const newStart = new Date(startDate);
    const newEnd = new Date(endDate);

    return existingBookings.some(booking => {
      const bookingStart = new Date(booking.startDate);
      const bookingEnd = new Date(booking.endDate);
      return (
        (newStart >= bookingStart && newStart < bookingEnd) ||
        (newEnd > bookingStart && newEnd <= bookingEnd) ||
        (newStart <= bookingStart && newEnd >= bookingEnd)
      );
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    const now = new Date();

    if (startDate < now) {
      setError('Start date cannot be in the past.');
      setLoading(false);
      return;
    }

    if (endDate <= startDate) {
      setError('End date must be after start date.');
      setLoading(false);
      return;
    }

    // KEY CHECK: if car is unavailable today, block any booking that starts or ends today
    if (isUnavailableToday) {
      if (isToday(formData.startDate) || isToday(formData.endDate)) {
        setError(`🚫 "${car.model}" is unavailable today. Please choose a start date from tomorrow onwards.`);
        setLoading(false);
        return;
      }
    }

    if (hasTimeConflict(formData.startDate, formData.endDate)) {
      setError('This time slot conflicts with an existing booking. Please choose a different time.');
      setLoading(false);
      return;
    }

    if (isAdmin() && !formData.selectedEmployeeId) {
      setError('Please select who this booking is for.');
      setLoading(false);
      return;
    }

    const bookingFor = getBookingFor();
    if (!bookingFor) {
      setError('Selected employee not found. Please try again.');
      setLoading(false);
      return;
    }

    try {
      await addDoc(collection(db, 'bookings'), {
        carId: car.id,
        ...bookingFor,
        startDate: formData.startDate,
        endDate: formData.endDate,
        purpose: formData.purpose,
        status: 'active',
        tripStarted: false,
        createdAt: new Date().toISOString()
      });

      alert(
        bookingFor.bookedByAdmin
          ? `✅ Booking confirmed for ${bookingFor.userName}!`
          : '✅ Booking confirmed successfully!'
      );
      onClose();
    } catch (err) {
      console.error('Error creating booking:', err);
      setError('Failed to create booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // If car is unavailable today and user picks today's date, show instant error
    if (isUnavailableToday && (name === 'startDate' || name === 'endDate')) {
      if (isToday(value)) {
        setError(`🚫 "${car.model}" is unavailable today. Please select a date from tomorrow onwards.`);
      } else {
        setError('');
      }
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const selectedEmployee = formData.selectedEmployeeId === 'self'
    ? null
    : employees.find(e => e.id === formData.selectedEmployeeId);

  const minDate = getMinStartDate();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content booking-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Book {car.model}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {/* Unavailability notice */}
        {isUnavailableToday && (
          <div className="unavailability-notice">
            🚫 <strong>This car is unavailable today.</strong><br />
            You can still book it for <strong>tomorrow or any future date</strong>.
          </div>
        )}

        {error && <div className="error-message">{error}</div>}

        {existingBookings.length > 0 && (
          <div className="existing-bookings-info">
            <strong>⚠️ Existing Bookings for this car:</strong>
            <div className="bookings-list">
              {existingBookings.map(booking => (
                <div key={booking.id} className="booking-item">
                  📅 {new Date(booking.startDate).toLocaleString()} → {new Date(booking.endDate).toLocaleString()}
                  {booking.userName && <span className="booking-owner"> · {booking.userName}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Admin: Book for Employee */}
          {isAdmin() && (
            <div className="form-group book-for-section">
              <label htmlFor="selectedEmployeeId">📋 Book For</label>
              <select
                id="selectedEmployeeId"
                name="selectedEmployeeId"
                value={formData.selectedEmployeeId}
                onChange={handleChange}
                required
              >
                <option value="self">Myself ({userProfile?.name})</option>
                <optgroup label="── Employees ──">
                  {employees.length === 0 ? (
                    <option disabled>No employees found — add them first</option>
                  ) : (
                    employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.email})
                      </option>
                    ))
                  )}
                </optgroup>
              </select>

              {selectedEmployee && (
                <div className="selected-employee-card">
                  <div className="selected-employee-avatar">
                    {selectedEmployee.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="selected-employee-info">
                    <strong>{selectedEmployee.name}</strong>
                    <span>{selectedEmployee.email}</span>
                    {selectedEmployee.department && (
                      <span>{selectedEmployee.department} · {selectedEmployee.position}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="startDate">
              Start Date & Time
              {isUnavailableToday && <span className="label-hint"> (from tomorrow onwards)</span>}
            </label>
            <input
              type="datetime-local"
              id="startDate"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              min={minDate}
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
              min={formData.startDate || minDate}
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
              {loading
                ? 'Confirming...'
                : selectedEmployee
                  ? `Book for ${selectedEmployee.name.split(' ')[0]}`
                  : 'Confirm Booking'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingModal;
