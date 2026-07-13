// reports.jsx — Advanced Reports module: filterable tables + CSV export.
// Wraps the existing analytics charts (AdminReportsOverview) as the Overview tab
// and adds Clients, Delivered, Pending, Products & Stock, Payments and Accounts
// reports. Overrides window.AdminReports (loaded after dashboard.jsx).
(function () {
  const { Icon } = window;
  const T = window.ADMIN_T, F = window.ADMIN_F;
  const { Card, PageHead, Button, Search, Select, Table, Td, Row, Empty, Pill, Thumb,
    useData, DataStore, ToastStore, A_money, A_fmtDate } = window;

  // ── CSV download (native, no libraries) ──────────────────────────────────
  function downloadCSV(filename, headers, rows) {
    const esc = (v) => {
      const s = String(v == null ? '' : v);
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    const lines = [headers.map(esc).join(',')];
    rows.forEach((r) => lines.push(r.map(esc).join(',')));
    const blob = new Blob(['\ufeff' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 120);
    ToastStore.push(filename + ' downloaded (' + rows.length + ' row' + (rows.length === 1 ? '' : 's') + ').', { title: 'Export ready', icon: 'download', tone: 'ok' });
  }
  const plain = (n) => Math.round(n || 0); // unformatted number for CSV cells

  // ── Small controls ───────────────────────────────────────────────────────
  function DateRange({ from, to, onFrom, onTo }) {
    const input = { height: 42, border: `1.5px solid ${T.line}`, borderRadius: 11, padding: '0 12px', fontFamily: F, fontSize: 13.5, fontWeight: 700, color: T.ink, background: '#fff', outline: 'none' };
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input type="date" value={from} onChange={(e) => onFrom(e.target.value)} style={input} aria-label="From date" />
        <span style={{ fontSize: 13, fontWeight: 700, color: T.sub }}>to</span>
        <input type="date" value={to} onChange={(e) => onTo(e.target.value)} style={input} aria-label="To date" />
        {(from || to) && <button onClick={() => { onFrom(''); onTo(''); }} style={{ border: `1.5px solid ${T.line}`, background: '#fff', color: T.sub, cursor: 'pointer', fontFamily: F, fontSize: 13, fontWeight: 800, height: 42, padding: '0 12px', borderRadius: 11 }}>Clear</button>}
      </div>
    );
  }
  const inRange = (iso, from, to) => {
    if (from && iso < from) return false;
    if (to && iso > to) return false;
    return true;
  };

  // Section shell: title + controls + export, then a table or empty state.
  function ReportSection({ title, sub, controls, onExport, exportDisabled, children }) {
    return (
      <Card pad={0} style={{ overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', padding: '16px 18px', borderBottom: `1px solid ${T.line}` }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 15.5, fontWeight: 800, color: T.ink }}>{title}</div>
            {sub && <div style={{ fontSize: 12.5, fontWeight: 600, color: T.sub, marginTop: 2 }}>{sub}</div>}
          </div>
          <div style={{ flex: 1 }} />
          {controls}
          <Button icon="download" variant="dark" size="sm" onClick={onExport} style={exportDisabled ? { opacity: 0.5, pointerEvents: 'none' } : null}>Export CSV</Button>
        </div>
        {children}
      </Card>
    );
  }

  // ════════════════════════════════ CLIENTS ════════════════════════════════
  function ClientsReport({ d }) {
    const [q, setQ] = React.useState('');
    const rows = React.useMemo(() => {
      const valid = d.orders.filter((o) => o.status !== 'Cancelled');
      return d.clients.map((c) => {
        const mine = valid.filter((o) => o.clientId === c.id);
        return { c, count: mine.length, spent: mine.reduce((s, o) => s + o.total, 0) };
      }).sort((a, b) => b.spent - a.spent);
    }, [d.clients, d.orders]);
    const term = q.trim().toLowerCase();
    const filtered = term ? rows.filter((r) => (r.c.name + ' ' + r.c.email + ' ' + r.c.phone).toLowerCase().includes(term)) : rows;
    const exp = () => downloadCSV('client-list.csv',
      ['Client', 'Email', 'Phone', 'Status', 'Orders', 'Total Spent (UGX)'],
      filtered.map((r) => [r.c.name, r.c.email, r.c.phone, r.c.status, r.count, plain(r.spent)]));
    return (
      <ReportSection title="Client List" sub={`${filtered.length} client${filtered.length === 1 ? '' : 's'} · order count & lifetime spend`}
        controls={<Search value={q} onChange={setQ} placeholder="Search name, email…" width={240} />}
        onExport={exp} exportDisabled={!filtered.length}>
        {filtered.length === 0 ? <Empty title="No clients match" sub="Try another search term." /> : (
          <Table columns={[{ label: 'Client' }, { label: 'Contact' }, { label: 'Status' }, { label: 'Orders', align: 'right' }, { label: 'Total Spent', align: 'right' }]}>
            {filtered.map((r, i) => (
              <Row key={r.c.id} i={i}>
                <Td><div style={{ fontWeight: 800 }}>{r.c.name}</div><div style={{ fontSize: 12, color: T.sub, fontWeight: 600, marginTop: 2 }}>{r.c.address}</div></Td>
                <Td><div style={{ fontWeight: 700 }}>{r.c.email}</div><div style={{ fontSize: 12, color: T.sub, fontWeight: 600, marginTop: 2 }}>{r.c.phone}</div></Td>
                <Td><Pill status={r.c.status} small /></Td>
                <Td align="right" style={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{r.count}</Td>
                <Td align="right" style={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{A_money(r.spent)}</Td>
              </Row>
            ))}
          </Table>
        )}
      </ReportSection>
    );
  }

  // ══════════════════════════════ DELIVERED ════════════════════════════════
  function DeliveredReport({ d }) {
    const [from, setFrom] = React.useState('');
    const [to, setTo] = React.useState('');
    const rows = d.orders.filter((o) => o.status === 'Delivered' && inRange(o.date, from, to))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    const total = rows.reduce((s, o) => s + o.total, 0);
    const exp = () => downloadCSV('delivered-orders.csv',
      ['Order ID', 'Client', 'Date', 'Items', 'Payment', 'Total (UGX)'],
      rows.map((o) => [o.id, o.clientName, o.date, o.items.reduce((s, it) => s + it.qty, 0), o.payment, plain(o.total)]));
    return (
      <ReportSection title="Delivered Orders" sub={`${rows.length} order${rows.length === 1 ? '' : 's'} · ${A_money(total)} fulfilled`}
        controls={<DateRange from={from} to={to} onFrom={setFrom} onTo={setTo} />} onExport={exp} exportDisabled={!rows.length}>
        {rows.length === 0 ? <Empty icon="truck" title="No delivered orders" sub="Adjust the date range to see results." /> : (
          <Table columns={[{ label: 'Order ID' }, { label: 'Client' }, { label: 'Date' }, { label: 'Payment' }, { label: 'Total', align: 'right' }]}>
            {rows.map((o, i) => (
              <Row key={o.id} i={i}>
                <Td style={{ fontWeight: 800 }}>{o.id}</Td>
                <Td style={{ fontWeight: 700 }}>{o.clientName}</Td>
                <Td style={{ color: T.sub, fontWeight: 600 }}>{A_fmtDate(o.date)}</Td>
                <Td style={{ fontWeight: 700 }}>{o.payment}</Td>
                <Td align="right" style={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{A_money(o.total)}</Td>
              </Row>
            ))}
          </Table>
        )}
      </ReportSection>
    );
  }

  // ═══════════════════════════════ PENDING ═════════════════════════════════
  const PENDING_SET = ['Pending', 'Packed'];
  function PendingReport({ d }) {
    const [from, setFrom] = React.useState('');
    const [to, setTo] = React.useState('');
    const rows = d.orders.filter((o) => PENDING_SET.includes(o.status) && inRange(o.date, from, to))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    const total = rows.reduce((s, o) => s + o.total, 0);
    const update = (id, v) => {
      DataStore.setOrderStatus(id, v);
      ToastStore.push(`${id} marked ${v}.`, { title: 'Status updated', icon: 'truck', tone: v === 'Cancelled' ? 'warn' : 'ok' });
    };
    const exp = () => downloadCSV('pending-orders.csv',
      ['Order ID', 'Client', 'Date', 'Status', 'Items', 'Total (UGX)'],
      rows.map((o) => [o.id, o.clientName, o.date, o.status, o.items.reduce((s, it) => s + it.qty, 0), plain(o.total)]));
    const statusOpts = window.A_ORDER_STATUSES.map((s) => ({ value: s, label: s }));
    return (
      <ReportSection title="Pending Orders" sub={`${rows.length} awaiting fulfilment · ${A_money(total)} in pipeline`}
        controls={<DateRange from={from} to={to} onFrom={setFrom} onTo={setTo} />} onExport={exp} exportDisabled={!rows.length}>
        {rows.length === 0 ? <Empty icon="check" title="Nothing pending" sub="All orders in this range are fulfilled or cancelled." /> : (
          <Table columns={[{ label: 'Order ID' }, { label: 'Client' }, { label: 'Date' }, { label: 'Total', align: 'right' }, { label: 'Update status', align: 'right', width: 190 }]}>
            {rows.map((o, i) => (
              <Row key={o.id} i={i}>
                <Td style={{ fontWeight: 800 }}>{o.id}</Td>
                <Td style={{ fontWeight: 700 }}>{o.clientName}</Td>
                <Td style={{ color: T.sub, fontWeight: 600 }}>{A_fmtDate(o.date)}</Td>
                <Td align="right" style={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{A_money(o.total)}</Td>
                <Td align="right" style={{ width: 190 }}><div style={{ display: 'inline-block', minWidth: 150 }}><Select value={o.status} onChange={(v) => update(o.id, v)} options={statusOpts} /></div></Td>
              </Row>
            ))}
          </Table>
        )}
      </ReportSection>
    );
  }

  // ═══════════════════════════ PRODUCTS & STOCK ════════════════════════════
  function ProductsReport({ d }) {
    const [q, setQ] = React.useState('');
    const [lowOnly, setLowOnly] = React.useState(false);
    const term = q.trim().toLowerCase();
    let rows = d.products.slice().sort((a, b) => a.stock - b.stock);
    if (term) rows = rows.filter((p) => (p.name + ' ' + p.sku + ' ' + p.brand + ' ' + p.category).toLowerCase().includes(term));
    if (lowOnly) rows = rows.filter((p) => p.stock < 5);
    const lowCount = d.products.filter((p) => p.stock < 5).length;
    const stat = (n) => n === 0 ? { t: 'Out of stock', c: T.red, b: T.redWash } : n < 5 ? { t: 'Low stock', c: T.amberInk, b: '#FFF3DC' } : { t: 'In stock', c: T.green, b: T.greenWash };
    const exp = () => downloadCSV('products-stock.csv',
      ['SKU', 'Product', 'Brand', 'Category', 'Stock', 'Status', 'Price (UGX)'],
      rows.map((p) => [p.sku, p.name, p.brand, p.category, p.stock, stat(p.stock).t, plain(p.salePrice || p.regularPrice)]));
    return (
      <ReportSection title="Products & Stock" sub={`${d.products.length} products · ${lowCount} below 5 units`}
        controls={<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => setLowOnly((v) => !v)} style={{ height: 42, padding: '0 14px', borderRadius: 11, border: `1.5px solid ${lowOnly ? T.red : T.line}`, background: lowOnly ? T.redWash : '#fff', color: lowOnly ? T.red : T.ink, fontFamily: F, fontSize: 13, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7 }}>
            <Icon name="bolt" size={15} color={lowOnly ? T.red : T.sub} stroke={2.2} />Low stock</button>
          <Search value={q} onChange={setQ} placeholder="Search SKU, name…" width={230} />
        </div>} onExport={exp} exportDisabled={!rows.length}>
        {rows.length === 0 ? <Empty title="No products match" /> : (
          <Table columns={[{ label: 'Product' }, { label: 'SKU' }, { label: 'Category' }, { label: 'Stock', align: 'right' }, { label: 'Status', align: 'right' }, { label: 'Price', align: 'right' }]}>
            {rows.map((p, i) => {
              const s = stat(p.stock);
              return (
                <Row key={p.id} i={i}>
                  <Td><div style={{ display: 'flex', alignItems: 'center', gap: 11 }}><Thumb p={p} size={38} /><div style={{ minWidth: 0 }}><div style={{ fontWeight: 700, maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div><div style={{ fontSize: 12, color: T.sub, fontWeight: 700, marginTop: 2 }}>{p.brand}</div></div></div></Td>
                  <Td style={{ fontWeight: 700, color: T.sub, fontVariantNumeric: 'tabular-nums' }}>{p.sku}</Td>
                  <Td style={{ fontWeight: 700 }}>{p.category}</Td>
                  <Td align="right" style={{ fontWeight: 800, color: s.c, fontVariantNumeric: 'tabular-nums' }}>{p.stock}</Td>
                  <Td align="right"><span style={{ fontSize: 11.5, fontWeight: 800, color: s.c, background: s.b, padding: '4px 10px', borderRadius: 999, whiteSpace: 'nowrap' }}>{s.t}</span></Td>
                  <Td align="right" style={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{A_money(p.salePrice || p.regularPrice)}</Td>
                </Row>
              );
            })}
          </Table>
        )}
      </ReportSection>
    );
  }

  // ═══════════════════════════════ PAYMENTS ════════════════════════════════
  // Orders with status Delivered are treated as Paid (per spec).
  function PaymentsReport({ d }) {
    const [from, setFrom] = React.useState('');
    const [to, setTo] = React.useState('');
    const [method, setMethod] = React.useState('All');
    let rows = d.orders.filter((o) => o.status === 'Delivered' && inRange(o.date, from, to));
    if (method !== 'All') rows = rows.filter((o) => o.payment === method);
    rows = rows.sort((a, b) => new Date(b.date) - new Date(a.date));
    const total = rows.reduce((s, o) => s + o.total, 0);
    const methods = ['All', ...window.A_PAYMENTS];
    const exp = () => downloadCSV('payments.csv',
      ['Order ID', 'Client', 'Date', 'Method', 'Status', 'Amount (UGX)'],
      rows.map((o) => [o.id, o.clientName, o.date, o.payment, 'Paid', plain(o.total)]));
    return (
      <ReportSection title="Payments" sub={`${rows.length} completed payment${rows.length === 1 ? '' : 's'} · ${A_money(total)} received`}
        controls={<div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <Select value={method} onChange={setMethod} options={methods.map((m) => ({ value: m, label: m === 'All' ? 'All methods' : m }))} width={160} />
          <DateRange from={from} to={to} onFrom={setFrom} onTo={setTo} />
        </div>} onExport={exp} exportDisabled={!rows.length}>
        {rows.length === 0 ? <Empty icon="shield" title="No payments" sub="Completed payments come from delivered orders." /> : (
          <Table columns={[{ label: 'Order ID' }, { label: 'Client' }, { label: 'Date' }, { label: 'Method' }, { label: 'Status' }, { label: 'Amount', align: 'right' }]}>
            {rows.map((o, i) => (
              <Row key={o.id} i={i}>
                <Td style={{ fontWeight: 800 }}>{o.id}</Td>
                <Td style={{ fontWeight: 700 }}>{o.clientName}</Td>
                <Td style={{ color: T.sub, fontWeight: 600 }}>{A_fmtDate(o.date)}</Td>
                <Td style={{ fontWeight: 700 }}>{o.payment}</Td>
                <Td><span style={{ fontSize: 11.5, fontWeight: 800, color: T.green, background: T.greenWash, padding: '4px 10px', borderRadius: 999 }}>Paid</span></Td>
                <Td align="right" style={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{A_money(o.total)}</Td>
              </Row>
            ))}
          </Table>
        )}
      </ReportSection>
    );
  }

  // ═══════════════════════════════ ACCOUNTS ════════════════════════════════
  function AccountsReport({ d }) {
    const valid = d.orders.filter((o) => o.status !== 'Cancelled');
    const revenue = valid.reduce((s, o) => s + o.total, 0);
    const delivered = d.orders.filter((o) => o.status === 'Delivered');
    const paid = delivered.reduce((s, o) => s + o.total, 0);
    const outstanding = valid.filter((o) => o.status !== 'Delivered').reduce((s, o) => s + o.total, 0);
    const aov = valid.length ? revenue / valid.length : 0;
    const cancelled = d.orders.filter((o) => o.status === 'Cancelled');
    const lowStock = d.products.filter((p) => p.stock < 5).length;
    const cards = [
      { icon: 'shield', label: 'Total Revenue', value: A_money(revenue), accent: T.green, note: 'Excludes cancelled orders' },
      { icon: 'check', label: 'Paid / Collected', value: A_money(paid), accent: T.blue, note: `${delivered.length} delivered orders` },
      { icon: 'clock', label: 'Outstanding', value: A_money(outstanding), accent: T.amber, note: 'Awaiting delivery' },
      { icon: 'cart', label: 'Total Orders', value: valid.length, accent: T.purple, note: `${cancelled.length} cancelled` },
      { icon: 'box', label: 'Avg. Order Value', value: A_money(aov), accent: T.blueDk, note: 'Per fulfilled order' },
      { icon: 'user', label: 'Active Clients', value: d.clients.filter((c) => c.status === 'Active').length, accent: T.teal, note: `${d.clients.length} total` },
      { icon: 'package', label: 'Catalogue Size', value: d.products.length, accent: T.blue, note: `${lowStock} low on stock` },
      { icon: 'truck', label: 'Delivered Rate', value: valid.length ? Math.round((delivered.length / valid.length) * 100) + '%' : '—', accent: T.green, note: 'Of fulfilled orders' },
    ];
    const exp = () => downloadCSV('accounts-summary.csv',
      ['Metric', 'Value'],
      [['Total Revenue (UGX)', plain(revenue)], ['Paid / Collected (UGX)', plain(paid)], ['Outstanding (UGX)', plain(outstanding)],
       ['Total Orders', valid.length], ['Cancelled Orders', cancelled.length], ['Average Order Value (UGX)', plain(aov)],
       ['Active Clients', d.clients.filter((c) => c.status === 'Active').length], ['Total Clients', d.clients.length],
       ['Catalogue Size', d.products.length], ['Low Stock Items', lowStock]]);
    return (
      <ReportSection title="Accounts Summary" sub="Revenue, collections and fulfilment at a glance" onExport={exp}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14, padding: 18 }}>
          {cards.map((c) => (
            <div key={c.label} style={{ border: `1px solid ${T.line}`, borderRadius: 14, padding: '16px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: c.accent + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={c.icon} size={18} color={c.accent} stroke={2} /></div>
                <div style={{ fontSize: 12.5, fontWeight: 800, color: T.sub }}>{c.label}</div>
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: T.ink, letterSpacing: -0.6, fontVariantNumeric: 'tabular-nums' }}>{c.value}</div>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: T.faint, marginTop: 4 }}>{c.note}</div>
            </div>
          ))}
        </div>
      </ReportSection>
    );
  }

  // ════════════════════════════════ SHELL ══════════════════════════════════
  const TABS = [
    { id: 'overview', label: 'Overview', icon: 'filter' },
    { id: 'clients', label: 'Client List', icon: 'user' },
    { id: 'delivered', label: 'Delivered', icon: 'truck' },
    { id: 'pending', label: 'Pending', icon: 'clock' },
    { id: 'products', label: 'Products & Stock', icon: 'package' },
    { id: 'payments', label: 'Payments', icon: 'shield' },
    { id: 'accounts', label: 'Accounts', icon: 'box' },
  ];

  function Reports() {
    const d = useData();
    const [tab, setTab] = React.useState('overview');
    return (
      <div>
        <PageHead title="Reports" sub="Filter, review and export live order, client and stock data" />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          {TABS.map((t) => {
            const on = t.id === tab;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: `1.5px solid ${on ? T.blue : T.line}`, background: on ? T.blue : '#fff', color: on ? '#fff' : T.ink, cursor: 'pointer', fontFamily: F, padding: '9px 14px', borderRadius: 999, fontSize: 13.5, fontWeight: 800, transition: 'background .15s, color .15s' }}>
                <Icon name={t.icon} size={16} color={on ? '#fff' : T.sub} stroke={2.1} />{t.label}
              </button>
            );
          })}
        </div>
        {tab === 'overview' && (window.AdminReportsOverview ? <window.AdminReportsOverview embedded /> : null)}
        {tab === 'clients' && <ClientsReport d={d} />}
        {tab === 'delivered' && <DeliveredReport d={d} />}
        {tab === 'pending' && <PendingReport d={d} />}
        {tab === 'products' && <ProductsReport d={d} />}
        {tab === 'payments' && <PaymentsReport d={d} />}
        {tab === 'accounts' && <AccountsReport d={d} />}
      </div>
    );
  }

  window.AdminReports = Reports;
})();
