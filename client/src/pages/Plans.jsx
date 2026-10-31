import React, { useState, useEffect } from 'react';
import api, { getErrorMessage } from '../api';
import Table from '../components/Table';
import Form from '../components/Form';
import { useAuth } from '../context/AuthContext';

const Plans = () => {
  const { role } = useAuth();
  const isAdmin = role === 'admin';

  const [plans, setPlans] = useState([]);
  const [products, setProducts] = useState([]);
  const [productFilter, setProductFilter] = useState('');
  const [periodFilter, setPeriodFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [editingPlan, setEditingPlan] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');

  const fetchPlans = async () => {
    try {
      setError('');
      const params = {};
      if (productFilter) params.product_id = productFilter;
      if (periodFilter) params.billing_period = periodFilter;
      if (activeFilter !== '') params.active = activeFilter;
      const res = await api.get('/plans', { params });
      setPlans(res.data.plans || []);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products');
      setProducts(res.data.products || []);
    } catch (_) {}
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [productFilter, periodFilter, activeFilter]);

  const handleToggleActive = async (plan) => {
    try {
      setError('');
      await api.patch(`/plans/${plan.id}/active`, {
        is_active: plan.is_active ? 0 : 1
      });
      fetchPlans();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleFormSubmit = async (values) => {
    try {
      setFormError('');
      const payload = {
        ...values,
        product_id: Number(values.product_id),
        variant_id: values.variant_id ? Number(values.variant_id) : null,
        price: Number(values.price),
        min_quantity: Number(values.min_quantity || 1),
        auto_close: values.auto_close ? 1 : 0,
        closable: values.closable ? 1 : 0,
        pausable: values.pausable ? 1 : 0,
        renewable: values.renewable ? 1 : 0
      };
      if (editingPlan) {
        await api.put(`/plans/${editingPlan.id}`, payload);
      } else {
        await api.post('/plans', payload);
      }
      setIsModalOpen(false);
      fetchPlans();
    } catch (err) {
      setFormError(getErrorMessage(err));
    }
  };

  const formFields = [
    { name: 'name', label: 'Plan Name', type: 'text', required: true },
    {
      name: 'product_id',
      label: 'Product',
      type: 'select',
      required: true,
      options: products.map(p => ({ value: p.id, label: p.name }))
    },
    { name: 'variant_id', label: 'Variant ID (Optional)', type: 'number' },
    { name: 'price', label: 'Price (in paise)', type: 'number', min: 1, required: true },
    {
      name: 'billing_period',
      label: 'Billing Period',
      type: 'select',
      required: true,
      options: [
        { value: 'daily', label: 'Daily' },
        { value: 'weekly', label: 'Weekly' },
        { value: 'monthly', label: 'Monthly' },
        { value: 'quarterly', label: 'Quarterly' },
        { value: 'yearly', label: 'Yearly' }
      ]
    },
    { name: 'min_quantity', label: 'Minimum Quantity', type: 'number', min: 1, required: true },
    { name: 'start_date', label: 'Start Date', type: 'date' },
    { name: 'end_date', label: 'End Date', type: 'date' },
    { name: 'closable', label: 'Allow User Cancellation (Closable)', type: 'checkbox' },
    { name: 'pausable', label: 'Allow Subscription Pause', type: 'checkbox' },
    { name: 'renewable', label: 'Auto-Renewable', type: 'checkbox' },
    { name: 'auto_close', label: 'Auto Close on Expiry', type: 'checkbox' }
  ];

  const columns = [
    { header: 'ID', key: 'id' },
    { header: 'Name', key: 'name' },
    {
      header: 'Product',
      key: 'product_id',
      render: (p) => {
        const prod = products.find(pr => pr.id === p.product_id);
        return prod ? prod.name : `Product #${p.product_id}`;
      }
    },
    {
      header: 'Price',
      key: 'price',
      render: (p) => `₹${(p.price / 100).toFixed(2)}`
    },
    {
      header: 'Billing Period',
      key: 'billing_period',
      render: (p) => <span style={{ textTransform: 'capitalize' }}>{p.billing_period}</span>
    },
    { header: 'Min Qty', key: 'min_quantity' },
    {
      header: 'Status',
      key: 'is_active',
      render: (p) => (
        <span className={`badge ${p.is_active ? 'badge-active' : 'badge-inactive'}`}>
          {p.is_active ? 'Active' : 'Inactive'}
        </span>
      )
    }
  ];

  return (
    <div>
      <div className="page-header">
        <h2>Subscription Plans</h2>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <Table
        columns={columns}
        data={plans}
        filterComponent={
          <>
            <select
              className="form-control"
              style={{ maxWidth: '200px' }}
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
            >
              <option value="">All Products</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <select
              className="form-control"
              style={{ maxWidth: '160px' }}
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
            >
              <option value="">All Periods</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
            <select
              className="form-control"
              style={{ maxWidth: '140px' }}
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="1">Active</option>
              <option value="0">Inactive</option>
            </select>
          </>
        }
        onAddNew={isAdmin ? () => { setEditingPlan(null); setFormError(''); setIsModalOpen(true); } : null}
        addNewLabel="Add Plan"
        actions={isAdmin ? (plan) => (
          <>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => { setEditingPlan(plan); setFormError(''); setIsModalOpen(true); }}
            >
              Edit
            </button>
            <button
              className={`btn btn-sm ${plan.is_active ? 'btn-danger' : 'btn-primary'}`}
              onClick={() => handleToggleActive(plan)}
            >
              {plan.is_active ? 'Deactivate' : 'Activate'}
            </button>
          </>
        ) : null}
      />

      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <Form
              title={editingPlan ? `Edit Plan #${editingPlan.id}` : 'Create New Plan'}
              fields={formFields}
              initialValues={editingPlan || {
                name: '',
                product_id: products[0]?.id || '',
                variant_id: '',
                price: '',
                billing_period: 'monthly',
                min_quantity: 1,
                start_date: '',
                end_date: '',
                closable: 1,
                pausable: 1,
                renewable: 1,
                auto_close: 0
              }}
              onSubmit={handleFormSubmit}
              onCancel={() => setIsModalOpen(false)}
              submitLabel={editingPlan ? 'Update Plan' : 'Create Plan'}
              error={formError}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Plans;

