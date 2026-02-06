// src/components/Dashboard.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const { userProfile } = useAuth();
  const [stats, setStats] = useState({
    totalCars: 0,
    availableCars: 0,
    activeBookings: 0,
    totalDrivers: 0
  });
  const [cars, setCars] = useState([]);
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    // Listen to cars collection
    const carsQuery = query(collection(db, 'cars'));
    const unsubscribeCars = onSnapshot(carsQuery, (snapshot) => {
      const carsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCars(carsData);
      setStats(prev => ({ ...prev, totalCars: snapshot.size }));
    });

    // Listen to bookings collection
    const bookingsQuery = query(collection(db, 'bookings'));
    const unsubscribeBookings = onSnapshot(bookingsQuery, (snapshot) => {
      const bookingsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBookings(bookingsData);
      
      const activeCount = bookingsData.filter(b => b.status === 'active').length;
      setStats(prev => ({ ...prev, activeBookings: activeCount }));
    });

    // Listen to drivers collection
    const driversQuery = query(collection(db, 'drivers'));
    const unsubscribeDrivers = onSnapshot(driversQuery, (snapshot) => {
      setStats(prev => ({ ...prev, totalDrivers: snapshot.size }));
    });

    return () => {
      unsubscribeCars();
      unsubscribeBookings();
      unsubscribeDrivers();
    };
  }, []);

  // Calculate available cars based on current time
  useEffect(() => {
    const now = new Date();
    const carsInUse = bookings.filter(b => 
      b.status === 'active' && 
      b.tripStarted &&
      new Date(b.startDate) <= now &&
      new Date(b.endDate) >= now
    ).map(b => b.carId);

    const availableCount = cars.filter(car => !carsInUse.includes(car.id)).length;
    setStats(prev => ({ ...prev, availableCars: availableCount }));
  }, [cars, bookings]);

  return (
    <div className="dashboard">
      <div className="page-header">
        <h2>Dashboard</h2>
        <p>Welcome back, {userProfile?.name}</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🚗</div>
          <div className="stat-content">
            <h3>{stats.totalCars}</h3>
            <p>Total Cars</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{stats.availableCars}</h3>
            <p>Available Cars</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <h3>{stats.activeBookings}</h3>
            <p>Active Bookings</p>
          </div>
        </div>

        {userProfile?.role === 'admin' && (
          <div className="stat-card">
            <div className="stat-icon">👨‍✈️</div>
            <div className="stat-content">
              <h3>{stats.totalDrivers}</h3>
              <p>Total Drivers</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
