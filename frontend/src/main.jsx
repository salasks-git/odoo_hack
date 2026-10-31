import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

const API = '/api';
function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [tab, setTab] = useState('subscriptions');
  const [subs, setSubs] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [detail, setDetail] = useState(null);
  const [newSub, setNewSub] = useState({ customer_id: '', plan_id: '', product_id: '', qty: 1, unit_price: '', tax_percent: 0 });
  const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  async function request(path, options = {}) {
    const response = await fetch(`${API}${path}`, { ...options, headers: { ...headers, ...options.headers } });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || `Request failed (${response.status})`);
    return payload;
  }
  async function refresh() {
    try {
      const [s, i] = await Promise.all([request('/subscriptions'), request('/invoices')]);
      setSubs(s); setInvoices(i); setMessage('');
    } catch (e) { setMessage(e.message); }
  }
  useEffect(() => { localStorage.setItem('token', token); if (token) refresh(); }, [token]);
  async function action(fn, done) { setBusy(true); try { const result = await fn(); if (done) done(result); await refresh(); } catch (e) { setMessage(e.message); } finally { setBusy(false); } }
  async function billing() { await action(() => request('/billing/run', { method: 'POST', body: '{}' }), r => setMessage(`Billing finished: ${r.created} invoices created, ${r.skipped} skipped, ${r.auto_closed} subscriptions closed.`)); }
  async function changeStatus(id, status) { await action(() => request(`/subscriptions/${id}/status`, { method: 'POST', body: JSON.stringify({ status }) })); }
  async function invoiceAction(id, actionName) { await action(() => request(`/invoices/${id}/${actionName}`, { method: 'POST', body: '{}' })); }
  async function showInvoice(id) { try { setDetail(await request(`/invoices/${id}`)); } catch (e) { setMessage(e.message); } }
  return <main>
    <header><div><p className="eyebrow">MEMBER 2 · SUBSCRIPTIONS & BILLING</p><h1>Subscription desk</h1><p className="muted">Manage the subscription lifecycle and create invoices when billing is due.</p></div><button disabled={busy} onClick={billing}>Run billing</button></header>
    <section className="token"><label>Development JWT <input value={token} onChange={e => setToken(e.target.value)} placeholder="Paste a token from the shared login" /></label><button className="light" onClick={refresh}>Refresh</button></section>
    {message && <div className="notice">{message}</div>}
    <nav><button className={tab === 'subscriptions' ? 'selected' : ''} onClick={() => setTab('subscriptions')}>Subscriptions <span>{subs.length}</span></button><button className={tab === 'invoices' ? 'selected' : ''} onClick={() => setTab('invoices')}>Invoices <span>{invoices.length}</span></button></nav>
    {tab === 'subscriptions' ? <><section className="panel form-panel"><div className="panelhead"><div><h2>Create a subscription</h2><p>Use IDs from the shared customer, plan and product lists.</p></div></div><form className="form-grid" onSubmit={e => { e.preventDefault(); const payload = { customer_id: Number(newSub.customer_id), plan_id: Number(newSub.plan_id), start_date: new Date().toISOString().slice(0, 10), payment_terms: 0, lines: [{ product_id: Number(newSub.product_id), qty: Number(newSub.qty), ...(newSub.unit_price === '' ? {} : { unit_price: Number(newSub.unit_price) }), tax_percent: Number(newSub.tax_percent) }] }; action(() => request('/subscriptions', { method: 'POST', body: JSON.stringify(payload) }), () => setMessage('Subscription created as a draft.')); }}><label>Customer ID<input required type="number" min="1" value={newSub.customer_id} onChange={e => setNewSub({ ...newSub, customer_id: e.target.value })}/></label><label>Plan ID<input required type="number" min="1" value={newSub.plan_id} onChange={e => setNewSub({ ...newSub, plan_id: e.target.value })}/></label><label>Product ID<input required type="number" min="1" value={newSub.product_id} onChange={e => setNewSub({ ...newSub, product_id: e.target.value })}/></label><label>Quantity<input required type="number" min="0.01" step="0.01" value={newSub.qty} onChange={e => setNewSub({ ...newSub, qty: e.target.value })}/></label><label>Unit price (optional)<input type="number" min="0" step="0.01" placeholder="Use product price" value={newSub.unit_price} onChange={e => setNewSub({ ...newSub, unit_price: e.target.value })}/></label><label>Tax %<input type="number" min="0" step="0.01" value={newSub.tax_percent} onChange={e => setNewSub({ ...newSub, tax_percent: e.target.value })}/></label><button disabled={busy}>Save draft</button></form></section><section className="panel"><div className="panelhead"><div><h2>Subscriptions</h2><p>Move each record through its allowed next step.</p></div></div>{subs.length ? <div className="rows">{subs.map(s => <article className="row" key={s.id}><div><strong>{s.number}</strong><p>Customer #{s.customer_id} · Plan #{s.plan_id}</p></div><span className={`badge ${s.status}`}>{s.status}</span><span className="date">Next bill: {s.next_billing_date || '—'}</span>{s.status !== 'closed' && <button className="light" disabled={busy} onClick={() => changeStatus(s.id, ({ draft: 'quotation', quotation: 'confirmed', confirmed: 'active', active: 'closed' })[s.status])}>Advance → {({ draft: 'quotation', quotation: 'confirmed', confirmed: 'active', active: 'closed' })[s.status]}</button>}{['draft', 'quotation'].includes(s.status) && <button className="quiet" disabled={busy} onClick={() => action(() => request(`/subscriptions/${s.id}`, { method: 'DELETE' }))}>Delete</button>}</article>)}</div> : <p className="empty">No subscriptions loaded. Connect the shared backend and sign in to see records.</p>}</section></> : <section className="panel"><div className="panelhead"><div><h2>Invoices</h2><p>Generated invoice lines keep their original price and tax details.</p></div></div>{invoices.length ? <div className="rows">{invoices.map(i => <article className="row" key={i.id}><div><strong>{i.number}</strong><p>Period {i.period_start} · Due {i.due_date}</p></div><span className={`badge ${i.status}`}>{i.status}</span><strong className="amount">${Number(i.total).toFixed(2)}</strong><button className="light" onClick={() => showInvoice(i.id)}>Details</button>{i.status === 'draft' && <button className="light" onClick={() => invoiceAction(i.id, 'confirm')}>Confirm</button>}{['draft', 'confirmed'].includes(i.status) && <button className="quiet" onClick={() => invoiceAction(i.id, 'cancel')}>Cancel</button>}</article>)}</div> : <p className="empty">No invoices yet. Run billing after a subscription is active and due.</p>}</section>}
    {detail && <div className="overlay" onClick={() => setDetail(null)}><section className="dialog" onClick={e => e.stopPropagation()}><button className="close" onClick={() => setDetail(null)}>×</button><p className="eyebrow">INVOICE DETAILS</p><h2>{detail.number}</h2><p>{detail.status} · Due {detail.due_date}</p><div className="rows">{detail.lines?.map(l => <article className="row" key={l.id}><div><strong>{l.product_name}</strong><p>{l.variant_name || 'No variant'} · {l.qty} × ${Number(l.unit_price).toFixed(2)}</p></div><strong>${Number(l.line_total).toFixed(2)}</strong></article>)}</div><div className="totals"><p>Subtotal <b>${Number(detail.subtotal).toFixed(2)}</b></p><p>Discount <b>−${Number(detail.discount).toFixed(2)}</b></p><p>Tax <b>${Number(detail.tax).toFixed(2)}</b></p><p className="grand">Total <b>${Number(detail.total).toFixed(2)}</b></p></div><button onClick={() => window.print()}>Print invoice</button></section></div>}
    <footer>Member 2 starter · For shared login and catalog setup, see <code>docs/INTEGRATION.md</code>.</footer>
  </main>;
}

createRoot(document.getElementById('root')).render(<App />);
