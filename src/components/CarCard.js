// src/components/CarCard.js
import React, { useState } from 'react';
import BookingModal from './BookingModal';
import { useAuth } from '../contexts/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

const CarCard = ({ car, driver, inUse, bookings, onEdit, onDelete }) => {
  const { isAdmin } = useAuth();
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [toggling, setToggling] = useState(false);

  // car.available === false means admin marked it unavailable today
  const isUnavailableToday = car.available === false;

  const upcomingBookings = bookings
    .filter(b => b.carId === car.id && b.status === 'active')
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

  const handleToggleAvailability = async () => {
    if (toggling) return;
    const makingUnavailable = car.available !== false;
    const msg = makingUnavailable
      ? `Mark "${car.model}" as UNAVAILABLE today?\n\nEmployees won't be able to book it for today, but future dates will still work.`
      : `Mark "${car.model}" as AVAILABLE again?`;

    if (!window.confirm(msg)) return;

    setToggling(true);
    try {
      await updateDoc(doc(db, 'cars', car.id), {
        available: !makingUnavailable,
        unavailableDate: makingUnavailable ? new Date().toDateString() : null
      });
    } catch (err) {
      console.error('Error toggling availability:', err);
      alert('Failed to update availability. Please try again.');
    } finally {
      setToggling(false);
    }
  };

  const getStatus = () => {
    if (isUnavailableToday) return { label: '🚫 Unavailable Today', cls: 'unavailable' };
    if (inUse)              return { label: '🔴 In Use',            cls: 'in-use'      };
    return                         { label: '🟢 Available',         cls: 'available'   };
  };

  const { label, cls } = getStatus();

  return (
    <>
      <div className={`car-card ${isUnavailableToday ? 'car-card--unavailable' : ''}`}>
        <div className={`car-status ${cls}`}>{label}</div>

        <div className="car-image" style={{ opacity: isUnavailableToday ? 0.4 : 1 }}>🚗</div>

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

          {isUnavailableToday && (
            <div className="unavailable-banner">
              🚫 Unavailable for today — future dates can still be booked
            </div>
          )}

          {upcomingBookings.length > 0 && (
            <div className="upcoming-bookings">
              <strong>Upcoming:</strong>
              {upcomingBookings.slice(0, 2).map(booking => (
                <div key={booking.id} className="booking-slot">
                  {new Date(booking.startDate).toLocaleDateString()}{' '}
                  {new Date(booking.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} –{' '}
                  {new Date(booking.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              ))}
              {upcomingBookings.length > 2 && (
                <small>+{upcomingBookings.length - 2} more</small>
              )}
            </div>
          )}

          <div className="car-actions">
            {!isAdmin() && (
              <button className="btn-primary" onClick={() => setShowBookingModal(true)}>
                {isUnavailableToday ? '📅 Book Future Date' : 'Book Now'}
              </button>
            )}

            {isAdmin() && (
              <>
                <button
                  className={`btn-toggle ${isUnavailableToday ? 'btn-toggle--off' : 'btn-toggle--on'}`}
                  onClick={handleToggleAvailability}
                  disabled={toggling}
                >
                  {toggling ? '...' : isUnavailableToday ? '✅ Mark Available' : '🚫 Mark Unavailable'}
                </button>
                <button className="btn-primary btn-sm" onClick={() => setShowBookingModal(true)}>Book</button>
                <button className="btn-secondary btn-sm" onClick={onEdit}>Edit</button>
                <button className="btn-danger btn-sm" onClick={onDelete}>Delete</button>
              </>
            )}
          </div>
        </div>
      </div>

      {showBookingModal && (
        <BookingModal
          car={car}
          isUnavailableToday={isUnavailableToday}
          existingBookings={bookings.filter(b => b.carId === car.id && b.status === 'active')}
          onClose={() => setShowBookingModal(false)}
        />
      )}
    </>
  );
};

export default CarCard;
