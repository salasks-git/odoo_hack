import React, { useState, useEffect } from 'react';
import { financeApi } from '../services/financeApi';
import { formatCurrency, formatDate, exportToCsv } from '../utils/financeCalculations';
import DateFilter from '../components/DateFilter';
import {
  FileSpreadsheet, Download, RefreshCw, Calendar,
  DollarSign, TrendingUp, AlertTriangle, Layers
} from 'lucide-react';

export default function FinanceReports() {
  const [reportType, setReportType] = useState('daily_revenue');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = { report_type: reportType };
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const data = await financeApi.getReports(params);
      setReportData(data);
    } catch (err) {
      console.error('Failed to load report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportType, startDate, endDate]);

  const handleExportCsv = () => {
    if (!reportData || !reportData.rows || !reportData.rows.length) {
      alert('No data to export');
      return;
    }

    const filename = `${reportType}_report_${new Date().toISOString().split('T')[0]}`;
    const headers = Object.keys(reportData.rows[0]);
    exportToCsv(filename, headers, reportData.rows);
  };

  const reportTabs = [
    { id: 'daily_revenue', label: 'Daily Revenue', desc: 'Day-by-day revenue by payment method' },
    { id: 'monthly_revenue', label: 'Monthly Revenue', desc: 'Aggregated monthly collections' },
    { id: 'payment_history', label: 'Payment History', desc: 'Comprehensive transaction log' },
    { id: 'outstanding_invoices', label: 'Outstanding Invoices', desc: 'All invoices with unpaid balances' },
    { id: 'overdue_invoices', label: 'Overdue Invoices', desc: 'Invoices past due date with balance' }
  ];

  const summary = reportData?.summary || {};
  const rows = reportData?.rows || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Financial Reports & Exports</h1>
          <p className="text-xs text-slate-500 mt-1">
            Generate verifiable revenue reports, payment audits, and outstanding balance summaries.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          disabled={!rows.length}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-emerald-500/20 flex items-center gap-2 self-start sm:self-auto transition-all"
        >
          <Download className="w-4 h-4" />
          Export to CSV
        </button>
      </div>

      {/* Report Type Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {reportTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setReportType(tab.id)}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              reportType === tab.id
                ? 'bg-blue-50/70 border-blue-400 text-blue-900 shadow-sm ring-2 ring-blue-500/20'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <p className="text-xs font-bold">{tab.label}</p>
            <p className="text-[11px] text-slate-400 mt-1 leading-snug">{tab.desc}</p>
          </button>
        ))}
      </div>

      {/* Date Filter & Summary Banner */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
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

        {/* Dynamic Summary Cards */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          {reportType === 'daily_revenue' && (
            <>
              <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                <span className="text-emerald-700 font-medium">Total Revenue: </span>
                <span className="font-bold text-emerald-900">{formatCurrency(summary.total_revenue)}</span>
              </div>
              <div className="px-3 py-1.5 bg-slate-100 rounded-xl">
                <span className="text-slate-500 font-medium">Transactions: </span>
                <span className="font-bold text-slate-900">{summary.total_transactions}</span>
              </div>
            </>
          )}

          {reportType === 'monthly_revenue' && (
            <>
              <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                <span className="text-emerald-700 font-medium">Total Revenue: </span>
                <span className="font-bold text-emerald-900">{formatCurrency(summary.total_revenue)}</span>
              </div>
              <div className="px-3 py-1.5 bg-slate-100 rounded-xl">
                <span className="text-slate-500 font-medium">Monthly Avg: </span>
                <span className="font-bold text-slate-900">{formatCurrency(summary.average_monthly)}</span>
              </div>
            </>
          )}

          {reportType === 'payment_history' && (
            <>
              <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                <span className="text-emerald-700 font-medium">Successful Collected: </span>
                <span className="font-bold text-emerald-900">{formatCurrency(summary.total_collected)}</span>
              </div>
              <div className="px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-xl">
                <span className="text-purple-700 font-medium">Total Records: </span>
                <span className="font-bold text-purple-900">{summary.total_records}</span>
              </div>
            </>
          )}

          {reportType === 'outstanding_invoices' && (
            <>
              <div className="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-xl">
                <span className="text-blue-700 font-medium">Outstanding Total: </span>
                <span className="font-bold text-blue-900">{formatCurrency(summary.total_outstanding_amount)}</span>
              </div>
              <div className="px-3 py-1.5 bg-rose-50 border border-rose-200 rounded-xl">
                <span className="text-rose-700 font-medium">Overdue Accounts: </span>
                <span className="font-bold text-rose-900">{summary.overdue_count}</span>
              </div>
            </>
          )}

          {reportType === 'overdue_invoices' && (
            <>
              <div className="px-3 py-1.5 bg-rose-50 border border-rose-200 rounded-xl">
                <span className="text-rose-700 font-medium">Total Overdue: </span>
                <span className="font-bold text-rose-900">{formatCurrency(summary.total_overdue_amount)}</span>
              </div>
              <div className="px-3 py-1.5 bg-slate-100 rounded-xl">
                <span className="text-slate-500 font-medium">Overdue Invoices: </span>
                <span className="font-bold text-slate-900">{summary.total_overdue_invoices}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Report Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Compiling financial report...
          </div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm bg-slate-50">
            No records found for the selected reporting parameters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  {Object.keys(rows[0]).map((col) => (
                    <th key={col} className="py-3 px-4">
                      {col.replace(/_/g, ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {rows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    {Object.entries(row).map(([key, val], cellIdx) => {
                      const isAmount = typeof val === 'number' && (key.includes('amount') || key.includes('revenue') || key.includes('balance'));
                      return (
                        <td key={cellIdx} className={`py-3 px-4 text-xs ${isAmount ? 'font-bold text-slate-900' : 'text-slate-700'}`}>
                          {isAmount ? formatCurrency(val) : String(val ?? '-')}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

