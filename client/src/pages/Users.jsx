import React, { useState, useEffect } from 'react';
import api, { getErrorMessage } from '../api';
import Table from '../components/Table';
import Form from '../components/Form';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');

  const fetchUsers = async () => {
    try {
      setError('');
      const params = {};
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      const res = await api.get('/users', { params });
      setUsers(res.data.users || []);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter]);

  const handleToggleActive = async (user) => {
    try {
      setError('');
      await api.patch(`/users/${user.id}/active`, {
        is_active: user.is_active ? 0 : 1
      });
      fetchUsers();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (values) => {
    try {
      setFormError('');
      if (editingUser) {
        await api.put(`/users/${editingUser.id}`, values);
      } else {
        await api.post('/users', values);
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (err) {
      setFormError(getErrorMessage(err));
    }
  };

  const formFields = [
    { name: 'name', label: 'Name', type: 'text', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true },
    {
      name: 'role',
      label: 'Role',
      type: 'select',
      required: true,
      options: [
        { value: 'admin', label: 'Admin' },
        { value: 'staff', label: 'Staff' },
        { value: 'customer', label: 'Customer' }
      ]
    },
    {
      name: 'password',
      label: editingUser ? 'New Password (leave blank to keep unchanged)' : 'Password',
      type: 'password',
      required: !editingUser
    }
  ];

  const columns = [
    { header: 'ID', key: 'id' },
    { header: 'Name', key: 'name' },
    { header: 'Email', key: 'email' },
    {
      header: 'Role',
      key: 'role',
      render: (u) => <span style={{ textTransform: 'capitalize' }}>{u.role}</span>
    },
    {
      header: 'Status',
      key: 'is_active',
      render: (u) => (
        <span className={`badge ${u.is_active ? 'badge-active' : 'badge-inactive'}`}>
          {u.is_active ? 'Active' : 'Inactive'}
        </span>
      )
    }
  ];

  return (
    <div>
      <div className="page-header">
        <h2>Users Management</h2>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <Table
        columns={columns}
        data={users}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name or email..."
        filterComponent={
          <select
            className="form-control"
            style={{ maxWidth: '180px' }}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="staff">Staff</option>
            <option value="customer">Customer</option>
          </select>
        }
        onAddNew={handleOpenCreate}
        addNewLabel="Add User"
        actions={(user) => (
          <>
            <button className="btn btn-secondary btn-sm" onClick={() => handleOpenEdit(user)}>
              Edit
            </button>
            <button
              className={`btn btn-sm ${user.is_active ? 'btn-danger' : 'btn-primary'}`}
              onClick={() => handleToggleActive(user)}
            >
              {user.is_active ? 'Deactivate' : 'Activate'}
            </button>
          </>
        )}
      />

      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <Form
              title={editingUser ? `Edit User #${editingUser.id}` : 'Create New User'}
              fields={formFields}
              initialValues={editingUser || { name: '', email: '', role: 'customer', password: '' }}
              onSubmit={handleFormSubmit}
              onCancel={() => setIsModalOpen(false)}
              submitLabel={editingUser ? 'Update User' : 'Create User'}
              error={formError}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;

