// quote.jsx — Quotation builder, read-only preview, send flow, and the Quotes
// section (overrides the simple uploader with the full quotation system).
(function () {
  const { Icon } = window;
  const T = window.ADMIN_T, F = window.ADMIN_F;
  const { Card, PageHead, Button, IconBtn, Search, Select, Table, Td, Row, Empty, Pill,
    Field, Input, Textarea, Modal, ConfirmStore, ToastStore, Router, useData, useAuth, DataStore, A_uid,
    A_field, A_lbl, PPS_PAYMENT_TERMS, PPS_CURRENCIES, Q_fmtMoney, Q_fmtDate, Q_todayISO, Q_addDays,
    Q_totalsOf, QuoteStore, useQuotes, buildQuotationHTML, printQuotation } = window;

  const UOMS = ['Pcs', 'Mtrs', 'Kg', 'Set', 'Box', 'Roll', 'Unit', 'Pair', 'Hrs', 'Lot'];
  const Q_STATUSES = ['Draft', 'Sent', 'Accepted', 'Rejected'];
  const openLink = (href) => { const a = document.createElement('a'); a.href = href; a.target = '_blank'; a.rel = 'noopener'; document.body.appendChild(a); a.click(); a.remove(); };

  // Pill colours for the two quote-only statuses not already in the shared map.
  function QStatus({ status }) {
    const extra = { Accepted: { fg: T.green, bg: T.greenWash }, Rejected: { fg: T.red, bg: T.redWash }, Draft: { fg: T.sub, bg: T.surface } };
    const c = extra[status];
    if (!c) return <Pill status={status} small />;
    return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 800, color: c.fg, background: c.bg, padding: '3px 9px', borderRadius: 999, whiteSpace: 'nowrap' }}><span style={{ width: 6, height: 6, borderRadius: 999, background: c.fg }} />{status}</span>;
  }

  // ════════════════════════════════ BUILDER ═════════════════════════════════
  function QuotationBuilder({ existing, presetClient, onClose }) {
    const auth = useAuth();
    const d = useData();
    const isNew = !existing;
    const blank = () => {
      const { seq, number } = QuoteStore.nextNumber();
      const today = Q_todayISO();
      const pc = presetClient ? (d.clients.find((c) => c.name === presetClient) || {}) : {};
      return {
        id: 'q_' + Math.random().toString(36).slice(2, 9), seq, number,
        issuedBy: auth.signature || auth.name, issuedByTitle: auth.title || '',
        client: { company: presetClient || '', tin: '', address: pc.address || '', phone: pc.phone || '', email: pc.email || '' },
        date: today, validUntil: Q_addDays(today, 30), paymentTerms: 'Net 30 Days', currency: 'UGX', vat: true,
        items: [{ code: 'ITM-001', description: '', uom: 'Pcs', qty: 1, unitPrice: 0 }],
        status: 'Draft', createdAt: new Date().toISOString(),
      };
    };
    const [q, setQ] = React.useState(() => existing ? JSON.parse(JSON.stringify(existing)) : blank());
    const [err, setErr] = React.useState('');
    const set = (k) => (e) => setQ((s) => ({ ...s, [k]: e.target.value }));
    const setClient = (k) => (e) => setQ((s) => ({ ...s, client: { ...s.client, [k]: e.target.value } }));
    const isAdmin = !!auth && auth.role === 'admin';
    const clientLabel = (c) => (c && (c.companyName || c.name)) || '';
    // Auto-fill TIN / address / phone / email when the typed company exactly
    // matches a saved client (case-insensitive). Manual entry is never blocked.
    const onCompany = (e) => {
      const v = e.target.value;
      setQ((s) => {
        const match = d.clients.find((c) => clientLabel(c).trim().toLowerCase() === v.trim().toLowerCase());
        const client = { ...s.client, company: v };
        if (match) Object.assign(client, { tin: match.tin || '', address: match.address || '', phone: match.phone || '', email: match.email || '', clientId: match.id });
        return { ...s, client };
      });
    };
    const saveClientFromQuote = () => {
      const company = (q.client.company || '').trim();
      if (!company) { ToastStore.push('Enter a company name first.', { title: 'No company', icon: 'minus', tone: 'error' }); return; }
      const existing = d.clients.find((c) => clientLabel(c).trim().toLowerCase() === company.toLowerCase());
      if (existing) { ToastStore.push(`${company} is already saved in Clients.`, { title: 'Already a client', icon: 'check', tone: 'info' }); return; }
      const rec = { id: A_uid('c_'), companyName: company, name: company, tin: (q.client.tin || '').trim(), address: (q.client.address || '').trim(), phone: (q.client.phone || '').trim(), email: (q.client.email || '').trim(), contactPerson: '', notes: '', status: 'Active', source: 'admin', registered: new Date().toISOString().slice(0, 10), createdAt: new Date().toISOString() };
      DataStore.saveClient(rec);
      setQ((s) => ({ ...s, client: { ...s.client, clientId: rec.id } }));
      ToastStore.push(`${company} added to Clients.`, { title: 'Client saved', icon: 'check', tone: 'ok' });
    };
    const setItem = (i, k, v) => setQ((s) => { const items = s.items.slice(); items[i] = { ...items[i], [k]: v }; return { ...s, items }; });
    const addItem = () => setQ((s) => ({ ...s, items: [...s.items, { code: 'ITM-' + String(s.items.length + 1).padStart(3, '0'), description: '', uom: 'Pcs', qty: 1, unitPrice: 0 }] }));
    const removeItem = (i) => setQ((s) => ({ ...s, items: s.items.length > 1 ? s.items.filter((_, x) => x !== i) : s.items }));

    const t = Q_totalsOf(q);
    const cur = q.currency;

    const validate = () => {
      if (!q.client.company.trim()) { setErr('Enter the client / company name (Issued To).'); return false; }
      if (!q.items.some((it) => it.description.trim())) { setErr('Add at least one line item with a description.'); return false; }
      setErr(''); return true;
    };
    const persist = (status) => {
      const clean = { ...q, client: { ...q.client, company: q.client.company.trim() }, status: status || q.status,
        items: q.items.filter((it) => it.description.trim() || Number(it.qty) || Number(it.unitPrice)) };
      QuoteStore.save(clean);
      return clean;
    };
    const saveDraft = () => { if (!validate()) return; persist(); onClose(); ToastStore.push(`${q.number} saved.`, { title: 'Quotation saved', icon: 'check', tone: 'ok' }); };
    const downloadPdf = () => { if (!validate()) return; const c = persist(); printQuotation(c); ToastStore.push('Opening print dialog — choose “Save as PDF”.', { title: 'PDF ready', icon: 'download', tone: 'info' }); };
    const sendNow = () => { if (!validate()) return; const c = persist(); onClose(); window.__ppsOpenSend && window.__ppsOpenSend(c); };

    // compact field styles for the dense item rows
    const cell = { ...A_field, padding: '8px 9px', fontSize: 13, borderRadius: 8 };
    const numCell = { ...cell, textAlign: 'right', fontVariantNumeric: 'tabular-nums' };
    const head = { fontSize: 10.5, fontWeight: 800, color: T.sub, textTransform: 'uppercase', letterSpacing: 0.4, padding: '0 4px 7px', textAlign: 'left' };

    return (
      <Modal title={isNew ? 'Create Quotation' : `Edit ${q.number}`} sub={isNew ? q.number + ' · draft' : q.client.company} width={960} onClose={onClose}
        footer={<React.Fragment>
          <div style={{ marginRight: 'auto', display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: T.sub }}>Grand total</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: T.ink, fontVariantNumeric: 'tabular-nums' }}>{Q_fmtMoney(t.grand, cur)}</span>
          </div>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="ghost" icon="download" onClick={downloadPdf}>Download PDF</Button>
          <Button variant="dark" icon="check" onClick={saveDraft}>Save</Button>
          <Button variant="primary" icon="arrowRight" onClick={sendNow}>Save &amp; Send</Button>
        </React.Fragment>}>
        {err && <div style={{ display: 'flex', alignItems: 'center', gap: 9, background: T.redWash, border: `1px solid #F6C9CB`, color: T.red, borderRadius: 11, padding: '10px 13px', fontSize: 13, fontWeight: 700, marginBottom: 16 }}><Icon name="minus" size={15} color={T.red} stroke={2.6} />{err}</div>}

        {/* Issued by / Issued to */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 18 }}>
          <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: 14, padding: 16 }}>
            <div style={{ fontSize: 11.5, fontWeight: 800, color: T.sub, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 12 }}>Issued By</div>
            <div style={{ display: 'grid', gap: 12 }}>
              <Field label="Name / signature"><Input value={q.issuedBy} onChange={set('issuedBy')} /></Field>
              <Field label="Title"><Input value={q.issuedByTitle} onChange={set('issuedByTitle')} placeholder="Sales Officer" /></Field>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.sub, display: 'flex', alignItems: 'center', gap: 7 }}><Icon name="shield" size={14} color={T.green} stroke={2} />Auto-filled from your account signature</div>
            </div>
          </div>
          <div style={{ border: `1px solid ${T.line}`, borderRadius: 14, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{ fontSize: 11.5, fontWeight: 800, color: T.sub, textTransform: 'uppercase', letterSpacing: 0.4 }}>Issued To · Client</div>
              <div style={{ flex: 1 }} />
              {isAdmin && <Button size="sm" variant="ghost" icon="plus" onClick={saveClientFromQuote}>Save as new client</Button>}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Company name" hint="type to auto-fill" full><Input value={q.client.company} onChange={onCompany} placeholder="Start typing a client company…" list="pps-client-names" autoComplete="off" /></Field>
              <Field label="TIN" hint="optional"><Input value={q.client.tin} onChange={setClient('tin')} /></Field>
              <Field label="Phone" hint="optional"><Input value={q.client.phone} onChange={setClient('phone')} /></Field>
              <Field label="Email" hint="optional" full><Input value={q.client.email} onChange={setClient('email')} type="email" /></Field>
              <Field label="Address" hint="optional" full><Input value={q.client.address} onChange={setClient('address')} /></Field>
            </div>
            <datalist id="pps-client-names">{d.clients.map((c) => <option key={c.id} value={clientLabel(c)} />)}</datalist>
          </div>
        </div>

        {/* Quotation details */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 16 }}>
          <Field label="Date"><Input type="date" value={q.date} onChange={(e) => setQ((s) => ({ ...s, date: e.target.value }))} /></Field>
          <Field label="Valid until"><Input type="date" value={q.validUntil} onChange={(e) => setQ((s) => ({ ...s, validUntil: e.target.value }))} /></Field>
          <Field label="Payment terms"><Select value={q.paymentTerms} onChange={(v) => setQ((s) => ({ ...s, paymentTerms: v }))} options={PPS_PAYMENT_TERMS} /></Field>
          <Field label="Currency"><Select value={q.currency} onChange={(v) => setQ((s) => ({ ...s, currency: v }))} options={Object.keys(PPS_CURRENCIES)} /></Field>
        </div>

        {/* Items */}
        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: T.ink }}>Items</span>
            <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 600, color: T.sub }}>· amount calculates automatically</span>
            <div style={{ flex: 1 }} />
            <Button size="sm" variant="ghost" icon="plus" onClick={addItem}>Add row</Button>
          </div>
          <div style={{ overflowX: 'auto', border: `1px solid ${T.line}`, borderRadius: 14 }}>
            <table style={{ width: '100%', minWidth: 760, borderCollapse: 'collapse', fontFamily: F }}>
              <thead><tr style={{ background: T.surface }}>
                <th style={{ ...head, padding: '10px 8px 10px 12px', width: 120 }}>Item code</th>
                <th style={{ ...head, padding: '10px 8px' }}>Description</th>
                <th style={{ ...head, padding: '10px 8px', width: 92 }}>UOM</th>
                <th style={{ ...head, padding: '10px 8px', width: 74, textAlign: 'right' }}>Qty</th>
                <th style={{ ...head, padding: '10px 8px', width: 130, textAlign: 'right' }}>Unit price</th>
                <th style={{ ...head, padding: '10px 8px', width: 130, textAlign: 'right' }}>Amount</th>
                <th style={{ ...head, padding: '10px 12px 10px 8px', width: 40 }}></th>
              </tr></thead>
              <tbody>
                {q.items.map((it, i) => (
                  <tr key={i} style={{ borderTop: `1px solid ${T.lineSoft}` }}>
                    <td style={{ padding: '7px 6px 7px 10px' }}><input value={it.code} onChange={(e) => setItem(i, 'code', e.target.value)} style={{ ...cell, fontFamily: F, fontWeight: 700 }} /></td>
                    <td style={{ padding: '7px 6px' }}><input value={it.description} onChange={(e) => setItem(i, 'description', e.target.value)} placeholder="Item description" style={{ ...cell }} /></td>
                    <td style={{ padding: '7px 6px' }}>
                      <select value={it.uom} onChange={(e) => setItem(i, 'uom', e.target.value)} style={{ ...cell, appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer', fontWeight: 700 }}>{UOMS.map((u) => <option key={u} value={u}>{u}</option>)}</select>
                    </td>
                    <td style={{ padding: '7px 6px' }}><input type="number" min="0" value={it.qty} onChange={(e) => setItem(i, 'qty', e.target.value)} style={numCell} /></td>
                    <td style={{ padding: '7px 6px' }}><input type="number" min="0" value={it.unitPrice} onChange={(e) => setItem(i, 'unitPrice', e.target.value)} style={numCell} /></td>
                    <td style={{ padding: '7px 6px', textAlign: 'right', fontSize: 13, fontWeight: 800, color: T.ink, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{Q_fmtMoney((Number(it.qty) || 0) * (Number(it.unitPrice) || 0), cur)}</td>
                    <td style={{ padding: '7px 10px 7px 6px', textAlign: 'center' }}>
                      <button onClick={() => removeItem(i)} title="Remove" style={{ width: 28, height: 28, borderRadius: 8, border: `1px solid ${T.line}`, background: '#fff', color: T.red, cursor: q.items.length > 1 ? 'pointer' : 'not-allowed', opacity: q.items.length > 1 ? 1 : 0.4, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="minus" size={15} color={T.red} stroke={2.6} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* VAT + totals */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 18, alignItems: 'flex-start' }}>
          <label style={{ flex: '1 1 240px', display: 'flex', alignItems: 'center', gap: 12, padding: '13px 15px', border: `1.5px solid ${q.vat ? T.blue : T.line}`, background: q.vat ? T.blueWash : '#fff', borderRadius: 12, cursor: 'pointer' }}>
            <span onClick={() => setQ((s) => ({ ...s, vat: !s.vat }))} style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${q.vat ? T.blue : T.line}`, background: q.vat ? T.blue : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{q.vat && <Icon name="check" size={14} color="#fff" stroke={3} />}</span>
            <input type="checkbox" checked={q.vat} onChange={(e) => setQ((s) => ({ ...s, vat: e.target.checked }))} style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} />
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: T.ink }}>Add 18% VAT</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.sub, marginTop: 1 }}>Applied to the subtotal</div>
            </div>
          </label>
          <div style={{ flex: '1 1 300px', maxWidth: 360, marginLeft: 'auto', border: `1px solid ${T.line}`, borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 15px', fontSize: 13.5 }}><span style={{ fontWeight: 700, color: T.sub }}>Subtotal</span><strong style={{ color: T.ink, fontVariantNumeric: 'tabular-nums' }}>{Q_fmtMoney(t.subtotal, cur)}</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 15px', fontSize: 13.5, borderTop: `1px solid ${T.lineSoft}` }}><span style={{ fontWeight: 700, color: T.sub }}>VAT {q.vat ? '(18%)' : '(0%)'}</span><strong style={{ color: T.ink, fontVariantNumeric: 'tabular-nums' }}>{Q_fmtMoney(t.vat, cur)}</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '13px 15px', background: T.navy, color: '#fff' }}><span style={{ fontWeight: 800 }}>Grand Total</span><strong style={{ fontSize: 16, fontVariantNumeric: 'tabular-nums' }}>{Q_fmtMoney(t.grand, cur)}</strong></div>
          </div>
        </div>
      </Modal>
    );
  }

  // ════════════════════════════════ PREVIEW ═════════════════════════════════
  function QuotationPreview({ quote, onClose, onEdit }) {
    return (
      <Modal title={quote.number} sub={`${quote.client.company} · ${quote.status}`} width={860} onClose={onClose}
        footer={<React.Fragment>
          <Button variant="ghost" onClick={onClose}>Close</Button>
          <Button variant="ghost" icon="doc" onClick={() => { onClose(); onEdit(quote); }}>Edit</Button>
          <Button variant="primary" icon="download" onClick={() => printQuotation(quote)}>Download PDF</Button>
        </React.Fragment>}>
        <div style={{ background: '#fff', border: `1px solid ${T.line}`, borderRadius: 10, overflow: 'hidden' }}
          dangerouslySetInnerHTML={{ __html: buildQuotationHTML(quote) }} />
      </Modal>
    );
  }

  // ════════════════════════════════ SEND ════════════════════════════════════
  function SendModal({ quote, onClose }) {
    const t = Q_totalsOf(quote);
    const summary = `Quotation ${quote.number} from Pinnacle Power Systems Ltd.\nClient: ${quote.client.company}\nDate: ${Q_fmtDate(quote.date)} · Valid until ${Q_fmtDate(quote.validUntil)}\nItems: ${quote.items.length}\nGrand Total: ${Q_fmtMoney(t.grand, quote.currency)}${quote.vat ? ' (incl. 18% VAT)' : ''}\n\nPlease find the full quotation attached.`;
    const markSent = (channel) => { QuoteStore.setStatus(quote.id, 'Sent'); onClose(); ToastStore.push(`${quote.number} sent to ${quote.client.company} via ${channel}.`, { title: 'Quotation sent', icon: 'check', tone: 'ok' }); };

    const email = () => {
      const to = quote.client.email || '';
      openLink(`mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent('Quotation ' + quote.number + ' — Pinnacle Power Systems')}&body=${encodeURIComponent('Dear ' + (quote.client.company || 'Customer') + ',\n\n' + summary + '\n\nKind regards,\n' + quote.issuedBy + '\nPinnacle Power Systems Ltd.')}`);
      markSent('Email');
    };
    const whatsapp = () => {
      const digits = (quote.client.phone || '').replace(/[^0-9]/g, '');
      openLink(`https://wa.me/${digits}?text=${encodeURIComponent(summary)}`);
      markSent('WhatsApp');
    };
    const chat = () => markSent('chat');

    const Opt = ({ icon, color, bg, title, sub, onClick, disabled }) => (
      <button onClick={onClick} disabled={disabled} style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%', textAlign: 'left', border: `1.5px solid ${T.line}`, background: '#fff', borderRadius: 13, padding: '15px 16px', cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: F, opacity: disabled ? 0.5 : 1, transition: 'border-color .12s, background .12s' }}
        onMouseEnter={(e) => { if (!disabled) { e.currentTarget.style.borderColor = color; e.currentTarget.style.background = T.surface; } }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.line; e.currentTarget.style.background = '#fff'; }}>
        <span style={{ width: 44, height: 44, borderRadius: 11, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: 14.5, fontWeight: 800, color: T.ink }}>{title}</span>
          <span style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: T.sub, marginTop: 2 }}>{sub}</span>
        </span>
        <Icon name="arrowRight" size={18} color={T.faint} stroke={2.2} />
      </button>
    );
    const waIcon = <svg width="22" height="22" viewBox="0 0 24 24" fill="#1FA855"><path d="M17.5 14.4c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.22 3.08.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.13-.27-.2-.57-.35zM12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.38 5.07L2 22l5.05-1.33A9.96 9.96 0 0 0 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2z" /></svg>;

    return (
      <Modal title="Send quotation" sub={`${quote.number} · ${quote.client.company}`} width={520} onClose={onClose}
        footer={<Button variant="ghost" onClick={onClose}>Done</Button>}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 15px', background: T.surface, borderRadius: 12, marginBottom: 16 }}>
          <div><div style={{ fontSize: 11.5, fontWeight: 800, color: T.sub, textTransform: 'uppercase', letterSpacing: 0.3 }}>Grand total</div><div style={{ fontSize: 18, fontWeight: 800, color: T.ink, marginTop: 2 }}>{Q_fmtMoney(t.grand, quote.currency)}</div></div>
          <Button variant="ghost" size="sm" icon="download" onClick={() => printQuotation(quote)}>PDF</Button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
          <Opt onClick={email} disabled={!quote.client.email} color={T.blue} bg={T.blueWash} title="Email" sub={quote.client.email || 'No client email on file'} icon={<Icon name="doc" size={21} color={T.blue} stroke={2} />} />
          <Opt onClick={whatsapp} disabled={!quote.client.phone} color="#1FA855" bg="#E4F6EC" title="WhatsApp" sub={quote.client.phone || 'No client phone on file'} icon={waIcon} />
          <Opt onClick={chat} color={T.amber} bg="#FFF3DC" title="Save to inquiry chat" sub="Attach to the client conversation & mark as sent" icon={<Icon name="user" size={21} color={T.amberInk} stroke={2} />} />
        </div>
      </Modal>
    );
  }

  // ════════════════════════════════ SECTION ═════════════════════════════════
  function Quotes() {
    const quotes = useQuotes();
    const auth = useAuth();
    const payload = Router.payload();
    const [q, setQ] = React.useState('');
    const [status, setStatus] = React.useState('All');
    const [building, setBuilding] = React.useState(null);   // {existing} | {presetClient} | {}
    const [preview, setPreview] = React.useState(null);
    const [sending, setSending] = React.useState(null);

    // Allow other sections (Inquiries → "attach a quote") to open the builder.
    React.useEffect(() => { window.__ppsOpenSend = (quote) => setSending(quote); return () => { window.__ppsOpenSend = null; }; }, []);
    React.useEffect(() => { if (payload && payload.attach) setBuilding({ presetClient: payload.attach }); }, []);

    const isAdmin = !!auth && auth.role === 'admin';
    const edit = (quote) => setBuilding({ existing: quote });
    const del = (quote) => {
      if (!isAdmin) { ToastStore.push('Only admins can delete quotations.', { title: 'Access denied', icon: 'lock', tone: 'error' }); return; }
      ConfirmStore.open({ title: 'Delete quotation', sub: quote.number, body: `Permanently delete this quotation for ${quote.client.company}? This cannot be undone.`, confirmLabel: 'Delete', danger: true, onConfirm: () => { QuoteStore.remove(quote.id); ToastStore.push(`${quote.number} deleted.`, { title: 'Quotation deleted', icon: 'minus', tone: 'warn' }); } });
    };

    const list = quotes.filter((x) => {
      if (status !== 'All' && x.status !== status) return false;
      if (q.trim()) { const s = (x.number + ' ' + x.client.company).toLowerCase(); if (!s.includes(q.trim().toLowerCase())) return false; }
      return true;
    }).sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));

    const cols = [{ label: 'Quote' }, { label: 'Client' }, { label: 'Date' }, { label: 'Total', align: 'right' }, { label: 'Status', align: 'center' }, { label: 'Actions', align: 'right', width: 168 }];
    return (
      <div>
        <PageHead title="Quotes" sub={`${quotes.length} quotation${quotes.length === 1 ? '' : 's'} · build, send & track`}>
          <Button icon="plus" onClick={() => setBuilding({})}>Create Quotation</Button>
        </PageHead>
        <Card pad={14} style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <Search value={q} onChange={setQ} placeholder="Search quote # or client…" width={300} />
          <Select value={status} onChange={setStatus} options={['All', ...Q_STATUSES]} width={160} />
          <div style={{ flex: 1 }} /><div style={{ fontSize: 13, fontWeight: 700, color: T.sub }}>{list.length} shown</div>
        </Card>
        {list.length === 0 ? <Card><Empty icon="doc" title="No quotations yet" sub="Click “Create Quotation” to build one." /></Card> : (
          <Table columns={cols}>
            {list.map((x, i) => {
              const tot = Q_totalsOf(x);
              return (
                <Row key={x.id} i={i} onClick={() => setPreview(x)}>
                  <Td><span style={{ fontSize: 13, fontWeight: 800, color: T.ink, fontVariantNumeric: 'tabular-nums' }}>{x.number}</span></Td>
                  <Td>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{x.client.company}</div>
                      <div style={{ fontSize: 11.5, fontWeight: 600, color: T.sub }}>{x.items.length} item{x.items.length === 1 ? '' : 's'} · {x.currency}</div>
                    </div>
                  </Td>
                  <Td><span style={{ fontSize: 12.5, fontWeight: 600, color: T.sub }}>{Q_fmtDate(x.date)}</span></Td>
                  <Td align="right"><span style={{ fontSize: 13.5, fontWeight: 800, color: T.ink, fontVariantNumeric: 'tabular-nums' }}>{Q_fmtMoney(tot.grand, x.currency)}</span></Td>
                  <Td align="center"><QStatus status={x.status} /></Td>
                  <Td align="right">
                    <div style={{ display: 'inline-flex', gap: 6 }} onClick={(e) => e.stopPropagation()}>
                      <IconBtn icon="doc" tone="blue" title="View / Edit" onClick={() => edit(x)} />
                      <IconBtn icon="download" tone="ink" title="Download PDF" onClick={() => printQuotation(x)} />
                      <IconBtn icon="arrowRight" tone="blue" title="Send" onClick={() => setSending(x)} />
                      {isAdmin && <IconBtn icon="minus" tone="danger" title="Delete" onClick={() => del(x)} />}
                    </div>
                  </Td>
                </Row>
              );
            })}
          </Table>
        )}
        {building && <QuotationBuilder existing={building.existing} presetClient={building.presetClient} onClose={() => setBuilding(null)} />}
        {preview && <QuotationPreview quote={preview} onClose={() => setPreview(null)} onEdit={edit} />}
        {sending && <SendModal quote={sending} onClose={() => setSending(null)} />}
      </div>
    );
  }

  window.AdminQuotes = Quotes;
})();
