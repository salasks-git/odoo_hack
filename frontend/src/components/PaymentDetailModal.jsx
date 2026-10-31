import React from 'react';
import { formatCurrency, formatDateTime, getStatusBadgeClass } from '../utils/formatters';
import { X, Receipt, CheckCircle, ShieldCheck } from 'lucide-react';

export default function PaymentDetailModal({ detail, onClose }) {
  if (!detail || !detail.payment) return null;
  const { payment, invoice, related_payments = [] } = detail;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">Payment Audit Details</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-slate-400 uppercase tracking-wider text-[10px] font-bold block mb-1">
                Processed Amount
              </span>
              <div className="text-2xl font-black text-slate-900 font-display">
                {formatCurrency(payment.amount)}
              </div>
            </div>
            <div className="text-right">
              <span className={`inline-block px-3 py-1 rounded-full font-bold text-xs ${getStatusBadgeClass(payment.status)}`}>
                {payment.status}
              </span>
              <span className="text-[11px] text-slate-400 block mt-1 font-medium">
                {payment.payment_method}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 bg-white p-3.5 border border-slate-200/70 rounded-xl">
            <div>
              <p className="text-slate-400 font-bold uppercase text-[10px]">Transaction ID</p>
              <p className="font-mono font-bold text-slate-900 text-xs mt-0.5">{payment.transaction_id || `ID #${payment.id}`}</p>
            </div>
            <div>
              <p className="text-slate-400 font-bold uppercase text-[10px]">Payment Date</p>
              <p className="font-medium text-slate-700 text-xs mt-0.5">{formatDateTime(payment.payment_date)}</p>
            </div>
            <div>
              <p className="text-slate-400 font-bold uppercase text-[10px]">Customer</p>
              <p className="font-bold text-slate-900 text-xs mt-0.5">{payment.customer_name}</p>
            </div>
            <div>
              <p className="text-slate-400 font-bold uppercase text-[10px]">Invoice Reference</p>
              <p className="font-bold text-indigo-600 text-xs mt-0.5">{payment.invoice_number}</p>
            </div>
          </div>

          {payment.notes && (
            <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl">
              <span className="font-bold text-indigo-800 block mb-0.5">Audit Note:</span>
              <span className="text-slate-700">{payment.notes}</span>
            </div>
          )}

          {invoice && (
            <div className="border-t border-slate-100 pt-3">
              <h4 className="font-bold text-slate-800 mb-2">Invoice Current Balance</h4>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Invoice Total:</span>
                  <span className="font-bold text-slate-900">{formatCurrency(invoice.total || invoice.total_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Amount Paid:</span>
                  <span className="font-bold text-emerald-600">{formatCurrency(invoice.amount_paid)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200 font-bold">
                  <span className="text-slate-900">Remaining Balance:</span>
                  <span className={invoice.remaining_balance > 0 ? 'text-indigo-600 font-extrabold' : 'text-slate-500'}>
                    {formatCurrency(invoice.remaining_balance)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {related_payments.length > 0 && (
            <div className="border-t border-slate-100 pt-3">
              <h4 className="font-bold text-slate-800 mb-2">Other Payments On This Invoice</h4>
              <div className="space-y-1.5">
                {related_payments.map((rp) => (
                  <div key={rp.id} className="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <span className="font-mono font-bold text-slate-800">{rp.transaction_id}</span>
                      <span className="text-slate-400 ml-2">({rp.payment_method})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{formatCurrency(rp.amount)}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${getStatusBadgeClass(rp.status)}`}>
                        {rp.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/70 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
