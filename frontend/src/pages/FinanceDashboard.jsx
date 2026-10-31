import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import KPICard from '../components/KPICard';
import {
  MonthlyRevenueChart,
  PaymentStatusChart,
  RevenueByMethodChart
} from '../components/Charts';
import PaymentModal from '../components/PaymentModal';
import {
  DollarSign, Clock, CheckCircle2, AlertTriangle,
  Plus, RefreshCw, ArrowRight, CreditCard, ChevronRight
} from 'lucide-react';
import { formatCurrency, formatDateTime, getStatusBadgeClass, formatDate } from '../utils/formatters';

export default function FinanceDashboard({ onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.getDashboard();
      setData(res);
    } catch (e) {
      console.error('Failed to load dashboard data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePayOverdue = (invoiceId) => {
    setSelectedInvoiceId(invoiceId);
    setIsPaymentModalOpen(true);
  };

  const kpi = data?.kpi || {};
  const charts = data?.charts || {};
  const recentTransactions = data?.recent_transactions || [];
  const recentOverdue = data?.recent_overdue || [];

  return (
    <div className="space-y-6">
      {/* Top Header & Action */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Executive Overview</span>
          <h1 className="text-xl font-black text-slate-900 mt-1">Financial Management Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5">Real-time revenue metrics, collection rates, and overdue invoice tracking.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors"
            title="Refresh dashboard"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => {
              setSelectedInvoiceId(null);
              setIsPaymentModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Record Payment</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Revenue Collected"
          value={formatCurrency(kpi.collected_revenue)}
          subtitle="Cleared & verified payments"
          icon={DollarSign}
          variant="emerald"
        />

        <KPICard
          title="Outstanding Balance"
          value={formatCurrency(kpi.outstanding_balance)}
          subtitle={`Across ${formatCurrency(kpi.total_invoiced)} billed`}
          icon={Clock}
          variant="indigo"
        />

        <KPICard
          title="Successful Payments"
          value={kpi.successful_payment_count || 0}
          subtitle="Processed transactions"
          icon={CheckCircle2}
          variant="purple"
        />

        <KPICard
          title="Overdue Invoices"
          value={kpi.overdue_count || 0}
          subtitle={`Total: ${formatCurrency(kpi.overdue_balance)}`}
          icon={AlertTriangle}
          variant="rose"
        />
      </div>

      {/* Charts Grid: Monthly Line & Payment Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Monthly Revenue Trend</h3>
              <p className="text-xs text-slate-500">Collected revenue grouped by billing month</p>
            </div>
            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg">
              Live Aggregate
            </span>
          </div>
          <MonthlyRevenueChart data={charts.monthly_trend} />
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900">Payment Status Distribution</h3>
            <p className="text-xs text-slate-500">Breakdown of recorded attempts</p>
          </div>
          <PaymentStatusChart data={charts.status_distribution} />
        </div>
      </div>

      {/* Revenue by Method & Recent Overdue Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900">Revenue by Payment Method</h3>
            <p className="text-xs text-slate-500">Total processed by payment channel</p>
          </div>
          <RevenueByMethodChart data={charts.revenue_by_method} />
        </div>

        {/* Recent Overdue Invoices Section */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Recent Overdue Invoices</h3>
                <p className="text-xs text-slate-500">Accounts with unpaid balances past due date</p>
              </div>
              <button
                onClick={() => onNavigate('overdue')}
                className="text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1"
              >
                View All Overdue ({kpi.overdue_count}) <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="pb-2">Invoice #</th>
                    <th className="pb-2">Customer</th>
                    <th className="pb-2">Due Date</th>
                    <th className="pb-2 text-right">Balance</th>
                    <th className="pb-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentOverdue.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400">
                        No overdue invoices found!
                      </td>
                    </tr>
                  ) : (
                    recentOverdue.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/70">
                        <td className="py-2.5 font-mono font-bold text-slate-800">
                          {inv.number || inv.invoice_number}
                        </td>
                        <td className="py-2.5 text-slate-800 font-medium">
                          {inv.customer_name}
                        </td>
                        <td className="py-2.5 text-rose-600 font-semibold">
                          {formatDate(inv.due_date)}
                        </td>
                        <td className="py-2.5 text-right font-black text-rose-600">
                          {formatCurrency(inv.remaining_balance)}
                        </td>
                        <td className="py-2.5 text-right">
                          <button
                            onClick={() => handlePayOverdue(inv.id)}
                            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg text-[11px] inline-flex items-center gap-1 transition-colors"
                          >
                            <CreditCard className="w-3 h-3" /> Pay
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span>Verified in accordance with Member 2 invoicing rules</span>
            <button
              onClick={() => onNavigate('invoices')}
              className="text-indigo-600 hover:underline font-bold"
            >
              All Invoices →
            </button>
          </div>
        </div>
      </div>

      {/* Recent Payment Transactions Table */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent Payment Transactions</h3>
            <p className="text-xs text-slate-500">Latest recorded payments across invoices</p>
          </div>
          <button
            onClick={() => onNavigate('payments')}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            All Payments <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                <th className="pb-2.5">Transaction ID</th>
                <th className="pb-2.5">Invoice #</th>
                <th className="pb-2.5">Customer</th>
                <th className="pb-2.5">Method</th>
                <th className="pb-2.5 text-right">Amount</th>
                <th className="pb-2.5 text-center">Status</th>
                <th className="pb-2.5 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentTransactions.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/70">
                  <td className="py-3 font-mono font-bold text-slate-800">
                    {t.transaction_id}
                  </td>
                  <td className="py-3 font-semibold text-indigo-600">
                    {t.invoice_number}
                  </td>
                  <td className="py-3 text-slate-800 font-medium">
                    {t.customer_name}
                  </td>
                  <td className="py-3 text-slate-600">
                    {t.payment_method}
                  </td>
                  <td className="py-3 text-right font-black text-slate-900">
                    {formatCurrency(t.amount)}
                  </td>
                  <td className="py-3 text-center">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${getStatusBadgeClass(t.status)}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="py-3 text-right text-slate-500">
                    {formatDateTime(t.payment_date)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Form Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSuccess={loadData}
        preselectedInvoiceId={selectedInvoiceId}
      />
    </div>
  );
}
