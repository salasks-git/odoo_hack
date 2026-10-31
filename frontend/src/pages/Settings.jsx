import React, { useState } from 'react';
import { Settings, Save, ShieldCheck, Check } from 'lucide-react';

export default function SettingsPage() {
  const [currency, setCurrency] = useState('USD');
  const [allowOverpayment, setAllowOverpayment] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">System Preferences</span>
          <h1 className="text-xl font-black text-slate-900 mt-1">Finance & Ledger Settings</h1>
          <p className="text-xs text-slate-500 mt-0.5">Configure financial safeguards, currency displays, and accounting defaults.</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6 text-xs">
        {saved && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 font-bold">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Preferences saved successfully!</span>
          </div>
        )}

        <div>
          <h3 className="text-sm font-bold text-slate-900 mb-1">Display Currency</h3>
          <p className="text-slate-500 mb-2">Standard currency symbol used across the finance dashboard and reports.</p>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-64 text-xs font-bold rounded-xl border border-slate-300 px-3 py-2 bg-white"
          >
            <option value="USD">USD ($) — United States Dollar</option>
            <option value="INR">INR (₹) — Indian Rupee</option>
            <option value="EUR">EUR (€) — Euro</option>
            <option value="GBP">GBP (£) — British Pound</option>
          </select>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Financial Safeguards & Overpayment Rules</h3>
          <p className="text-slate-500 mb-3">Enforce strict financial calculations according to Member 3 Build Plan specifications.</p>
          
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={!allowOverpayment}
              readOnly
              className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
            />
            <div>
              <p className="font-bold text-slate-800">Prevent unsupported overpayments (Strict Mode)</p>
              <p className="text-slate-400">Payments exceeding remaining invoice balance are blocked by backend validations.</p>
            </div>
          </label>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Supported Payment Methods</h3>
          <p className="text-slate-500 mb-3">Enabled payment methods for customer billing settlements.</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {['UPI', 'Card (Visa/Mastercard)', 'Bank Transfer (NEFT/RTGS)', 'Cash'].map(method => (
              <div key={method} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 font-bold flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>{method}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-2 shadow-sm shadow-indigo-500/20"
          >
            <Save className="w-4 h-4" /> Save Preferences
          </button>
        </div>
      </form>
    </div>
  );
}
