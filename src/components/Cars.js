// src/components/Cars.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../services/firebase';
import CarCard from './CarCard';
import CarModal from './CarModal';
import '../styles/Cars.css';

const Cars = () => {
  const { isAdmin } = useAuth();
  const [cars, setCars] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCar, setEditingCar] = useState(null);

  useEffect(() => {
    // Listen to cars
    const carsQuery = query(collection(db, 'cars'));
    const unsubscribeCars = onSnapshot(carsQuery, (snapshot) => {
      const carsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCars(carsData);
    }, (error) => {
      console.error('Error fetching cars:', error);
      // Use demo data if Firebase fails
      setCars([
        { id: '1', model: 'Toyota Camry', plate: 'ABC-1234', seats: 5, driverId: '1' },
        { id: '2', model: 'Honda CR-V', plate: 'XYZ-5678', seats: 7, driverId: '2' }
      ]);
    });

    // Listen to drivers
    const driversQuery = query(collection(db, 'drivers'));
    const unsubscribeDrivers = onSnapshot(driversQuery, (snapshot) => {
      const driversData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDrivers(driversData);
    }, (error) => {
      console.error('Error fetching drivers:', error);
      setDrivers([
        { id: '1', name: 'Michael Johnson', phone: '555-0101' },
        { id: '2', name: 'Sarah Williams', phone: '555-0102' }
      ]);
    });

    // Listen to bookings
    const bookingsQuery = query(collection(db, 'bookings'));
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

    return () => {
      unsubscribeCars();
      unsubscribeDrivers();
      unsubscribeBookings();
    };
  }, []);

  const handleAddCar = () => {
    setEditingCar(null);
    setShowModal(true);
  };

  const handleEditCar = (car) => {
    setEditingCar(car);
    setShowModal(true);
  };

  const handleDeleteCar = async (carId) => {
    if (!window.confirm('Are you sure you want to delete this car?')) return;

    try {
      await deleteDoc(doc(db, 'cars', carId));
    } catch (error) {
      console.error('Error deleting car:', error);
      alert('Failed to delete car. Please try again.');
    }
  };

  const handleSaveCar = async (carData) => {
    try {
      if (editingCar) {
        await updateDoc(doc(db, 'cars', editingCar.id), carData);
      } else {
        await addDoc(collection(db, 'cars'), carData);
      }
      setShowModal(false);
    } catch (error) {
      console.error('Error saving car:', error);
      alert('Failed to save car. Please try again.');
    }
  };

  const isCarCurrentlyInUse = (carId) => {
    // Check if car has an active trip happening right now
    const now = new Date();
    return bookings.some(b => 
      b.carId === carId && 
      b.status === 'active' && 
      b.tripStarted &&
      new Date(b.startDate) <= now &&
      new Date(b.endDate) >= now
    );
  };

  return (
    <div className="cars-page">
      <div className="page-header">
        <div>
          <h2>Cars</h2>
          <p>Browse and manage vehicles</p>
        </div>
        {isAdmin() && (
          <button className="btn-primary" onClick={handleAddCar}>
            + Add Car
          </button>
        )}
      </div>

      <div className="cars-grid">
        {cars.map(car => {
          const driver = drivers.find(d => d.id === car.driverId || d.carId === car.id);
          const inUse = isCarCurrentlyInUse(car.id);

          return (
            <CarCard
              key={car.id}
              car={car}
              driver={driver}
              inUse={inUse}
              bookings={bookings}
              onEdit={isAdmin() ? () => handleEditCar(car) : null}
              onDelete={isAdmin() ? () => handleDeleteCar(car.id) : null}
            />
          );
        })}
      </div>

      {showModal && (
        <CarModal
          car={editingCar}
          onClose={() => setShowModal(false)}
          onSave={handleSaveCar}
        />
      )}
    </div>
  );
};

export default Cars;
