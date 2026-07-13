// receipt.jsx — customer receipt PDF (print-to-PDF) for the storefront, plus
// helpers to persist customer orders to localStorage (pps_orders) and read them
// back. Loaded after commerce.jsx. Uses the shared window.COMPANY_LOGO so the
// receipt header carries the Pinnacle Power Systems logo. Purely additive.
(function () {
  const { PRODUCTS } = window;

  // Company identity printed on every receipt (mirrors the quotation footer).
  const COMPANY = {
    name: 'Pinnacle Power Systems Ltd.',
    tagline: 'Electrical Distribution · Automation · Power',
    address: 'Plot 24, Ntinda Industrial Area, Kampala, Uganda',
    phone: '+256764250125',
    email: 'pinnaclepowersystems256@gmail.com',
    web: 'www.pinnaclepower.co.ug',
  };

  const money = (n) => 'USh ' + Math.round(n || 0).toLocaleString('en-US');
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fmtDate = (v) => {
    if (!v) return '';
    const d = new Date(v);
    if (isNaN(d)) return String(v); // already a display string (e.g. sample order)
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // ── Order persistence (pps_orders) ───────────────────────────────────────
  const KEY = 'pps_orders';
  const readOrders = () => { try { const r = localStorage.getItem(KEY); return r ? JSON.parse(r) : []; } catch (e) { return []; } };
  const writeOrders = (l) => { try { localStorage.setItem(KEY, JSON.stringify(l)); } catch (e) {} };

  // Place an order from the storefront cart. Stored with the customer's email
  // and details so the admin/reports and "My Orders" can read it back.
  function placeCustomerOrder({ user, items, payment, importFees, transportFee, deliveryArea, deliveryAddress }) {
    const list = readOrders();
    const seq = 1043 + list.filter((o) => /^#PPS-/.test(o.id)).length;
    const lineItems = items.map((it) => {
      const p = PRODUCTS.find((x) => x.id === it.id) || {};
      return {
        productId: it.id, name: p.name || it.id, sku: p.sku || '', category: p.cat || '', qty: it.qty, price: p.ugx || 0,
        import_fee: p.imported === true ? (Number(p.import_fee) || 0) : 0,
        imported: p.imported === true, home_bested: p.home_bested === true,
      };
    });
    const subtotal = lineItems.reduce((s, it) => s + it.price * it.qty, 0);
    const importFeeTotal = Number(importFees) || 0;
    const deliveryFeeTotal = Number(transportFee) || 0;
    const grandTotal = subtotal + importFeeTotal + deliveryFeeTotal;
    const name = [user && user.firstName, user && user.lastName].filter(Boolean).join(' ') || (user && user.firstName) || 'Customer';
    const nowIso = new Date().toISOString();
    const method = payment || 'MTN MoMo';
    const addr = deliveryAddress || (user && user.address) || 'Kampala, Uganda';
    // 'kampala' = transport fee charged; 'outside' = delivery arranged separately.
    const area = deliveryArea || (/kampala/i.test(String(addr)) ? 'kampala' : 'outside');
    const order = {
      id: '#PPS-' + seq,
      clientId: (user && user.userId) || '', clientName: name,
      customerName: name, customerEmail: (user && user.email) || '',
      address: addr,
      date: nowIso.slice(0, 10),
      items: lineItems,
      total: grandTotal, importFees: importFeeTotal, transportFee: deliveryFeeTotal,
      deliveryFee: deliveryFeeTotal, deliveryArea: area,
      deliveryNote: area === 'outside' ? 'Delivery to be arranged' : '',
      totals: { subtotal, importFees: importFeeTotal, deliveryFee: deliveryFeeTotal, grandTotal, deliveryArea: area },
      // Actual stage transitions are recorded here; the storefront Track Order
      // timeline and the admin order timeline both read from this array.
      timeline: [{ stage: 'Order Placed', status: 'Pending', date: nowIso }],
      // Payment stays 'Awaiting verification' until an administrator confirms
      // the funds arrived (admin console → Orders → Verify payment).
      status: 'Pending', payment: method, paymentMethod: method, paymentStatus: 'Awaiting verification',
      source: 'storefront',
    };
    writeOrders([order, ...list]);
    return order;
  }

  // All persisted orders belonging to a signed-in customer (matched on email).
  function loadCustomerOrders(user) {
    if (!user || !user.email) return [];
    const email = user.email.toLowerCase();
    return readOrders().filter((o) => (o.customerEmail || '').toLowerCase() === email)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  // ── Canonical receipt object adapters ────────────────────────────────────
  // From a persisted pps_orders record.
  function receiptFromOrder(o, user) {
    const items = (o.items || []).map((it) => ({
      name: it.name, sku: it.sku, qty: it.qty, price: it.price,
      import_fee: Number(it.import_fee) || 0, imported: it.imported === true,
    }));
    const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0);
    const importLines = items.filter((it) => it.imported && it.import_fee > 0)
      .map((it) => ({ name: it.name, qty: it.qty, amount: it.import_fee * it.qty }));
    const importFees = (o.totals && o.totals.importFees != null) ? o.totals.importFees
      : (o.importFees != null ? o.importFees : importLines.reduce((s, l) => s + l.amount, 0));
    const deliveryFee = (o.totals && o.totals.deliveryFee != null) ? o.totals.deliveryFee
      : (o.transportFee != null ? o.transportFee : 0);
    const total = (o.totals && o.totals.grandTotal != null) ? o.totals.grandTotal
      : (o.total != null ? o.total : subtotal + importFees + deliveryFee);
    return {
      number: 'RCP-' + String(o.id).replace(/[^0-9A-Za-z]/g, ''),
      orderId: o.id, date: o.date, status: o.status, payment: o.paymentMethod || o.payment || 'MTN MoMo',
      customer: {
        name: o.customerName || o.clientName || (user && [user.firstName, user.lastName].filter(Boolean).join(' ')) || 'Customer',
        email: o.customerEmail || (user && user.email) || '',
        address: o.address || 'Kampala, Uganda',
      },
      items, subtotal, importLines, importFees, deliveryFee, discount: 0,
      total,
    };
  }

  // From the storefront SAMPLE_ORDER (used by the Track Order modal demo).
  function receiptFromSample(o, user) {
    const items = (o.items || []).map((it) => {
      const p = PRODUCTS.find((x) => x.id === it.id) || {};
      return {
        name: p.name || it.id, sku: p.sku || '', qty: it.qty, price: p.ugx || 0,
        import_fee: p.imported === true ? (Number(p.import_fee) || 0) : 0, imported: p.imported === true,
      };
    });
    const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0);
    const importLines = items.filter((it) => it.imported && it.import_fee > 0)
      .map((it) => ({ name: it.name, qty: it.qty, amount: it.import_fee * it.qty }));
    const importFees = importLines.reduce((s, l) => s + l.amount, 0);
    const discount = o.discountUgx || 0;
    const deliveryFee = o.delivery || 0;
    return {
      number: 'RCP-' + String(o.number).replace(/[^0-9A-Za-z]/g, ''),
      orderId: o.number, date: o.placed, status: o.status, payment: o.payment || 'MTN MoMo',
      customer: {
        name: (user && [user.firstName, user.lastName].filter(Boolean).join(' ')) || (user && user.firstName) || 'Valued Customer',
        email: (user && user.email) || '',
        address: (user && user.address) || 'Kampala, Uganda',
      },
      items, subtotal, importLines, importFees, deliveryFee, discount,
      total: subtotal - discount + importFees + deliveryFee,
    };
  }

  // ── Receipt HTML (rendered into #pps-receipt-root, printed via window.print) ─
  function buildReceiptHTML(r) {
    const rows = r.items.map((it, i) => `
      <tr>
        <td class="c">${i + 1}</td>
        <td>${esc(it.name)}</td>
        <td class="mono">${esc(it.sku)}</td>
        <td class="r">${Number(it.qty || 0).toLocaleString('en-US')}</td>
        <td class="r">${money(it.price)}</td>
        <td class="r">${money((it.qty || 0) * (it.price || 0))}</td>
      </tr>`).join('');
    const importRows = (r.importLines || []).map((l) => `
      <div class="rcpt-trow"><span>Import Fee – ${esc(l.name)} × ${Number(l.qty || 0).toLocaleString('en-US')}</span><strong>${money(l.amount)}</strong></div>`).join('');
    const totalRows = [
      ['Subtotal', r.subtotal, false],
      r.discount ? ['Discount', -r.discount, false] : null,
    ].filter(Boolean).map(([label, val]) => `
      <div class="rcpt-trow"><span>${esc(label)}</span><strong>${val < 0 ? '− ' : ''}${money(Math.abs(val))}</strong></div>`).join('')
      + importRows
      + `
      <div class="rcpt-trow"><span>Delivery Fee</span><strong>${r.deliveryFee > 0 ? money(r.deliveryFee) : 'Free'}</strong></div>`;
    return `
    <div class="rcpt">
      <div class="rcpt-top">
        <img class="rcpt-logo" src="${window.COMPANY_LOGO}" alt="${esc(COMPANY.name)}" />
        <div class="rcpt-cohead">
          <div>${esc(COMPANY.address)}</div>
          <div>${esc(COMPANY.phone)}</div>
          <div>${esc(COMPANY.email)} · ${esc(COMPANY.web)}</div>
        </div>
      </div>

      <div class="rcpt-titlebar">
        <div class="rcpt-title">RECEIPT</div>
        <div class="rcpt-num"><span>No.</span> ${esc(r.number)}</div>
      </div>

      <div class="rcpt-meta">
        <div class="rcpt-to">
          <div class="rcpt-lbl">Billed To</div>
          <div class="rcpt-cl">${esc(r.customer.name)}</div>
          ${r.customer.email ? `<div>${esc(r.customer.email)}</div>` : ''}
          ${r.customer.address ? `<div>${esc(r.customer.address)}</div>` : ''}
        </div>
        <div class="rcpt-facts">
          <div class="rcpt-fact"><span>Order ID</span><strong>${esc(r.orderId)}</strong></div>
          <div class="rcpt-fact"><span>Date</span><strong>${fmtDate(r.date)}</strong></div>
          <div class="rcpt-fact"><span>Payment</span><strong>${esc(r.payment)}</strong></div>
          <div class="rcpt-fact"><span>Status</span><strong>${esc(r.status)}</strong></div>
        </div>
      </div>

      <table class="rcpt-items">
        <thead><tr>
          <th class="c">#</th><th>Product</th><th>SKU</th><th class="r">Qty</th><th class="r">Unit Price</th><th class="r">Subtotal</th>
        </tr></thead>
        <tbody>${rows || '<tr><td colspan="6" class="c muted">No items</td></tr>'}</tbody>
      </table>

      <div class="rcpt-bottom">
        <div class="rcpt-note">
          <div class="rcpt-lbl">Notes</div>
          <p>This receipt confirms the items and amounts for order ${esc(r.orderId)}. Goods supplied are covered by the applicable manufacturer warranty, handled through ${esc(COMPANY.name)}.</p>
          <div class="rcpt-qr" aria-hidden="true"></div>
          <div class="rcpt-qrlbl">Scan to verify · ${esc(r.number)}</div>
        </div>
        <div class="rcpt-totals">
          ${totalRows}
          <div class="rcpt-trow rcpt-grand"><span>Grand Total</span><strong>${money(r.total)}</strong></div>
        </div>
      </div>

      <div class="rcpt-thanks">Thank you for your business!</div>
      <div class="rcpt-foot">${esc(COMPANY.name)} · ${esc(COMPANY.address)} · ${esc(COMPANY.phone)} · ${esc(COMPANY.email)}</div>
    </div>`;
  }

  function printReceipt(r) {
    const root = document.getElementById('pps-receipt-root');
    if (!root) { window.print(); return; }
    root.innerHTML = buildReceiptHTML(r);
    const done = () => { window.removeEventListener('afterprint', done); setTimeout(() => { root.innerHTML = ''; }, 400); };
    window.addEventListener('afterprint', done);
    setTimeout(() => window.print(), 60);
  }

  Object.assign(window, {
    PPS_RECEIPT_COMPANY: COMPANY,
    placeCustomerOrder, loadCustomerOrders,
    receiptFromOrder, receiptFromSample, buildReceiptHTML, printReceipt,
  });
})();
