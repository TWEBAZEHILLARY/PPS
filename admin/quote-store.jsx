// quote-store.jsx — quotation data layer (pps_quotations) + currency helpers
// + printable PDF generator. The richer quotation system layered on top of the
// existing Quotes section.
(function () {
  // ── Company identity (appears on every quotation PDF) ────────────────────
  const COMPANY = {
    name: 'Pinnacle Power Systems Ltd.',
    tagline: 'Electrical Distribution · Automation · Power',
    address: 'Plot 24, Ntinda Industrial Area, Kampala, Uganda',
    phone: '+256 414 660 220  ·  +256 772 000 145',
    email: 'sales@pinnaclepower.co.ug',
    web: 'www.pinnaclepower.co.ug',
    tin: '1009 234 567',
  };

  // ── Currency ─────────────────────────────────────────────────────────────
  const CURRENCIES = {
    UGX: { code: 'UGX', sym: 'USh', dp: 0 },
    USD: { code: 'USD', sym: '$', dp: 2 },
    EUR: { code: 'EUR', sym: '€', dp: 2 },
  };
  const PAYMENT_TERMS = ['Net 30 Days', 'Net 15 Days', 'Net 7 Days', 'Cash on Delivery', '50% Deposit, 50% on Delivery', 'Payment in Advance'];
  const VAT_RATE = 0.18;

  const fmtMoney = (n, code) => {
    const c = CURRENCIES[code] || CURRENCIES.UGX;
    return c.sym + ' ' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: c.dp, maximumFractionDigits: c.dp });
  };
  const fmtDate = (iso) => { const d = new Date(iso); if (isNaN(d)) return iso || ''; return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); };
  const todayISO = () => new Date('2026-06-23').toISOString().slice(0, 10);
  const addDays = (iso, n) => { const d = new Date(iso); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };

  const totalsOf = (q) => {
    const subtotal = (q.items || []).reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.unitPrice) || 0), 0);
    const vat = q.vat ? subtotal * VAT_RATE : 0;
    return { subtotal, vat, grand: subtotal + vat };
  };

  // ── Store (pps_quotations) ───────────────────────────────────────────────
  const KEY = 'pps_quotations';
  const read = () => { try { const r = localStorage.getItem(KEY); return r ? JSON.parse(r) : null; } catch (e) { return null; } };
  const writeAll = (l) => { try { localStorage.setItem(KEY, JSON.stringify(l)); } catch (e) {} };

  const YEAR = 2026;
  const padNum = (n) => 'PPS-Q-' + YEAR + '-' + String(n).padStart(4, '0');

  const SEED = [
    {
      id: 'q_seed1', number: 'PPS-Q-2026-0014', seq: 14,
      issuedBy: 'Hillary Twebaze', issuedByTitle: 'Administrator',
      client: { company: 'Jinja Steel Works Ltd.', tin: '1004 553 921', address: 'Main Street, Jinja, Uganda', phone: '+256 701 884 220', email: 'aisha@jinjasteel.com' },
      date: '2026-06-21', validUntil: '2026-07-21', paymentTerms: 'Net 30 Days', currency: 'UGX', vat: true,
      items: [
        { code: 'NEX-SWA4C16', description: 'XLPE Armoured Cable 4-Core 16mm² (SWA, 0.6/1kV)', uom: 'Mtrs', qty: 500, unitPrice: 38500 },
        { code: 'NEX-H07VK6', description: 'H07V-K Single-Core 6mm² Building Wire', uom: 'Mtrs', qty: 300, unitPrice: 3120 },
        { code: 'MK-GLD20', description: 'Brass Cable Gland 20mm with Locknut', uom: 'Pcs', qty: 24, unitPrice: 9500 },
      ],
      status: 'Sent', createdAt: '2026-06-21T09:10:00',
    },
    {
      id: 'q_seed2', number: 'PPS-Q-2026-0015', seq: 15,
      issuedBy: 'Hillary Twebaze', issuedByTitle: 'Administrator',
      client: { company: 'Okoth Electrical Contractors', tin: '', address: '22 Bombo Road, Kampala', phone: '+256 753 309 117', email: 'david.okoth@gmail.com' },
      date: '2026-06-20', validUntil: '2026-07-20', paymentTerms: '50% Deposit, 50% on Delivery', currency: 'UGX', vat: true,
      items: [
        { code: 'SIE-6ES7212', description: 'SIMATIC S7-1200 CPU 1212C DC/DC/DC', uom: 'Pcs', qty: 3, unitPrice: 1240000 },
        { code: 'SCH-ATV320', description: 'Altivar 320 VFD 2.2kW 3-Phase', uom: 'Pcs', qty: 2, unitPrice: 1980000 },
      ],
      status: 'Draft', createdAt: '2026-06-20T14:30:00',
    },
  ];

  function seedIfEmpty() { if (!read()) writeAll(SEED); }
  seedIfEmpty();

  const QuoteStore = (() => {
    const subs = new Set();
    let list = read() || [];
    const emit = () => { list = list.slice(); subs.forEach((f) => f(list)); };
    const persist = () => writeAll(list);
    const nextSeq = () => list.reduce((m, q) => Math.max(m, q.seq || 0), 15) + 1;
    return {
      all: () => list,
      sub: (f) => { subs.add(f); return () => subs.delete(f); },
      nextNumber: () => { const s = nextSeq(); return { seq: s, number: padNum(s) }; },
      save: (q) => {
        const i = list.findIndex((x) => x.id === q.id);
        if (i >= 0) list[i] = q; else list.unshift(q);
        persist(); emit(); return q;
      },
      setStatus: (id, status) => { list = list.map((q) => (q.id === id ? { ...q, status } : q)); persist(); emit(); },
      remove: (id) => { list = list.filter((q) => q.id !== id); persist(); emit(); },
    };
  })();
  function useQuotes() { const [l, set] = React.useState(QuoteStore.all()); React.useEffect(() => QuoteStore.sub(set), []); return l; }

  // ── Printable PDF (window.print into a dedicated print root) ──────────────
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function buildQuotationHTML(q) {
    const t = totalsOf(q);
    const rows = (q.items || []).map((it, i) => `
      <tr>
        <td class="c">${i + 1}</td>
        <td class="mono">${esc(it.code)}</td>
        <td>${esc(it.description)}</td>
        <td class="c">${esc(it.uom)}</td>
        <td class="r">${Number(it.qty || 0).toLocaleString('en-US')}</td>
        <td class="r">${fmtMoney(it.unitPrice, q.currency)}</td>
        <td class="r">${fmtMoney((Number(it.qty) || 0) * (Number(it.unitPrice) || 0), q.currency)}</td>
      </tr>`).join('');
    return `
    <div class="pq">
      <div class="pq-top">
        <div class="pq-brand">
          <img src="${window.COMPANY_LOGO}" alt="${esc(COMPANY.name)}" style="height:46px;width:auto;display:block;" />
          <div>
            <div class="pq-tag">${esc(COMPANY.tagline)}</div>
          </div>
        </div>
        <div class="pq-cohead">
          <div>${esc(COMPANY.address)}</div>
          <div>${esc(COMPANY.phone)}</div>
          <div>${esc(COMPANY.email)} · ${esc(COMPANY.web)}</div>
          <div><strong>TIN:</strong> ${esc(COMPANY.tin)}</div>
        </div>
      </div>

      <div class="pq-titlebar">
        <div class="pq-title">QUOTATION</div>
        <div class="pq-num"><span>No.</span> ${esc(q.number)}</div>
      </div>

      <div class="pq-meta">
        <div class="pq-to">
          <div class="pq-lbl">Issued To</div>
          <div class="pq-cl">${esc(q.client.company) || '—'}</div>
          ${q.client.address ? `<div>${esc(q.client.address)}</div>` : ''}
          ${q.client.phone ? `<div>Tel: ${esc(q.client.phone)}</div>` : ''}
          ${q.client.email ? `<div>${esc(q.client.email)}</div>` : ''}
          ${q.client.tin ? `<div>TIN: ${esc(q.client.tin)}</div>` : ''}
        </div>
        <div class="pq-facts">
          <div class="pq-fact"><span>Date</span><strong>${fmtDate(q.date)}</strong></div>
          <div class="pq-fact"><span>Valid Until</span><strong>${fmtDate(q.validUntil)}</strong></div>
          <div class="pq-fact"><span>Payment Terms</span><strong>${esc(q.paymentTerms)}</strong></div>
          <div class="pq-fact"><span>Currency</span><strong>${esc(q.currency)}</strong></div>
        </div>
      </div>

      <table class="pq-items">
        <thead><tr>
          <th class="c">#</th><th>Item Code</th><th>Description</th><th class="c">UOM</th><th class="r">Qty</th><th class="r">Unit Price</th><th class="r">Amount</th>
        </tr></thead>
        <tbody>${rows || '<tr><td colspan="7" class="c muted">No items</td></tr>'}</tbody>
      </table>

      <div class="pq-bottom">
        <div class="pq-terms">
          <div class="pq-lbl">Terms &amp; Conditions</div>
          <ol>
            <li>This quotation is valid until the date shown above; prices are subject to change thereafter.</li>
            <li>Prices are quoted in ${esc((CURRENCIES[q.currency] || {}).code || q.currency)}${q.vat ? ' and are exclusive of VAT unless stated in the totals' : ' and are VAT-exclusive'}.</li>
            <li>Delivery lead time confirmed on receipt of a purchase order and applicable deposit.</li>
            <li>Goods remain the property of ${esc(COMPANY.name)} until paid in full.</li>
            <li>Warranty per manufacturer terms; claims handled through Pinnacle Power Systems.</li>
          </ol>
        </div>
        <div class="pq-totals">
          <div class="pq-trow"><span>Subtotal</span><strong>${fmtMoney(t.subtotal, q.currency)}</strong></div>
          <div class="pq-trow"><span>VAT ${q.vat ? '(18%)' : '(0%)'}</span><strong>${fmtMoney(t.vat, q.currency)}</strong></div>
          <div class="pq-trow pq-grand"><span>Grand Total</span><strong>${fmtMoney(t.grand, q.currency)}</strong></div>
        </div>
      </div>

      <div class="pq-sign">
        <div class="pq-sigbox">
          <div class="pq-signame">${esc(q.issuedBy)}</div>
          <div class="pq-sigline"></div>
          <div class="pq-lbl">Issued By</div>
          <div class="pq-sigmeta">${esc(q.issuedByTitle || '')}${q.issuedByTitle ? ' · ' : ''}${esc(COMPANY.name)}</div>
          <div class="pq-sigmeta">Date: ${fmtDate(q.date)}</div>
        </div>
        <div class="pq-thanks">
          <div class="pq-ty">Thank you for your business.</div>
          <div class="pq-tysub">For queries on this quotation, contact ${esc(COMPANY.email)}.</div>
        </div>
      </div>

      <div class="pq-foot">${esc(COMPANY.name)} · ${esc(COMPANY.address)} · ${esc(COMPANY.phone)} · TIN ${esc(COMPANY.tin)}</div>
    </div>`;
  }

  function printQuotation(q) {
    const root = document.getElementById('pps-print-root');
    if (!root) { window.print(); return; }
    root.innerHTML = buildQuotationHTML(q);
    const done = () => { window.removeEventListener('afterprint', done); setTimeout(() => { root.innerHTML = ''; }, 400); };
    window.addEventListener('afterprint', done);
    setTimeout(() => window.print(), 60);
  }

  Object.assign(window, {
    PPS_COMPANY: COMPANY, PPS_CURRENCIES: CURRENCIES, PPS_PAYMENT_TERMS: PAYMENT_TERMS, PPS_VAT_RATE: VAT_RATE,
    Q_fmtMoney: fmtMoney, Q_fmtDate: fmtDate, Q_todayISO: todayISO, Q_addDays: addDays, Q_totalsOf: totalsOf,
    QuoteStore, useQuotes, buildQuotationHTML, printQuotation,
  });
})();
