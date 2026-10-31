import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

const subscriptions = [
  { number: 'SUB-0008', customer: 'Aarav Mehta', plan: 'Monthly Essential', next: '02 Nov 2026', status: 'Active' },
  { number: 'SUB-0007', customer: 'Nisha Kapoor', plan: 'Weekly Studio', next: 'Today', status: 'Confirmed' },
  { number: 'SUB-0006', customer: 'Rohan Shah', plan: 'Monthly Essential', next: '18 Nov 2026', status: 'Quotation' },
];
const invoices = [
  { number: 'INV-0012', customer: 'Aarav Mehta', date: '02 Oct 2026', amount: '₹1,414.82', status: 'Confirmed' },
  { number: 'INV-0011', customer: 'Nisha Kapoor', date: '17 Oct 2026', amount: '₹588.82', status: 'Paid' },
  { number: 'INV-0010', customer: 'Rohan Shah', date: '01 Oct 2026', amount: '₹2,829.64', status: 'Draft' },
];
const menu = [['overview', '◫', 'Overview'], ['subscriptions', '↻', 'Subscriptions'], ['invoices', '▤', 'Invoices']];

function App() {
  const [page, setPage] = useState('overview');
  return <div className="shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-icon">↻</span><span>orbit<span className="brand-light">.bill</span></span></div>
      <div className="nav-caption">WORKSPACE</div>
      <nav>{menu.map(([key, icon, label]) => <button key={key} className={'nav-item ' + (page === key ? 'selected' : '')} onClick={() => setPage(key)}><span className="nav-icon">{icon}</span>{label}{key === 'subscriptions' && <span className="nav-count">8</span>}</button>)}</nav>
      <div className="sidebar-bottom"><button className={'nav-item ' + (page === 'help' ? 'selected' : '')} onClick={() => setPage('help')}><span className="nav-icon">?</span>Debug guide</button><div className="member"><span className="avatar">M2</span><span><b>Member 2</b><small>Subscriptions & billing</small></span></div></div>
    </aside>
    <div className="main">
      <div className="topbar"><div className="crumb">Workspace <span>/</span> <b>{pageLabel(page)}</b></div><div className="right-tools"><span className="preview"><i/>Preview mode</span><span className="avatar avatar-small">M2</span></div></div>
      <main className="content">{page === 'overview' ? <Overview onNavigate={setPage}/> : <section className="card placeholder"><span className="eyebrow">NEXT BUILD STEP</span><h1>{pageLabel(page)}</h1><p>We are building the project one screen at a time. This section comes next.</p><button className="secondary" onClick={() => setPage('overview')}>Back to overview</button></section>}</main>
      <footer><span>Member 2 · Subscription and invoice management</span><span>Step 1 of 4 · Interface foundation</span></footer>
    </div>
  </div>;
}
function pageLabel(page) { return ({ overview: 'Overview', subscriptions: 'Subscriptions', invoices: 'Invoices', help: 'Debug guide' })[page]; }
function Overview({ onNavigate }) {
  return <>
    <div className="heading"><div><span className="eyebrow">YOUR BILLING WORKSPACE</span><h1>Good morning</h1><p>Here’s the latest activity across subscriptions and invoices.</p></div><button className="primary" onClick={() => onNavigate('subscriptions')}><span>＋</span> New subscription</button></div>
    <div className="preview-note"><span className="note-dot">i</span><span><b>Preview mode</b> — These are example records so you can explore the layout. Nothing is saved yet.</span></div>
    <section className="stats">
      <Stat title="Active subscriptions" value="6" note="Currently billing" symbol="↻" tone="green"/>
      <Stat title="Due to bill" value="2" note="Ready for a billing run" symbol="▤" tone="amber"/>
      <Stat title="Outstanding invoices" value="₹4,244.46" note="Draft and confirmed" symbol="₹" tone="blue"/>
      <Stat title="Collected revenue" value="₹8,910.25" note="Paid invoices" symbol="✓" tone="purple"/>
    </section>
    <div className="grid">
      <section className="card lifecycle"><div className="card-heading"><div><h2>Subscription lifecycle</h2><p>Every subscription follows this path.</p></div><button className="link" onClick={() => onNavigate('subscriptions')}>View subscriptions <span>→</span></button></div>
        <div className="steps">{['Draft','Quotation','Confirmed','Active','Closed'].map((s,i)=><React.Fragment key={s}><div className={'step ' + (i===3?'current':'')}><span>{i+1}</span><b>{s}</b></div>{i<4&&<i className="connector"/>}</React.Fragment>)}</div>
        <p className="caption">The backend allows only the next status in this sequence.</p>
      </section>
      <section className="card upcoming"><div className="card-heading"><div><h2>Upcoming billing</h2><p>Next subscriptions to bill</p></div></div>{subscriptions.slice(0,2).map((s,i)=><div className="upcoming-row" key={s.number}><span className="customer-avatar">{i?'NK':'AM'}</span><span className="customer"><b>{s.customer}</b><small>{s.number} · {s.plan}</small></span><span className="next-date"><b>{i?'Today':'02 Nov'}</b><small>{i?'Due':'Upcoming'}</small></span></div>)}</section>
      <section className="card recent"><div className="card-heading"><div><h2>Recent invoices</h2><p>Latest billing activity</p></div><button className="link" onClick={() => onNavigate('invoices')}>All invoices <span>→</span></button></div>
        <div className="table-wrap"><table><thead><tr><th>INVOICE</th><th>CUSTOMER</th><th>DATE</th><th>STATUS</th><th className="right">TOTAL</th></tr></thead><tbody>{invoices.map(i=><tr key={i.number}><td className="id">{i.number}</td><td>{i.customer}</td><td>{i.date}</td><td><Badge status={i.status}/></td><td className="right amount">{i.amount}</td></tr>)}</tbody></table></div>
      </section>
    </div>
  </>;
}
function Stat({title,value,note,symbol,tone}) { return <article className="stat"><span className={'stat-icon '+tone}>{symbol}</span><small>{title}</small><b>{value}</b><span className="stat-note">{note}</span></article>; }
function Badge({status}) { return <span className={'badge '+status.toLowerCase()}>{status}</span>; }
createRoot(document.getElementById('root')).render(<App />);
