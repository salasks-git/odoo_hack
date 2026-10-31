import React, { useState, useEffect } from 'react';
import { financeApi } from '../services/financeApi';
import PaymentTable from '../components/PaymentTable';
import PaymentForm from '../components/PaymentForm';
import DateFilter from '../components/DateFilter';
import { formatCurrency, formatDateTime, getStatusBadgeClass } from '../utils/financeCalculations';
import { Plus, Search, Filter, RefreshCw, X, Receipt, CheckCircle, AlertTriangle } from 'lucide-react';

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [selectedPaymentDetail, setSelectedPaymentDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== 'all') params.status = statusFilter;
      if (methodFilter !== 'all') params.payment_method = methodFilter;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const res = await financeApi.getPayments(params);
      setPayments(res.data || []);
      setTotalCount(res.pagination?.total || 0);
    } catch (err) {
      console.error('Error fetching payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [statusFilter, methodFilter, startDate, endDate]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchPayments();
  };

  const handleViewPayment = async (id) => {
    setDetailLoading(true);
    try {
      const detail = await financeApi.getPayment(id);
      setSelectedPaymentDetail(detail);
    } catch (err) {
      alert('Failed to load payment detail: ' + err.message);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Payment Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Record, track, search, and audit financial payments made against subscription invoices.
          </p>
        </div>
        <button
          onClick={() => setIsRecordModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 flex items-center gap-2 self-start sm:self-auto transition-all"
        >
          <Plus className="w-4 h-4" />
          Record Payment
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by transaction ID, invoice #, customer name, notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            />
          </form>

          {/* Status Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs py-2 px-3 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="Successful">Successful</option>
              <option value="Pending">Pending</option>
              <option value="Failed">Failed</option>
              <option value="Refunded">Refunded</option>
            </select>
          </div>

          {/* Payment Method Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Method:</span>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="text-xs py-2 px-3 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Methods</option>
              <option value="UPI">UPI</option>
              <option value="Card">Card</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cash">Cash</option>
            </select>
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchPayments}
            className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Date Filter Bar */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <DateFilter
            startDate={startDate}
            endDate={endDate}
            onDateChange={(s, e) => {
              setStartDate(s);
              setEndDate(e);
            }}
            onClear={() => {
              setStartDate('');
              setEndDate('');
            }}
          />
          <div className="text-xs font-semibold text-slate-500">
            Total records: <span className="text-slate-900">{totalCount}</span>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <PaymentTable
          payments={payments}
          loading={loading}
          onViewPayment={handleViewPayment}
        />
      </div>

      {/* Record Payment Form Modal */}
      <PaymentForm
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        onSuccess={fetchPayments}
      />

      {/* Payment Detail Modal */}
      {selectedPaymentDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-blue-600" />
                <h2 className="text-base font-bold text-slate-900">Payment Audit Details</h2>
              </div>
              <button
                onClick={() => setSelectedPaymentDetail(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {/* Payment Summary Header */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/90 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 uppercase tracking-wider text-[10px] font-bold block mb-1">
                    Amount Processed
                  </span>
                  <div className="text-2xl font-bold text-slate-900">
                    {formatCurrency(selectedPaymentDetail.payment.amount)}
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-3 py-1 rounded-full font-bold text-xs ${getStatusBadgeClass(selectedPaymentDetail.payment.status)}`}>
                    {selectedPaymentDetail.payment.status}
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-1">
                    {selectedPaymentDetail.payment.payment_method}
                  </span>
                </div>
              </div>

              {/* Core Information Grid */}
              <div className="grid grid-cols-2 gap-3 bg-white p-3 border border-slate-100 rounded-xl">
                <div>
                  <p className="text-slate-400 font-semibold uppercase text-[10px]">Transaction ID</p>
                  <p className="font-mono font-bold text-slate-800 text-xs mt-0.5">
                    {selectedPaymentDetail.payment.transaction_id || `ID #${selectedPaymentDetail.payment.id}`}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 font-semibold uppercase text-[10px]">Timestamp</p>
                  <p className="font-medium text-slate-700 text-xs mt-0.5">
                    {formatDateTime(selectedPaymentDetail.payment.payment_date)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 font-semibold uppercase text-[10px]">Customer</p>
                  <p className="font-semibold text-slate-800 text-xs mt-0.5">
                    {selectedPaymentDetail.payment.customer_name}
                  </p>
                  <p className="text-slate-400 text-[11px]">{selectedPaymentDetail.payment.customer_company}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-semibold uppercase text-[10px]">Invoice Ref</p>
                  <p className="font-semibold text-blue-600 text-xs mt-0.5">
                    {selectedPaymentDetail.payment.invoice_number}
                  </p>
                  <p className="text-slate-400 text-[11px]">Due: {selectedPaymentDetail.payment.invoice_due_date}</p>
                </div>
              </div>

              {/* Notes */}
              {selectedPaymentDetail.payment.notes && (
                <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl">
                  <span className="font-semibold text-blue-800 block mb-0.5">Audit Note:</span>
                  <span className="text-slate-700">{selectedPaymentDetail.payment.notes}</span>
                </div>
              )}

              {/* Associated Invoice Current Balance */}
              <div className="border-t border-slate-100 pt-3">
                <h4 className="font-bold text-slate-800 mb-2">Invoice Balance Status</h4>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1.5 text-slate-600">
                  <div className="flex justify-between">
                    <span>Total Billed:</span>
                    <span className="font-medium text-slate-800">{formatCurrency(selectedPaymentDetail.invoice.total_amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Paid to Date:</span>
                    <span className="font-medium text-emerald-600">{formatCurrency(selectedPaymentDetail.invoice.amount_paid)}</span>
                  </div>
                  <div className="flex justify-between font-bold pt-1 border-t border-slate-200 text-slate-900">
                    <span>Remaining Balance:</span>
                    <span className={selectedPaymentDetail.invoice.remaining_balance > 0 ? 'text-blue-600' : 'text-slate-600'}>
                      {formatCurrency(selectedPaymentDetail.invoice.remaining_balance)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Related Payments on Same Invoice */}
              {selectedPaymentDetail.related_payments && selectedPaymentDetail.related_payments.length > 0 && (
                <div className="border-t border-slate-100 pt-3">
                  <h4 className="font-bold text-slate-800 mb-2">Other Payments On This Invoice</h4>
                  <div className="space-y-1.5">
                    {selectedPaymentDetail.related_payments.map(rp => (
                      <div key={rp.id} className="p-2 bg-slate-50 rounded-lg flex items-center justify-between text-xs">
                        <div>
                          <span className="font-mono text-slate-700 font-semibold">{rp.transaction_id}</span>
                          <span className="text-slate-400 ml-2">({rp.payment_method})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{formatCurrency(rp.amount)}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${getStatusBadgeClass(rp.status)}`}>
                            {rp.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedPaymentDetail(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-xl text-xs transition-colors"
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

