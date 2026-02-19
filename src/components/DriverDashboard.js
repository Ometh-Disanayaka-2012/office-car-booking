// src/components/DriverDashboard.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db } from '../services/firebase';
import NotificationBell from './NotificationBell';
import { checkUpcomingTrips } from '../services/notificationService';
import '../styles/DriverDashboard.css';

const DriverDashboard = () => {
  const navigate = useNavigate();
  const [driver, setDriver] = useState(null);
  const [car, setCar] = useState(null);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Check for upcoming trips every 10 minutes
  useEffect(() => {
    checkUpcomingTrips(); // Run once on mount
    const interval = setInterval(checkUpcomingTrips, 10 * 60 * 1000); // Every 10 min
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Check driver session
    const session = localStorage.getItem('driverSession');
    if (!session) {
      navigate('/driver/login');
      return;
    }

    const driverData = JSON.parse(session);
    setDriver(driverData);

    // Get driver's car
    if (driverData.carId) {
      const unsubscribeCar = onSnapshot(doc(db, 'cars', driverData.carId), (docSnap) => {
        if (docSnap.exists()) {
          setCar({ id: docSnap.id, ...docSnap.data() });
        }
      });

      // Get all bookings for this car
      const bookingsQuery = query(
        collection(db, 'bookings'),
        where('carId', '==', driverData.carId),
        where('status', '==', 'active')
      );

      const unsubscribeBookings = onSnapshot(bookingsQuery, (snapshot) => {
        const tripsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Sort by start date
        tripsData.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
        setTrips(tripsData);
        setLoading(false);
      });

      return () => {
        unsubscribeCar();
        unsubscribeBookings();
      };
    } else {
      setLoading(false);
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('driverSession');
    navigate('/driver/login');
  };

  const getTripStatus = (trip) => {
    const now = new Date();
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);

    if (trip.tripStarted) {
      if (now < end) {
        return { label: '🔴 In Progress', cls: 'in-progress' };
      }
      return { label: '⏱️ Completing', cls: 'completing' };
    }

    const hoursUntilStart = (start - now) / (1000 * 60 * 60);

    if (hoursUntilStart < 0) {
      return { label: '⚠️ Overdue', cls: 'overdue' };
    } else if (hoursUntilStart < 1) {
      return { label: '🟠 Starting Soon!', cls: 'starting-soon' };
    } else if (hoursUntilStart < 24) {
      return { label: '🟢 Today', cls: 'today' };
    } else {
      return { label: '📅 Upcoming', cls: 'upcoming' };
    }
  };

  const formatDateTime = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dateOnly = date.toDateString();
    const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (dateOnly === today.toDateString()) {
      return `Today at ${time}`;
    } else if (dateOnly === tomorrow.toDateString()) {
      return `Tomorrow at ${time}`;
    } else {
      return `${date.toLocaleDateString()} at ${time}`;
    }
  };

  if (loading) {
    return (
      <div className="driver-dashboard loading">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div className="driver-dashboard">
      {/* Header */}
      <div className="driver-header">
        <div className="driver-header-left">
          <h1>🚗 Driver Portal</h1>
          <p>Welcome, {driver?.name}</p>
        </div>
        <div className="driver-header-right">
          <NotificationBell driverId={driver?.id} />
          <button className="btn-secondary" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      {/* Car Info */}
      {car ? (
        <div className="driver-car-info">
          <div className="car-icon">🚗</div>
          <div>
            <h3>Your Assigned Car</h3>
            <p className="car-details">
              <strong>{car.model}</strong> · {car.plate} · {car.seats} seats
            </p>
          </div>
        </div>
      ) : (
        <div className="driver-car-info no-car">
          <div className="car-icon">⚠️</div>
          <div>
            <h3>No Car Assigned</h3>
            <p>Please contact admin to assign you a vehicle</p>
          </div>
        </div>
      )}

      {/* Trips List */}
      <div className="trips-section">
        <h2>Your Trips ({trips.length})</h2>

        {trips.length === 0 ? (
          <div className="empty-trips">
            <div className="empty-icon">📅</div>
            <h3>No upcoming trips</h3>
            <p>You'll be notified when a trip is assigned to you</p>
          </div>
        ) : (
          <div className="trips-list">
            {trips.map(trip => {
              const status = getTripStatus(trip);
              return (
                <div key={trip.id} className={`trip-card ${status.cls}`}>
                  <div className="trip-card-header">
                    <div className={`trip-status ${status.cls}`}>
                      {status.label}
                    </div>
                    <div className="trip-time">
                      {formatDateTime(trip.startDate)}
                    </div>
                  </div>

                  <div className="trip-card-body">
                    <div className="trip-employee">
                      <div className="employee-avatar">
                        {trip.userName?.charAt(0) || 'E'}
                      </div>
                      <div>
                        <strong>{trip.userName || 'Employee'}</strong>
                        <br />
                        <small>{trip.userEmail}</small>
                      </div>
                    </div>

                    {trip.purpose && (
                      <div className="trip-purpose">
                        <strong>Purpose:</strong> {trip.purpose}
                      </div>
                    )}

                    <div className="trip-duration">
                      <strong>Duration:</strong> {formatDateTime(trip.startDate)} → {formatDateTime(trip.endDate)}
                    </div>

                    {trip.tripStarted && (
                      <div className="trip-meters">
                        <strong>Start Odometer:</strong> {trip.startMeterReading || '—'} km
                      </div>
                    )}
                  </div>

                  <div className="trip-card-footer">
                    {!trip.tripStarted && (
                      <span className="trip-note">
                        ℹ️ Employee will start the trip
                      </span>
                    )}
                    {trip.tripStarted && (
                      <span className="trip-note active">
                        🔴 Trip in progress
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverDashboard;
