import React, { useState, useEffect } from 'react';
import { financeApi } from '../services/financeApi';
import { formatCurrency, formatDate } from '../utils/financeCalculations';
import { X, CheckCircle, AlertCircle, RefreshCw, Zap } from 'lucide-react';

export default function PaymentForm({ isOpen, onClose, onSuccess, preselectedInvoiceId = null }) {
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
      // Set current datetime local
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
      const data = await financeApi.getInvoices();
      // Prioritize unpaid & partially paid invoices
      setInvoices(data);
      if (preselectedInvoiceId) {
        const found = data.find(i => String(i.id) === String(preselectedInvoiceId));
        if (found) setSelectedInvoice(found);
      }
    } catch (err) {
      setErrorMessage('Failed to load invoices: ' + err.message);
    } finally {
      setLoadingInvoices(false);
    }
  };

  const generateTxnId = () => {
    const prefix = paymentMethod === 'UPI' ? 'UPI' : paymentMethod === 'Card' ? 'CRD' : paymentMethod === 'Bank Transfer' ? 'NEFT' : 'CSH';
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    setTransactionId(`TXN-${prefix}-${randomNum}`);
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
      setErrorMessage('Please select an invoice.');
      return;
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMessage('Payment amount must be greater than zero.');
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
      await financeApi.createPayment({
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Record New Payment</h2>
            <p className="text-xs text-slate-500">Apply a verified payment against an existing invoice</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. Select Invoice */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Select Invoice *
            </label>
            <select
              value={selectedInvoiceId}
              onChange={(e) => setSelectedInvoiceId(e.target.value)}
              disabled={loadingInvoices}
              className="w-full text-sm rounded-xl border border-slate-300 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              required
            >
              <option value="">-- Choose Invoice to Apply Payment --</option>
              {invoices.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.invoice_number} - {inv.customer_name} ({formatCurrency(inv.remaining_balance)} due) [{inv.calculated_status}]
                </option>
              ))}
            </select>
          </div>

          {/* Invoice Summary Card if selected */}
          {selectedInvoice && (
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/90 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-600">Customer:</span>
                <span className="font-semibold text-slate-900">{selectedInvoice.customer_name} ({selectedInvoice.customer_company})</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-600">Invoice Total:</span>
                <span className="text-slate-700 font-medium">{formatCurrency(selectedInvoice.total_amount)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-600">Already Paid:</span>
                <span className="text-emerald-600 font-medium">{formatCurrency(selectedInvoice.amount_paid)}</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                <span className="font-bold text-slate-800">Remaining Balance:</span>
                <span className="font-bold text-blue-600 text-sm">{formatCurrency(selectedInvoice.remaining_balance)}</span>
              </div>
              {selectedInvoice.is_overdue === 1 && (
                <div className="mt-1 text-rose-600 font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Past Due Date ({formatDate(selectedInvoice.due_date)})
                </div>
              )}
            </div>
          )}

          {/* 2. Amount and Quick Presets */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Payment Amount ($) *
              </label>
              {selectedInvoice && selectedInvoice.remaining_balance > 0 && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleAmountPreset(1.0)}
                    className="text-[11px] font-medium text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 flex items-center gap-1"
                  >
                    <Zap className="w-2.5 h-2.5" /> Full Balance
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
              max={selectedInvoice && status === 'Successful' ? selectedInvoice.remaining_balance : undefined}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full text-sm font-semibold rounded-xl border border-slate-300 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* 3. Payment Method & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Payment Method *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full text-sm rounded-xl border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                required
              >
                <option value="UPI">UPI</option>
                <option value="Card">Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cash">Cash</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Payment Status *
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full text-sm rounded-xl border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                required
              >
                <option value="Successful">Successful</option>
                <option value="Pending">Pending</option>
                <option value="Failed">Failed</option>
              </select>
            </div>
          </div>

          {/* 4. Transaction Reference ID */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Transaction / Reference ID *
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
              placeholder="e.g. TXN-UPI-901284"
              className="w-full text-sm font-mono rounded-xl border border-slate-300 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* 5. Payment Date */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Payment Date & Time *
            </label>
            <input
              type="text"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              placeholder="YYYY-MM-DD HH:MM:SS"
              className="w-full text-sm rounded-xl border border-slate-300 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* 6. Notes */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Notes / Audit Memo
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Cleared via corporate account NEFT"
              className="w-full text-sm rounded-xl border border-slate-300 px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Modal Footer Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md shadow-blue-500/20 disabled:opacity-60 flex items-center gap-2 transition-all"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Recording...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Record Payment
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

