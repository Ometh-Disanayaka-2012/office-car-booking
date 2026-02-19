// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import DriverLogin from './components/DriverLogin';
import DriverDashboard from './components/DriverDashboard';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Cars from './components/Cars';
import Bookings from './components/Bookings';
import AllBookings from './components/AllBookings';
import Drivers from './components/Drivers';
import Employees from './components/Employees';
import './App.css';

// Protected Route wrapper
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { currentUser, isAdmin } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin()) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function AppRoutes() {
  const { currentUser } = useAuth();

  return (
    <Routes>
      {/* Employee/Admin Login */}
      <Route 
        path="/login" 
        element={currentUser ? <Navigate to="/dashboard" replace /> : <Login />} 
      />

      {/* Driver Login */}
      <Route path="/driver/login" element={<DriverLogin />} />

      {/* Driver Dashboard (no auth check, uses localStorage) */}
      <Route path="/driver/dashboard" element={<DriverDashboard />} />
      
      {/* Employee/Admin Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="cars" element={<Cars />} />
        <Route path="bookings" element={<Bookings />} />
        <Route
          path="all-bookings"
          element={
            <ProtectedRoute adminOnly>
              <AllBookings />
            </ProtectedRoute>
          }
        />
        <Route
          path="drivers"
          element={
            <ProtectedRoute adminOnly>
              <Drivers />
            </ProtectedRoute>
          }
        />
        <Route
          path="employees"
          element={
            <ProtectedRoute adminOnly>
              <Employees />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
