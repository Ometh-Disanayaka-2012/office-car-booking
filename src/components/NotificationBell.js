// src/components/NotificationBell.js
import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot, updateDoc, doc, addDoc, orderBy, limit } from 'firebase/firestore';
import { db } from '../services/firebase';
import '../styles/NotificationBell.css';

const NotificationBell = ({ driverId }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!driverId) return;

    // Listen to driver's notifications
    const notifQuery = query(
      collection(db, 'notifications'),
      where('driverId', '==', driverId),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(notifQuery, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.read).length);

      // Show browser notification for new unread ones
      notifs.forEach(notif => {
        if (!notif.read && !notif.shown) {
          showBrowserNotification(notif);
          // Mark as shown
          updateDoc(doc(db, 'notifications', notif.id), { shown: true });
        }
      });
    });

    return () => unsubscribe();
  }, [driverId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showBrowserNotification = (notif) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notif.title, {
        body: notif.message,
        icon: '/car-icon.png',
        badge: '/car-icon.png',
        tag: notif.id
      });
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        alert('✅ Notifications enabled! You\'ll now receive trip alerts.');
      }
    }
  };

  const handleMarkAsRead = async (notifId) => {
    try {
      await updateDoc(doc(db, 'notifications', notifId), { read: true });
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unread = notifications.filter(n => !n.read);
      await Promise.all(unread.map(n =>
        updateDoc(doc(db, 'notifications', n.id), { read: true })
      ));
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_trip': return '🆕';
      case 'starting_soon': return '⏰';
      case 'trip_started': return '🔴';
      case 'trip_ended': return '✅';
      default: return '📢';
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="notification-bell-container" ref={dropdownRef}>
      <button
        className="notification-bell"
        onClick={() => setIsOpen(!isOpen)}
        title="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button
                className="mark-all-read"
                onClick={handleMarkAllAsRead}
              >
                Mark all read
              </button>
            )}
          </div>

          {Notification.permission !== 'granted' && (
            <div className="notification-permission-prompt">
              <p>Enable browser notifications for trip alerts!</p>
              <button
                className="btn-primary btn-sm"
                onClick={requestNotificationPermission}
              >
                Enable Notifications
              </button>
            </div>
          )}

          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="empty-notifications">
                <div className="empty-icon">🔕</div>
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map(notif => (
                <div
                  key={notif.id}
                  className={`notification-item ${notif.read ? 'read' : 'unread'}`}
                  onClick={() => !notif.read && handleMarkAsRead(notif.id)}
                >
                  <div className="notif-icon">
                    {getNotificationIcon(notif.type)}
                  </div>
                  <div className="notif-content">
                    <div className="notif-title">{notif.title}</div>
                    <div className="notif-message">{notif.message}</div>
                    <div className="notif-time">{formatTime(notif.createdAt)}</div>
                  </div>
                  {!notif.read && <div className="unread-dot"></div>}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
