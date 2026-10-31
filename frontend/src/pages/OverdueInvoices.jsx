import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import PaymentModal from '../components/PaymentModal';
import { formatCurrency, formatDate } from '../utils/formatters';
import { AlertTriangle, CreditCard, RefreshCw, Clock, ArrowRight, ShieldAlert } from 'lucide-react';

export default function OverdueInvoices() {
  const [overdueList, setOverdueList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalOverdueBalance, setTotalOverdueBalance] = useState(0);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);

  const fetchOverdue = async () => {
    setLoading(true);
    try {
      const res = await api.getOverdueInvoices();
      setOverdueList(res.data || []);
      setTotalOverdueBalance(res.total_overdue_balance || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverdue();
  }, []);

  const handlePay = (id) => {
    setSelectedInvoiceId(id);
    setIsPaymentModalOpen(true);
  };

  const getSeverityBadge = (days) => {
    if (days >= 30) {
      return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">Urgent (30+ days)</span>;
    } else if (days >= 15) {
      return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800 border border-orange-200">Critical (15-30 days)</span>;
    } else {
      return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">Warning (1-14 days)</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-md uppercase tracking-wider">
              Attention Required
            </span>
          </div>
          <h1 className="text-xl font-black text-slate-900 mt-1">Overdue Invoices Tracker</h1>
          <p className="text-xs text-slate-500 mt-0.5">Invoices with positive balances whose due date has lapsed.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-rose-50 border border-rose-200 text-xs">
            <span className="text-rose-600 font-bold block text-[10px] uppercase">Total Overdue At Risk</span>
            <span className="font-black text-rose-700 text-base">{formatCurrency(totalOverdueBalance)}</span>
          </div>
          <button
            onClick={fetchOverdue}
            className="p-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Overdue Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-rose-600" />
            Loading overdue records...
          </div>
        ) : overdueList.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs bg-slate-50">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2">
              ✓
            </div>
            <p className="font-bold text-slate-800 text-sm">Great news! Zero Overdue Invoices</p>
            <p className="text-slate-400 mt-1">All invoices are settled or within their regular payment term limits.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Customer Information</th>
                  <th className="py-3 px-4 text-right">Total Invoiced</th>
                  <th className="py-3 px-4 text-right">Outstanding Amount</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4 text-center">Days Overdue</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Settlement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {overdueList.map((inv) => (
                  <tr key={inv.id} className="hover:bg-rose-50/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {inv.number || inv.invoice_number}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-800">{inv.customer_name}</p>
                      <p className="text-[10px] text-slate-400">{inv.customer_email}</p>
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-slate-600">
                      {formatCurrency(inv.total || inv.total_amount)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-rose-600 text-sm">
                      {formatCurrency(inv.remaining_balance)}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      {formatDate(inv.due_date)}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-rose-600">
                      {inv.days_overdue} days
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {getSeverityBadge(inv.days_overdue)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handlePay(inv.id)}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs inline-flex items-center gap-1.5 shadow-sm shadow-rose-600/20 transition-all"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Settle Now</span>
                      </button>
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
        onSuccess={fetchOverdue}
        preselectedInvoiceId={selectedInvoiceId}
      />
    </div>
  );
}
