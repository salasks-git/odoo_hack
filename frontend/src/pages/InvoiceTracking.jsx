import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import PaymentModal from '../components/PaymentModal';
import { formatCurrency, formatDate, getStatusBadgeClass } from '../utils/formatters';
import { FileText, Search, CreditCard, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

export default function InvoiceTracking() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const data = await api.getInvoices({
        status: statusFilter,
        search
      });
      setInvoices(data || []);
    } catch (e) {
      console.error(e);
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

  const handlePay = (invoiceId) => {
    setSelectedInvoiceId(invoiceId);
    setIsPaymentModalOpen(true);
  };

  const totalBilled = invoices.reduce((s, i) => s + (i.total || i.total_amount || 0), 0);
  const totalOutstanding = invoices.reduce((s, i) => s + (i.remaining_balance || 0), 0);
  const overdueCount = invoices.filter(i => i.is_overdue === 1).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Ledger & Balances</span>
          <h1 className="text-xl font-black text-slate-900 mt-1">Invoice Balance Tracking</h1>
          <p className="text-xs text-slate-500 mt-0.5">Real-time status of generated invoices, customer balances, and payment progress.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <span className="text-slate-400 mr-1.5 font-medium">Outstanding:</span>
            <span className="font-bold text-indigo-600">{formatCurrency(totalOutstanding)}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-xs">
            <span className="text-rose-600 mr-1.5 font-medium">Overdue Accounts:</span>
            <span className="font-bold text-rose-700">{overdueCount}</span>
          </div>
        </div>
      </div>

      {/* Tabs and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'all', label: 'All Invoices' },
            { id: 'Paid', label: 'Paid' },
            { id: 'Unpaid', label: 'Unpaid' },
            { id: 'Partially Paid', label: 'Partially Paid' },
            { id: 'Overdue', label: 'Overdue' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                statusFilter === tab.id
                  ? tab.id === 'Overdue'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search invoice # or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </form>
      </div>

      {/* Invoice Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
            Loading invoices...
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs bg-slate-50">
            No invoices found for the selected status filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4 text-right">Invoice Total</th>
                  <th className="py-3 px-4 text-right">Amount Paid</th>
                  <th className="py-3 px-4 text-right">Outstanding Balance</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4 text-center">Payment Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {inv.number || inv.invoice_number}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      {inv.customer_name}
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-slate-700">
                      {formatCurrency(inv.total || inv.total_amount)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-emerald-600">
                      {formatCurrency(inv.amount_paid)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black">
                      <span className={inv.remaining_balance > 0 ? (inv.is_overdue ? 'text-rose-600' : 'text-indigo-600') : 'text-slate-400'}>
                        {formatCurrency(inv.remaining_balance)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {formatDate(inv.due_date)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${getStatusBadgeClass(inv.calculated_status)}`}>
                        {inv.calculated_status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {inv.remaining_balance > 0 ? (
                        <button
                          onClick={() => handlePay(inv.id)}
                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg text-[11px] inline-flex items-center gap-1 transition-colors"
                        >
                          <CreditCard className="w-3 h-3" /> Pay Now
                        </button>
                      ) : (
                        <span className="text-[11px] font-bold text-emerald-600 inline-flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> Paid
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSuccess={fetchInvoices}
        preselectedInvoiceId={selectedInvoiceId}
      />
    </div>
  );
}
