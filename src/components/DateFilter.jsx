import React from 'react';
import { Calendar, X } from 'lucide-react';

export default function DateFilter({ startDate, endDate, onDateChange, onClear }) {
  const setPreset = (preset) => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (preset === 'all') {
      onClear();
      return;
    }

    if (preset === 'this-month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      onDateChange(firstDay, todayStr);
    } else if (preset === 'last-30') {
      const past = new Date();
      past.setDate(today.getDate() - 30);
      onDateChange(past.toISOString().split('T')[0], todayStr);
    } else if (preset === 'last-90') {
      const past = new Date();
      past.setDate(today.getDate() - 90);
      onDateChange(past.toISOString().split('T')[0], todayStr);
    }
  };

  const hasFilter = Boolean(startDate || endDate);

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
        <button
          onClick={() => setPreset('all')}
          className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
            !hasFilter ? 'bg-white shadow-sm text-slate-800' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          All Time
        </button>
        <button
          onClick={() => setPreset('this-month')}
          className="px-2.5 py-1 rounded-md font-medium text-slate-600 hover:text-slate-900 transition-colors"
        >
          This Month
        </button>
        <button
          onClick={() => setPreset('last-30')}
          className="px-2.5 py-1 rounded-md font-medium text-slate-600 hover:text-slate-900 transition-colors"
        >
          Last 30 Days
        </button>
        <button
          onClick={() => setPreset('last-90')}
          className="px-2.5 py-1 rounded-md font-medium text-slate-600 hover:text-slate-900 transition-colors"
        >
          Last 90 Days
        </button>
      </div>

      <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
        <Calendar className="w-3.5 h-3.5 text-slate-400" />
        <input
          type="date"
          value={startDate || ''}
          onChange={(e) => onDateChange(e.target.value, endDate)}
          className="text-xs text-slate-700 focus:outline-none bg-transparent"
          placeholder="Start Date"
        />
        <span className="text-slate-400">to</span>
        <input
          type="date"
          value={endDate || ''}
          onChange={(e) => onDateChange(startDate, e.target.value)}
          className="text-xs text-slate-700 focus:outline-none bg-transparent"
          placeholder="End Date"
        />
        {hasFilter && (
          <button
            onClick={onClear}
            className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600"
            title="Clear dates"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}

