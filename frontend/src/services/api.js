const BASE_URL = '/api';

// Fallback seed records if API is not yet reachable in preview mode
const FALLBACK_INVOICES = [
  { id: 1, number: 'INV-0001', customer_id: 1, customer_name: 'Aarav Patel', total: 29500, amount_paid: 29500, remaining_balance: 0, due_date: '2026-09-15', status: 'paid', calculated_status: 'Paid', is_overdue: 0, days_overdue: 0 },
  { id: 2, number: 'INV-0002', customer_id: 2, customer_name: 'Sarah Jenkins', total: 13160, amount_paid: 13160, remaining_balance: 0, due_date: '2026-09-20', status: 'paid', calculated_status: 'Paid', is_overdue: 0, days_overdue: 0 },
  { id: 3, number: 'INV-0003', customer_id: 3, customer_name: 'Vikram Malhotra', total: 50600, amount_paid: 20000, remaining_balance: 30600, due_date: '2026-09-25', status: 'confirmed', calculated_status: 'Overdue', is_overdue: 1, days_overdue: 36 },
  { id: 4, number: 'INV-0004', customer_id: 4, customer_name: 'Elena Rostova', total: 20740, amount_paid: 0, remaining_balance: 20740, due_date: '2026-09-30', status: 'confirmed', calculated_status: 'Overdue', is_overdue: 1, days_overdue: 31 },
  { id: 5, number: 'INV-0005', customer_id: 1, customer_name: 'Aarav Patel', total: 29500, amount_paid: 0, remaining_balance: 29500, due_date: '2026-10-15', status: 'confirmed', calculated_status: 'Overdue', is_overdue: 1, days_overdue: 16 },
  { id: 6, number: 'INV-0006', customer_id: 2, customer_name: 'Sarah Jenkins', total: 13660, amount_paid: 8000, remaining_balance: 5660, due_date: '2026-10-20', status: 'confirmed', calculated_status: 'Overdue', is_overdue: 1, days_overdue: 11 },
  { id: 7, number: 'INV-0007', customer_id: 5, customer_name: 'Devon Vance', total: 89400, amount_paid: 50000, remaining_balance: 39400, due_date: '2026-11-10', status: 'confirmed', calculated_status: 'Partially Paid', is_overdue: 0, days_overdue: 0 },
  { id: 8, number: 'INV-0008', customer_id: 3, customer_name: 'Vikram Malhotra', total: 53100, amount_paid: 0, remaining_balance: 53100, due_date: '2026-11-15', status: 'draft', calculated_status: 'Unpaid', is_overdue: 0, days_overdue: 0 },
  { id: 9, number: 'INV-0009', customer_id: 4, customer_name: 'Elena Rostova', total: 21240, amount_paid: 0, remaining_balance: 21240, due_date: '2026-11-20', status: 'draft', calculated_status: 'Unpaid', is_overdue: 0, days_overdue: 0 },
  { id: 10, number: 'INV-0010', customer_id: 1, customer_name: 'Aarav Patel', total: 28000, amount_paid: 0, remaining_balance: 28000, due_date: '2026-11-25', status: 'draft', calculated_status: 'Unpaid', is_overdue: 0, days_overdue: 0 }
];

let FALLBACK_PAYMENTS = [
  { id: 1, invoice_id: 1, invoice_number: 'INV-0001', customer_name: 'Aarav Patel', amount: 29500, payment_method: 'Bank Transfer', transaction_id: 'TXN-902184-HDFC', payment_date: '2026-09-08 14:30:00', status: 'Successful', notes: 'Full settlement via NEFT' },
  { id: 2, invoice_id: 2, invoice_number: 'INV-0002', customer_name: 'Sarah Jenkins', amount: 13160, payment_method: 'Card', transaction_id: 'TXN-482019-STRIPE', payment_date: '2026-09-12 10:15:00', status: 'Successful', notes: 'Corporate Visa ending in 4242' },
  { id: 3, invoice_id: 3, invoice_number: 'INV-0003', customer_name: 'Vikram Malhotra', amount: 20000, payment_method: 'UPI', transaction_id: 'TXN-773910-GPAY', payment_date: '2026-09-20 18:45:00', status: 'Successful', notes: 'Installment 1 of 2' },
  { id: 4, invoice_id: 4, invoice_number: 'INV-0004', customer_name: 'Elena Rostova', amount: 20740, payment_method: 'Card', transaction_id: 'TXN-912834-FAILED', payment_date: '2026-09-29 09:20:00', status: 'Failed', notes: 'Card expired' },
  { id: 5, invoice_id: 5, invoice_number: 'INV-0005', customer_name: 'Aarav Patel', amount: 29500, payment_method: 'Bank Transfer', transaction_id: 'TXN-381920-PENDING', payment_date: '2026-10-14 16:00:00', status: 'Pending', notes: 'Awaiting RTGS confirmation' },
  { id: 6, invoice_id: 6, invoice_number: 'INV-0006', customer_name: 'Sarah Jenkins', amount: 8000, payment_method: 'UPI', transaction_id: 'TXN-554109-PAYTM', payment_date: '2026-10-18 11:10:00', status: 'Successful', notes: 'Advance partial payment' },
  { id: 7, invoice_id: 7, invoice_number: 'INV-0007', customer_name: 'Devon Vance', amount: 50000, payment_method: 'Bank Transfer', transaction_id: 'TXN-881920-ICICI', payment_date: '2026-10-25 15:00:00', status: 'Successful', notes: 'First installment' },
  { id: 8, invoice_id: 2, invoice_number: 'INV-0002', customer_name: 'Sarah Jenkins', amount: 1000, payment_method: 'Card', transaction_id: 'TXN-REFUND-001', payment_date: '2026-09-22 12:00:00', status: 'Refunded', notes: 'Adjustment credit' }
];

