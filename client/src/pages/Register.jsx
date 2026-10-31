import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { getErrorMessage } from '../api';
import { useAuth } from '../context/AuthContext';
import Form from '../components/Form';

const Register = () => {
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const fields = [
    { name: 'name', label: 'Full Name', type: 'text', required: true, placeholder: 'John Doe' },
    { name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'name@example.com' },
    { name: 'password', label: 'Password (min 9 chars, upper, lower, special)', type: 'password', required: true, placeholder: '••••••••' }
  ];

  const handleSubmit = async (values) => {
    try {
      setError('');
      const res = await api.post('/auth/register', values);
      login(res.data.user, res.data.token);
      navigate('/profile');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Register</h2>
        <Form
          fields={fields}
          initialValues={{ name: '', email: '', password: '' }}
          onSubmit={handleSubmit}
          submitLabel="Create Account"
          error={error}
        />
        <div className="auth-links" style={{ justifyContent: 'center' }}>
          <span>Already have an account? <Link to="/login">Sign In</Link></span>
        </div>
      </div>
    </div>
  );
};

export default Register;

