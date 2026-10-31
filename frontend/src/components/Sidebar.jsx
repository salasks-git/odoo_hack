import React from 'react';
import {
  LayoutGrid, LayoutDashboard, CreditCard, Receipt,
  FileText, AlertTriangle, TrendingUp, FileSpreadsheet,
  Bell, Settings, ChevronLeft, ChevronRight, Coins,
  Sparkles
} from 'lucide-react';

export default function Sidebar({
  currentPage,
  onNavigate,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile
}) {
  const navigationGroups = [
    {
      group: 'MAIN',
      items: [
        { id: 'overview', label: 'Overview', icon: LayoutGrid },
        { id: 'dashboard', label: 'Finance Dashboard', icon: LayoutDashboard }
      ]
    },
    {
      group: 'FINANCIAL MANAGEMENT',
      items: [
        { id: 'payments', label: 'Payments', icon: CreditCard },
        { id: 'transactions', label: 'All Transactions', icon: Receipt },
        { id: 'invoices', label: 'Invoice Tracking', icon: FileText },
        { id: 'overdue', label: 'Overdue Invoices', icon: AlertTriangle, badge: 'Alert' }
      ]
    },
    {
      group: 'ANALYTICS & REPORTS',
      items: [
        { id: 'analytics', label: 'Revenue Analytics', icon: TrendingUp },
        { id: 'reports', label: 'Financial Reports', icon: FileSpreadsheet }
      ]
    },
    {
      group: 'OTHER',
      items: [
        { id: 'notifications', label: 'Notifications', icon: Bell, badge: '3' },
        { id: 'settings', label: 'Settings', icon: Settings }
      ]
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs md:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 bg-white border-r border-slate-200/90 flex flex-col transition-all duration-300 ease-in-out shadow-xs ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        {/* Brand / Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 shrink-0 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-600 flex items-center justify-center text-white shadow-sm shadow-indigo-500/30">
              <Coins className="w-5 h-5" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-extrabold text-sm tracking-tight text-slate-900 truncate">
                  orbit<span className="text-indigo-600">.finance</span>
                </span>
                <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">
                  Admin Workspace
                </span>
              </div>
            )}
          </div>

          {/* Desktop Toggle Button */}
          <button
            onClick={onToggleCollapse}
            className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin">
          {navigationGroups.map((group) => (
            <div key={group.group} className="space-y-1">
              {!isCollapsed ? (
                <p className="px-3 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                  {group.group}
                </p>
              ) : (
                <div className="w-4 h-0.5 bg-slate-200 mx-auto my-2 rounded" />
              )}

              <div className="space-y-1 mt-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPage === item.id;

                  return (
                    <div key={item.id} className="relative group">
                      <button
                        onClick={() => {
                          onNavigate(item.id);
                          onCloseMobile?.();
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all relative ${
                          isActive
                            ? 'bg-indigo-50/90 text-indigo-700 font-bold shadow-xs'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        } ${isCollapsed ? 'justify-center px-0' : ''}`}
                      >
                        {/* Active Indicator Bar */}
                        {isActive && (
                          <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-indigo-600 rounded-r-md" />
                        )}

                        <Icon
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'
                          }`}
                        />

                        {!isCollapsed && (
                          <span className="truncate flex-1 text-left">{item.label}</span>
                        )}

                        {!isCollapsed && item.badge && (
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                              item.badge === 'Alert'
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>

                      {/* Floating Tooltip in Collapsed State */}
                      {isCollapsed && (
                        <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap top-1/2 -translate-y-1/2">
                          {item.label}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar Footer / User Profile */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/60">
          <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : 'px-2'}`}>
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0 border border-indigo-200">
              M3
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-800 truncate">Member 3</p>
                <p className="text-[10px] text-slate-400 truncate">Finance Lead</p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
