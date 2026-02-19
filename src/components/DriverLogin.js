// src/components/DriverLogin.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import '../styles/Login.css';

const DriverLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Check if driver exists with this email
      const driversQuery = query(
        collection(db, 'drivers'),
        where('email', '==', formData.email.toLowerCase())
      );
      const snapshot = await getDocs(driversQuery);

      if (snapshot.empty) {
        setError('Invalid email or password');
        setLoading(false);
        return;
      }

      const driverDoc = snapshot.docs[0];
      const driverData = driverDoc.data();

      // Simple password check (in production, use proper auth!)
      // For now: password is driver's license number or phone last 4 digits
      const expectedPassword = driverData.phone?.slice(-4) || driverData.license?.slice(-4) || 'driver123';
      
      if (formData.password !== expectedPassword) {
        setError('Invalid email or password');
        setLoading(false);
        return;
      }

      // Store driver session
      const driverSession = {
        id: driverDoc.id,
        ...driverData,
        role: 'driver',
        loginTime: new Date().toISOString()
      };

      localStorage.setItem('driverSession', JSON.stringify(driverSession));
      navigate('/driver/dashboard');

    } catch (err) {
      console.error('Login error:', err);
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>🚗 Driver Portal</h1>
          <p>Log in to view your trips</p>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="driver@company.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Last 4 digits of your phone"
              required
            />
            <small className="form-hint">
              Use the last 4 digits of your phone number
            </small>
          </div>

          <button
            type="submit"
            className="btn-primary btn-block"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login as Driver'}
          </button>
        </form>

        <div className="login-footer">
          <a href="/login">← Back to Employee Login</a>
        </div>

        <div className="demo-credentials">
          <strong>Demo Driver Login:</strong><br />
          Email: Any driver email from Drivers page<br />
          Password: Last 4 digits of their phone
        </div>
      </div>
    </div>
  );
};

export default DriverLogin;
