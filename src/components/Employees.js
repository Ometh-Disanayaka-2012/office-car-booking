// src/components/Employees.js
import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../services/firebase';
import EmployeeModal from './EmployeeModal';
import '../styles/Employees.css';

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);

  useEffect(() => {
    // Listen to employees
    const employeesQuery = query(collection(db, 'employees'));
    const unsubscribeEmployees = onSnapshot(employeesQuery, (snapshot) => {
      const employeesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Sort by name
      employeesData.sort((a, b) => a.name.localeCompare(b.name));
      setEmployees(employeesData);
    }, (error) => {
      console.error('Error fetching employees:', error);
      setEmployees([]);
    });

    return () => {
      unsubscribeEmployees();
    };
  }, []);

  const handleAddEmployee = () => {
    setEditingEmployee(null);
    setShowModal(true);
  };

  const handleEditEmployee = (employee) => {
    setEditingEmployee(employee);
    setShowModal(true);
  };

  const handleDeleteEmployee = async (employeeId) => {
    if (!window.confirm('Are you sure you want to delete this employee? This will not affect their user account.')) return;

    try {
      await deleteDoc(doc(db, 'employees', employeeId));
    } catch (error) {
      console.error('Error deleting employee:', error);
      alert('Failed to delete employee. Please try again.');
    }
  };

  const handleSaveEmployee = async (employeeData) => {
    try {
      if (editingEmployee) {
        await updateDoc(doc(db, 'employees', editingEmployee.id), employeeData);
      } else {
        await addDoc(collection(db, 'employees'), {
          ...employeeData,
          createdAt: new Date().toISOString()
        });
      }
      setShowModal(false);
    } catch (error) {
      console.error('Error saving employee:', error);
      alert('Failed to save employee. Please try again.');
    }
  };

  const getRoleBadge = (role) => {
    const badges = {
      admin: { color: '#DC2626', icon: '👑', label: 'Admin' },
      employee: { color: '#2563EB', icon: '👤', label: 'Employee' },
      manager: { color: '#7C3AED', icon: '📊', label: 'Manager' }
    };
    const badge = badges[role] || badges.employee;
    return (
      <span 
        className="role-badge" 
        style={{ backgroundColor: `${badge.color}20`, color: badge.color }}
      >
        {badge.icon} {badge.label}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    return status === 'active' ? (
      <span className="status-badge active">✓ Active</span>
    ) : (
      <span className="status-badge inactive">⏸ Inactive</span>
    );
  };

  return (
    <div className="employees-page">
      <div className="page-header">
        <div>
          <h2>Employees</h2>
          <p>Manage employee profiles and information</p>
        </div>
        <button className="btn-primary" onClick={handleAddEmployee}>
          + Add Employee
        </button>
      </div>

      <div className="employees-grid">
        {employees.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <h3>No employees yet</h3>
            <p>Add your first employee to get started</p>
            <button className="btn-primary" onClick={handleAddEmployee}>
              + Add Employee
            </button>
          </div>
        ) : (
          employees.map(employee => (
            <div key={employee.id} className="employee-card">
              <div className="employee-header">
                <div className="employee-avatar-large">
                  {employee.name?.charAt(0).toUpperCase() || '?'}
                </div>
                <div className="employee-status-indicators">
                  {getRoleBadge(employee.role)}
                  {getStatusBadge(employee.status)}
                </div>
              </div>

              <div className="employee-info-section">
                <h3 className="employee-name">{employee.name}</h3>
                
                <div className="employee-details">
                  <div className="detail-row">
                    <span className="detail-icon">📧</span>
                    <span className="detail-text">{employee.email}</span>
                  </div>
                  
                  {employee.phone && (
                    <div className="detail-row">
                      <span className="detail-icon">📞</span>
                      <span className="detail-text">{employee.phone}</span>
                    </div>
                  )}
                  
                  {employee.department && (
                    <div className="detail-row">
                      <span className="detail-icon">🏢</span>
                      <span className="detail-text">{employee.department}</span>
                    </div>
                  )}
                  
                  {employee.position && (
                    <div className="detail-row">
                      <span className="detail-icon">💼</span>
                      <span className="detail-text">{employee.position}</span>
                    </div>
                  )}
                  
                  {employee.employeeId && (
                    <div className="detail-row">
                      <span className="detail-icon">🆔</span>
                      <span className="detail-text">ID: {employee.employeeId}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="employee-actions">
                <button 
                  className="btn-secondary btn-sm" 
                  onClick={() => handleEditEmployee(employee)}
                >
                  Edit
                </button>
                <button 
                  className="btn-danger btn-sm" 
                  onClick={() => handleDeleteEmployee(employee.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <EmployeeModal
          employee={editingEmployee}
          onClose={() => setShowModal(false)}
          onSave={handleSaveEmployee}
        />
      )}
    </div>
  );
};

export default Employees;
