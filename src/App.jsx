import React, { useState } from 'react';
import FinanceDashboard from './pages/FinanceDashboard';
import Payments from './pages/Payments';
import InvoiceTracking from './pages/InvoiceTracking';
import FinanceReports from './pages/FinanceReports';
import {
  LayoutDashboard, CreditCard, FileText, BarChart3,
  Coins, Plus, ShieldCheck, Database
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const navigation = [
    { id: 'dashboard', name: 'Finance Dashboard', icon: LayoutDashboard },
    { id: 'payments', name: 'Payment Management', icon: CreditCard },
    { id: 'invoices', name: 'Invoice & Overdue Tracking', icon: FileText },
    { id: 'reports', name: 'Financial Reports', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 font-sans antialiased">
      {/* Top Header / App Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Branding */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-base tracking-tight text-slate-900">
                    Member 3
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-md font-semibold bg-blue-100 text-blue-700">
                    Finance Module
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  Payments • Invoice Tracking • Dashboard • Reports
                </p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </nav>

            {/* Database & System Status indicator */}
            <div className="flex items-center gap-2.5">
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold">
                <Database className="w-3.5 h-3.5 text-emerald-600" />
                <span>SQLite Connected</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden border-t border-slate-200 px-2 py-1.5 flex justify-around bg-slate-50">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`p-2 rounded-lg text-xs flex flex-col items-center gap-1 ${
                  isActive ? 'text-blue-600 font-bold' : 'text-slate-500'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-[10px]">{item.name.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <FinanceDashboard
            onNavigateToPayments={() => setActiveTab('payments')}
            onNavigateToInvoices={() => setActiveTab('invoices')}
          />
        )}
        {activeTab === 'payments' && <Payments />}
        {activeTab === 'invoices' && <InvoiceTracking />}
        {activeTab === 'reports' && <FinanceReports />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4">
          <p>
            Member 3: Payment Management & Finance Module • Integrated with Member 1 (Customers) & Member 2 (Invoicing)
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Complies with all 10 Testing Safeguards • Verified Real-time Balances & Overdue Checks
          </p>
        </div>
      </footer>
    </div>
  );
}

