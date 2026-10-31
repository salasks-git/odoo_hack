export function formatCurrency(amount, currency = 'USD') {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
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

export function calculateDaysOverdue(dueDateStr) {
  if (!dueDateStr) return 0;
  const due = new Date(dueDateStr);
  const now = new Date();
  const diffTime = now.getTime() - due.getTime();
  if (diffTime <= 0) return 0;
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

export function getStatusBadgeClass(status) {
  switch (status) {
    case 'Successful':
    case 'Paid':
    case 'active':
      return 'bg-emerald-50 text-emerald-700 border border-emerald-200/80';
    case 'Partially Paid':
    case 'confirmed':
      return 'bg-blue-50 text-blue-700 border border-blue-200/80';
    case 'Pending':
    case 'draft':
    case 'quotation':
      return 'bg-amber-50 text-amber-700 border border-amber-200/80';
    case 'Overdue':
    case 'Failed':
      return 'bg-rose-50 text-rose-700 border border-rose-200/80';
    case 'Refunded':
    case 'cancelled':
    case 'closed':
      return 'bg-purple-50 text-purple-700 border border-purple-200/80';
    default:
      return 'bg-slate-50 text-slate-700 border border-slate-200';
  }
}

export function exportToCsv(filename, headers, rows) {
  if (!rows || !rows.length) {
    alert('No data available to export');
    return;
  }

  const csvRows = [];
  csvRows.push(headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(','));

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
