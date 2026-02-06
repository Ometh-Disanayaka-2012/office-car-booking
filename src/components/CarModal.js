// src/components/CarModal.js
import React, { useState, useEffect } from 'react';

const CarModal = ({ car, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    model: '',
    plate: '',
    seats: 5
  });

  useEffect(() => {
    if (car) {
      setFormData({
        model: car.model || '',
        plate: car.plate || '',
        seats: car.seats || 5
      });
    }
  }, [car]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'seats' ? parseInt(value) : value
    }));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{car ? 'Edit Car' : 'Add Car'}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="model">Car Model</label>
            <input
              type="text"
              id="model"
              name="model"
              value={formData.model}
              onChange={handleChange}
              required
              placeholder="e.g., Toyota Camry"
            />
          </div>

          <div className="form-group">
            <label htmlFor="plate">License Plate</label>
            <input
              type="text"
              id="plate"
              name="plate"
              value={formData.plate}
              onChange={handleChange}
              required
              placeholder="e.g., ABC-1234"
            />
          </div>

          <div className="form-group">
            <label htmlFor="seats">Number of Seats</label>
            <input
              type="number"
              id="seats"
              name="seats"
              value={formData.seats}
              onChange={handleChange}
              required
              min="2"
              max="20"
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save Car
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CarModal;
