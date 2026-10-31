import React, { useState, useEffect } from 'react';

const Form = ({
  title,
  fields = [],
  initialValues = {},
  onSubmit,
  onCancel,
  submitLabel = 'Save',
  error,
  extraContent
}) => {
  const [formData, setFormData] = useState(initialValues);

  useEffect(() => {
    setFormData(initialValues);
  }, [initialValues]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (checked ? 1 : 0) : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      {title && <h3 style={{ marginBottom: '1.25rem' }}>{title}</h3>}
      {error && <div className="error-banner">{error}</div>}

      {fields.map((field) => (
        <div className="form-group" key={field.name}>
          {field.type !== 'checkbox' && (
            <label htmlFor={field.name}>
              {field.label} {field.required && <span style={{ color: '#ef4444' }}>*</span>}
            </label>
          )}

          {field.type === 'select' ? (
            <select
              id={field.name}
              name={field.name}
              className="form-control"
              value={formData[field.name] !== undefined ? formData[field.name] : ''}
              onChange={handleChange}
              required={field.required}
            >
              <option value="">{field.placeholder || '-- Select --'}</option>
              {field.options?.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : field.type === 'textarea' ? (
            <textarea
              id={field.name}
              name={field.name}
              className="form-control"
              rows={field.rows || 3}
              value={formData[field.name] || ''}
              onChange={handleChange}
              placeholder={field.placeholder}
              required={field.required}
            />
          ) : field.type === 'checkbox' ? (
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                id={field.name}
                name={field.name}
                checked={!!formData[field.name]}
                onChange={handleChange}
              />
              {field.label}
            </label>
          ) : (
            <input
              type={field.type || 'text'}
              id={field.name}
              name={field.name}
              className="form-control"
              value={formData[field.name] !== undefined ? formData[field.name] : ''}
              onChange={handleChange}
              placeholder={field.placeholder}
              step={field.step}
              min={field.min}
              required={field.required}
            />
          )}
        </div>
      ))}

      {extraContent}

      <div className="form-actions">
        <button type="submit" className="btn btn-primary">
          {submitLabel}
        </button>
        {onCancel && (
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

export default Form;

