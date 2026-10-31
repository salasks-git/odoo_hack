import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api, { getErrorMessage } from '../api';
import Form from '../components/Form';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fields = [
    { name: 'name', label: 'Name', type: 'text', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true }
  ];

  const handleSubmit = async (values) => {
    try {
      setError('');
      setSuccess('');
      const res = await api.put('/auth/me', values);
      updateUser(res.data.user);
      setSuccess('Profile updated successfully');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>My Profile</h2>
      </div>

      {success && <div className="success-banner">{success}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        <div className="card">
          <Form
            title="Update Details"
            fields={fields}
            initialValues={{ name: user?.name || '', email: user?.email || '' }}
            onSubmit={handleSubmit}
            submitLabel="Save Changes"
            error={error}
          />
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '1.25rem' }}>Account Information</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.95rem' }}>
            <div><strong>User ID:</strong> #{user?.id}</div>
            <div><strong>Role:</strong> <span style={{ textTransform: 'capitalize' }}>{user?.role}</span></div>
            <div>
              <strong>Status:</strong>{' '}
              <span className={`badge ${user?.is_active ? 'badge-active' : 'badge-inactive'}`}>
                {user?.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            {user?.created_at && (
              <div><strong>Member Since:</strong> {new Date(user.created_at).toLocaleDateString()}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

