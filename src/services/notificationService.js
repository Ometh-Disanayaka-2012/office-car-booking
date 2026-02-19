// src/services/notificationService.js
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Send a notification to a driver
 * @param {string} driverId - Driver's document ID
 * @param {object} notification - { title, message, type, tripId }
 */
export const sendDriverNotification = async (driverId, notification) => {
  try {
    await addDoc(collection(db, 'notifications'), {
      driverId,
      title: notification.title,
      message: notification.message,
      type: notification.type, // 'new_trip', 'starting_soon', 'trip_started', 'trip_ended'
      tripId: notification.tripId || null,
      read: false,
      shown: false,
      createdAt: new Date().toISOString()
    });
    console.log('✅ Notification sent to driver:', driverId);
  } catch (err) {
    console.error('❌ Error sending notification:', err);
  }
};

/**
 * Send notification when a new trip is booked
 */
export const notifyNewTrip = async (booking, car) => {
  if (!car || !car.driverId) {
    console.log('No driver assigned to this car');
    return;
  }

  const startDate = new Date(booking.startDate);
  const formattedDate = startDate.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  await sendDriverNotification(car.driverId, {
    title: '🆕 New Trip Assigned!',
    message: `${booking.userName} booked ${car.model} for ${formattedDate}`,
    type: 'new_trip',
    tripId: booking.id
  });
};

/**
 * Send notification when trip is starting soon (1 hour before)
 */
export const notifyTripStartingSoon = async (booking, car, driver) => {
  if (!driver || !driver.id) return;

  const startDate = new Date(booking.startDate);
  const formattedTime = startDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  await sendDriverNotification(driver.id, {
    title: '⏰ Trip Starting Soon!',
    message: `Trip with ${booking.userName} starts at ${formattedTime}. Be ready!`,
    type: 'starting_soon',
    tripId: booking.id
  });
};

/**
 * Send notification when employee starts the trip
 */
export const notifyTripStarted = async (booking, car) => {
  if (!car || !car.driverId) return;

  await sendDriverNotification(car.driverId, {
    title: '🔴 Trip Started!',
    message: `${booking.userName} has started the trip. Drive safely!`,
    type: 'trip_started',
    tripId: booking.id
  });
};

/**
 * Send notification when trip ends
 */
export const notifyTripEnded = async (booking, car) => {
  if (!car || !car.driverId) return;

  const distance = booking.distanceTraveled || 'N/A';

  await sendDriverNotification(car.driverId, {
    title: '✅ Trip Completed!',
    message: `Trip with ${booking.userName} ended. Distance: ${distance} km`,
    type: 'trip_ended',
    tripId: booking.id
  });
};

/**
 * Check for trips starting in 1 hour and send notifications
 * Call this function periodically (every 10 minutes)
 */
export const checkUpcomingTrips = async () => {
  try {
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

    // Get all active bookings
    const bookingsQuery = query(
      collection(db, 'bookings'),
      where('status', '==', 'active'),
      where('tripStarted', '==', false)
    );

    const snapshot = await getDocs(bookingsQuery);
    
    for (const doc of snapshot.docs) {
      const booking = { id: doc.id, ...doc.data() };
      const startDate = new Date(booking.startDate);

      // Check if trip starts in 50-70 minutes (10 min buffer)
      const minutesUntilStart = (startDate - now) / (1000 * 60);

      if (minutesUntilStart >= 50 && minutesUntilStart <= 70) {
        // Check if we already sent notification
        const notifQuery = query(
          collection(db, 'notifications'),
          where('tripId', '==', booking.id),
          where('type', '==', 'starting_soon')
        );
        const notifSnap = await getDocs(notifQuery);

        if (notifSnap.empty) {
          // Get car info
          const carDoc = await getDocs(query(collection(db, 'cars'), where('__name__', '==', booking.carId)));
          if (!carDoc.empty) {
            const car = { id: carDoc.docs[0].id, ...carDoc.docs[0].data() };
            
            // Get driver info
            if (car.driverId) {
              const driverDoc = await getDocs(query(collection(db, 'drivers'), where('__name__', '==', car.driverId)));
              if (!driverDoc.empty) {
                const driver = { id: driverDoc.docs[0].id, ...driverDoc.docs[0].data() };
                await notifyTripStartingSoon(booking, car, driver);
              }
            }
          }
        }
      }
    }
  } catch (err) {
    console.error('Error checking upcoming trips:', err);
  }
};
