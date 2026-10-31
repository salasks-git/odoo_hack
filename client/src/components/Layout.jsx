import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Layout = () => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          Subscription Hub
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/profile" className={({ isActive }) => (isActive ? 'active' : '')}>
            Profile
          </NavLink>
          {role === 'admin' && (
            <NavLink to="/users" className={({ isActive }) => (isActive ? 'active' : '')}>
              Users
            </NavLink>
          )}
          {(role === 'admin' || role === 'staff') && (
            <>
              <NavLink to="/products" className={({ isActive }) => (isActive ? 'active' : '')}>
                Products & Variants
              </NavLink>
              <NavLink to="/plans" className={({ isActive }) => (isActive ? 'active' : '')}>
                Plans
              </NavLink>
              <NavLink to="/discounts" className={({ isActive }) => (isActive ? 'active' : '')}>
                Discounts
              </NavLink>
            </>
          )}
        </nav>
        <div className="sidebar-footer">
          <div style={{ marginBottom: '0.8rem', fontSize: '0.85rem', color: '#94a3b8' }}>
            <div><strong>{user?.name}</strong></div>
            <div style={{ textTransform: 'capitalize' }}>Role: {role}</div>
          </div>
          <button onClick={handleLogout} className="btn btn-secondary btn-sm" style={{ width: '100%' }}>
            Sign Out
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

