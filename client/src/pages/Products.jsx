import React, { useState, useEffect } from 'react';
import api, { getErrorMessage } from '../api';
import Table from '../components/Table';
import Form from '../components/Form';
import { useAuth } from '../context/AuthContext';

const Products = () => {
  const { role } = useAuth();
  const isAdmin = role === 'admin';

  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');

  // Variants management modal state
  const [selectedProductForVariants, setSelectedProductForVariants] = useState(null);
  const [productVariants, setProductVariants] = useState([]);
  const [editingVariant, setEditingVariant] = useState(null);
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [variantError, setVariantError] = useState('');

  const fetchProducts = async () => {
    try {
      setError('');
      const params = {};
      if (search) params.search = search;
      if (categoryFilter) params.category = categoryFilter;
      if (activeFilter !== '') params.active = activeFilter;
      const res = await api.get('/products', { params });
      setProducts(res.data.products || []);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search, categoryFilter, activeFilter]);

  const handleToggleProductActive = async (prod) => {
    try {
      setError('');
      await api.patch(`/products/${prod.id}/active`, {
        is_active: prod.is_active ? 0 : 1
      });
      fetchProducts();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleProductSubmit = async (values) => {
    try {
      setFormError('');
      const payload = {
        ...values,
        sales_price: Number(values.sales_price),
        cost_price: Number(values.cost_price)
      };
      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, payload);
      } else {
        await api.post('/products', payload);
      }
      setIsProductModalOpen(false);
      fetchProducts();
    } catch (err) {
      setFormError(getErrorMessage(err));
    }
  };

  const fetchVariants = async (productId) => {
    try {
      setVariantError('');
      const res = await api.get('/plans', { params: { product_id: productId } });
      const planList = res.data.plans || [];
      const vIds = [...new Set(planList.map(p => p.variant_id).filter(Boolean))];
      const fetched = [];
      for (const id of vIds) {
        try {
          const vRes = await api.get(`/variants/${id}`);
          if (vRes.data.variant) fetched.push(vRes.data.variant);
        } catch (_) {}
      }
      setProductVariants(fetched);
    } catch (err) {
      setVariantError(getErrorMessage(err));
    }
  };

  const handleOpenVariants = (product) => {
    setSelectedProductForVariants(product);
    setIsVariantModalOpen(true);
    setProductVariants([]);
    fetchVariants(product.id);
  };

  const handleVariantSubmit = async (values) => {
    try {
      setVariantError('');
      const payload = {
        ...values,
        extra_price: Number(values.extra_price || 0)
      };
      if (editingVariant) {
        await api.put(`/variants/${editingVariant.id}`, payload);
      } else {
        await api.post(`/variants/product/${selectedProductForVariants.id}`, payload);
      }
      setEditingVariant(null);
      fetchVariants(selectedProductForVariants.id);
    } catch (err) {
      setVariantError(getErrorMessage(err));
    }
  };

  const handleToggleVariantActive = async (variant) => {
    try {
      setVariantError('');
      await api.patch(`/variants/${variant.id}/active`, {
        is_active: variant.is_active ? 0 : 1
      });
      fetchVariants(selectedProductForVariants.id);
    } catch (err) {
      setVariantError(getErrorMessage(err));
    }
  };

  const productFields = [
    { name: 'name', label: 'Product Name', type: 'text', required: true },
    { name: 'type', label: 'Type', type: 'text', placeholder: 'e.g. service, digital, physical' },
    { name: 'category', label: 'Category', type: 'text', placeholder: 'e.g. hosting, software' },
    { name: 'sales_price', label: 'Sales Price (in paise)', type: 'number', min: 1, required: true },
    { name: 'cost_price', label: 'Cost Price (in paise)', type: 'number', min: 1, required: true },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'notes', label: 'Internal Notes', type: 'textarea' }
  ];

  const variantFields = [
    { name: 'name', label: 'Variant Name', type: 'text', required: true },
    { name: 'extra_price', label: 'Extra Price (in paise)', type: 'number', min: 0, required: true },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'specs', label: 'Specifications (JSON/Text)', type: 'textarea' }
  ];

  const columns = [
    { header: 'ID', key: 'id' },
    { header: 'Name', key: 'name' },
    { header: 'Category', key: 'category' },
    {
      header: 'Sales Price',
      key: 'sales_price',
      render: (p) => `₹${(p.sales_price / 100).toFixed(2)}`
    },
    {
      header: 'Cost Price',
      key: 'cost_price',
      render: (p) => `₹${(p.cost_price / 100).toFixed(2)}`
    },
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
        <h2>Products & Variants</h2>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <Table
        columns={columns}
        data={products}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search products..."
        filterComponent={
          <>
            <input
              type="text"
              className="form-control"
              style={{ maxWidth: '160px' }}
              placeholder="Filter Category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            />
            <select
              className="form-control"
              style={{ maxWidth: '150px' }}
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="1">Active</option>
              <option value="0">Inactive</option>
            </select>
          </>
        }
        onAddNew={isAdmin ? () => { setEditingProduct(null); setFormError(''); setIsProductModalOpen(true); } : null}
        addNewLabel="Add Product"
        actions={(prod) => (
          <>
            <button className="btn btn-secondary btn-sm" onClick={() => handleOpenVariants(prod)}>
              Variants
            </button>
            {isAdmin && (
              <>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => { setEditingProduct(prod); setFormError(''); setIsProductModalOpen(true); }}
                >
                  Edit
                </button>
                <button
                  className={`btn btn-sm ${prod.is_active ? 'btn-danger' : 'btn-primary'}`}
                  onClick={() => handleToggleProductActive(prod)}
                >
                  {prod.is_active ? 'Deactivate' : 'Activate'}
                </button>
              </>
            )}
          </>
        )}
      />

      {isProductModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <Form
              title={editingProduct ? `Edit Product #${editingProduct.id}` : 'Create New Product'}
              fields={productFields}
              initialValues={editingProduct || { name: '', type: '', category: '', sales_price: '', cost_price: '', description: '', notes: '' }}
              onSubmit={handleProductSubmit}
              onCancel={() => setIsProductModalOpen(false)}
              submitLabel={editingProduct ? 'Update Product' : 'Create Product'}
              error={formError}
            />
          </div>
        </div>
      )}

      {isVariantModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '750px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3>Variants for {selectedProductForVariants?.name}</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setIsVariantModalOpen(false)}>
                Close
              </button>
            </div>

            {variantError && <div className="error-banner">{variantError}</div>}

            {isAdmin && (
              <div style={{ marginBottom: '1.5rem', border: '1px solid #e2e8f0', padding: '1rem', borderRadius: '6px' }}>
                <Form
                  title={editingVariant ? `Edit Variant #${editingVariant.id}` : 'Add New Variant'}
                  fields={variantFields}
                  initialValues={editingVariant || { name: '', extra_price: 0, description: '', specs: '' }}
                  onSubmit={handleVariantSubmit}
                  onCancel={editingVariant ? () => setEditingVariant(null) : null}
                  submitLabel={editingVariant ? 'Update Variant' : 'Add Variant'}
                />
              </div>
            )}

            <Table
              columns={[
                { header: 'ID', key: 'id' },
                { header: 'Name', key: 'name' },
                {
                  header: 'Extra Price',
                  key: 'extra_price',
                  render: (v) => `+₹${(v.extra_price / 100).toFixed(2)}`
                },
                {
                  header: 'Status',
                  key: 'is_active',
                  render: (v) => (
                    <span className={`badge ${v.is_active ? 'badge-active' : 'badge-inactive'}`}>
                      {v.is_active ? 'Active' : 'Inactive'}
                    </span>
                  )
                }
              ]}
              data={productVariants}
              actions={isAdmin ? (variant) => (
                <>
                  <button className="btn btn-secondary btn-sm" onClick={() => setEditingVariant(variant)}>
                    Edit
                  </button>
                  <button
                    className={`btn btn-sm ${variant.is_active ? 'btn-danger' : 'btn-primary'}`}
                    onClick={() => handleToggleVariantActive(variant)}
                  >
                    {variant.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                </>
              ) : null}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;

