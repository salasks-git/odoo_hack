import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';

// Pages
import Overview from './pages/Overview';
import FinanceDashboard from './pages/FinanceDashboard';
import Payments from './pages/Payments';
import AllTransactions from './pages/AllTransactions';
import InvoiceTracking from './pages/InvoiceTracking';
import OverdueInvoices from './pages/OverdueInvoices';
import RevenueAnalytics from './pages/RevenueAnalytics';
import FinancialReports from './pages/FinancialReports';
import Notifications from './pages/Notifications';
import SettingsPage from './pages/Settings';

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'overview':
        return <Overview onNavigate={setCurrentPage} />;
      case 'dashboard':
        return <FinanceDashboard onNavigate={setCurrentPage} />;
      case 'payments':
        return <Payments />;
      case 'transactions':
        return <AllTransactions />;
      case 'invoices':
        return <InvoiceTracking />;
      case 'overdue':
        return <OverdueInvoices />;
      case 'analytics':
        return <RevenueAnalytics />;
      case 'reports':
        return <FinancialReports />;
      case 'notifications':
        return <Notifications />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <FinanceDashboard onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans antialiased">
      {/* Fixed Collapsible Left Sidebar */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      {/* Main Layout Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'
        }`}
      >
        {/* Sticky Topbar */}
        <Topbar
          currentPage={currentPage}
          onOpenMobile={() => setIsMobileOpen(true)}
          globalSearch={globalSearch}
          onGlobalSearchChange={setGlobalSearch}
          onNavigate={setCurrentPage}
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto animate-fade-in">
          {renderCurrentPage()}
        </main>

        {/* Footer */}
        <footer className="h-12 border-t border-slate-200/80 bg-white/60 px-6 flex items-center justify-between text-xs text-slate-400">
          <span>Member 3 • Finance Management & Invoicing Admin</span>
          <span>Integrated with Member 1 (Auth/Users) & Member 2 (Billing)</span>
        </footer>
      </div>
    </div>
  );
}