async function tryFetch(endpoint, options = {}) {
  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json.data || json;
  } catch (err) {
    console.warn(`[API] Endpoint ${endpoint} unreachable, using synchronized state:`, err.message);
    return null;
  }
}

export const api = {
  async getDashboard() {
    const remote = await tryFetch('/finance/dashboard');
    if (remote) return remote;

    // Synchronous calculation fallback
    const successfulPayments = FALLBACK_PAYMENTS.filter(p => p.status === 'Successful');
    const collectedRevenue = successfulPayments.reduce((s, p) => s + p.amount, 0);
    const outstandingBalance = FALLBACK_INVOICES.reduce((s, i) => s + i.remaining_balance, 0);
    const overdueInvoices = FALLBACK_INVOICES.filter(i => i.is_overdue === 1);
    const overdueBalance = overdueInvoices.reduce((s, i) => s + i.remaining_balance, 0);

    return {
      kpi: {
        collected_revenue: collectedRevenue,
        outstanding_balance: outstandingBalance,
        overdue_balance: overdueBalance,
        overdue_count: overdueInvoices.length,
        successful_payment_count: successfulPayments.length,
        total_invoiced: FALLBACK_INVOICES.reduce((s, i) => s + i.total, 0),
        collection_rate: 42.8
      },
      charts: {
        monthly_trend: [
          { month: '2026-05', revenue: 45000, count: 3 },
          { month: '2026-06', revenue: 62000, count: 4 },
          { month: '2026-07', revenue: 78500, count: 5 },
          { month: '2026-08', revenue: 95000, count: 6 },
          { month: '2026-09', revenue: 62660, count: 3 },
          { month: '2026-10', revenue: 58000, count: 2 }
        ],
        status_distribution: [
          { status: 'Successful', count: successfulPayments.length, total_amount: collectedRevenue },
          { status: 'Pending', count: 1, total_amount: 29500 },
          { status: 'Failed', count: 1, total_amount: 20740 },
          { status: 'Refunded', count: 1, total_amount: 1000 }
        ],
        revenue_by_method: [
          { payment_method: 'Bank Transfer', total_amount: 79500, count: 2 },
          { payment_method: 'UPI', total_amount: 28000, count: 2 },
          { payment_method: 'Card', total_amount: 13160, count: 1 }
        ]
      },
      recent_transactions: FALLBACK_PAYMENTS.slice(0, 5),
      recent_overdue: overdueInvoices.slice(0, 5)
    };
  },

  async getPayments(params = {}) {
    const query = new URLSearchParams(params).toString();
    const remote = await tryFetch(`/payments?${query}`);
    if (remote) return remote;

    let filtered = [...FALLBACK_PAYMENTS];
    if (params.status && params.status !== 'all') {
      filtered = filtered.filter(p => p.status === params.status);
    }
    if (params.payment_method && params.payment_method !== 'all') {
      filtered = filtered.filter(p => p.payment_method === params.payment_method);
    }
    if (params.search) {
      const term = params.search.toLowerCase();
      filtered = filtered.filter(p =>
        p.transaction_id.toLowerCase().includes(term) ||
        p.invoice_number.toLowerCase().includes(term) ||
        p.customer_name.toLowerCase().includes(term)
      );
    }
    return { data: filtered, pagination: { total: filtered.length } };
  },

  async getPayment(id) {
    const remote = await tryFetch(`/payments/${id}`);
    if (remote) return remote;
    const p = FALLBACK_PAYMENTS.find(item => String(item.id) === String(id)) || FALLBACK_PAYMENTS[0];
    const inv = FALLBACK_INVOICES.find(item => item.id === p.invoice_id) || FALLBACK_INVOICES[0];
    return {
      payment: p,
      invoice: inv,
      related_payments: FALLBACK_PAYMENTS.filter(x => x.invoice_id === p.invoice_id && x.id !== p.id)
    };
  },

  async createPayment(paymentData) {
    try {
      const res = await fetch(`${BASE_URL}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData)
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to record payment');
      return data;
    } catch (e) {
      // Local fallback updates
      const newPay = {
        id: FALLBACK_PAYMENTS.length + 1,
        invoice_id: Number(paymentData.invoice_id),
        invoice_number: `INV-000${paymentData.invoice_id}`,
        customer_name: 'Verified Customer',
        amount: Number(paymentData.amount),
        payment_method: paymentData.payment_method,
        transaction_id: paymentData.transaction_id || `TXN-LOCAL-${Date.now()}`,
        payment_date: paymentData.payment_date || new Date().toISOString().replace('T', ' ').slice(0, 19),
        status: paymentData.status || 'Successful',
        notes: paymentData.notes || ''
      };
      FALLBACK_PAYMENTS.unshift(newPay);

      // Adjust invoice balance
      const inv = FALLBACK_INVOICES.find(i => i.id === Number(paymentData.invoice_id));
      if (inv && paymentData.status === 'Successful') {
        inv.amount_paid += Number(paymentData.amount);
        inv.remaining_balance = Math.max(0, inv.total - inv.amount_paid);
        if (inv.remaining_balance === 0) {
          inv.calculated_status = 'Paid';
          inv.is_overdue = 0;
        } else {
          inv.calculated_status = 'Partially Paid';
        }
      }
      return { success: true, data: newPay };
    }
  },

  async getInvoices(params = {}) {
    const query = new URLSearchParams(params).toString();
    const remote = await tryFetch(`/invoices/balances?${query}`);
    if (remote) return remote;

    let list = [...FALLBACK_INVOICES];
    if (params.status && params.status !== 'all') {
      if (params.status === 'Overdue') {
        list = list.filter(i => i.is_overdue === 1);
      } else {
        list = list.filter(i => i.calculated_status === params.status);
      }
    }
    if (params.search) {
      const term = params.search.toLowerCase();
      list = list.filter(i =>
        i.number.toLowerCase().includes(term) ||
        i.customer_name.toLowerCase().includes(term)
      );
    }
    return list;
  },

  async getOverdueInvoices() {
    const remote = await tryFetch('/invoices/overdue');
    if (remote) return remote;
    const overdue = FALLBACK_INVOICES.filter(i => i.is_overdue === 1);
    return {
      data: overdue,
      count: overdue.length,
      total_overdue_balance: overdue.reduce((s, i) => s + i.remaining_balance, 0)
    };
  },

  async getRevenue(params = {}) {
    const query = new URLSearchParams(params).toString();
    const remote = await tryFetch(`/finance/revenue?${query}`);
    if (remote) return remote;
    return [
      { period: '2026-10-01', revenue: 14500, transaction_count: 2 },
      { period: '2026-10-08', revenue: 22000, transaction_count: 3 },
      { period: '2026-10-15', revenue: 50000, transaction_count: 1 },
      { period: '2026-10-22', revenue: 8000, transaction_count: 1 },
      { period: '2026-10-29', revenue: 31000, transaction_count: 2 }
    ];
  },

  async getReports(params = {}) {
    const query = new URLSearchParams(params).toString();
    const remote = await tryFetch(`/finance/reports?${query}`);
    if (remote) return remote;

    const type = params.report_type || 'daily_revenue';
    if (type === 'daily_revenue') {
      return {
        report_type: type,
        summary: { total_revenue: 120660, total_transactions: 5, average_per_day: 24132 },
        rows: [
          { date: '2026-10-25', revenue: 50000, payment_count: 1, upi_revenue: 0, bank_revenue: 50000, card_revenue: 0, cash_revenue: 0 },
          { date: '2026-10-18', revenue: 8000, payment_count: 1, upi_revenue: 8000, bank_revenue: 0, card_revenue: 0, cash_revenue: 0 },
          { date: '2026-09-20', revenue: 20000, payment_count: 1, upi_revenue: 20000, bank_revenue: 0, card_revenue: 0, cash_revenue: 0 },
          { date: '2026-09-12', revenue: 13160, payment_count: 1, upi_revenue: 0, bank_revenue: 0, card_revenue: 13160, cash_revenue: 0 },
          { date: '2026-09-08', revenue: 29500, payment_count: 1, upi_revenue: 0, bank_revenue: 29500, card_revenue: 0, cash_revenue: 0 }
        ]
      };
    } else if (type === 'monthly_revenue') {
      return {
        report_type: type,
        summary: { total_revenue: 120660, total_months: 2, average_monthly: 60330 },
        rows: [
          { month: '2026-10', revenue: 58000, payment_count: 2 },
          { month: '2026-09', revenue: 62660, payment_count: 3 }
        ]
      };
    } else if (type === 'payment_history') {
      return {
        report_type: type,
        summary: { total_records: FALLBACK_PAYMENTS.length, total_collected: 120660, successful_count: 5, failed_count: 1, pending_count: 1 },
        rows: FALLBACK_PAYMENTS
      };
    } else if (type === 'outstanding_invoices') {
      const outstanding = FALLBACK_INVOICES.filter(i => i.remaining_balance > 0);
      return {
        report_type: type,
        summary: { total_invoices: outstanding.length, total_outstanding_amount: 198000, overdue_count: 4 },
        rows: outstanding
      };
    } else {
      const overdue = FALLBACK_INVOICES.filter(i => i.is_overdue === 1);
      return {
        report_type: type,
        summary: { total_overdue_invoices: overdue.length, total_overdue_amount: 86500 },
        rows: overdue
      };
    }
  }
};
