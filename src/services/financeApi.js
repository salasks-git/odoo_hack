// Central API client for Member 3 Finance module
const BASE_URL = '/api';

async function fetchJson(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || `HTTP ${response.status}: Failed to execute request`);
  }
  return data;
}

export const financeApi = {
  // Dashboard & Analytics
  async getDashboard() {
    const res = await fetchJson('/finance/dashboard');
    return res.data;
  },

  async getRevenue(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetchJson(`/finance/revenue?${query}`);
    return res.data;
  },

  async getReports(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetchJson(`/finance/reports?${query}`);
    return res.data;
  },

  // Payments
  async getPayments(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetchJson(`/payments?${query}`);
    return res;
  },

  async getPayment(id) {
    const res = await fetchJson(`/payments/${id}`);
    return res.data;
  },

  async createPayment(paymentData) {
    const res = await fetchJson('/payments', {
      method: 'POST',
      body: JSON.stringify(paymentData)
    });
    return res;
  },

  // Invoices & Overdue Tracking
  async getInvoices(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetchJson(`/invoices?${query}`);
    return res.data;
  },

  async getOverdueInvoices() {
    const res = await fetchJson('/invoices/overdue');
    return res;
  },

  async getInvoice(id) {
    const res = await fetchJson(`/invoices/${id}`);
    return res.data;
  },

  // System
  async resetDatabase() {
    const res = await fetchJson('/reset-seed', { method: 'POST' });
    return res;
  }
};

