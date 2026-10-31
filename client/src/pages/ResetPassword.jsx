import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api, { getErrorMessage } from '../api';
import Form from '../components/Form';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || '';
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const fields = [
    { name: 'token', label: 'Reset Token', type: 'text', required: true, placeholder: 'Enter reset token' },
    { name: 'password', label: 'New Password (min 9 chars, upper, lower, special)', type: 'password', required: true, placeholder: '••••••••' }
  ];

  const handleSubmit = async (values) => {
    try {
      setError('');
      setMessage('');
      const res = await api.post('/auth/reset-password', values);
      setMessage(res.data.message || 'Password reset successful. You can now log in.');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Reset Password</h2>
        {message && <div className="success-banner">{message}</div>}
        <Form
          fields={fields}
          initialValues={{ token: tokenFromUrl, password: '' }}
          onSubmit={handleSubmit}
          submitLabel="Reset Password"
          error={error}
        />
        <div className="auth-links" style={{ justifyContent: 'center' }}>
          <Link to="/login">Back to Sign In</Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;

