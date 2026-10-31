// Utility functions for Member 3 Financial Module

export function formatCurrency(amount, currency = 'USD') {
  const numeric = Number(amount) || 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numeric);
}

export function formatDate(dateStr) {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateStr;
  }
}

export function calculateCollectionRate(collected, totalInvoiced) {
  const c = Number(collected) || 0;
  const t = Number(totalInvoiced) || 0;
  if (t <= 0) return 100;
  return Math.min(100, Math.max(0, +( (c / t) * 100 ).toFixed(1)));
}

export function getStatusBadgeClass(status) {
  switch (status) {
    case 'Successful':
    case 'Paid':
      return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    case 'Partially Paid':
      return 'bg-blue-50 text-blue-700 border border-blue-200';
    case 'Pending':
    case 'Draft':
      return 'bg-amber-50 text-amber-700 border border-amber-200';
    case 'Overdue':
    case 'Failed':
      return 'bg-rose-50 text-rose-700 border border-rose-200';
    case 'Refunded':
      return 'bg-purple-50 text-purple-700 border border-purple-200';
    default:
      return 'bg-slate-50 text-slate-700 border border-slate-200';
  }
}

export function getPaymentMethodIcon(method) {
  switch (method) {
    case 'UPI':
      return 'smartphone';
    case 'Card':
      return 'credit-card';
    case 'Bank Transfer':
      return 'building';
    case 'Cash':
      return 'banknote';
    default:
      return 'wallet';
  }
}

export function exportToCsv(filename, headers, rows) {
  if (!rows || !rows.length) {
    alert('No data available to export');
    return;
  }

  const csvRows = [];
  // Add headers
  csvRows.push(headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(','));

  // Add data rows
  for (const row of rows) {
    const values = headers.map(header => {
      const val = row[header] !== undefined && row[header] !== null ? row[header] : '';
      return `"${String(val).replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(','));
  }

  const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvRows.join('\n'));
  const link = document.createElement('a');
  link.setAttribute('href', csvContent);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

