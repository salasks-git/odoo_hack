import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { getErrorMessage } from '../api';
import { useAuth } from '../context/AuthContext';
import Form from '../components/Form';

const Login = () => {
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const fields = [
    { name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'name@example.com' },
    { name: 'password', label: 'Password', type: 'password', required: true, placeholder: '••••••••' }
  ];

  const handleSubmit = async (values) => {
    try {
      setError('');
      const res = await api.post('/auth/login', values);
      login(res.data.user, res.data.token);
      if (res.data.user.role === 'admin' || res.data.user.role === 'staff') {
        navigate('/products');
      } else {
        navigate('/profile');
      }
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Sign In</h2>
        <Form
          fields={fields}
          initialValues={{ email: '', password: '' }}
          onSubmit={handleSubmit}
          submitLabel="Sign In"
          error={error}
        />
        <div className="auth-links">
          <Link to="/register">Create an account</Link>
          <Link to="/forgot-password">Forgot password?</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;

