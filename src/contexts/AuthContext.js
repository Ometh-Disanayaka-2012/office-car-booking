// src/contexts/AuthContext.js

import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../services/firebase';
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import {
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // 🔍 Find employee by email
          const q = query(
            collection(db, "employees"),
            where("email", "==", user.email)
          );

          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            const employeeData = querySnapshot.docs[0].data();

            setUserProfile({
              ...employeeData,
              email: user.email
            });
          } else {
            // If employee not found
            setUserProfile({
              email: user.email,
              name: "Unknown User",
              role: "employee"
            });
          }

        } catch (error) {
          console.error('Error fetching employee profile:', error);
        }

        setCurrentUser(user);
      } else {
        setCurrentUser(null);
        setUserProfile(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result;
    } catch (error) {
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      throw error;
    }
  };

  const isAdmin = () => {
    return userProfile?.role === 'admin';
  };

  const value = {
    currentUser,
    userProfile,
    signIn,
    signOut,
    isAdmin,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
