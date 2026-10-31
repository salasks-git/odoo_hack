import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';
import { X, CheckCircle, AlertCircle, RefreshCw, Zap } from 'lucide-react';

export default function PaymentModal({ isOpen, onClose, onSuccess, preselectedInvoiceId = null }) {
  const [invoices, setInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(preselectedInvoiceId || '');
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [transactionId, setTransactionId] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [status, setStatus] = useState('Successful');
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadInvoices();
      generateTxnId();
      const now = new Date();
      const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 19)
        .replace('T', ' ');
      setPaymentDate(localIso);
      setErrorMessage('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (preselectedInvoiceId) {
      setSelectedInvoiceId(preselectedInvoiceId);
    }
  }, [preselectedInvoiceId]);

  useEffect(() => {
    if (selectedInvoiceId && invoices.length) {
      const inv = invoices.find(i => String(i.id) === String(selectedInvoiceId));
      setSelectedInvoice(inv || null);
      if (inv) {
        setAmount(String(inv.remaining_balance));
      }
    } else {
      setSelectedInvoice(null);
    }
  }, [selectedInvoiceId, invoices]);

  const loadInvoices = async () => {
    setLoadingInvoices(true);
    try {
      const data = await api.getInvoices();
      setInvoices(data || []);
      if (preselectedInvoiceId) {
        const found = (data || []).find(i => String(i.id) === String(preselectedInvoiceId));
        if (found) setSelectedInvoice(found);
      }
    } catch (err) {
      setErrorMessage('Failed to load invoices');
    } finally {
      setLoadingInvoices(false);
    }
  };

  const generateTxnId = () => {
    const prefix = paymentMethod === 'UPI' ? 'UPI' : paymentMethod === 'Card' ? 'CRD' : paymentMethod === 'Bank Transfer' ? 'NEFT' : 'CSH';
    const rand = Math.floor(100000 + Math.random() * 900000);
    setTransactionId(`TXN-${prefix}-${rand}`);
  };

  const handleAmountPreset = (multiplier) => {
    if (!selectedInvoice) return;
    const val = (selectedInvoice.remaining_balance * multiplier).toFixed(2);
    setAmount(val);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!selectedInvoiceId) {
      setErrorMessage('Please choose an invoice.');
      return;
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMessage('Amount must be greater than zero.');
      return;
    }

    if (selectedInvoice && status === 'Successful' && numAmount > selectedInvoice.remaining_balance + 0.001) {
      setErrorMessage(`Payment amount cannot exceed remaining balance of ${formatCurrency(selectedInvoice.remaining_balance)}`);
      return;
    }

    if (!transactionId.trim()) {
      setErrorMessage('Transaction reference ID is required.');
      return;
    }

    setSubmitting(true);
    try {
      await api.createPayment({
        invoice_id: Number(selectedInvoiceId),
        amount: numAmount,
        payment_method: paymentMethod,
        transaction_id: transactionId.trim(),
        payment_date: paymentDate,
        status,
        notes: notes.trim()
      });

      onSuccess();
      onClose();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div>
            <h2 className="text-base font-bold text-slate-900">Record Verified Payment</h2>
            <p className="text-xs text-slate-500">Apply a payment against an outstanding invoice balance</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Select Invoice *
            </label>
            <select
              value={selectedInvoiceId}
              onChange={(e) => setSelectedInvoiceId(e.target.value)}
              disabled={loadingInvoices}
              className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            >
              <option value="">-- Select an invoice to pay --</option>
              {invoices.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.number || inv.invoice_number} — {inv.customer_name} ({formatCurrency(inv.remaining_balance)} due)
                </option>
              ))}
            </select>
          </div>

          {selectedInvoice && (
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/90 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Customer:</span>
                <span className="font-bold text-slate-900">{selectedInvoice.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Invoice Total:</span>
                <span className="text-slate-700 font-medium">{formatCurrency(selectedInvoice.total || selectedInvoice.total_amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount Paid:</span>
                <span className="text-emerald-600 font-medium">{formatCurrency(selectedInvoice.amount_paid)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200 font-bold">
                <span className="text-slate-900">Remaining Balance:</span>
                <span className="text-indigo-600 font-extrabold">{formatCurrency(selectedInvoice.remaining_balance)}</span>
              </div>
              {selectedInvoice.is_overdue === 1 && (
                <div className="mt-1 text-rose-600 font-bold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Due date passed ({formatDate(selectedInvoice.due_date)})
                </div>
              )}
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Payment Amount ($) *
              </label>
              {selectedInvoice && selectedInvoice.remaining_balance > 0 && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleAmountPreset(1.0)}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 flex items-center gap-1"
                  >
                    <Zap className="w-3 h-3" /> Full Balance
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAmountPreset(0.5)}
                    className="text-[11px] font-medium text-slate-600 hover:text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200"
                  >
                    50% Partial
                  </button>
                </div>
              )}
            </div>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full text-sm font-bold rounded-xl border border-slate-300 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Payment Method *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="UPI">UPI</option>
                <option value="Card">Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cash">Cash</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Status *
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="Successful">Successful</option>
                <option value="Pending">Pending</option>
                <option value="Failed">Failed</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Transaction Ref ID *
              </label>
              <button
                type="button"
                onClick={generateTxnId}
                className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Regenerate
              </button>
            </div>
            <input
              type="text"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              placeholder="e.g. TXN-UPI-982103"
              className="w-full text-xs font-mono rounded-xl border border-slate-300 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Payment Date & Time *
            </label>
            <input
              type="text"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              placeholder="YYYY-MM-DD HH:MM:SS"
              className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Notes / Audit Reference
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Verified via bank statement"
              className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? 'Recording...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
