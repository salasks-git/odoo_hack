import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import PaymentDetailModal from '../components/PaymentDetailModal';
import { formatCurrency, formatDateTime, getStatusBadgeClass } from '../utils/formatters';
import { Receipt, Search, Download, RefreshCw, Eye, ShieldCheck, Filter } from 'lucide-react';
import { exportToCsv } from '../utils/formatters';

export default function AllTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [selectedDetail, setSelectedDetail] = useState(null);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await api.getPayments({
        status: statusFilter,
        payment_method: methodFilter,
        search
      });
      setTransactions(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [statusFilter, methodFilter]);

  const handleExport = () => {
    if (!transactions.length) return alert('No transactions to export');
    const headers = ['id', 'transaction_id', 'invoice_number', 'customer_name', 'amount', 'payment_method', 'status', 'payment_date'];
    exportToCsv('all_transactions_log', headers, transactions);
  };

  const totalVolume = transactions.reduce((s, t) => s + Number(t.amount), 0);
  const successfulVolume = transactions
    .filter(t => t.status === 'Successful')
    .reduce((s, t) => s + Number(t.amount), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Audit Log</span>
          <h1 className="text-xl font-black text-slate-900 mt-1">All Transactions Registry</h1>
          <p className="text-xs text-slate-500 mt-0.5">Comprehensive, immutable history of financial events and gateway attempts.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Summary Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <p className="text-[10px] font-bold uppercase text-slate-400">Total Records</p>
          <p className="text-xl font-black text-slate-900 mt-1">{transactions.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <p className="text-[10px] font-bold uppercase text-slate-400">Total Processed Volume</p>
          <p className="text-xl font-black text-slate-900 mt-1">{formatCurrency(totalVolume)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <p className="text-[10px] font-bold uppercase text-emerald-600">Successful Settlement</p>
          <p className="text-xl font-black text-emerald-700 mt-1">{formatCurrency(successfulVolume)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <p className="text-[10px] font-bold uppercase text-slate-400">Settlement Ratio</p>
          <p className="text-xl font-black text-indigo-600 mt-1">
            {totalVolume > 0 ? ((successfulVolume / totalVolume) * 100).toFixed(1) : 0}%
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search all transaction logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs py-2 px-3 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="Successful">Successful</option>
            <option value="Pending">Pending</option>
            <option value="Failed">Failed</option>
            <option value="Refunded">Refunded</option>
          </select>

          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="text-xs py-2 px-3 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Methods</option>
            <option value="UPI">UPI</option>
            <option value="Card">Card</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Cash">Cash</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">Txn ID</th>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/80">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{t.transaction_id}</td>
                  <td className="py-3.5 px-4 font-semibold text-indigo-600">{t.invoice_number}</td>
                  <td className="py-3.5 px-4 font-medium text-slate-800">{t.customer_name}</td>
                  <td className="py-3.5 px-4 text-slate-600">{t.payment_method}</td>
                  <td className="py-3.5 px-4 text-right font-black text-slate-900">{formatCurrency(t.amount)}</td>
                  <td className="py-3.5 px-4 text-center">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${getStatusBadgeClass(t.status)}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-500">{formatDateTime(t.payment_date)}</td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={async () => {
                        const detail = await api.getPayment(t.id);
                        setSelectedDetail(detail);
                      }}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <PaymentDetailModal
        detail={selectedDetail}
        onClose={() => setSelectedDetail(null)}
      />
    </div>
  );
}
