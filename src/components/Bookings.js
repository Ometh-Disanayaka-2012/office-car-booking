// src/components/Bookings.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db } from '../services/firebase';
import '../styles/Bookings.css';

const Bookings = () => {
  const { currentUser, userProfile } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [cars, setCars] = useState([]);
  const [users, setUsers] = useState({});

  useEffect(() => {
    // Listen to user's bookings
    const bookingsQuery = query(
      collection(db, 'bookings'),
      where('userId', '==', currentUser.uid)
    );
    
    const unsubscribeBookings = onSnapshot(bookingsQuery, (snapshot) => {
      const bookingsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
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

    // Listen to users collection
    const usersQuery = query(collection(db, 'users'));
    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      const usersMap = {};
      snapshot.docs.forEach(doc => {
        usersMap[doc.id] = doc.data();
      });
      setUsers(usersMap);
    }, (error) => {
      console.error('Error fetching users:', error);
    });

    return () => {
      unsubscribeBookings();
      unsubscribeCars();
      unsubscribeUsers();
    };
  }, [currentUser]);

  const getCarById = (carId) => {
    return cars.find(c => c.id === carId);
  };

  const getEmployeeName = (booking) => {
    // First try to get name from booking itself
    if (booking.userName) {
      return booking.userName;
    }
    
    // Fallback: get from users collection
    if (booking.userId && users[booking.userId]) {
      return users[booking.userId].name || users[booking.userId].email || 'Unknown';
    }
    
    // Last resort
    return 'Unknown User';
  };

  const getEmployeeAvatar = (booking) => {
    const name = getEmployeeName(booking);
    return name.charAt(0).toUpperCase();
  };

  const handleStartTrip = async (bookingId) => {
    const startMeter = prompt('Enter starting odometer reading (km):');
    
    if (!startMeter) {
      return; // User cancelled
    }

    const meterValue = parseFloat(startMeter);
    if (isNaN(meterValue) || meterValue < 0) {
      alert('Please enter a valid odometer reading.');
      return;
    }

    try {
      await updateDoc(doc(db, 'bookings', bookingId), {
        tripStarted: true,
        tripStartTime: new Date().toISOString(),
        startMeterReading: meterValue,
        status: 'active'
      });
      alert('Trip started! Drive safely.');
    } catch (error) {
      console.error('Error starting trip:', error);
      alert('Failed to start trip. Please try again.');
    }
  };

  const handleEndTrip = async (bookingId) => {
    const booking = bookings.find(b => b.id === bookingId);
    
    if (!booking) return;

    const endMeter = prompt(`Enter ending odometer reading (km):\n\nStart reading: ${booking.startMeterReading || 'N/A'} km`);
    
    if (!endMeter) {
      return; // User cancelled
    }

    const meterValue = parseFloat(endMeter);
    if (isNaN(meterValue) || meterValue < 0) {
      alert('Please enter a valid odometer reading.');
      return;
    }

    // Validate end reading is greater than start reading
    if (booking.startMeterReading && meterValue < booking.startMeterReading) {
      alert(`End reading (${meterValue} km) cannot be less than start reading (${booking.startMeterReading} km).`);
      return;
    }

    const distance = booking.startMeterReading ? (meterValue - booking.startMeterReading).toFixed(2) : 0;

    if (!window.confirm(`Trip Summary:\n\nStart: ${booking.startMeterReading || 'N/A'} km\nEnd: ${meterValue} km\nDistance: ${distance} km\n\nConfirm end trip?`)) {
      return;
    }

    try {
      await updateDoc(doc(db, 'bookings', bookingId), {
        tripEndTime: new Date().toISOString(),
        endMeterReading: meterValue,
        distanceTraveled: distance,
        status: 'completed'
      });
      alert(`Trip completed successfully!\n\nTotal distance: ${distance} km`);
    } catch (error) {
      console.error('Error ending trip:', error);
      alert('Failed to end trip. Please try again.');
    }
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
        <h2>My Bookings</h2>
        <p>{userProfile?.name}'s car reservations and trip history</p>
      </div>

      <div className="table-container">
        <table className="bookings-table">
          <thead>
            <tr>
              <th>Booked By</th>
              <th>Car</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Distance</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                  No bookings found
                </td>
              </tr>
            ) : (
              bookings.map(booking => {
                const car = getCarById(booking.carId);
                const employeeName = getEmployeeName(booking);
                const employeeAvatar = getEmployeeAvatar(booking);
                
                return (
                  <tr key={booking.id}>
                    <td>
                      <div className="employee-info">
                        <span className="employee-avatar">
                          {employeeAvatar}
                        </span>
                        <span>{employeeName}</span>
                      </div>
                    </td>
                    <td>{car?.model || 'Unknown'}</td>
                    <td>{new Date(booking.startDate).toLocaleString()}</td>
                    <td>{new Date(booking.endDate).toLocaleString()}</td>
                    <td>
                      {booking.status === 'completed' && booking.distanceTraveled ? (
                        <span>{booking.distanceTraveled} km</span>
                      ) : booking.tripStarted ? (
                        <span style={{ color: 'var(--text-secondary)' }}>In progress</span>
                      ) : (
                        <span style={{ color: 'var(--text-secondary)' }}>—</span>
                      )}
                    </td>
                    <td>{getStatusBadge(booking.status)}</td>
                    <td>
                      <div className="action-buttons">
                        {booking.status === 'active' && !booking.tripStarted && (
                          <>
                            <button
                              className="btn-success btn-sm"
                              onClick={() => handleStartTrip(booking.id)}
                            >
                              Start Trip
                            </button>
                            <button
                              className="btn-danger btn-sm"
                              onClick={() => handleCancelBooking(booking.id)}
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        {booking.status === 'active' && booking.tripStarted && (
                          <button
                            className="btn-danger btn-sm"
                            onClick={() => handleEndTrip(booking.id)}
                          >
                            End Trip
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

export default Bookings;
