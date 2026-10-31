import React, { useState, useEffect } from 'react';
import { financeApi } from '../services/financeApi';
import { formatCurrency, formatDate, getStatusBadgeClass } from '../utils/financeCalculations';
import PaymentForm from '../components/PaymentForm';
import {
  FileText, Search, AlertCircle, CheckCircle, CreditCard,
  RefreshCw, Clock, ArrowUpDown, Filter, Eye
} from 'lucide-react';

export default function InvoiceTracking() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Payment Modal Trigger
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState(null);

  // Invoice Detail Modal
  const [selectedInvoiceDetail, setSelectedInvoiceDetail] = useState(null);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (search.trim()) params.search = search.trim();
      const data = await financeApi.getInvoices(params);
      setInvoices(data || []);
    } catch (err) {
      console.error('Error fetching invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchInvoices();
  };

  const handlePayNow = (invoice) => {
    setSelectedInvoiceForPayment(invoice.id);
    setPaymentModalOpen(true);
  };

  const handleViewInvoice = async (invoiceId) => {
    try {
      const detail = await financeApi.getInvoice(invoiceId);
      setSelectedInvoiceDetail(detail);
    } catch (err) {
      alert('Error fetching invoice details: ' + err.message);
    }
  };

  // Compute summary values from current loaded list
  const totalInvoiced = invoices.reduce((sum, i) => sum + Number(i.total_amount), 0);
  const totalPaid = invoices.reduce((sum, i) => sum + Number(i.amount_paid), 0);
  const totalOutstanding = invoices.reduce((sum, i) => sum + Number(i.remaining_balance), 0);
  const overdueCount = invoices.filter(i => i.is_overdue === 1).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Invoice & Overdue Tracking</h1>
          <p className="text-xs text-slate-500 mt-1">
            Track invoice balances, manage partial payments, and identify overdue accounts.
          </p>
        </div>

        {/* Quick summary badges */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <span className="text-slate-400 mr-1.5">Outstanding:</span>
            <span className="font-bold text-blue-600">{formatCurrency(totalOutstanding)}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-xs">
            <span className="text-rose-600 mr-1.5 font-medium">Overdue Invoices:</span>
            <span className="font-bold text-rose-700">{overdueCount}</span>
          </div>
        </div>
      </div>

      {/* Filter and Tab Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'all', label: 'All Invoices' },
            { id: 'Overdue', label: 'Overdue' },
            { id: 'Partially Paid', label: 'Partially Paid' },
            { id: 'Unpaid', label: 'Unpaid' },
            { id: 'Paid', label: 'Fully Paid' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === tab.id
                  ? tab.id === 'Overdue'
                    ? 'bg-rose-600 text-white shadow-sm shadow-rose-500/20'
                    : 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search invoice # or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </form>
      </div>

      {/* Invoice Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading invoices...
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm bg-slate-50">
            No invoices found matching current filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Customer & Plan</th>
                  <th className="py-3 px-4 text-right">Total Amount</th>
                  <th className="py-3 px-4 text-right">Paid to Date</th>
                  <th className="py-3 px-4 text-right">Remaining Balance</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-xs">
                      {inv.invoice_number}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{inv.customer_name}</div>
                      <div className="text-xs text-slate-400">{inv.plan_name || inv.customer_company}</div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-slate-700">
                      {formatCurrency(inv.total_amount)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-emerald-600">
                      {formatCurrency(inv.amount_paid)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                      <span className={inv.remaining_balance > 0 ? (inv.is_overdue ? 'text-rose-600' : 'text-blue-600') : 'text-slate-400'}>
                        {formatCurrency(inv.remaining_balance)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <div className="text-slate-700">{formatDate(inv.due_date)}</div>
                      {inv.is_overdue === 1 && (
                        <span className="text-[10px] text-rose-600 font-bold flex items-center gap-0.5 mt-0.5">
                          <AlertCircle className="w-2.5 h-2.5" /> Past Due
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusBadgeClass(inv.calculated_status)}`}>
                        {inv.calculated_status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {inv.remaining_balance > 0 && (
                          <button
                            onClick={() => handlePayNow(inv)}
                            className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                            title="Record Payment"
                          >
                            <CreditCard className="w-3.5 h-3.5" /> Pay
                          </button>
                        )}
                        <button
                          onClick={() => handleViewInvoice(inv.id)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                          title="View Invoice History"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Form Modal */}
      <PaymentForm
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        onSuccess={fetchInvoices}
        preselectedInvoiceId={selectedInvoiceForPayment}
      />

      {/* Invoice Detail & Payment History Modal */}
      {selectedInvoiceDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h2 className="text-base font-bold text-slate-900">
                  Invoice {selectedInvoiceDetail.invoice_number}
                </h2>
              </div>
              <button
                onClick={() => setSelectedInvoiceDetail(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Customer</span>
                  <p className="font-semibold text-slate-900 text-sm mt-0.5">{selectedInvoiceDetail.customer_name}</p>
                  <p className="text-slate-500">{selectedInvoiceDetail.customer_company}</p>
                  <p className="text-slate-500">{selectedInvoiceDetail.customer_email}</p>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Billing Status</span>
                  <div className="mt-1">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${getStatusBadgeClass(selectedInvoiceDetail.calculated_status)}`}>
                      {selectedInvoiceDetail.calculated_status}
                    </span>
                  </div>
                  <p className="text-slate-500 mt-1">Due: {formatDate(selectedInvoiceDetail.due_date)}</p>
                </div>
              </div>

              {/* Financial Metrics */}
              <div className="border border-slate-200 rounded-xl p-3.5 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-600">Subtotal:</span>
                  <span className="font-medium text-slate-800">{formatCurrency(selectedInvoiceDetail.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Tax Amount:</span>
                  <span className="font-medium text-slate-800">+{formatCurrency(selectedInvoiceDetail.tax_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Discount:</span>
                  <span className="font-medium text-emerald-600">-{formatCurrency(selectedInvoiceDetail.discount_amount)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm border-t border-slate-200 pt-1.5 text-slate-900">
                  <span>Total Amount:</span>
                  <span>{formatCurrency(selectedInvoiceDetail.total_amount)}</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-600">
                  <span>Total Paid:</span>
                  <span>{formatCurrency(selectedInvoiceDetail.amount_paid)}</span>
                </div>
                <div className="flex justify-between font-bold text-blue-600 text-sm border-t border-slate-200 pt-1.5">
                  <span>Remaining Balance:</span>
                  <span>{formatCurrency(selectedInvoiceDetail.remaining_balance)}</span>
                </div>
              </div>

              {/* Payment History Table */}
              <div>
                <h4 className="font-bold text-slate-900 mb-2">Applied Payments History</h4>
                {selectedInvoiceDetail.payments && selectedInvoiceDetail.payments.length > 0 ? (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                        <tr>
                          <th className="p-2">Transaction ID</th>
                          <th className="p-2">Method</th>
                          <th className="p-2 text-right">Amount</th>
                          <th className="p-2 text-center">Status</th>
                          <th className="p-2">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedInvoiceDetail.payments.map((p) => (
                          <tr key={p.id}>
                            <td className="p-2 font-mono font-medium text-slate-800">{p.transaction_id}</td>
                            <td className="p-2 text-slate-600">{p.payment_method}</td>
                            <td className="p-2 text-right font-bold text-slate-900">{formatCurrency(p.amount)}</td>
                            <td className="p-2 text-center">
                              <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${getStatusBadgeClass(p.status)}`}>
                                {p.status}
                              </span>
                            </td>
                            <td className="p-2 text-slate-500">{formatDate(p.payment_date)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 rounded-xl text-center text-slate-400">
                    No payments have been applied to this invoice yet.
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              {selectedInvoiceDetail.remaining_balance > 0 ? (
                <button
                  onClick={() => {
                    handlePayNow(selectedInvoiceDetail);
                    setSelectedInvoiceDetail(null);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
                >
                  <CreditCard className="w-4 h-4" /> Pay Balance Now
                </button>
              ) : (
                <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" /> Fully Paid
                </span>
              )}
              <button
                onClick={() => setSelectedInvoiceDetail(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-xl text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

