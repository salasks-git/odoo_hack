import React from 'react';

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendLabel,
  variant = 'blue'
}) {
  const variantStyles = {
    emerald: {
      bg: 'bg-emerald-50/70',
      text: 'text-emerald-600',
      border: 'border-emerald-100',
      iconBg: 'bg-emerald-100 text-emerald-700'
    },
    blue: {
      bg: 'bg-blue-50/70',
      text: 'text-blue-600',
      border: 'border-blue-100',
      iconBg: 'bg-blue-100 text-blue-700'
    },
    amber: {
      bg: 'bg-amber-50/70',
      text: 'text-amber-600',
      border: 'border-amber-100',
      iconBg: 'bg-amber-100 text-amber-700'
    },
    rose: {
      bg: 'bg-rose-50/70',
      text: 'text-rose-600',
      border: 'border-rose-100',
      iconBg: 'bg-rose-100 text-rose-700'
    },
    purple: {
      bg: 'bg-purple-50/70',
      text: 'text-purple-600',
      border: 'border-purple-100',
      iconBg: 'bg-purple-100 text-purple-700'
    },
    slate: {
      bg: 'bg-slate-50',
      text: 'text-slate-700',
      border: 'border-slate-200',
      iconBg: 'bg-slate-200 text-slate-700'
    }
  };

  const style = variantStyles[variant] || variantStyles.blue;

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">{title}</p>
        {Icon && (
          <div className={`p-2.5 rounded-lg ${style.iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <h3 className="text-2xl font-bold tracking-tight text-slate-900">{value}</h3>
      </div>

      {(subtitle || trend) && (
        <div className="mt-2 flex items-center text-xs text-slate-500 gap-1.5">
          {trend && (
            <span className={`font-semibold ${style.text}`}>
              {trend}
            </span>
          )}
          {trendLabel && <span>{trendLabel}</span>}
          {subtitle && !trend && <span>{subtitle}</span>}
        </div>
      )}
    </div>
  );
}

