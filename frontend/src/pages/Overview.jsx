import React from 'react';
import { ArrowRight, RefreshCw, FileText, CheckCircle2, Clock } from 'lucide-react';

export default function Overview({ onNavigate }) {
  const subscriptions = [
    { number: 'SUB-0008', customer: 'Aarav Mehta', plan: 'Monthly Essential', next: '02 Nov 2026', status: 'Active' },
    { number: 'SUB-0007', customer: 'Nisha Kapoor', plan: 'Weekly Studio', next: 'Today', status: 'Confirmed' },
    { number: 'SUB-0006', customer: 'Rohan Shah', plan: 'Monthly Essential', next: '18 Nov 2026', status: 'Quotation' },
  ];

  const invoices = [
    { number: 'INV-0012', customer: 'Aarav Mehta', date: '02 Oct 2026', amount: '₹1,414.82', status: 'Confirmed' },
    { number: 'INV-0011', customer: 'Nisha Kapoor', date: '17 Oct 2026', amount: '₹588.82', status: 'Paid' },
    { number: 'INV-0010', customer: 'Rohan Shah', date: '01 Oct 2026', amount: '₹2,829.64', status: 'Draft' },
  ];

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Your Billing Workspace</span>
          <h1 className="text-xl font-black text-slate-900 mt-1">Subscription & Invoicing Overview</h1>
          <p className="text-xs text-slate-500 mt-0.5">High-level activity across active subscriptions and generated billing cycles.</p>
        </div>
        <button
          onClick={() => onNavigate('dashboard')}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 flex items-center gap-2 self-start sm:self-auto transition-all"
        >
          <span>Open Finance Dashboard</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase text-slate-400">Active Subscriptions</p>
          <h3 className="text-2xl font-black text-slate-900 mt-2">6</h3>
          <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Currently billing
          </p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase text-slate-400">Due to Bill</p>
          <h3 className="text-2xl font-black text-slate-900 mt-2">2</h3>
          <p className="text-xs text-amber-600 font-semibold mt-1 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Ready for billing run
          </p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase text-slate-400">Outstanding Invoices</p>
          <h3 className="text-2xl font-black text-slate-900 mt-2">₹4,244.46</h3>
          <p className="text-xs text-blue-600 font-semibold mt-1 flex items-center gap-1">
            <FileText className="w-3.5 h-3.5" /> Draft and confirmed
          </p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase text-slate-400">Collected Revenue</p>
          <h3 className="text-2xl font-black text-slate-900 mt-2">₹8,910.25</h3>
          <p className="text-xs text-purple-600 font-semibold mt-1 flex items-center gap-1">
            <RefreshCw className="w-3.5 h-3.5" /> Paid invoices
          </p>
        </div>
      </div>

      {/* Grid: Lifecycle & Upcoming */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subscription Lifecycle */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900">Subscription Lifecycle</h3>
          <p className="text-xs text-slate-500 mt-0.5">Every subscription transitions through this strict sequence.</p>

          <div className="flex items-center justify-between my-6 px-2">
            {['Draft', 'Quotation', 'Confirmed', 'Active', 'Closed'].map((s, i) => (
              <React.Fragment key={s}>
                <div className="flex flex-col items-center gap-1.5">
                  <span className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center ${
                    i === 3 ? 'bg-indigo-600 text-white ring-4 ring-indigo-100' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {i + 1}
                  </span>
                  <span className={`text-[10px] font-bold ${i === 3 ? 'text-indigo-600' : 'text-slate-400'}`}>
                    {s}
                  </span>
                </div>
                {i < 4 && <div className="h-0.5 flex-1 bg-slate-200 mx-1" />}
              </React.Fragment>
            ))}
          </div>
          <p className="text-[11px] text-slate-400 italic">The backend allows only the next status in this sequence.</p>
        </div>

        {/* Upcoming Billing */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900">Upcoming Billing</h3>
          <p className="text-xs text-slate-500 mt-0.5">Next subscription periods scheduled to bill.</p>

          <div className="mt-4 divide-y divide-slate-100">
            {subscriptions.slice(0, 3).map((sub, i) => (
              <div key={sub.number} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-[10px]">
                    {sub.customer.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{sub.customer}</p>
                    <p className="text-[10px] text-slate-400">{sub.number} • {sub.plan}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-800">{sub.next}</p>
                  <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700">
                    {sub.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
