// src/services/firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Firebase configuration
// REPLACE WITH YOUR FIREBASE CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyApyxCKluAzfYcp7rK1VtE6eo5c4wDwJ20",
  authDomain: "office-car-booking-9f3bc.firebaseapp.com",
  projectId: "office-car-booking-9f3bc",
  storageBucket: "office-car-booking-9f3bc.firebasestorage.app",
  messagingSenderId: "409968965266",
  appId: "1:409968965266:web:6ee397bfc6355cbd6d984b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;
