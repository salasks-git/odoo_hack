import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  MonthlyRevenueChart,
  PaymentStatusChart,
  RevenueByMethodChart
} from '../components/Charts';
import { formatCurrency } from '../utils/formatters';
import { TrendingUp, DollarSign, Calendar, BarChart2, ArrowUpRight } from 'lucide-react';

export default function RevenueAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await api.getDashboard();
        setData(res);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const kpi = data?.kpi || {};
  const charts = data?.charts || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Financial Intelligence</span>
          <h1 className="text-xl font-black text-slate-900 mt-1">Revenue Analytics & Trends</h1>
          <p className="text-xs text-slate-500 mt-0.5">Deep financial insights into revenue velocity, channel yield, and settlement health.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1">
            <ArrowUpRight className="w-4 h-4" /> Healthy Collection Rate: {kpi.collection_rate}%
          </span>
        </div>
      </div>

      {/* Analytics KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-[10px] font-bold uppercase text-slate-400">Total Billed Volume</p>
          <p className="text-2xl font-black text-slate-900 mt-2 font-display">{formatCurrency(kpi.total_invoiced)}</p>
          <p className="text-xs text-slate-500 mt-1">Sum of all generated subscription invoices</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-[10px] font-bold uppercase text-emerald-600">Settled Revenue</p>
          <p className="text-2xl font-black text-emerald-700 mt-2 font-display">{formatCurrency(kpi.collected_revenue)}</p>
          <p className="text-xs text-emerald-600 mt-1 font-semibold">{kpi.collection_rate}% of all accounts receivable cleared</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-[10px] font-bold uppercase text-indigo-600">Pending & Outstanding</p>
          <p className="text-2xl font-black text-indigo-700 mt-2 font-display">{formatCurrency(kpi.outstanding_balance)}</p>
          <p className="text-xs text-slate-500 mt-1">Remaining balance across current invoicing cycles</p>
        </div>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900">Monthly Revenue Growth</h3>
          <p className="text-xs text-slate-500 mb-4">Trend of successful subscription payment collections over time</p>
          <MonthlyRevenueChart data={charts.monthly_trend} />
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900">Payment Channel Volume</h3>
          <p className="text-xs text-slate-500 mb-4">Total revenue captured by payment method</p>
          <RevenueByMethodChart data={charts.revenue_by_method} />
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900">Payment Processing Status Breakdown</h3>
        <p className="text-xs text-slate-500 mb-4">Proportion of transactions successfully settled versus pending or failed</p>
        <div className="max-w-md mx-auto">
          <PaymentStatusChart data={charts.status_distribution} />
        </div>
      </div>
    </div>
  );
}
