// src/components/Drivers.js
import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../services/firebase';
import DriverModal from './DriverModal';
import '../styles/Drivers.css';

const Drivers = () => {
  const [drivers, setDrivers] = useState([]);
  const [cars, setCars] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);

  useEffect(() => {
    // Listen to drivers
    const driversQuery = query(collection(db, 'drivers'));
    const unsubscribeDrivers = onSnapshot(driversQuery, (snapshot) => {
      const driversData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDrivers(driversData);
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
      unsubscribeDrivers();
      unsubscribeCars();
    };
  }, []);

  const handleAddDriver = () => {
    setEditingDriver(null);
    setShowModal(true);
  };

  const handleEditDriver = (driver) => {
    setEditingDriver(driver);
    setShowModal(true);
  };

  const handleDeleteDriver = async (driverId) => {
    if (!window.confirm('Are you sure you want to delete this driver?')) return;

    try {
      await deleteDoc(doc(db, 'drivers', driverId));
    } catch (error) {
      console.error('Error deleting driver:', error);
      alert('Failed to delete driver. Please try again.');
    }
  };

  const handleSaveDriver = async (driverData) => {
    try {
      if (editingDriver) {
        await updateDoc(doc(db, 'drivers', editingDriver.id), driverData);
      } else {
        await addDoc(collection(db, 'drivers'), driverData);
      }
      setShowModal(false);
    } catch (error) {
      console.error('Error saving driver:', error);
      alert('Failed to save driver. Please try again.');
    }
  };

  const getCarById = (carId) => {
    return cars.find(c => c.id === carId);
  };

  return (
    <div className="drivers-page">
      <div className="page-header">
        <div>
          <h2>Drivers</h2>
          <p>Manage driver assignments</p>
        </div>
        <button className="btn-primary" onClick={handleAddDriver}>
          + Add Driver
        </button>
      </div>

      <div className="table-container">
        <table className="drivers-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>License Number</th>
              <th>Assigned Car</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {drivers.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
                  No drivers found
                </td>
              </tr>
            ) : (
              drivers.map(driver => {
                const car = getCarById(driver.carId);
                return (
                  <tr key={driver.id}>
                    <td>{driver.name}</td>
                    <td>{driver.phone}</td>
                    <td>{driver.license}</td>
                    <td>{car ? `${car.model} (${car.plate})` : 'Not assigned'}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-secondary btn-sm"
                          onClick={() => handleEditDriver(driver)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn-danger btn-sm"
                          onClick={() => handleDeleteDriver(driver.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <DriverModal
          driver={editingDriver}
          cars={cars}
          drivers={drivers}
          onClose={() => setShowModal(false)}
          onSave={handleSaveDriver}
        />
      )}
    </div>
  );
};

export default Drivers;
