import React, { useState, useEffect } from 'react';
import api, { getErrorMessage } from '../api';
import Table from '../components/Table';
import Form from '../components/Form';
import { useAuth } from '../context/AuthContext';

const Discounts = () => {
  const { role } = useAuth();
  const isAdmin = role === 'admin';

  const [discounts, setDiscounts] = useState([]);
  const [editingDiscount, setEditingDiscount] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');

  // Validation tester state
  const [testCode, setTestCode] = useState('');
  const [testSubtotal, setTestSubtotal] = useState(10000);
  const [testQuantity, setTestQuantity] = useState(1);
  const [validationResult, setValidationResult] = useState(null);

  const fetchDiscounts = async () => {
    try {
      setError('');
      const res = await api.get('/discounts');
      setDiscounts(res.data.discounts || []);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const handleToggleActive = async (discount) => {
    try {
      setError('');
      await api.patch(`/discounts/${discount.id}/active`, {
        is_active: discount.is_active ? 0 : 1
      });
      fetchDiscounts();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleFormSubmit = async (values) => {
    try {
      setFormError('');
      const payload = {
        ...values,
        code: values.code?.toUpperCase(),
        value: Number(values.value),
        min_amount: Number(values.min_amount || 0),
        min_quantity: Number(values.min_quantity || 0),
        usage_limit: values.usage_limit ? Number(values.usage_limit) : null,
        product_id: values.product_id ? Number(values.product_id) : null
      };
      if (editingDiscount) {
        await api.put(`/discounts/${editingDiscount.id}`, payload);
      } else {
        await api.post('/discounts', payload);
      }
      setIsModalOpen(false);
      fetchDiscounts();
    } catch (err) {
      setFormError(getErrorMessage(err));
    }
  };

  const handleTestValidate = async (e) => {
    e.preventDefault();
    try {
      setValidationResult(null);
      const res = await api.post('/discounts/validate', {
        code: testCode,
        subtotal: Number(testSubtotal),
        quantity: Number(testQuantity)
      });
      setValidationResult(res.data);
    } catch (err) {
      setValidationResult({ valid: false, reason: getErrorMessage(err) });
    }
  };

  const formFields = [
    { name: 'code', label: 'Discount Code (e.g. SAVE20)', type: 'text', required: true },
    {
      name: 'type',
      label: 'Discount Type',
      type: 'select',
      required: true,
      options: [
        { value: 'percentage', label: 'Percentage (%)' },
        { value: 'fixed', label: 'Fixed Amount (paise)' }
      ]
    },
    { name: 'value', label: 'Value (Percent or Paise)', type: 'number', min: 0, required: true },
    { name: 'min_amount', label: 'Minimum Subtotal (paise)', type: 'number', min: 0 },
    { name: 'min_quantity', label: 'Minimum Quantity', type: 'number', min: 0 },
    { name: 'usage_limit', label: 'Total Usage Limit (Optional)', type: 'number', min: 1 },
    { name: 'product_id', label: 'Eligible Product ID (Optional)', type: 'number' },
    { name: 'start_date', label: 'Start Date', type: 'date' },
    { name: 'end_date', label: 'End Date', type: 'date' }
  ];

  const columns = [
    { header: 'ID', key: 'id' },
    { header: 'Code', key: 'code', render: (d) => <strong>{d.code}</strong> },
    { header: 'Type', key: 'type', render: (d) => <span style={{ textTransform: 'capitalize' }}>{d.type}</span> },
    {
      header: 'Value',
      key: 'value',
      render: (d) => d.type === 'percentage' ? `${d.value}%` : `₹${(d.value / 100).toFixed(2)}`
    },
    {
      header: 'Min Amount',
      key: 'min_amount',
      render: (d) => `₹${(d.min_amount / 100).toFixed(2)}`
    },
    { header: 'Used / Limit', key: 'times_used', render: (d) => `${d.times_used} / ${d.usage_limit ?? '∞'}` },
    {
      header: 'Status',
      key: 'is_active',
      render: (d) => (
        <span className={`badge ${d.is_active ? 'badge-active' : 'badge-inactive'}`}>
          {d.is_active ? 'Active' : 'Inactive'}
        </span>
      )
    }
  ];

  return (
    <div>
      <div className="page-header">
        <h2>Discounts Management</h2>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h4 style={{ marginBottom: '0.75rem' }}>Quick Discount Validator</h4>
        <form onSubmit={handleTestValidate} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <label style={{ fontSize: '0.85rem' }}>Code</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. WELCOME10"
              value={testCode}
              onChange={(e) => setTestCode(e.target.value)}
              required
            />
          </div>
          <div>
            <label style={{ fontSize: '0.85rem' }}>Subtotal (paise)</label>
            <input
              type="number"
              className="form-control"
              value={testSubtotal}
              onChange={(e) => setTestSubtotal(e.target.value)}
              required
            />
          </div>
          <div>
            <label style={{ fontSize: '0.85rem' }}>Quantity</label>
            <input
              type="number"
              className="form-control"
              value={testQuantity}
              onChange={(e) => setTestQuantity(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Test Code
          </button>
        </form>

        {validationResult && (
          <div style={{ marginTop: '1rem' }} className={validationResult.valid ? 'success-banner' : 'error-banner'}>
            {validationResult.valid ? (
              <span>Valid! Discount Amount: ₹{(validationResult.amount / 100).toFixed(2)}</span>
            ) : (
              <span>Invalid: {validationResult.reason}</span>
            )}
          </div>
        )}
      </div>

      <Table
        columns={columns}
        data={discounts}
        onAddNew={isAdmin ? () => { setEditingDiscount(null); setFormError(''); setIsModalOpen(true); } : null}
        addNewLabel="Add Discount"
        actions={isAdmin ? (d) => (
          <>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => { setEditingDiscount(d); setFormError(''); setIsModalOpen(true); }}
            >
              Edit
            </button>
            <button
              className={`btn btn-sm ${d.is_active ? 'btn-danger' : 'btn-primary'}`}
              onClick={() => handleToggleActive(d)}
            >
              {d.is_active ? 'Deactivate' : 'Activate'}
            </button>
          </>
        ) : null}
      />

      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <Form
              title={editingDiscount ? `Edit Discount #${editingDiscount.id}` : 'Create New Discount'}
              fields={formFields}
              initialValues={editingDiscount || {
                code: '',
                type: 'percentage',
                value: '',
                min_amount: 0,
                min_quantity: 0,
                usage_limit: '',
                product_id: '',
                start_date: '',
                end_date: ''
              }}
              onSubmit={handleFormSubmit}
              onCancel={() => setIsModalOpen(false)}
              submitLabel={editingDiscount ? 'Update Discount' : 'Create Discount'}
              error={formError}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Discounts;

