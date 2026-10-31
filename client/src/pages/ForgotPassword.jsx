import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getErrorMessage } from '../api';
import Form from '../components/Form';

const ForgotPassword = () => {
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const fields = [
    { name: 'email', label: 'Email Address', type: 'email', required: true, placeholder: 'name@example.com' }
  ];

  const handleSubmit = async (values) => {
    try {
      setError('');
      setMessage('');
      const res = await api.post('/auth/forgot-password', values);
      setMessage(res.data.message || 'If that email exists, a password reset link has been generated.');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Forgot Password</h2>
        {message && <div className="success-banner">{message}</div>}
        <Form
          fields={fields}
          initialValues={{ email: '' }}
          onSubmit={handleSubmit}
          submitLabel="Send Reset Link"
          error={error}
        />
        <div className="auth-links" style={{ justifyContent: 'center' }}>
          <Link to="/login">Back to Sign In</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

