// src/components/CarCard.js
import React, { useState } from 'react';
import BookingModal from './BookingModal';
import { useAuth } from '../contexts/AuthContext';
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../services/firebase";

const CarCard = ({ car, driver, inUse, bookings, onEdit, onDelete }) => {
  const { isAdmin } = useAuth();
  const [showBookingModal, setShowBookingModal] = useState(false);

  // Get upcoming bookings for this car
  const upcomingBookings = bookings
    .filter(b => b.carId === car.id && b.status === 'active')
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

    const toggleAvailability = async (carId, currentStatus) => {
      try {
        await updateDoc(doc(db, "cars", carId), {
          availableToday: !currentStatus
        });
      } catch (error) {
        console.error("Error updating availability:", error);
      }
    };

  return (
    <>
      <div className="car-card">
        <div className={`car-status ${inUse ? 'in-use' : 'available'}`}>
          {inUse ? 'In Use' : 'Available'}
        </div>

        {isAdmin() && (
  <label>
    <input
      type="checkbox"
      checked={car.availableToday}
      onChange={() => toggleAvailability(car.id, car.availableToday)}
    />
    Available Today
  </label>
)}
        
        <div className="car-image">🚗</div>
        
        <div className="car-info">
          <h3>{car.model}</h3>
          <div className="car-details">
            <span>🔢 {car.plate}</span>
            <span>💺 {car.seats} seats</span>
          </div>
          
          {driver ? (
            <div className="car-driver">
              <strong>Driver:</strong> {driver.name}<br />
              <small>📞 {driver.phone}</small>
            </div>
          ) : (
            <div className="car-driver">No driver assigned</div>
          )}

          {upcomingBookings.length > 0 && (
            <div className="upcoming-bookings">
              <strong>Upcoming:</strong>
              {upcomingBookings.slice(0, 2).map(booking => (
                <div key={booking.id} className="booking-slot">
                  {new Date(booking.startDate).toLocaleDateString()} {' '}
                  {new Date(booking.startDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {' '}
                  {new Date(booking.endDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
              ))}
              {upcomingBookings.length > 2 && (
                <small>+{upcomingBookings.length - 2} more</small>
              )}
            </div>
          )}
          
          <div className="car-actions">
            {!isAdmin() && (
              <button 
                className="btn-primary"
                onClick={() => setShowBookingModal(true)}
              >
                Book Now
              </button>
            )}
            
            {isAdmin() && (
              <>
                <button className="btn-secondary btn-sm" onClick={onEdit}>
                  Edit
                </button>
                <button className="btn-danger btn-sm" onClick={onDelete}>
                  Delete
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {showBookingModal && (
        <BookingModal
          car={car}
          existingBookings={bookings.filter(b => b.carId === car.id && b.status === 'active')}
          onClose={() => setShowBookingModal(false)}
        />
      )}
    </>
  );
};

export default CarCard;
