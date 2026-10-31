import React, { useState, useEffect } from 'react';
import { financeApi } from '../services/financeApi';
import StatCard from '../components/StatCard';
import {
  MonthlyRevenueTrendChart,
  RevenueByMethodChart,
  PaymentStatusDistributionChart
} from '../components/RevenueChart';
import { formatCurrency, formatDateTime, getStatusBadgeClass } from '../utils/financeCalculations';
import {
  DollarSign, Clock, AlertTriangle, CheckCircle2,
  TrendingUp, Plus, RefreshCw, ArrowRight, ShieldCheck
} from 'lucide-react';
import PaymentForm from '../components/PaymentForm';

export default function FinanceDashboard({ onNavigateToPayments, onNavigateToInvoices }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboardData = async () => {
    try {
      setRefreshing(true);
      const res = await financeApi.getDashboard();
      setData(res);
      setError(null);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setError(err.message || 'Error loading dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleResetData = async () => {
    if (confirm('Reset demo database to original sample records?')) {
      await financeApi.resetDatabase();
      loadDashboardData();
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-600">Calculating real-time financial metrics...</p>
        </div>
      </div>
    );
  }

  const { kpi, charts, recent_transactions } = data || {
    kpi: {},
    charts: {},
    recent_transactions: []
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Finance & Revenue Dashboard</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Live Data
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time financial indicators, revenue collections, overdue tracking, and transaction history.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadDashboardData}
            disabled={refreshing}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            title="Refresh dashboard"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsPaymentModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            Record Payment
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center justify-between">
          <span>Failed to fetch live data: {error}</span>
          <button onClick={loadDashboardData} className="underline font-semibold">Retry</button>
        </div>
      )}

      {/* 5 KPI StatCards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Collected Revenue"
          value={formatCurrency(kpi.collected_revenue)}
          subtitle="Successful payments only"
          icon={DollarSign}
          variant="emerald"
        />

        <StatCard
          title="Outstanding Balance"
          value={formatCurrency(kpi.outstanding_balance)}
          subtitle={`Across ${kpi.total_invoiced ? formatCurrency(kpi.total_invoiced) : ''} billed`}
          icon={Clock}
          variant="blue"
        />

        <StatCard
          title="Overdue Balance"
          value={formatCurrency(kpi.overdue_balance)}
          subtitle={`${kpi.overdue_count} overdue invoices`}
          icon={AlertTriangle}
          variant="rose"
        />

        <StatCard
          title="Successful Payments"
          value={kpi.successful_payment_count}
          subtitle="Completed transactions"
          icon={CheckCircle2}
          variant="purple"
        />

        <StatCard
          title="Collection Rate"
          value={`${kpi.collection_rate}%`}
          subtitle="Collected vs total billed"
          icon={TrendingUp}
          variant="amber"
        />
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue Trend */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Monthly Revenue Trend</h2>
              <p className="text-xs text-slate-500">Collected subscription revenue grouped by month</p>
            </div>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
              Live Aggregation
            </span>
          </div>
          <MonthlyRevenueTrendChart data={charts.monthly_trend} />
        </div>

        {/* Payment Status Distribution */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-slate-900">Payment Status Distribution</h2>
            <p className="text-xs text-slate-500">Breakdown of recorded transactions</p>
          </div>
          <PaymentStatusDistributionChart data={charts.status_distribution} />
        </div>
      </div>

      {/* Revenue by Method & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Method Breakdown BarChart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-slate-900">Revenue by Payment Method</h2>
            <p className="text-xs text-slate-500">Volume processed across channels</p>
          </div>
          <RevenueByMethodChart data={charts.revenue_by_method} />
        </div>

        {/* Recent Transactions Feed */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Recent Transactions</h2>
                <p className="text-xs text-slate-500">Latest recorded payments across invoices</p>
              </div>
              <button
                onClick={onNavigateToPayments}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                View All <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="pb-2.5">Customer & Invoice</th>
                    <th className="pb-2.5">Method</th>
                    <th className="pb-2.5 text-right">Amount</th>
                    <th className="pb-2.5 text-center">Status</th>
                    <th className="pb-2.5 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recent_transactions && recent_transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5">
                        <div className="font-semibold text-slate-800">{t.customer_name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{t.invoice_number}</div>
                      </td>
                      <td className="py-2.5 text-slate-600">{t.payment_method}</td>
                      <td className="py-2.5 text-right font-bold text-slate-900">
                        {formatCurrency(t.amount)}
                      </td>
                      <td className="py-2.5 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${getStatusBadgeClass(t.status)}`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="py-2.5 text-right text-slate-400 text-[11px]">
                        {formatDateTime(t.payment_date)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span>Synchronized with shared invoice & customer registries</span>
            <button
              onClick={handleResetData}
              className="text-slate-400 hover:text-slate-600 text-[11px] underline"
            >
              Reset Seed Data
            </button>
          </div>
        </div>
      </div>

      {/* Payment Form Modal */}
      <PaymentForm
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSuccess={loadDashboardData}
      />
    </div>
  );
}

