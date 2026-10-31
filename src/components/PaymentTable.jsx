import React from 'react';
import { formatCurrency, formatDateTime, getStatusBadgeClass } from '../utils/financeCalculations';
import { Eye, CreditCard, Smartphone, Building, Banknote, HelpCircle } from 'lucide-react';

export default function PaymentTable({ payments = [], loading = false, onViewPayment }) {
  const getMethodIcon = (method) => {
    switch (method) {
      case 'UPI':
        return <Smartphone className="w-3.5 h-3.5 text-indigo-500" />;
      case 'Card':
        return <CreditCard className="w-3.5 h-3.5 text-blue-500" />;
      case 'Bank Transfer':
        return <Building className="w-3.5 h-3.5 text-emerald-500" />;
      case 'Cash':
        return <Banknote className="w-3.5 h-3.5 text-amber-500" />;
      default:
        return <HelpCircle className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 text-sm">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        Loading payment records...
      </div>
    );
  }

  if (!payments.length) {
    return (
      <div className="p-12 text-center text-slate-500 text-sm bg-slate-50 rounded-xl border border-dashed border-slate-300">
        No payment records found matching the current filters.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            <th className="py-3 px-4">Transaction Ref</th>
            <th className="py-3 px-4">Invoice #</th>
            <th className="py-3 px-4">Customer</th>
            <th className="py-3 px-4">Method</th>
            <th className="py-3 px-4 text-right">Amount</th>
            <th className="py-3 px-4 text-center">Status</th>
            <th className="py-3 px-4">Payment Date</th>
            <th className="py-3 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-sm">
          {payments.map((p) => (
            <tr key={p.id} className="hover:bg-slate-50/80 transition-colors group">
              <td className="py-3.5 px-4 font-mono text-xs font-semibold text-slate-800">
                {p.transaction_id || `PAY-${p.id}`}
              </td>
              <td className="py-3.5 px-4">
                <span className="font-medium text-blue-600 hover:underline cursor-pointer">
                  {p.invoice_number}
                </span>
              </td>
              <td className="py-3.5 px-4">
                <div className="font-medium text-slate-900">{p.customer_name}</div>
                <div className="text-xs text-slate-400">{p.customer_company || p.customer_email}</div>
              </td>
              <td className="py-3.5 px-4">
                <div className="flex items-center gap-1.5 text-xs text-slate-700">
                  {getMethodIcon(p.payment_method)}
                  <span>{p.payment_method}</span>
                </div>
              </td>
              <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                {formatCurrency(p.amount)}
              </td>
              <td className="py-3.5 px-4 text-center">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusBadgeClass(p.status)}`}>
                  {p.status}
                </span>
              </td>
              <td className="py-3.5 px-4 text-xs text-slate-500">
                {formatDateTime(p.payment_date)}
              </td>
              <td className="py-3.5 px-4 text-right">
                <button
                  onClick={() => onViewPayment(p.id)}
                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="View Details"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

