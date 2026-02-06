// src/components/AllBookings.js
import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db } from '../services/firebase';
import '../styles/Bookings.css';

const AllBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [cars, setCars] = useState([]);

  useEffect(() => {
    // Listen to all bookings
    const bookingsQuery = query(collection(db, 'bookings'));
    
    const unsubscribeBookings = onSnapshot(bookingsQuery, (snapshot) => {
      const bookingsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Sort by created date, newest first
      bookingsData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setBookings(bookingsData);
    }, (error) => {
      console.error('Error fetching bookings:', error);
      setBookings([]);
    });

    // Listen to cars
    const carsQuery = query(collection(db, 'cars'));
    const unsubscribeCars = onSnapshot(carsQuery, (snapshot) => {
      const carsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCars(carsData);
    });

    return () => {
      unsubscribeBookings();
      unsubscribeCars();
    };
  }, []);

  const getCarById = (carId) => {
    return cars.find(c => c.id === carId);
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;

    try {
      await updateDoc(doc(db, 'bookings', bookingId), {
        status: 'cancelled'
      });
      alert('Booking cancelled.');
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert('Failed to cancel booking. Please try again.');
    }
  };

  const getStatusBadge = (status) => {
    const badgeClasses = {
      active: 'badge-active',
      completed: 'badge-completed',
      cancelled: 'badge-cancelled'
    };
    return <span className={`badge ${badgeClasses[status]}`}>{status}</span>;
  };

  return (
    <div className="bookings-page">
      <div className="page-header">
        <h2>All Bookings</h2>
        <p>Manage all car bookings in the system</p>
      </div>

      <div className="table-container">
        <table className="bookings-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Car</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Meter (km)</th>
              <th>Distance</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>
                  No bookings found
                </td>
              </tr>
            ) : (
              bookings.map(booking => {
                const car = getCarById(booking.carId);
                return (
                  <tr key={booking.id}>
                    <td>{booking.userName}</td>
                    <td>{car?.model || 'Unknown'}</td>
                    <td>{new Date(booking.startDate).toLocaleString()}</td>
                    <td>{new Date(booking.endDate).toLocaleString()}</td>
                    <td>
                      {booking.startMeterReading && booking.endMeterReading ? (
                        <span>
                          {booking.startMeterReading} → {booking.endMeterReading}
                        </span>
                      ) : booking.startMeterReading ? (
                        <span style={{ color: 'var(--text-secondary)' }}>
                          {booking.startMeterReading} → —
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-secondary)' }}>—</span>
                      )}
                    </td>
                    <td>
                      {booking.status === 'completed' && booking.distanceTraveled ? (
                        <strong>{booking.distanceTraveled} km</strong>
                      ) : booking.tripStarted ? (
                        <span style={{ color: 'var(--text-secondary)' }}>In progress</span>
                      ) : (
                        <span style={{ color: 'var(--text-secondary)' }}>—</span>
                      )}
                    </td>
                    <td>{getStatusBadge(booking.status)}</td>
                    <td>
                      <div className="action-buttons">
                        {booking.status === 'active' && (
                          <button
                            className="btn-danger btn-sm"
                            onClick={() => handleCancelBooking(booking.id)}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AllBookings;
