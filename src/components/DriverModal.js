// src/components/DriverModal.js
import React, { useState, useEffect } from 'react';

const DriverModal = ({ driver, cars, drivers, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    license: '',
    carId: ''
  });

  useEffect(() => {
    if (driver) {
      setFormData({
        name: driver.name || '',
        phone: driver.phone || '',
        license: driver.license || '',
        carId: driver.carId || ''
      });
    }
  }, [driver]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Get available cars (not assigned to other drivers)
  const getAvailableCars = () => {
    return cars.filter(car => {
      const assignedDriver = drivers.find(d => d.carId === car.id);
      return !assignedDriver || (driver && assignedDriver.id === driver.id);
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{driver ? 'Edit Driver' : 'Add Driver'}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="e.g., Michael Johnson"
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              placeholder="e.g., 555-0101"
            />
          </div>

          <div className="form-group">
            <label htmlFor="license">License Number</label>
            <input
              type="text"
              id="license"
              name="license"
              value={formData.license}
              onChange={handleChange}
              required
              placeholder="e.g., DL12345"
            />
          </div>

          <div className="form-group">
            <label htmlFor="carId">Assigned Car</label>
            <select
              id="carId"
              name="carId"
              value={formData.carId}
              onChange={handleChange}
            >
              <option value="">No Car Assigned</option>
              {getAvailableCars().map(car => (
                <option key={car.id} value={car.id}>
                  {car.model} ({car.plate})
                </option>
              ))}
            </select>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save Driver
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DriverModal;
