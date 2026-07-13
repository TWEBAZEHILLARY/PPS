// records.jsx — Clients, Orders, Inquiries and Quotes management.
(function () {
  const { Icon } = window;
  const T = window.ADMIN_T, F = window.ADMIN_F;
  const { Card, PageHead, Button, IconBtn, Search, Select, Table, Td, Row, Empty, Thumb, Pill,
    Field, Input, Textarea, Modal, ConfirmStore, useData, DataStore, ToastStore, Router, useAuth,
    A_money, A_fmtDate, A_relTime, A_uid, A_ORDER_STATUSES, A_INQUIRY_STATUSES } = window;

  const Avatar = ({ name, size = 38, bg = T.blue }) => (
    <div style={{ width: size, height: size, borderRadius: 999, background: bg, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.4, fontWeight: 800, flexShrink: 0 }}>{(name || 'U').charAt(0).toUpperCase()}</div>
  );

  // ════════════════════════════════ CLIENTS ════════════════════════════════
  // Display name resolves to the company first, falling back to the legacy
  // person/account `name` so storefront-registered clients still show.
  const clientLabel = (c) => (c && (c.companyName || c.name)) || '—';
  const A_today = () => new Date().toISOString().slice(0, 10);

  function ClientModal({ client, onClose, isNew }) {
    const d = useData();
    const auth = useAuth();
    const readOnly = !(auth && auth.role === 'admin');
    const [f, setF] = React.useState({ companyName: '', tin: '', address: '', phone: '', email: '', contactPerson: '', notes: '', status: 'Active', ...client });
    const [tab, setTab] = React.useState('details');
    const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
    const orders = d.orders.filter((o) => o.clientId === client.id);

    const save = () => {
      if (readOnly) { ToastStore.push('Only admins can add or edit clients.', { title: 'Access denied', icon: 'lock', tone: 'error' }); return; }
      const companyName = (f.companyName || '').trim();
      if (!companyName) { ToastStore.push('Company name is required.', { title: 'Missing company name', icon: 'minus', tone: 'error' }); return; }
      const rec = {
        ...f, companyName,
        name: isNew ? companyName : (f.name || companyName),
        tin: (f.tin || '').trim(), address: (f.address || '').trim(), phone: (f.phone || '').trim(),
        email: (f.email || '').trim(), contactPerson: (f.contactPerson || '').trim(), notes: (f.notes || '').trim(),
        status: f.status || 'Active', source: f.source || (isNew ? 'admin' : 'storefront'),
        registered: f.registered || A_today(), createdAt: f.createdAt || new Date().toISOString(),
        id: f.id || A_uid('c_'),
      };
      DataStore.saveClient(rec);
      onClose();
      ToastStore.push(`${companyName} ${isNew ? 'added' : 'updated'}.`, { title: isNew ? 'Client added' : 'Client saved', icon: 'check', tone: 'ok' });
    };

    const Tab = ({ id, children }) => <button onClick={() => setTab(id)} style={{ flex: 1, border: 'none', background: 'none', cursor: 'pointer', fontFamily: F, fontSize: 14, fontWeight: 800, color: tab === id ? T.blue : T.sub, padding: '12px 0', borderBottom: `3px solid ${tab === id ? T.blue : 'transparent'}` }}>{children}</button>;
    const roCss = readOnly ? { background: T.surface, color: T.sub } : null;

    return (
      <Modal title={isNew ? 'Add Client' : clientLabel(client)} sub={isNew ? 'New client record' : (client.email || client.contactPerson || '')} width={580} onClose={onClose}
        footer={tab === 'details'
          ? (readOnly
              ? <React.Fragment><div style={{ marginRight: 'auto', display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12.5, fontWeight: 800, color: T.sub }}><Icon name="lock" size={15} color={T.sub} stroke={2} />View only — editing is admin-only</div><Button variant="ghost" onClick={onClose}>Close</Button></React.Fragment>
              : <React.Fragment><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" icon="check" onClick={save}>{isNew ? 'Add client' : 'Save changes'}</Button></React.Fragment>)
          : <Button variant="ghost" onClick={onClose}>Close</Button>}>
        {!isNew && (
          <div style={{ display: 'flex', borderBottom: `1px solid ${T.line}`, margin: '-22px -22px 20px' }}>
            <Tab id="details">Details</Tab><Tab id="orders">Order history · {orders.length}</Tab>
          </div>
        )}
        {tab === 'details' ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="Company name" hint="required" full><Input value={f.companyName} onChange={set('companyName')} disabled={readOnly} style={roCss} placeholder="Client company" /></Field>
            <Field label="Contact person" hint="optional"><Input value={f.contactPerson} onChange={set('contactPerson')} disabled={readOnly} style={roCss} /></Field>
            <Field label="TIN" hint="optional"><Input value={f.tin} onChange={set('tin')} disabled={readOnly} style={roCss} /></Field>
            <Field label="Phone" hint="optional"><Input value={f.phone} onChange={set('phone')} disabled={readOnly} style={roCss} /></Field>
            <Field label="Email" hint="optional"><Input type="email" value={f.email} onChange={set('email')} disabled={readOnly} style={roCss} /></Field>
            <Field label="Address" hint="optional" full><Textarea rows={2} value={f.address} onChange={set('address')} disabled={readOnly} style={roCss} /></Field>
            <Field label="Notes" hint="optional" full><Textarea rows={2} value={f.notes} onChange={set('notes')} disabled={readOnly} style={roCss} /></Field>
            <Field label="Status"><Select value={f.status} onChange={(v) => setF((s) => ({ ...s, status: v }))} options={['Active', 'Suspended']} /></Field>
            {!isNew && <Field label="Created"><Input value={A_fmtDate(f.createdAt || f.registered)} disabled style={{ background: T.surface, color: T.sub }} /></Field>}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {orders.length === 0 ? <Empty icon="cart" title="No orders yet" /> : orders.sort((a, b) => new Date(b.date) - new Date(a.date)).map((o) => (
              <div key={o.id} onClick={() => { onClose(); Router.go('orders', { focus: o.id }); }} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', border: `1px solid ${T.line}`, borderRadius: 12, cursor: 'pointer' }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: T.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="package" size={17} color={T.sub} stroke={1.8} /></div>
                <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13.5, fontWeight: 800, color: T.ink }}>{o.id}</div><div style={{ fontSize: 12, fontWeight: 600, color: T.sub }}>{A_fmtDate(o.date)} · {o.items.length} items</div></div>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: T.ink }}>{A_money(o.total)}</div>
                <Pill status={o.status} small />
              </div>
            ))}
          </div>
        )}
      </Modal>
    );
  }

  function Clients() {
    const d = useData();
    const auth = useAuth();
    const isAdmin = !!auth && auth.role === 'admin';
    const [q, setQ] = React.useState('');
    const [modal, setModal] = React.useState(null);   // { client, isNew } | null
    const orderCount = (id) => d.orders.filter((o) => o.clientId === id).length;
    const blankClient = () => ({ id: A_uid('c_'), companyName: '', tin: '', address: '', phone: '', email: '', contactPerson: '', notes: '', status: 'Active', source: 'admin', registered: A_today(), createdAt: new Date().toISOString() });
    const del = (c) => {
      if (!isAdmin) { ToastStore.push('Only admins can delete clients.', { title: 'Access denied', icon: 'lock', tone: 'error' }); return; }
      ConfirmStore.open({ title: 'Delete client', sub: clientLabel(c), body: `Permanently delete ${clientLabel(c)}? This cannot be undone.`, confirmLabel: 'Delete', danger: true, onConfirm: () => { DataStore.deleteClient(c.id); ToastStore.push(`${clientLabel(c)} deleted.`, { title: 'Client deleted', icon: 'minus', tone: 'warn' }); } });
    };
    const list = d.clients.filter((c) => !q.trim() || (clientLabel(c) + ' ' + (c.name || '') + ' ' + (c.email || '') + ' ' + (c.tin || '')).toLowerCase().includes(q.trim().toLowerCase()));
    const cols = [{ label: 'Company' }, { label: 'TIN' }, { label: 'Phone' }, { label: 'Email' }, { label: 'Created' }, { label: 'Orders', align: 'center' }, { label: 'Status', align: 'center' }, { label: '', align: 'right', width: isAdmin ? 92 : 60 }];
    return (
      <div>
        <PageHead title="Clients" sub={`${d.clients.length} client${d.clients.length === 1 ? '' : 's'}`}>
          {isAdmin && <Button icon="plus" onClick={() => setModal({ client: blankClient(), isNew: true })}>Add Client</Button>}
        </PageHead>
        <Card pad={14} style={{ marginBottom: 16 }}><Search value={q} onChange={setQ} placeholder="Search by company, contact or TIN…" width={360} /></Card>
        {list.length === 0 ? <Card><Empty icon="user" title="No clients match" /></Card> : (
          <Table columns={cols}>
            {list.map((c, i) => (
              <Row key={c.id} i={i} onClick={() => setModal({ client: c, isNew: false })}>
                <Td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Avatar name={clientLabel(c)} bg={c.status === 'Suspended' ? T.sub : T.blue} />
                    <div style={{ minWidth: 0 }}><div style={{ fontSize: 13.5, fontWeight: 800, color: T.ink }}>{clientLabel(c)}</div><div style={{ fontSize: 12, fontWeight: 600, color: T.sub }}>{c.contactPerson || c.email || '—'}</div></div>
                  </div>
                </Td>
                <Td><span style={{ fontSize: 12.5, fontWeight: 600, color: c.tin ? T.sub : T.faint, fontVariantNumeric: 'tabular-nums' }}>{c.tin || '—'}</span></Td>
                <Td><span style={{ fontSize: 12.5, fontWeight: 600, color: T.sub, fontVariantNumeric: 'tabular-nums' }}>{c.phone || '—'}</span></Td>
                <Td><span style={{ fontSize: 12.5, color: T.sub, display: 'inline-block', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.email || '—'}</span></Td>
                <Td><span style={{ fontSize: 12.5, fontWeight: 600, color: T.sub }}>{A_fmtDate(c.createdAt || c.registered)}</span></Td>
                <Td align="center"><span style={{ fontSize: 13.5, fontWeight: 800, color: T.ink }}>{orderCount(c.id)}</span></Td>
                <Td align="center"><Pill status={c.status} small /></Td>
                <Td align="right">
                  <div style={{ display: 'inline-flex', gap: 7 }}>
                    <IconBtn icon={isAdmin ? 'doc' : 'arrowRight'} tone="blue" title={isAdmin ? 'Edit' : 'View'} onClick={(e) => { e.stopPropagation(); setModal({ client: c, isNew: false }); }} />
                    {isAdmin && <IconBtn icon="minus" tone="danger" title="Delete" onClick={(e) => { e.stopPropagation(); del(c); }} />}
                  </div>
                </Td>
              </Row>
            ))}
          </Table>
        )}
        {modal && <ClientModal client={modal.client} isNew={modal.isNew} onClose={() => setModal(null)} />}
      </div>
    );
  }

  // ════════════════════════════════ ORDERS ═════════════════════════════════
  const ORDER_FLOW = ['Pending', 'Packed', 'In Transit', 'Out for Delivery', 'Delivered'];
  const ORDER_STAGE_LABEL = { Pending: 'Order Placed', Packed: 'Order Packed', Shipped: 'In Transit', 'In Transit': 'In Transit', 'Out for Delivery': 'Out for Delivery', Delivered: 'Delivered' };
  function OrderModal({ order, onClose }) {
    const d = useData();
    const auth = useAuth();
    const readOnly = auth && auth.role === 'staff';
    const o = d.orders.find((x) => x.id === order.id) || order;
    const subtotal = o.items.reduce((s, it) => s + it.price * it.qty, 0);
    const updateStatus = (v) => {
      DataStore.setOrderStatus(o.id, v);
      ToastStore.push(`${o.id} marked ${v} — ${o.clientName} notified.`, { title: 'Status updated', icon: 'truck', tone: v === 'Cancelled' ? 'warn' : 'ok' });
    };
    // Payment verification — storefront checkouts arrive 'Awaiting verification'.
    const payStatus = o.paymentStatus;
    const verifyPayment = () => {
      DataStore.setOrderPayment(o.id, 'Verified');
      ToastStore.push(`Payment for ${o.id} marked as verified.`, { title: 'Payment verified', icon: 'check', tone: 'ok' });
    };
    const normStatus = o.status === 'Shipped' ? 'In Transit' : o.status;
    const stepIndex = ORDER_FLOW.indexOf(normStatus);
    const stampFor = (status) => {
      const stage = ORDER_STAGE_LABEL[status];
      const e = (o.timeline || []).find((x) => x.stage === stage);
      if (!e) return '';
      const dt = new Date(e.date); if (isNaN(dt)) return '';
      return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) + ' · ' + dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    };
    const cancelled = o.status === 'Cancelled';
    const cell = { padding: '11px 14px', fontSize: 13 };
    const th = { ...cell, fontSize: 11, fontWeight: 800, color: T.sub, textTransform: 'uppercase', letterSpacing: 0.4, background: T.surface, borderBottom: `1px solid ${T.line}` };

    return (
      <Modal title={'Order ' + o.id} sub={`${o.clientName} · ${A_fmtDate(o.date)}`} width={760} onClose={onClose}
        footer={<React.Fragment>
          {readOnly
            ? <div style={{ marginRight: 'auto', display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12.5, fontWeight: 800, color: T.sub }}><Icon name="lock" size={15} color={T.sub} stroke={2} />Read-only \u2014 status changes disabled</div>
            : <div style={{ marginRight: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: T.sub }}>Update status</span>
                <Select value={o.status} onChange={updateStatus} options={A_ORDER_STATUSES} width={170} />
              </div>}
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </React.Fragment>}>
        {/* meta */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 18 }}>
          {[['Status', <Pill status={o.status} />], ['Payment', (
            <div>
              {o.payment}
              {payStatus && (
                <div style={{ marginTop: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: payStatus === 'Verified' ? T.green : T.amberInk, background: payStatus === 'Verified' ? T.greenWash : '#FFF4DC', padding: '3px 9px', borderRadius: 999, whiteSpace: 'nowrap' }}>
                    {payStatus === 'Verified' ? 'Verified' : 'Awaiting verification'}</span>
                </div>
              )}
            </div>
          )], ['Items', o.items.reduce((s, it) => s + it.qty, 0)], ['Total', A_money(o.total)]].map(([k, v], i) => (
            <div key={i} style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: 12, padding: '11px 13px' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: T.sub, textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 6 }}>{k}</div>
              <div style={{ fontSize: 14.5, fontWeight: 800, color: T.ink }}>{v}</div>
            </div>
          ))}
        </div>

        {/* payment verification */}
        {payStatus && payStatus !== 'Verified' && !cancelled && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '13px 15px', background: '#FFF4DC', border: '1px solid #F0D9A6', borderRadius: 12, marginBottom: 18, flexWrap: 'wrap' }}>
            <Icon name="shield" size={20} color={T.amberInk} stroke={2} />
            <div style={{ flex: 1, minWidth: 220, fontSize: 13, fontWeight: 700, color: T.ink, lineHeight: 1.5 }}>
              Customer reports paying <strong>{A_money(o.total)}</strong> via {o.payment}. Confirm the funds arrived before verifying.</div>
            {readOnly
              ? <span style={{ fontSize: 12, fontWeight: 800, color: T.sub }}>Admin only</span>
              : <Button variant="primary" icon="check" onClick={verifyPayment}>Verify payment</Button>}
          </div>
        )}
        {payStatus === 'Verified' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 15px', background: T.greenWash, borderRadius: 12, marginBottom: 18, fontSize: 13, fontWeight: 800, color: T.green }}>
            <Icon name="check" size={17} color={T.green} stroke={2.6} />
            Payment verified{o.paymentVerifiedAt ? ' · ' + A_fmtDate(o.paymentVerifiedAt) : ''}
          </div>
        )}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: T.ink, marginBottom: 14 }}>Status timeline</div>
          {cancelled ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: T.redWash, borderRadius: 12, color: T.red, fontWeight: 800, fontSize: 13.5 }}><Icon name="minus" size={18} color={T.red} stroke={2.4} />Order cancelled</div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
              <div style={{ position: 'absolute', left: 16, right: 16, top: 14, height: 3, background: T.line, borderRadius: 999 }} />
              <div style={{ position: 'absolute', left: 16, top: 14, height: 3, width: `${stepIndex <= 0 ? 0 : (stepIndex / (ORDER_FLOW.length - 1)) * 100}%`, maxWidth: 'calc(100% - 32px)', background: T.blue, borderRadius: 999 }} />
              {ORDER_FLOW.map((s, i) => {
                const done = i <= stepIndex;
                const stamp = done ? stampFor(s) : '';
                return (
                  <div key={s} style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 999, background: done ? T.blue : '#fff', border: `2px solid ${done ? T.blue : T.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="check" size={15} color={done ? '#fff' : T.line} stroke={2.6} /></div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: done ? T.ink : T.faint, marginTop: 8, textAlign: 'center' }}>{s}</div>
                    {stamp && <div style={{ fontSize: 10.5, fontWeight: 600, color: T.sub, marginTop: 3, textAlign: 'center', maxWidth: 96 }}>{stamp}</div>}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* items */}
        <div style={{ border: `1px solid ${T.line}`, borderRadius: 14, overflow: 'hidden', marginBottom: 14 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: F, color: T.ink }}>
            <thead><tr><th style={th}>Product</th><th style={{ ...th, textAlign: 'center' }}>Qty</th><th style={{ ...th, textAlign: 'right' }}>Price</th><th style={{ ...th, textAlign: 'right' }}>Subtotal</th></tr></thead>
            <tbody>
              {o.items.map((it, i) => {
                const prod = d.products.find((p) => p.id === it.productId) || it;
                return (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.lineSoft}` }}>
                    <td style={cell}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                        <Thumb p={prod} size={40} />
                        <div style={{ minWidth: 0 }}><div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.3 }}>{it.name}</div><div style={{ fontSize: 11.5, fontWeight: 700, color: T.sub }}>{it.sku}</div></div>
                      </div>
                    </td>
                    <td style={{ ...cell, textAlign: 'center', fontWeight: 800 }}>{it.qty}</td>
                    <td style={{ ...cell, textAlign: 'right', fontWeight: 600, color: T.sub, fontVariantNumeric: 'tabular-nums' }}>{A_money(it.price)}</td>
                    <td style={{ ...cell, textAlign: 'right', fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{A_money(it.price * it.qty)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '14px 16px', background: T.surface }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: T.ink }}>Order total</span>
            <span style={{ fontSize: 20, fontWeight: 800, color: T.ink, fontVariantNumeric: 'tabular-nums' }}>{A_money(subtotal)}</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '13px 15px', background: T.surface, borderRadius: 12 }}>
          <Icon name="pin" size={18} color={T.blue} stroke={1.9} style={{ marginTop: 1, flexShrink: 0 }} />
          <div><div style={{ fontSize: 11.5, fontWeight: 800, color: T.sub, textTransform: 'uppercase', letterSpacing: 0.3 }}>Shipping address</div><div style={{ fontSize: 13.5, fontWeight: 700, color: T.ink, marginTop: 3 }}>{o.address}</div></div>
        </div>
      </Modal>
    );
  }

  function Orders() {
    const d = useData();
    const auth = useAuth();
    const isAdmin = !!auth && auth.role === 'admin';
    const payload = Router.payload();
    const [q, setQ] = React.useState('');
    const [status, setStatus] = React.useState('All');
    const [focus, setFocus] = React.useState(null);
    React.useEffect(() => { if (payload && payload.focus) { const o = d.orders.find((x) => x.id === payload.focus); if (o) setFocus(o); } }, []);

    const del = (o) => {
      if (!isAdmin) { ToastStore.push('Access denied. Only admins can delete.', { title: 'Access denied', icon: 'lock', tone: 'error' }); return; }
      ConfirmStore.open({ title: 'Delete order', sub: o.id, body: `Permanently delete order ${o.id} for ${o.clientName}? This cannot be undone.`, confirmLabel: 'Delete', danger: true, onConfirm: () => { DataStore.deleteOrder(o.id); ToastStore.push(`Order ${o.id} deleted.`, { title: 'Order deleted', icon: 'minus', tone: 'warn' }); } });
    };

    const list = d.orders.filter((o) => {
      if (status !== 'All' && o.status !== status) return false;
      if (q.trim()) { const s = (o.id + ' ' + o.clientName).toLowerCase(); if (!s.includes(q.trim().toLowerCase())) return false; }
      return true;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));

    const cols = [{ label: 'Order' }, { label: 'Client' }, { label: 'Date' }, { label: 'Total', align: 'right' }, { label: 'Status', align: 'center' }, { label: '', align: 'right', width: isAdmin ? 92 : 60 }];
    return (
      <div>
        <PageHead title="Orders" sub={`${d.orders.length} orders · update status to notify clients`} />
        <Card pad={14} style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <Search value={q} onChange={setQ} placeholder="Search order # or client…" width={300} />
          <Select value={status} onChange={setStatus} options={['All', ...A_ORDER_STATUSES]} width={170} />
          <div style={{ flex: 1 }} /><div style={{ fontSize: 13, fontWeight: 700, color: T.sub }}>{list.length} shown</div>
        </Card>
        {list.length === 0 ? <Card><Empty icon="cart" title="No orders match" /></Card> : (
          <Table columns={cols}>
            {list.map((o, i) => (
              <Row key={o.id} i={i} onClick={() => setFocus(o)}>
                <Td><span style={{ fontSize: 13, fontWeight: 800, color: T.ink, fontVariantNumeric: 'tabular-nums' }}>{o.id}</span></Td>
                <Td><span style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>{o.clientName}</span></Td>
                <Td><span style={{ fontSize: 12.5, fontWeight: 600, color: T.sub }}>{A_fmtDate(o.date)}</span></Td>
                <Td align="right"><span style={{ fontSize: 13.5, fontWeight: 800, color: T.ink, fontVariantNumeric: 'tabular-nums' }}>{A_money(o.total)}</span></Td>
                <Td align="center"><Pill status={o.status} small /></Td>
                <Td align="right">
                  <div style={{ display: 'inline-flex', gap: 7 }}>
                    <IconBtn icon="arrowRight" tone="blue" title="View" onClick={(e) => { e.stopPropagation(); setFocus(o); }} />
                    {isAdmin && <IconBtn icon="minus" tone="danger" title="Delete" onClick={(e) => { e.stopPropagation(); del(o); }} />}
                  </div>
                </Td>
              </Row>
            ))}
          </Table>
        )}
        {focus && <OrderModal order={focus} onClose={() => setFocus(null)} />}
      </div>
    );
  }

  // ═══════════════════════════════ INQUIRIES ═══════════════════════════════
  function InquiryModal({ inquiry, onClose }) {
    const d = useData();
    const q = d.inquiries.find((x) => x.id === inquiry.id) || inquiry;
    const [reply, setReply] = React.useState('');
    const send = () => {
      if (!reply.trim()) { ToastStore.push('Write a reply before sending.', { title: 'Empty reply', icon: 'doc', tone: 'error' }); return; }
      DataStore.setInquiryStatus(q.id, 'In Progress');
      setReply('');
      ToastStore.push(`Reply emailed to ${q.clientName}.`, { title: 'Reply sent', icon: 'check', tone: 'ok' });
    };
    const resolve = () => { DataStore.setInquiryStatus(q.id, 'Resolved'); onClose(); ToastStore.push(`${q.id} marked resolved.`, { title: 'Inquiry resolved', icon: 'check', tone: 'ok' }); };
    return (
      <Modal title={q.subject} sub={`${q.id} · ${q.clientName} · ${A_fmtDate(q.date)}`} width={580} onClose={onClose}
        footer={<React.Fragment>
          <Button variant="ghost" onClick={onClose}>Close</Button>
          {q.status !== 'Resolved' && <Button variant="accent" icon="check" onClick={resolve}>Mark resolved</Button>}
          <Button variant="primary" icon="arrowRight" onClick={send}>Send reply</Button>
        </React.Fragment>}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <Avatar name={q.clientName} /><div><div style={{ fontSize: 14, fontWeight: 800, color: T.ink }}>{q.clientName}</div><div style={{ fontSize: 12.5, fontWeight: 600, color: T.sub }}>{q.email}</div></div>
          <div style={{ flex: 1 }} /><Pill status={q.status} />
        </div>
        <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: 12, padding: '14px 16px', fontSize: 14, color: T.ink, fontWeight: 600, lineHeight: 1.55, marginBottom: 18 }}>{q.message}</div>
        <Field label="Your reply" hint="simulated email"><Textarea rows={4} value={reply} onChange={(e) => setReply(e.target.value)} placeholder={`Hi ${q.clientName.split(' ')[0]}, thanks for reaching out…`} /></Field>
        <button onClick={() => { onClose(); Router.go('quotes', { attach: q.clientName }); }} style={{ marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 8, border: `1.5px dashed ${T.line}`, background: '#fff', borderRadius: 11, padding: '10px 14px', cursor: 'pointer', fontFamily: F, fontSize: 13, fontWeight: 800, color: T.blue }}>
          <Icon name="doc" size={16} color={T.blue} />Attach a quote from Quotes</button>
      </Modal>
    );
  }

  function Inquiries() {
    const d = useData();
    const auth = useAuth();
    const isAdmin = !!auth && auth.role === 'admin';
    const payload = Router.payload();
    const [q, setQ] = React.useState('');
    const [status, setStatus] = React.useState('All');
    const [focus, setFocus] = React.useState(null);
    React.useEffect(() => { if (payload && payload.focus) { const it = d.inquiries.find((x) => x.id === payload.focus); if (it) setFocus(it); } }, []);
    const del = (it) => {
      if (!isAdmin) { ToastStore.push('Access denied. Only admins can delete.', { title: 'Access denied', icon: 'lock', tone: 'error' }); return; }
      ConfirmStore.open({ title: 'Delete inquiry', sub: it.id, body: `Permanently delete inquiry ${it.id} from ${it.clientName}? This cannot be undone.`, confirmLabel: 'Delete', danger: true, onConfirm: () => { DataStore.deleteInquiry(it.id); ToastStore.push(`Inquiry ${it.id} deleted.`, { title: 'Inquiry deleted', icon: 'minus', tone: 'warn' }); } });
    };
    const list = d.inquiries.filter((it) => {
      if (status !== 'All' && it.status !== status) return false;
      if (q.trim()) { const s = (it.subject + ' ' + it.clientName + ' ' + it.id).toLowerCase(); if (!s.includes(q.trim().toLowerCase())) return false; }
      return true;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
    const cols = [{ label: 'Inquiry' }, { label: 'Client' }, { label: 'Date' }, { label: 'Status', align: 'center' }, { label: '', align: 'right', width: isAdmin ? 92 : 60 }];
    return (
      <div>
        <PageHead title="Inquiries" sub={`${d.inquiries.length} customer inquiries`} />
        <Card pad={14} style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <Search value={q} onChange={setQ} placeholder="Search subject or client…" width={300} />
          <Select value={status} onChange={setStatus} options={['All', ...A_INQUIRY_STATUSES]} width={170} />
        </Card>
        {list.length === 0 ? <Card><Empty icon="doc" title="No inquiries match" /></Card> : (
          <Table columns={cols}>
            {list.map((it, i) => (
              <Row key={it.id} i={i} onClick={() => setFocus(it)}>
                <Td>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 800, color: T.ink, maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.subject}</div>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: T.sub, fontVariantNumeric: 'tabular-nums' }}>{it.id}</div>
                  </div>
                </Td>
                <Td><span style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>{it.clientName}</span></Td>
                <Td><span style={{ fontSize: 12.5, fontWeight: 600, color: T.sub }}>{A_relTime(it.date)}</span></Td>
                <Td align="center"><Pill status={it.status} small /></Td>
                <Td align="right">
                  <div style={{ display: 'inline-flex', gap: 7 }}>
                    <IconBtn icon="arrowRight" tone="blue" title="Open" onClick={(e) => { e.stopPropagation(); setFocus(it); }} />
                    {isAdmin && <IconBtn icon="minus" tone="danger" title="Delete" onClick={(e) => { e.stopPropagation(); del(it); }} />}
                  </div>
                </Td>
              </Row>
            ))}
          </Table>
        )}
        {focus && <InquiryModal inquiry={focus} onClose={() => setFocus(null)} />}
      </div>
    );
  }

  // ════════════════════════════════ QUOTES ═════════════════════════════════
  function QuoteModal({ onClose, presetClient }) {
    const d = useData();
    const [f, setF] = React.useState({ clientName: presetClient || (d.clients[0] && d.clients[0].name) || '', fileName: '', orderId: '' });
    const upload = () => {
      if (!f.fileName.trim()) { ToastStore.push('Choose a file to upload.', { title: 'No file', icon: 'doc', tone: 'error' }); return; }
      const id = '#QT-2026-' + Math.floor(100 + Math.random() * 900);
      DataStore.addQuote({ id, clientName: f.clientName, date: '2026-06-22', fileName: f.fileName.trim().endsWith('.pdf') ? f.fileName.trim() : f.fileName.trim() + '.pdf', status: 'Sent', orderId: f.orderId });
      onClose();
      ToastStore.push(`Quote ${id} sent to ${f.clientName}.`, { title: 'Quote sent', icon: 'check', tone: 'ok' });
    };
    const clientOrders = d.orders.filter((o) => o.clientName === f.clientName);
    return (
      <Modal title="Upload Quote" sub="Mock upload — attach to a client and order" width={520} onClose={onClose}
        footer={<React.Fragment><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" icon="arrowRight" onClick={upload}>Send to client</Button></React.Fragment>}>
        <div style={{ display: 'grid', gap: 16 }}>
          <Field label="Client"><Select value={f.clientName} onChange={(v) => setF((s) => ({ ...s, clientName: v, orderId: '' }))} options={d.clients.map((c) => c.name)} /></Field>
          <Field label="Quote file">
            <div onClick={() => setF((s) => ({ ...s, fileName: 'Quote_' + Date.now().toString().slice(-6) + '.pdf' }))} style={{ border: `1.5px dashed ${f.fileName ? T.blue : T.line}`, background: f.fileName ? T.blueWash : T.surface, borderRadius: 12, padding: '20px', textAlign: 'center', cursor: 'pointer' }}>
              {f.fileName ? <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}><Icon name="doc" size={20} color={T.blue} /><span style={{ fontSize: 13.5, fontWeight: 800, color: T.ink }}>{f.fileName}</span></div>
                : <div style={{ color: T.sub }}><Icon name="download" size={22} color={T.sub} style={{ margin: '0 auto 6px' }} /><div style={{ fontSize: 13.5, fontWeight: 800, color: T.ink }}>Click to choose a file (mock)</div><div style={{ fontSize: 12, marginTop: 2 }}>PDF</div></div>}
            </div>
          </Field>
          <Field label="Link to order" hint="optional"><Select value={f.orderId} onChange={(v) => setF((s) => ({ ...s, orderId: v }))} options={[{ value: '', label: 'None' }, ...clientOrders.map((o) => ({ value: o.id, label: `${o.id} · ${A_money(o.total)}` }))]} /></Field>
        </div>
      </Modal>
    );
  }

  function Quotes() {
    const d = useData();
    const payload = Router.payload();
    const [open, setOpen] = React.useState(false);
    const [preset, setPreset] = React.useState(null);
    React.useEffect(() => { if (payload && payload.attach) { setPreset(payload.attach); setOpen(true); } }, []);
    const cols = [{ label: 'Quote' }, { label: 'Client' }, { label: 'File' }, { label: 'Date' }, { label: 'Linked Order' }, { label: 'Status', align: 'center' }, { label: '', align: 'right', width: 110 }];
    return (
      <div>
        <PageHead title="Quotes" sub={`${d.quotes.length} quotes`}>
          <Button icon="plus" onClick={() => { setPreset(null); setOpen(true); }}>Upload quote</Button>
        </PageHead>
        {d.quotes.length === 0 ? <Card><Empty icon="doc" title="No quotes yet" sub="Upload a quote to get started." /></Card> : (
          <Table columns={cols}>
            {d.quotes.map((q, i) => (
              <Row key={q.id} i={i}>
                <Td><span style={{ fontSize: 13, fontWeight: 800, color: T.ink, fontVariantNumeric: 'tabular-nums' }}>{q.id}</span></Td>
                <Td><span style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>{q.clientName}</span></Td>
                <Td><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Icon name="doc" size={16} color={T.sub} /><span style={{ fontSize: 12.5, fontWeight: 600, color: T.sub, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.fileName}</span></div></Td>
                <Td><span style={{ fontSize: 12.5, fontWeight: 600, color: T.sub }}>{A_fmtDate(q.date)}</span></Td>
                <Td>{q.orderId ? <button onClick={() => Router.go('orders', { focus: q.orderId })} style={{ border: 'none', background: 'none', color: T.blue, fontWeight: 800, fontSize: 12.5, cursor: 'pointer', fontFamily: F, fontVariantNumeric: 'tabular-nums' }}>{q.orderId}</button> : <span style={{ fontSize: 12.5, color: T.faint }}>—</span>}</Td>
                <Td align="center"><Pill status={q.status} small /></Td>
                <Td align="right">
                  {q.status === 'Pending'
                    ? <Button size="sm" variant="ghost" icon="arrowRight" onClick={() => { DataStore.setQuoteStatus(q.id, 'Sent'); ToastStore.push(`Quote ${q.id} sent to ${q.clientName}.`, { title: 'Quote sent', icon: 'check', tone: 'ok' }); }}>Send</Button>
                    : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 800, color: T.green }}><Icon name="check" size={15} color={T.green} stroke={2.4} />Sent</span>}
                </Td>
              </Row>
            ))}
          </Table>
        )}
        {open && <QuoteModal presetClient={preset} onClose={() => setOpen(false)} />}
      </div>
    );
  }

  Object.assign(window, { AdminClients: Clients, AdminOrders: Orders, AdminInquiries: Inquiries, AdminQuotes: Quotes });
})();
