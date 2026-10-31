import React from 'react';

export default function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'indigo'
}) {
  const variantStyles = {
    indigo: {
      border: 'border-slate-200/80',
      iconBg: 'bg-indigo-50 text-indigo-600 border border-indigo-100',
      tag: 'text-indigo-600'
    },
    emerald: {
      border: 'border-slate-200/80',
      iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
      tag: 'text-emerald-600'
    },
    amber: {
      border: 'border-slate-200/80',
      iconBg: 'bg-amber-50 text-amber-600 border border-amber-100',
      tag: 'text-amber-600'
    },
    rose: {
      border: 'border-slate-200/80',
      iconBg: 'bg-rose-50 text-rose-600 border border-rose-100',
      tag: 'text-rose-600'
    },
    purple: {
      border: 'border-slate-200/80',
      iconBg: 'bg-purple-50 text-purple-600 border border-purple-100',
      tag: 'text-purple-600'
    }
  };

  const style = variantStyles[variant] || variantStyles.indigo;

  return (
    <div className={`bg-white rounded-2xl p-5 border ${style.border} shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group`}>
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
          {title}
        </p>
        {Icon && (
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${style.iconBg} transition-transform group-hover:scale-105`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-3">
        <h3 className="text-2xl font-black tracking-tight text-slate-900 font-display">
          {value}
        </h3>
      </div>

      {subtitle && (
        <p className="mt-2 text-xs text-slate-500 font-medium flex items-center gap-1.5">
          {subtitle}
        </p>
      )}
    </div>
  );
}
