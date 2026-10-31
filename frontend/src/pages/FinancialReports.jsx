import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { formatCurrency, formatDate, exportToCsv } from '../utils/formatters';
import { FileSpreadsheet, Download, RefreshCw, Calendar, X } from 'lucide-react';

export default function FinancialReports() {
  const [reportType, setReportType] = useState('daily_revenue');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const data = await api.getReports({
        report_type: reportType,
        start_date: startDate,
        end_date: endDate
      });
      setReportData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportType, startDate, endDate]);

  const handleExportCsv = () => {
    if (!reportData || !reportData.rows || !reportData.rows.length) {
      return alert('No report data to export');
    }
    const filename = `${reportType}_report_${new Date().toISOString().split('T')[0]}`;
    const headers = Object.keys(reportData.rows[0]);
    exportToCsv(filename, headers, reportData.rows);
  };

  const reportTabs = [
    { id: 'daily_revenue', label: 'Daily Revenue', desc: 'Day-by-day revenue breakdown by channel' },
    { id: 'monthly_revenue', label: 'Monthly Revenue', desc: 'Aggregated monthly collections' },
    { id: 'payment_history', label: 'Payment History', desc: 'Full transaction settlement log' },
    { id: 'outstanding_invoices', label: 'Outstanding Balance', desc: 'All invoices with remaining balances' },
    { id: 'overdue_invoices', label: 'Overdue Invoices', desc: 'Past-due accounts requiring collection' }
  ];

  const summary = reportData?.summary || {};
  const rows = reportData?.rows || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Compliance & Auditing</span>
          <h1 className="text-xl font-black text-slate-900 mt-1">Financial Reports & Exports</h1>
          <p className="text-xs text-slate-500 mt-0.5">Generate structured financial reports and download audit-ready CSV spreadsheets.</p>
        </div>
        <button
          onClick={handleExportCsv}
          disabled={!rows.length}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center gap-2 self-start sm:self-auto transition-all"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Report Selection Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {reportTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setReportType(tab.id)}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              reportType === tab.id
                ? 'bg-indigo-50/80 border-indigo-300 text-indigo-900 ring-2 ring-indigo-500/20 shadow-xs font-bold'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <p className="text-xs font-bold">{tab.label}</p>
            <p className="text-[10px] text-slate-400 mt-1 leading-snug">{tab.desc}</p>
          </button>
        ))}
      </div>

      {/* Date Filter & Summary Chips */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-xs text-slate-700 focus:outline-none"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-xs text-slate-700 focus:outline-none"
            />
            {(startDate || endDate) && (
              <button
                onClick={() => { setStartDate(''); setEndDate(''); }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Summary */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {summary.total_revenue !== undefined && (
            <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl">
              <span className="text-emerald-700 font-bold">Total Revenue: </span>
              <span className="font-black text-emerald-900">{formatCurrency(summary.total_revenue)}</span>
            </div>
          )}
          {summary.total_outstanding_amount !== undefined && (
            <div className="px-3 py-1.5 bg-indigo-50 border border-indigo-200 rounded-xl">
              <span className="text-indigo-700 font-bold">Outstanding Total: </span>
              <span className="font-black text-indigo-900">{formatCurrency(summary.total_outstanding_amount)}</span>
            </div>
          )}
          {summary.total_overdue_amount !== undefined && (
            <div className="px-3 py-1.5 bg-rose-50 border border-rose-200 rounded-xl">
              <span className="text-rose-700 font-bold">Overdue Total: </span>
              <span className="font-black text-rose-900">{formatCurrency(summary.total_overdue_amount)}</span>
            </div>
          )}
          {summary.total_transactions !== undefined && (
            <div className="px-3 py-1.5 bg-slate-100 rounded-xl font-bold text-slate-700">
              {summary.total_transactions} transactions
            </div>
          )}
        </div>
      </div>

      {/* Report Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
            Compiling report dataset...
          </div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs bg-slate-50">
            No records match the selected date parameters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {Object.keys(rows[0]).map((col) => (
                    <th key={col} className="py-3 px-4">
                      {col.replace(/_/g, ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    {Object.entries(row).map(([k, val], cellIdx) => {
                      const isNum = typeof val === 'number' && (k.includes('amount') || k.includes('revenue') || k.includes('balance'));
                      return (
                        <td key={cellIdx} className={`py-3.5 px-4 ${isNum ? 'font-bold text-slate-900' : 'text-slate-700'}`}>
                          {isNum ? formatCurrency(val) : String(val ?? '-')}
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
