// src/components/AllBookings.js
import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db } from '../services/firebase';
import '../styles/Bookings.css';

const AllBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [cars, setCars] = useState([]);
  const [employees, setEmployees] = useState({});
  const [userIdToEmployee, setUserIdToEmployee] = useState({}); // NEW: Direct userId mapping

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

    // Listen to employees collection
    const employeesQuery = query(collection(db, 'employees'));
    const unsubscribeEmployees = onSnapshot(employeesQuery, (snapshot) => {
      const employeesMap = {};
      snapshot.docs.forEach(doc => {
        const empData = doc.data();
        // Map by email for easy lookup
        employeesMap[empData.email] = { id: doc.id, ...empData };
      });
      setEmployees(employeesMap);
    }, (error) => {
      console.error('Error fetching employees:', error);
    });

    // Also listen to users collection as fallback
    const usersQuery = query(collection(db, 'users'));
    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      const userIdMap = {};
      const emailMap = { ...employees };
      
      snapshot.docs.forEach(doc => {
        const userData = doc.data();
        const empData = {
          id: doc.id,
          userId: doc.id,
          name: userData.name || userData.email,
          email: userData.email,
          role: userData.role,
          source: 'users'
        };
        
        // Map by userId for direct lookup
        userIdMap[doc.id] = empData;
        
        // Map by email if not already in employees
        if (userData.email && !emailMap[userData.email]) {
          emailMap[userData.email] = empData;
        }
      });
      
      setUserIdToEmployee(userIdMap);
      setEmployees(emailMap);
    }, (error) => {
      console.error('Error fetching users:', error);
    });

    return () => {
      unsubscribeBookings();
      unsubscribeCars();
      unsubscribeEmployees();
      unsubscribeUsers();
    };
  }, []);

  const getCarById = (carId) => {
    return cars.find(c => c.id === carId);
  };

  const getEmployeeName = (booking) => {
    // First try to get name from booking itself
    if (booking.userName) {
      return booking.userName;
    }
    
    // Direct userId lookup (most reliable for old bookings!)
    if (booking.userId && userIdToEmployee[booking.userId]) {
      return userIdToEmployee[booking.userId].name;
    }
    
    // Try to get user email from booking and lookup
    const userEmail = booking.userEmail || booking.email;
    if (userEmail && employees[userEmail]) {
      return employees[userEmail].name || userEmail;
    }
    
    // Last resort
    return userEmail || 'Unknown User';
  };

  const getEmployeeAvatar = (booking) => {
    const name = getEmployeeName(booking);
    return name.charAt(0).toUpperCase();
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
                const employeeName = getEmployeeName(booking);
                const employeeAvatar = getEmployeeAvatar(booking);
                
                return (
                  <tr key={booking.id}>
                    <td>
                      <div className="employee-info">
                        <span className="employee-avatar">
                          {employeeAvatar}
                        </span>
                        <div>
                          <span>{employeeName}</span>
                          {booking.bookedByAdmin && (
                            <div className="booked-by-admin-tag">
                              📋 Booked by {booking.bookedByName || 'Admin'}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
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
