import React, { useState } from 'react';
import {
  Menu, Search, Bell, ChevronDown, User,
  Settings, LogOut, CheckCircle, ShieldCheck
} from 'lucide-react';

export default function Topbar({
  currentPage,
  onOpenMobile,
  globalSearch,
  onGlobalSearchChange,
  onNavigate
}) {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const pageBreadcrumbMap = {
    overview: { category: 'Main', title: 'System Overview' },
    dashboard: { category: 'Main', title: 'Finance Dashboard' },
    payments: { category: 'Financial Management', title: 'Payment Management' },
    transactions: { category: 'Financial Management', title: 'All Transactions' },
    invoices: { category: 'Financial Management', title: 'Invoice Tracking' },
    overdue: { category: 'Financial Management', title: 'Overdue Invoices' },
    analytics: { category: 'Analytics & Reports', title: 'Revenue Analytics' },
    reports: { category: 'Analytics & Reports', title: 'Financial Reports' },
    notifications: { category: 'Other', title: 'Notifications Center' },
    settings: { category: 'Other', title: 'Finance Settings' }
  };

  const crumb = pageBreadcrumbMap[currentPage] || { category: 'Workspace', title: 'Dashboard' };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 flex items-center justify-between">
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobile}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 md:hidden transition-colors"
          title="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Workspace</span>
            <span>/</span>
            <span className="text-slate-500 font-medium">{crumb.category}</span>
          </div>
          <h1 className="text-base font-bold text-slate-900 tracking-tight leading-tight">
            {crumb.title}
          </h1>
        </div>
      </div>

      {/* Right Tools: Global Search, Notification, Profile */}
      <div className="flex items-center gap-3">
        {/* Global Search Bar */}
        <div className="hidden sm:flex items-center relative w-64 lg:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search records, invoices, txns..."
            value={globalSearch}
            onChange={(e) => onGlobalSearchChange(e.target.value)}
            className="w-full text-xs pl-9 pr-14 py-2 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-slate-200/70 text-[10px] font-mono text-slate-500">
            ⌘K
          </div>
        </div>

        {/* Notifications Icon Button */}
        <button
          onClick={() => onNavigate('notifications')}
          className="relative p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
        </button>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
              M3
            </div>
            <div className="hidden lg:block text-left text-xs">
              <p className="font-bold text-slate-800 leading-tight">Finance Admin</p>
              <p className="text-[10px] text-slate-400">Team Member 3</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {/* Profile Dropdown Menu */}
          {profileDropdownOpen && (
            <div
              className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 text-xs text-slate-700 z-50 animate-fade-in"
              onMouseLeave={() => setProfileDropdownOpen(false)}
            >
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                <p className="font-bold text-slate-900">Signed in as</p>
                <p className="text-[11px] text-indigo-600 font-medium truncate">member3@subscription.internal</p>
                <span className="inline-block mt-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700">
                  Role: Finance Administrator
                </span>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    onNavigate('settings');
                    setProfileDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 text-left"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  <span>Finance Settings</span>
                </button>
                <button
                  onClick={() => {
                    onNavigate('notifications');
                    setProfileDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 text-left"
                >
                  <Bell className="w-4 h-4 text-slate-400" />
                  <span>Notification Center</span>
                </button>
              </div>

              <div className="border-t border-slate-100 pt-1">
                <button
                  onClick={() => setProfileDropdownOpen(false)}
                  className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-rose-50 text-rose-600 text-left font-semibold"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
