import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile';
import Users from './pages/Users';
import Products from './pages/Products';
import Plans from './pages/Plans';
import Discounts from './pages/Discounts';

const HomeRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin' || user.role === 'staff') return <Navigate to="/products" replace />;
  return <Navigate to="/profile" replace />;
};

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Protected Routes wrapped in Layout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<HomeRedirect />} />
              <Route path="/profile" element={<Profile />} />

              {/* Admin Only Routes */}
              <Route element={<ProtectedRoute roles={['admin']} />}>
                <Route path="/users" element={<Users />} />
              </Route>

              {/* Admin & Staff Routes */}
              <Route element={<ProtectedRoute roles={['admin', 'staff']} />}>
                <Route path="/products" element={<Products />} />
                <Route path="/plans" element={<Plans />} />
                <Route path="/discounts" element={<Discounts />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;

