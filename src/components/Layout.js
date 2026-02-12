// src/components/Layout.js
import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Layout.css';

const Layout = () => {
  const { userProfile, signOut, isAdmin } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="logo">
          <h1>🚗 Office Fleet</h1>
          <p>Car Booking System</p>
        </div>

        <nav className="nav-menu">
          <NavLink to="/dashboard" className="nav-item">
            <span className="nav-icon">📊</span>
            <span>Dashboard</span>
          </NavLink>

          <NavLink to="/cars" className="nav-item">
            <span className="nav-icon">🚗</span>
            <span>Cars</span>
          </NavLink>

          <NavLink to="/bookings" className="nav-item">
            <span className="nav-icon">📅</span>
            <span>My Bookings</span>
          </NavLink>

          {isAdmin() && (
            <>
              <NavLink to="/all-bookings" className="nav-item">
                <span className="nav-icon">📋</span>
                <span>All Bookings</span>
              </NavLink>

              <NavLink to="/drivers" className="nav-item">
                <span className="nav-icon">👨‍✈️</span>
                <span>Drivers</span>
              </NavLink>

              <NavLink to="/employees" className="nav-item">
                <span className="nav-icon">👥</span>
                <span>Employees</span>
              </NavLink>
            </>
          )}
        </nav>

        <div className="user-info">
          <div className="user-avatar">
            {userProfile?.name?.charAt(0) || '?'}
          </div>
          <div className="user-details">
            <div className="user-name">
              {userProfile?.name || 'User'}
            </div>
            <div className="user-email">
              {userProfile?.email || ''}
            </div>
            <div className="user-role">
              {isAdmin() ? '👑 Administrator' : '👤 Employee'}
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
