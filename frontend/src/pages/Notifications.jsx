import React from 'react';
import { Bell, AlertTriangle, CheckCircle, Clock, Info, ShieldCheck } from 'lucide-react';

export default function Notifications() {
  const notifications = [
    {
      id: 1,
      title: 'Invoice Past Due Warning',
      message: 'Invoice INV-0003 for Vikram Malhotra (₹30,600.00) is now 36 days past its due date.',
      time: '10 minutes ago',
      type: 'warning',
      unread: true
    },
    {
      id: 2,
      title: 'Successful Payment Settled',
      message: 'Payment of $50,000.00 (TXN-881920-ICICI) against invoice INV-0007 was confirmed via Bank Transfer.',
      time: '2 hours ago',
      type: 'success',
      unread: true
    },
    {
      id: 3,
      title: 'Failed Payment Gateway Attempt',
      message: 'Card processing failed for Elena Rostova on invoice INV-0004 ($20,740.00). Reason: Card expired.',
      time: '1 day ago',
      type: 'error',
      unread: true
    },
    {
      id: 4,
      title: 'Recurring Billing Run Completed',
      message: 'Member 2 automated billing run generated 4 new period invoices for active monthly subscriptions.',
      time: '2 days ago',
      type: 'info',
      unread: false
    }
  ];

  const getIcon = (type) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="w-4 h-4 text-rose-500" />;
      case 'success': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'error': return <AlertTriangle className="w-4 h-4 text-rose-600" />;
      default: return <Info className="w-4 h-4 text-indigo-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Alerts & Logs</span>
          <h1 className="text-xl font-black text-slate-900 mt-1">Notifications Center</h1>
          <p className="text-xs text-slate-500 mt-0.5">Automated financial alerts, payment events, and collection warnings.</p>
        </div>
        <button
          onClick={() => alert('All notifications marked as read')}
          className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
        >
          Mark all as read
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
        {notifications.map((n) => (
          <div key={n.id} className={`p-4 flex items-start gap-3.5 transition-colors ${n.unread ? 'bg-indigo-50/20' : 'hover:bg-slate-50/80'}`}>
            <div className="p-2 rounded-xl bg-slate-100 shrink-0 mt-0.5">
              {getIcon(n.type)}
            </div>
            <div className="flex-1 text-xs">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900">{n.title}</h4>
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {n.time}
                </span>
              </div>
              <p className="text-slate-600 mt-1">{n.message}</p>
            </div>
            {n.unread && <div className="w-2 h-2 rounded-full bg-indigo-600 mt-2 shrink-0" />}
          </div>
        ))}
      </div>
    </div>
  );
}
