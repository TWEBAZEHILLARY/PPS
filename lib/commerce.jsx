// commerce.jsx — interactivity layer for the Pinnacle storefront.
// Adds: global cart store, toast store, modal store, and the
// Catalogue / Cart / Inquiry modals + ToastHost. Purely additive —
// the existing home visuals are untouched; triggers are wired in home-a.jsx.
(function () {
  const { Icon, Stars, AnimatedPrice, ProductShot, PRODUCTS, CATEGORIES, productDetail, SAMPLE_ORDER } = window;
  const F = "'Plus Jakarta Sans', system-ui, sans-serif";
  const T = {
    ink: '#0B1A33', sub: '#5A6B85', blue: '#1457E6', blueDk: '#0E3FB0',
    amber: '#FFB020', amberInk: '#5A3A00', surface: '#F4F7FC', line: '#E4E9F2',
    chip: '#EEF3FC', green: '#119C5B', red: '#E5484D',
  };

  // ── EmailJS admin notifications (new inquiries & orders) ──────────────────
  // All storefront notifications go to this inbox. Replace the four placeholders
  // below with the values from your EmailJS dashboard (https://dashboard.emailjs.com):
  //   • Public Key:   Account → General
  //   • Service ID:   Email Services → (your service)
  //   • Template IDs: Email Templates → create one for inquiries and one for orders.
  //                   Reference {{to_email}} as the recipient, plus the params each
  //                   helper sends below (client_name, message, order_id, …).
  // Until configured, each notification is logged to the console instead of sent —
  // the user flow is never blocked.
  const ADMIN_EMAIL = 'pinnaclepowersystems256@gmail.com';
  const ADMIN_DASHBOARD_LINK = (function () {
    try { return new URL('admin.html', window.location.href).href; } catch (e) { return 'admin.html'; }
  })();
  const EMAILJS_PUBLIC_KEY           = 'YOUR_PUBLIC_KEY';
  const EMAILJS_SERVICE_ID           = 'YOUR_SERVICE_ID';
  const EMAILJS_INQUIRY_TEMPLATE_ID  = 'YOUR_INQUIRY_TEMPLATE_ID';
  const EMAILJS_ORDER_TEMPLATE_ID    = 'YOUR_ORDER_TEMPLATE_ID';
  const ejPlaceholder = (v) => !v || /^YOUR_/.test(v);
  const ejReady = (tpl) => typeof window.emailjs !== 'undefined'
    && !ejPlaceholder(EMAILJS_PUBLIC_KEY) && !ejPlaceholder(EMAILJS_SERVICE_ID) && !ejPlaceholder(tpl);
  try { if (typeof window.emailjs !== 'undefined' && !ejPlaceholder(EMAILJS_PUBLIC_KEY)) window.emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY }); } catch (e) {}
  // Fire-and-forget: never throws, never blocks the UI. Resolves once the send
  // settles (or immediately, when EmailJS isn't configured).
  function notifyAdmin(templateId, params) {
    const payload = { to_email: ADMIN_EMAIL, email: ADMIN_EMAIL, dashboard_link: ADMIN_DASHBOARD_LINK, ...params };
    if (ejReady(templateId)) {
      try {
        return window.emailjs.send(EMAILJS_SERVICE_ID, templateId, payload)
          .catch((err) => { console.warn('[PPS] EmailJS notification failed — not retried.', err); });
      } catch (err) {
        console.warn('[PPS] EmailJS notification threw — not retried.', err);
        return Promise.resolve();
      }
    }
    console.log('%c[PPS] Admin notification (EmailJS not configured — add your keys in lib/commerce.jsx):',
      'font-weight:bold;color:#1457E6', { to: ADMIN_EMAIL, template: templateId, ...payload });
    return Promise.resolve();
  }
  window.PPS_notifyAdmin = notifyAdmin;
  window.PPS_EMAILJS = { ADMIN_EMAIL, INQUIRY: EMAILJS_INQUIRY_TEMPLATE_ID, ORDER: EMAILJS_ORDER_TEMPLATE_ID };

  // ── Global cart store. Base prices live in UGX (see shared.jsx). ──
  const CartStore = (() => {
    let items = [];
    const subs = new Set();
    const emit = () => { items = items.slice(); subs.forEach((f) => f(items)); };
    const find = (id) => items.find((i) => i.id === id);
    return {
      get: () => items,
      count: () => items.reduce((n, i) => n + i.qty, 0),
      total: () => items.reduce((s, i) => { const p = PRODUCTS.find((x) => x.id === i.id); return s + (p ? p.ugx * i.qty : 0); }, 0),
      // Sum of product prices × qty (no fees).
      subtotal: () => items.reduce((s, i) => { const p = PRODUCTS.find((x) => x.id === i.id); return s + (p ? p.ugx * i.qty : 0); }, 0),
      // Per-product importation fee: import_fee × qty for each `imported` product.
      importFees: () => items.reduce((s, i) => { const p = PRODUCTS.find((x) => x.id === i.id); return s + (p && p.imported === true ? (Number(p.import_fee) || 0) * i.qty : 0); }, 0),
      // Flat 5,000 UGX added ONCE if any item is home_bested or imported.
      transportFee: () => (items.some((i) => { const p = PRODUCTS.find((x) => x.id === i.id); return !!(p && (p.home_bested === true || p.imported === true)); }) ? 5000 : 0),
      // Subtotal + import fees + transport fee.
      grandTotal: () => {
        const sub = items.reduce((s, i) => { const p = PRODUCTS.find((x) => x.id === i.id); return s + (p ? p.ugx * i.qty : 0); }, 0);
        const imp = items.reduce((s, i) => { const p = PRODUCTS.find((x) => x.id === i.id); return s + (p && p.imported === true ? (Number(p.import_fee) || 0) * i.qty : 0); }, 0);
        const trans = items.some((i) => { const p = PRODUCTS.find((x) => x.id === i.id); return !!(p && (p.home_bested === true || p.imported === true)); }) ? 5000 : 0;
        return sub + imp + trans;
      },
      has: (id) => !!find(id),
      qtyOf: (id) => (find(id)?.qty || 0),
      add: (id, n = 1) => { const e = find(id); if (e) e.qty += n; else items.push({ id, qty: n }); emit(); },
      setQty: (id, q) => { const e = find(id); if (!e) return; e.qty = Math.max(1, q); emit(); },
      remove: (id) => { items = items.filter((i) => i.id !== id); emit(); },
      clear: () => { items = []; emit(); },
      sub: (f) => { subs.add(f); return () => subs.delete(f); },
    };
  })();
  function useCart() {
    const [, force] = React.useReducer((x) => x + 1, 0);
    React.useEffect(() => CartStore.sub(force), []);
    return CartStore;
  }

  // ── Client registry (pps_clients) + session (pps_session). ──
  // Shared with the admin dashboard. Clients are stored under `pps_clients`
  // in the admin's shape (id, name, email, phone, address, registered, status)
  // PLUS auth fields (firstName, lastName, password, registrationDate,
  // socialProvider) so that ONLY previously-registered clients can log in.
  const ClientStore = (() => {
    const KEY = 'pps_clients';
    const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { return []; } };
    const write = (list) => { try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) {} };
    const nextId = (list) => {
      let max = 0;
      list.forEach((c) => { const m = /^client_(\d+)$/.exec(c.id || ''); if (m) max = Math.max(max, parseInt(m[1], 10)); });
      return 'client_' + String(max + 1).padStart(3, '0');
    };
    const findByEmail = (email) => {
      if (!email) return null;
      const e = String(email).trim().toLowerCase();
      return read().find((c) => c.email && String(c.email).toLowerCase() === e) || null;
    };
    const add = (rec) => {
      const list = read();
      const firstName = (rec.firstName || '').trim();
      const lastName = (rec.lastName || '').trim();
      const now = new Date();
      const client = {
        id: nextId(list),
        firstName,
        lastName,
        name: [firstName, lastName].filter(Boolean).join(' ') || firstName || (rec.email ? String(rec.email).split('@')[0] : 'Customer'),
        email: (rec.email || '').trim(),
        password: rec.password != null ? rec.password : null,
        phone: rec.phone || '',
        address: rec.address || '',
        registered: now.toISOString().slice(0, 10),
        registrationDate: now.toISOString(),
        socialProvider: rec.socialProvider || null,
        status: 'Active',
        source: rec.socialProvider || 'Website',
      };
      list.unshift(client);
      write(list);
      return client;
    };
    return { read, write, nextId, findByEmail, add };
  })();

  // ── Auth store (simulated session). Persisted to localStorage. ──
  const AuthStore = (() => {
    const KEY = 'pps_auth';
    let user = null;
    try { const raw = localStorage.getItem(KEY); if (raw) user = JSON.parse(raw); } catch (e) { user = null; }
    const subs = new Set();
    const syncSession = () => {
      try {
        if (user && user.isLoggedIn) {
          localStorage.setItem('pps_session', JSON.stringify({
            userId: user.userId || user.uid || null,
            email: user.email || '',
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            isLoggedIn: true,
          }));
        } else {
          localStorage.removeItem('pps_session');
        }
      } catch (e) {}
    };
    const emit = () => { try { user ? localStorage.setItem(KEY, JSON.stringify(user)) : localStorage.removeItem(KEY); } catch (e) {} syncSession(); subs.forEach((f) => f(user)); };
    syncSession(); // mirror a restored session to pps_session on load
    return {
      get: () => user,
      isLoggedIn: () => !!(user && user.isLoggedIn),
      login: (u) => { user = { ...u, isLoggedIn: true }; emit(); },
      logout: () => { user = null; emit(); },
      sub: (f) => { subs.add(f); return () => subs.delete(f); },
    };
  })();
  function useAuth() {
    const [, force] = React.useReducer((x) => x + 1, 0);
    React.useEffect(() => AuthStore.sub(force), []);
    return AuthStore;
  }

  // ── Toast store ──
  const ToastStore = (() => {
    let list = []; let id = 0; const subs = new Set();
    const emit = () => { subs.forEach((f) => f(list)); };
    const dismiss = (tid) => { list = list.filter((t) => t.id !== tid); emit(); };
    const push = (msg, opts = {}) => {
      const t = { id: ++id, msg, title: opts.title, icon: opts.icon || 'check', tone: opts.tone || 'ok' };
      list = [...list, t]; emit();
      setTimeout(() => dismiss(t.id), 4000);
    };
    return { push, dismiss, get: () => list, sub: (f) => { subs.add(f); return () => subs.delete(f); } };
  })();
  function useToasts() {
    const [list, setList] = React.useState(ToastStore.get());
    React.useEffect(() => ToastStore.sub(setList), []);
    return list;
  }

  // ── Modal store (single active modal + optional payload) ──
  const ModalStore = (() => {
    let cur = null; let data = null; const subs = new Set();
    const emit = () => subs.forEach((f) => f(cur));
    return {
      open: (k, d = null) => { cur = k; data = d; emit(); },
      close: () => { cur = null; data = null; emit(); },
      get: () => cur, getData: () => data,
      sub: (f) => { subs.add(f); return () => subs.delete(f); },
    };
  })();

  const tone = { ok: T.green, warn: T.amber, error: T.red, info: T.blue };

  // ── Shared modal shell ──
  function Overlay({ children, width = 1040, onClose }) {
    return (
      <div onMouseDown={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(11,26,51,.55)', WebkitBackdropFilter: 'blur(3px)', backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '48px 20px', overflowY: 'auto', animation: 'ppsFade .18s ease' }}>
        <div onMouseDown={(e) => e.stopPropagation()}
          style={{ width: '100%', maxWidth: width, maxHeight: 'calc(100vh - 96px)', display: 'flex', flexDirection: 'column',
            background: '#fff', borderRadius: 18, boxShadow: '0 28px 80px rgba(11,26,51,.42)', overflow: 'hidden', fontFamily: F, color: T.ink, animation: 'ppsPop .2s cubic-bezier(.2,.9,.3,1.2)' }}>
          {children}
        </div>
      </div>
    );
  }
  function ModalHead({ title, sub, children, onClose }) {
    return (
      <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 16, padding: '18px 22px', borderBottom: `1px solid ${T.line}` }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.4 }}>{title}</div>
          {sub && <div style={{ fontSize: 13, color: T.sub, fontWeight: 600, marginTop: 2 }}>{sub}</div>}
        </div>
        <div style={{ flex: 1 }} />
        {children}
        <button onClick={onClose} aria-label="Close" style={{ flexShrink: 0, width: 38, height: 38, borderRadius: 10, border: `1px solid ${T.line}`, background: '#fff', color: T.sub, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      </div>
    );
  }

  function AddBtn({ p, full }) {
    const cart = useCart();
    const inCart = cart.has(p.id);
    const onClick = (e) => { e.stopPropagation(); cart.add(p.id); ToastStore.push(p.name, { title: 'Added to cart', icon: 'cart', tone: 'ok' }); };
    return (
      <button onClick={onClick}
        style={{ width: full ? '100%' : 'auto', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, border: 'none', cursor: 'pointer', fontFamily: F,
          padding: '9px 14px', borderRadius: 10, fontSize: 13, fontWeight: 800, transition: 'background .15s',
          background: inCart ? '#E5F4EC' : T.blue, color: inCart ? T.green : '#fff', boxShadow: inCart ? 'none' : '0 4px 12px rgba(20,87,230,.28)' }}>
        <Icon name={inCart ? 'check' : 'plus'} size={16} color={inCart ? T.green : '#fff'} stroke={2.4} />
        {inCart ? `In Cart · ${cart.qtyOf(p.id)}` : 'Add'}
      </button>
    );
  }

  // ── Catalogue modal ──
  function CatalogueModal() {
    const initCat = ModalStore.getData()?.category || 'All';
    const [cat, setCat] = React.useState(initCat);
    const [q, setQ] = React.useState('');
    const cats = ['All', ...CATEGORIES.map((c) => c.name)];
    const list = PRODUCTS.filter((p) => {
      if (cat !== 'All' && p.cat !== cat) return false;
      if (q.trim()) { const s = (p.name + ' ' + p.sku + ' ' + p.cat).toLowerCase(); if (!s.includes(q.trim().toLowerCase())) return false; }
      return true;
    });
    return (
      <Overlay width={1080} onClose={() => ModalStore.close()}>
        <ModalHead title="Catalogue" sub={`${PRODUCTS.length} products · authorised distributor stock`} onClose={() => ModalStore.close()}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: 320, height: 42, border: `1.5px solid ${T.line}`, borderRadius: 11, padding: '0 12px', background: '#fff' }}>
            <Icon name="search" size={18} color={T.sub} />
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, SKU or category…"
              style={{ flex: 1, border: 'none', outline: 'none', fontFamily: F, fontSize: 14, color: T.ink, background: 'transparent' }} />
            {q && <button onClick={() => setQ('')} style={{ border: 'none', background: 'none', cursor: 'pointer', color: T.sub, padding: 0, display: 'flex' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg></button>}
          </div>
        </ModalHead>

        <div style={{ flex: '0 0 auto', display: 'flex', flexWrap: 'wrap', gap: 8, padding: '14px 22px', borderBottom: `1px solid ${T.line}` }}>
          {cats.map((c) => {
            const on = c === cat;
            return <button key={c} onClick={() => setCat(c)}
              style={{ border: `1.5px solid ${on ? T.blue : T.line}`, background: on ? T.blue : '#fff', color: on ? '#fff' : T.ink, cursor: 'pointer', fontFamily: F,
                padding: '8px 14px', borderRadius: 999, fontSize: 13, fontWeight: 700 }}>{c}</button>;
          })}
        </div>

        <div style={{ flex: '1 1 auto', overflowY: 'auto', padding: 20, background: T.surface }}>
          {PRODUCTS.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: T.sub }}>
              <Icon name="box" size={36} color={T.sub} style={{ margin: '0 auto 12px' }} />
              <div style={{ fontSize: 16, fontWeight: 700, color: T.ink }}>No products available.</div>
              <div style={{ fontSize: 13.5, marginTop: 4 }}>Please check back later.</div>
            </div>
          ) : list.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: T.sub }}>
              <Icon name="search" size={36} color={T.sub} style={{ margin: '0 auto 12px' }} />
              <div style={{ fontSize: 16, fontWeight: 700, color: T.ink }}>No products match “{q}”.</div>
              <div style={{ fontSize: 13.5, marginTop: 4 }}>Try another keyword or category.</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(196px, 1fr))', gap: 14 }}>
              {list.map((p) => (
                <div key={p.id} onClick={() => ModalStore.open('productDetails', { id: p.id })} style={{ background: '#fff', border: `1px solid ${T.line}`, borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column', cursor: 'pointer' }}>
                  <div style={{ height: 116, background: T.surface, borderBottom: `1px solid ${T.line}` }}><ProductShot icon={p.icon} img={p.image} bg={T.surface} tint="#A6B4CC" /></div>
                  <div style={{ padding: '12px 13px 13px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: T.blue, letterSpacing: 0.3, textTransform: 'uppercase' }}>{p.brand}</div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: T.ink, lineHeight: 1.32, margin: '4px 0 6px', minHeight: 35 }}>{p.name}</div>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: T.sub, fontVariantNumeric: 'tabular-nums', marginBottom: 10 }}>{p.sku}</div>
                    <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <AnimatedPrice ugx={p.ugx} style={{ fontSize: 16, fontWeight: 800, color: T.ink }} />
                      <AddBtn p={p} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Overlay>
    );
  }

  // ── Cart modal ──
  function QtyStep({ id, qty }) {
    const cart = useCart();
    const btn = { width: 30, height: 30, borderRadius: 8, border: `1px solid ${T.line}`, background: '#fff', color: T.ink, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        <button style={btn} onClick={() => cart.setQty(id, qty - 1)} disabled={qty <= 1}><Icon name="minus" size={15} color={qty <= 1 ? T.line : T.ink} /></button>
        <span style={{ minWidth: 22, textAlign: 'center', fontSize: 14, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{qty}</span>
        <button style={btn} onClick={() => cart.add(id)}><Icon name="plus" size={15} color={T.ink} /></button>
      </div>
    );
  }
  function CartModal() {
    const cart = useCart();
    const rows = cart.get();
    const empty = rows.length === 0;
    return (
      <Overlay width={640} onClose={() => ModalStore.close()}>
        <ModalHead title="Your cart" sub={empty ? 'No items yet' : `${cart.count()} item${cart.count() === 1 ? '' : 's'}`} onClose={() => ModalStore.close()} />
        {empty ? (
          <div style={{ padding: '64px 24px', textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: 999, background: T.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Icon name="cart" size={30} color={T.sub} /></div>
            <div style={{ fontSize: 17, fontWeight: 800 }}>Your cart is empty</div>
            <div style={{ fontSize: 13.5, color: T.sub, fontWeight: 600, margin: '6px 0 20px' }}>Add components from the catalogue to get a locked quote.</div>
            <button onClick={() => ModalStore.open('catalogue')} style={{ border: 'none', background: T.blue, color: '#fff', padding: '12px 22px', borderRadius: 11, fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: F }}>Browse catalogue</button>
          </div>
        ) : (
          <React.Fragment>
            <div style={{ flex: '1 1 auto', overflowY: 'auto', padding: '6px 22px' }}>
              {rows.map((r) => {
                const p = PRODUCTS.find((x) => x.id === r.id); if (!p) return null;
                return (
                  <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 0', borderBottom: `1px solid ${T.line}` }}>
                    <div style={{ width: 64, height: 64, borderRadius: 11, overflow: 'hidden', flexShrink: 0, border: `1px solid ${T.line}` }}><ProductShot icon={p.icon} img={p.image} bg={T.surface} tint="#A6B4CC" pad={14} /></div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.3 }}>{p.name}</div>
                      <div style={{ fontSize: 11.5, fontWeight: 700, color: T.sub, margin: '3px 0 8px' }}>{p.sku}</div>
                      {p.imported === true && (Number(p.import_fee) || 0) > 0 && (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11.5, fontWeight: 800, color: T.amberInk, background: '#FFF4DC', padding: '2px 8px', borderRadius: 6, marginBottom: 8 }}>
                          + <AnimatedPrice ugx={Number(p.import_fee)} style={{ fontSize: 11.5, fontWeight: 800, color: T.amberInk }} /> import fee /unit
                        </div>
                      )}
                      <QtyStep id={r.id} qty={r.qty} />
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <AnimatedPrice ugx={p.ugx * r.qty} style={{ fontSize: 15.5, fontWeight: 800, color: T.ink }} />
                      <div style={{ fontSize: 11.5, color: T.sub, fontWeight: 600, marginTop: 2 }}><AnimatedPrice ugx={p.ugx} style={{ fontSize: 11.5 }} /> ea</div>
                      <button onClick={() => { cart.remove(r.id); ToastStore.push(p.name, { title: 'Removed', icon: 'check', tone: 'warn' }); }}
                        style={{ marginTop: 6, border: 'none', background: 'none', color: T.sub, cursor: 'pointer', fontSize: 12, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: F }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>Remove</button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ flex: '0 0 auto', borderTop: `1px solid ${T.line}`, padding: '18px 22px', background: T.surface }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13.5, fontWeight: 700, color: T.sub }}>Subtotal · incl. VAT</span>
                <AnimatedPrice ugx={cart.subtotal()} style={{ fontSize: 15, fontWeight: 800, color: T.ink }} />
              </div>
              {cart.importFees() > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: T.sub }}>Import fees</span>
                  <AnimatedPrice ugx={cart.importFees()} style={{ fontSize: 15, fontWeight: 800, color: T.ink }} />
                </div>
              )}
              {cart.transportFee() > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: T.sub }}>Transport fee</span>
                  <AnimatedPrice ugx={cart.transportFee()} style={{ fontSize: 15, fontWeight: 800, color: T.ink }} />
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '12px 0 14px', paddingTop: 12, borderTop: `1px solid ${T.line}` }}>
                <span style={{ fontSize: 14.5, fontWeight: 800, color: T.ink }}>Grand total</span>
                <AnimatedPrice ugx={cart.grandTotal()} style={{ fontSize: 24, fontWeight: 800, color: T.ink }} />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => { cart.clear(); ToastStore.push('All items removed from your cart.', { title: 'Cart cleared', icon: 'check', tone: 'warn' }); }}
                  style={{ flex: '0 0 auto', border: `1.5px solid ${T.line}`, background: '#fff', color: T.ink, padding: '13px 18px', borderRadius: 11, fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: F }}>Clear cart</button>
                <button onClick={() => {
                    if (!AuthStore.isLoggedIn()) { ToastStore.push('Please log in to proceed with checkout.', { title: 'Sign in required', icon: 'user', tone: 'warn' }); ModalStore.open('login'); return; }
                    ModalStore.open('checkout');
                  }}
                  style={{ flex: 1, border: 'none', background: T.blue, color: '#fff', padding: '13px 18px', borderRadius: 11, fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: F, boxShadow: '0 6px 16px rgba(20,87,230,.3)' }}>Proceed to checkout</button>
              </div>
            </div>
          </React.Fragment>
        )}
      </Overlay>
    );
  }

  // ── Inquiry modal ──
  function InquiryModal() {
    const svc = ModalStore.getData()?.service || null;
    // Auto-fill for logged-in clients: name + email come from the session
    // (pps_session mirror of AuthStore); phone comes from the client registry
    // (pps_clients) where signup stored it. Logged-out users see empty fields.
    const prefill = React.useMemo(() => {
      const u = AuthStore.get();
      if (!(u && u.isLoggedIn)) return { name: '', email: '', phone: '' };
      const name = [u.firstName, u.lastName].filter(Boolean).join(' ').trim();
      const client = ClientStore.findByEmail(u.email);
      return {
        name: name || (u.email ? u.email.split('@')[0] : ''),
        email: u.email || '',
        phone: (client && client.phone) || u.phone || '',
      };
    }, []);
    const [form, setForm] = React.useState({ name: prefill.name, email: prefill.email, phone: prefill.phone, spec: svc ? `I'm interested in ${svc}. ` : '' });
    const [file, setFile] = React.useState(null);
    const [drag, setDrag] = React.useState(false);
    const [touched, setTouched] = React.useState(false);
    const inputRef = React.useRef(null);
    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
    // Phone is optional — name, valid email and the spec remain required.
    const valid = form.name.trim() && /.+@.+\..+/.test(form.email) && form.spec.trim();
    const submit = () => {
      setTouched(true);
      if (!valid) { ToastStore.push('Add your name, a valid email and the part spec.', { title: 'Check the form', icon: 'doc', tone: 'error' }); return; }
      const name = form.name.trim();
      const email = form.email.trim();
      const phone = (form.phone || '').trim();
      const message = form.spec.trim();
      // Persist to pps_inquiries (shared with the admin Inquiries view).
      let rec = null;
      try {
        const list = JSON.parse(localStorage.getItem('pps_inquiries') || '[]');
        let max = 213;
        list.forEach((q) => { const m = /INQ-(\d+)/.exec(q.id || ''); if (m) max = Math.max(max, parseInt(m[1], 10)); });
        rec = {
          id: '#INQ-' + (max + 1),
          clientName: name, email, phone,
          date: new Date().toISOString().slice(0, 10),
          subject: svc ? ('Service inquiry — ' + svc) : 'Source a rare part',
          message: (file ? '[Attachment: ' + file.name + '] ' : '') + message,
          status: 'New',
        };
        list.unshift(rec);
        localStorage.setItem('pps_inquiries', JSON.stringify(list));
      } catch (e) { console.warn('[PPS] Could not save inquiry locally.', e); }
      // Notify the admin inbox (non-blocking — never interrupts the user flow).
      notifyAdmin(EMAILJS_INQUIRY_TEMPLATE_ID, {
        subject: rec ? rec.subject : 'Source a rare part',
        client_name: name, client_email: email, client_phone: phone || '—',
        message, inquiry_id: rec ? rec.id : '',
      });
      ModalStore.close();
      ToastStore.push(`Thanks ${name.split(' ')[0]} — our sourcing desk replies with a locked quote within 24h.`, { title: 'Inquiry sent', icon: 'check', tone: 'ok' });
    };
    const fld = { width: '100%', border: `1.5px solid ${T.line}`, borderRadius: 11, padding: '12px 14px', fontSize: 14, fontFamily: F, color: T.ink, outline: 'none', background: '#fff', boxSizing: 'border-box' };
    const lbl = { fontSize: 13, fontWeight: 800, color: T.ink, marginBottom: 7, display: 'block' };
    const err = (cond) => (touched && cond ? { borderColor: T.red } : null);
    return (
      <Overlay width={560} onClose={() => ModalStore.close()}>
        <ModalHead title={svc || 'Source a rare part'} sub={svc ? `Tell us what you need — our desk replies within 24h` : "Obsolete, hard-to-find or bulk — we'll quote within 24h"} onClose={() => ModalStore.close()} />
        <div style={{ flex: '1 1 auto', overflowY: 'auto', padding: '20px 22px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div><label style={lbl}>Your name</label><input value={form.name} onChange={set('name')} placeholder="Jane Okello" style={{ ...fld, ...err(!form.name.trim()) }} /></div>
            <div><label style={lbl}>Email</label><input type="email" value={form.email} onChange={set('email')} placeholder="jane@company.co.ug" style={{ ...fld, ...err(!/.+@.+\..+/.test(form.email)) }} /></div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Phone number <span style={{ color: T.sub, fontWeight: 600 }}>(optional)</span></label>
            <input type="tel" value={form.phone} onChange={set('phone')} placeholder="+256 7XX XXX XXX" style={fld} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Part description / specs</label>
            <textarea value={form.spec} onChange={set('spec')} rows={4} placeholder="Part number, ratings, brand, quantity — or describe what it does." style={{ ...fld, resize: 'vertical', lineHeight: 1.5, ...err(!form.spec.trim()) }} />
          </div>
          <label style={lbl}>Datasheet or photo <span style={{ color: T.sub, fontWeight: 600 }}>(optional)</span></label>
          <div onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) setFile(f); }}
            style={{ border: `1.5px dashed ${drag ? T.blue : T.line}`, background: drag ? T.chip : T.surface, borderRadius: 12, padding: '18px', textAlign: 'center', cursor: 'pointer' }}>
            <input ref={inputRef} type="file" hidden onChange={(e) => setFile(e.target.files[0] || null)} />
            {file ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
                <Icon name="doc" size={20} color={T.blue} />
                <span style={{ fontSize: 13.5, fontWeight: 700, color: T.ink, maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                <button onClick={(e) => { e.stopPropagation(); setFile(null); }} style={{ border: 'none', background: 'none', color: T.sub, cursor: 'pointer', display: 'flex' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg></button>
              </div>
            ) : (
              <div style={{ color: T.sub }}>
                <Icon name="download" size={22} color={T.sub} style={{ margin: '0 auto 6px' }} />
                <div style={{ fontSize: 13.5, fontWeight: 700, color: T.ink }}>Drop a file or click to upload</div>
                <div style={{ fontSize: 12, marginTop: 2 }}>PDF, JPG or PNG</div>
              </div>
            )}
          </div>
        </div>
        <div style={{ flex: '0 0 auto', borderTop: `1px solid ${T.line}`, padding: '16px 22px', display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button onClick={() => ModalStore.close()} style={{ border: `1.5px solid ${T.line}`, background: '#fff', color: T.ink, padding: '12px 20px', borderRadius: 11, fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: F }}>Cancel</button>
          <button onClick={submit} style={{ border: 'none', background: T.amber, color: T.amberInk, padding: '12px 22px', borderRadius: 11, fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: F, display: 'inline-flex', alignItems: 'center', gap: 8 }}>Send inquiry <Icon name="arrowRight" size={16} color={T.amberInk} /></button>
        </div>
      </Overlay>
    );
  }

  // ── Login / Signup modal ──
  const SocialMark = ({ kind }) => {
    const c = { google: '#EA4335', instagram: '#E1306C', twitter: '#1DA1F2' }[kind];
    if (kind === 'google') return (
      <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.5 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.9a5 5 0 0 1-2.2 3.3v2.7h3.5c2-1.9 3.3-4.7 3.3-7.9z"/><path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.5-2.7c-1 .7-2.3 1.1-3.8 1.1-2.9 0-5.4-2-6.3-4.6H2v2.8A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.7 14.1a6.6 6.6 0 0 1 0-4.2V7.1H2a11 11 0 0 0 0 9.8z"/><path fill="#EA4335" d="M12 5.4c1.6 0 3 .6 4.2 1.7l3.1-3.1A11 11 0 0 0 2 7.1l3.7 2.8C6.6 7.3 9.1 5.4 12 5.4z"/></svg>
    );
    if (kind === 'instagram') return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill={c} stroke="none"/></svg>
    );
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill={c}><path d="M22 5.9c-.7.3-1.5.5-2.3.6a4 4 0 0 0 1.8-2.2c-.8.5-1.7.8-2.6 1a4 4 0 0 0-6.9 3.7A11.4 11.4 0 0 1 3.8 4.7a4 4 0 0 0 1.2 5.4c-.6 0-1.2-.2-1.8-.5a4 4 0 0 0 3.2 4c-.5.1-1.1.2-1.7.1a4 4 0 0 0 3.7 2.8A8 8 0 0 1 2 18.3a11.3 11.3 0 0 0 6.1 1.8c7.4 0 11.4-6.1 11.4-11.4v-.5c.8-.6 1.5-1.3 2-2.1z"/></svg>
    );
  };

  function LoginModal() {
    const auth = useAuth();
    const loggedIn = auth.isLoggedIn();
    const user = auth.get();
    const [tab, setTab] = React.useState('login');
    const [show, setShow] = React.useState({});
    const [touched, setTouched] = React.useState(false);
    const [login, setLogin] = React.useState({ id: '', pw: '', remember: true });
    const [signup, setSignup] = React.useState({ first: '', last: '', email: '', phone: '', address: '', pw: '', confirm: '', agree: false });
    const toggle = (k) => setShow((s) => ({ ...s, [k]: !s[k] }));

    const fld = { width: '100%', border: `1.5px solid ${T.line}`, borderRadius: 11, padding: '12px 14px', fontSize: 14, fontFamily: F, color: T.ink, outline: 'none', background: '#fff', boxSizing: 'border-box' };
    const lbl = { fontSize: 13, fontWeight: 800, color: T.ink, marginBottom: 7, display: 'block' };
    const err = (cond) => (touched && cond ? { borderColor: T.red } : null);
    // NOTE: render this by CALLING it as a function (e.g. {PwField({...})}),
    // never as <PwField/>. Defined inside the component, a JSX element would get
    // a fresh component identity every render and React would remount the input
    // on each keystroke — which is what made password typing feel "stuck".
    const PwField = ({ k, value, onChange, placeholder, invalid }) => (
      <div style={{ position: 'relative' }}>
        <input type={show[k] ? 'text' : 'password'} value={value} onChange={onChange} placeholder={placeholder} maxLength={20} style={{ ...fld, paddingRight: 62, ...err(invalid) }} />
        <button type="button" onClick={() => toggle(k)} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', color: T.blue, fontWeight: 800, fontSize: 12.5, cursor: 'pointer', fontFamily: F, padding: '4px 6px' }}>{show[k] ? 'Hide' : 'Show'}</button>
      </div>
    );

    // ── Social login (Firebase) ──
    // window.ppsSocialSignIn(kind) lives in home.html; it returns a Promise<user>.
    // We funnel the returned profile through the existing AuthStore so the header,
    // checkout, and My Orders keep working unchanged — and mirror it to pps_user /
    // pps_clients so the admin can see anyone who signs up via social.
    const finishSocial = (u, label) => {
      const name = (u.displayName || '').trim();
      const parts = name ? name.split(/\s+/) : [];
      const email = u.email || '';
      const existing = ClientStore.findByEmail(email);

      // Login enforcement: on the Log In tab, reject any social user who has
      // not previously signed up (manual or social). Sign them back out of
      // Firebase so no session leaks through.
      if (tab === 'login' && !existing) {
        ToastStore.push('No account found. Please sign up first with this email or use a different method.', { title: 'No account', icon: 'user', tone: 'error' });
        try { if (window.firebase && window.firebase.auth) window.firebase.auth().signOut(); } catch (e) {}
        setTab('signup'); setTouched(false);
        if (email) setSignup((s) => ({ ...s, email }));
        return;
      }

      // Sign Up tab (or already-known user): create the client on first social
      // sign-up, then log in.
      let client = existing;
      if (!client) {
        const firstName = parts[0] || (email ? email.split('@')[0] : label);
        const lastName = parts.slice(1).join(' ');
        client = ClientStore.add({ firstName, lastName, email, password: null, socialProvider: label });
      }
      const firstName = client.firstName || (client.name || '').split(' ')[0];
      const lastName = client.lastName || (client.name || '').split(' ').slice(1).join(' ');
      try { localStorage.setItem('pps_user', JSON.stringify({ firstName, lastName, email, photoURL: u.photoURL || '', uid: u.uid || client.id, provider: label })); } catch (e) {}
      auth.login({ userId: client.id, firstName, lastName, email, photoURL: u.photoURL || '' });
      ModalStore.close();
      ToastStore.push(`Welcome, ${firstName}!`, { title: 'Signed in with ' + label, icon: 'check', tone: 'ok' });
    };
    const social = (kind, label) => () => {
      if (!window.ppsSocialSignIn) { ToastStore.push('Sign-in failed. Please try again.', { title: 'Sign-in failed', icon: 'user', tone: 'error' }); return; }
      window.ppsSocialSignIn(kind).then((u) => finishSocial(u, label)).catch((err) => {
        const code = (err && err.code) || '';
        if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
          ToastStore.push('Sign-in was cancelled.', { title: 'Cancelled', icon: 'user', tone: 'warn' });
        } else {
          ToastStore.push('Sign-in failed. Please try again.', { title: 'Sign-in failed', icon: 'user', tone: 'error' });
        }
      });
    };

    const doLogin = () => {
      setTouched(true);
      if (!login.id.trim() || !login.pw.trim()) { ToastStore.push('Enter your username/email and password.', { title: 'Check the form', icon: 'user', tone: 'error' }); return; }
      const id = login.id.trim();
      // Only registered clients (in pps_clients) may log in. Match by email,
      // falling back to full name as the identifier.
      const client = ClientStore.findByEmail(id) || ClientStore.read().find((c) => c.name && c.name.toLowerCase() === id.toLowerCase());
      if (!client) {
        ToastStore.push('Account not found. Please sign up first.', { title: 'No account', icon: 'user', tone: 'error' });
        setTab('signup'); setTouched(false);
        if (id.includes('@')) setSignup((s) => ({ ...s, email: id }));
        return;
      }
      // Social-only accounts have no password — send them to their provider.
      if (client.password == null) {
        ToastStore.push('This account uses social sign-in. Continue with Google, Instagram or Twitter.', { title: 'Use social login', icon: 'user', tone: 'warn' });
        return;
      }
      if (client.password !== login.pw) {
        ToastStore.push('Incorrect password. Please try again.', { title: 'Wrong password', icon: 'user', tone: 'error' });
        return;
      }
      const fn = client.firstName || (client.name || '').split(' ')[0];
      const ln = client.lastName || (client.name || '').split(' ').slice(1).join(' ');
      auth.login({ userId: client.id, firstName: fn, lastName: ln, email: client.email });
      ModalStore.close();
      ToastStore.push(`Welcome back, ${fn}!`, { title: 'Signed in', icon: 'check', tone: 'ok' });
    };
    const doSignup = () => {
      setTouched(true);
      const okEmail = /.+@.+\..+/.test(signup.email);
      if (!signup.first.trim() || !signup.last.trim() || !okEmail || !signup.phone.trim() || !signup.address.trim() || !signup.pw.trim() || signup.pw !== signup.confirm || !signup.agree) {
        ToastStore.push(signup.pw && signup.pw !== signup.confirm ? "Passwords don't match." : 'Complete all fields and accept the policy.', { title: 'Check the form', icon: 'user', tone: 'error' }); return;
      }
      const email = signup.email.trim();
      // Edge case: don't let the same email register twice.
      if (ClientStore.findByEmail(email)) {
        ToastStore.push('An account with this email already exists. Please log in.', { title: 'Already registered', icon: 'user', tone: 'warn' });
        setTab('login'); setTouched(false);
        setLogin((s) => ({ ...s, id: email }));
        return;
      }
      const fn = signup.first.trim();
      const ln = signup.last.trim();
      const client = ClientStore.add({ firstName: fn, lastName: ln, email, phone: signup.phone.trim(), address: signup.address.trim(), password: signup.pw, socialProvider: null });
      auth.login({ userId: client.id, firstName: fn, lastName: ln, email });
      ModalStore.close();
      ToastStore.push(`Account created! Welcome, ${fn}!`, { title: 'Account created', icon: 'check', tone: 'ok' });
    };

    const TabBtn = ({ id, children }) => {
      const on = tab === id;
      return <button onClick={() => { setTab(id); setTouched(false); }} style={{ flex: 1, border: 'none', background: 'none', cursor: 'pointer', fontFamily: F, fontSize: 15, fontWeight: 800, color: on ? T.blue : T.sub, padding: '14px 0', borderBottom: `3px solid ${on ? T.blue : 'transparent'}`, transition: 'color .15s' }}>{children}</button>;
    };

    return (
      <Overlay width={440} onClose={() => ModalStore.close()}>
        <ModalHead title={loggedIn ? 'Your account' : 'Welcome'} sub={loggedIn ? user.email || 'Signed in' : 'Sign in or create an account'} onClose={() => ModalStore.close()} />
        {loggedIn ? (
          <div style={{ padding: '26px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px', border: `1px solid ${T.line}`, borderRadius: 13, background: T.surface, marginBottom: 18 }}>
              <div style={{ width: 48, height: 48, borderRadius: 999, background: T.blue, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, fontWeight: 800, flexShrink: 0, overflow: 'hidden' }}>{user.photoURL ? <img src={user.photoURL} alt="" referrerPolicy="no-referrer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (user.firstName || 'U').charAt(0).toUpperCase()}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 800 }}>{[user.firstName, user.lastName].filter(Boolean).join(' ') || user.firstName}</div>
                {user.email && <div style={{ fontSize: 13, color: T.sub, fontWeight: 600 }}>{user.email}</div>}
              </div>
            </div>
            <button onClick={() => { ModalStore.open('myOrders'); }}
              style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, border: 'none', background: T.blue, color: '#fff', padding: '13px', borderRadius: 11, fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: F, marginBottom: 10, boxShadow: '0 6px 16px rgba(20,87,230,.3)' }}>
              <Icon name="box" size={17} color="#fff" stroke={2} /> My Orders &amp; Receipts</button>
            <button onClick={() => { const fn = user.firstName; auth.logout(); ModalStore.close(); ToastStore.push(`You've been signed out${fn ? ', ' + fn : ''}.`, { title: 'Signed out', icon: 'check', tone: 'warn' }); }}
              style={{ width: '100%', border: `1.5px solid ${T.line}`, background: '#fff', color: T.ink, padding: '13px', borderRadius: 11, fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: F }}>Log out</button>
          </div>
        ) : (
          <React.Fragment>
            <div style={{ display: 'flex', borderBottom: `1px solid ${T.line}` }}>
              <TabBtn id="login">Log In</TabBtn>
              <TabBtn id="signup">Sign Up</TabBtn>
            </div>
            <div style={{ flex: '1 1 auto', overflowY: 'auto', padding: '20px 22px' }}>
              {tab === 'login' ? (
                <React.Fragment>
                  <div style={{ marginBottom: 14 }}><label style={lbl}>Username or Email</label><input value={login.id} onChange={(e) => setLogin((s) => ({ ...s, id: e.target.value }))} placeholder="jane@company.co.ug" style={{ ...fld, ...err(!login.id.trim()) }} /></div>
                  <div style={{ marginBottom: 12 }}><label style={lbl}>Password</label>{PwField({ k: 'login', value: login.pw, onChange: (e) => setLogin((s) => ({ ...s, pw: e.target.value })), placeholder: '••••••••', invalid: !login.pw.trim() })}</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: T.ink, cursor: 'pointer' }}>
                      <input type="checkbox" checked={login.remember} onChange={(e) => setLogin((s) => ({ ...s, remember: e.target.checked }))} style={{ width: 16, height: 16, accentColor: T.blue, cursor: 'pointer' }} /> Remember me</label>
                    <span style={{ fontSize: 13, fontWeight: 700, color: T.blue, cursor: 'pointer' }}>Forgot Password?</span>
                  </div>
                  <button onClick={doLogin} style={{ width: '100%', border: 'none', background: T.blue, color: '#fff', padding: '13px', borderRadius: 11, fontSize: 14.5, fontWeight: 800, cursor: 'pointer', fontFamily: F, boxShadow: '0 6px 16px rgba(20,87,230,.3)' }}>Login</button>
                </React.Fragment>
              ) : (
                <React.Fragment>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                    <div><label style={lbl}>First Name</label><input value={signup.first} onChange={(e) => setSignup((s) => ({ ...s, first: e.target.value }))} placeholder="" style={{ ...fld, ...err(!signup.first.trim()) }} /></div>
                    <div><label style={lbl}>Last Name</label><input value={signup.last} onChange={(e) => setSignup((s) => ({ ...s, last: e.target.value }))} placeholder="" style={{ ...fld, ...err(!signup.last.trim()) }} /></div>
                  </div>
                  <div style={{ marginBottom: 14 }}><label style={lbl}>Email</label><input type="email" value={signup.email} onChange={(e) => setSignup((s) => ({ ...s, email: e.target.value }))} placeholder="jane@company.co.ug" style={{ ...fld, ...err(!/.+@.+\..+/.test(signup.email)) }} /></div>
                  <div style={{ marginBottom: 14 }}><label style={lbl}>Phone Number</label><input type="tel" value={signup.phone} onChange={(e) => setSignup((s) => ({ ...s, phone: e.target.value }))} placeholder="+256 700 000 000" style={{ ...fld, ...err(!signup.phone.trim()) }} /></div>
                  <div style={{ marginBottom: 14 }}><label style={lbl}>Address</label><input type="text" value={signup.address} onChange={(e) => setSignup((s) => ({ ...s, address: e.target.value }))} placeholder="Street, City, Country" style={{ ...fld, ...err(!signup.address.trim()) }} /></div>
                  <div style={{ marginBottom: 14 }}><label style={lbl}>Password</label>{PwField({ k: 'su1', value: signup.pw, onChange: (e) => setSignup((s) => ({ ...s, pw: e.target.value })), placeholder: 'At least 6 characters', invalid: !signup.pw.trim() })}</div>
                  <div style={{ marginBottom: 16 }}><label style={lbl}>Confirm Password</label>{PwField({ k: 'su2', value: signup.confirm, onChange: (e) => setSignup((s) => ({ ...s, confirm: e.target.value })), placeholder: 'Re-enter password', invalid: !signup.confirm.trim() || signup.confirm !== signup.pw })}</div>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: 9, fontSize: 13, fontWeight: 600, color: T.ink, cursor: 'pointer', marginBottom: 18, lineHeight: 1.4 }}>
                    <input type="checkbox" checked={signup.agree} onChange={(e) => setSignup((s) => ({ ...s, agree: e.target.checked }))} style={{ width: 16, height: 16, accentColor: T.blue, cursor: 'pointer', marginTop: 1, flexShrink: 0 }} />
                    <span>I agree with the <span onClick={(e) => { e.preventDefault(); e.stopPropagation(); ModalStore.open('terms'); }} style={{ color: T.blue, fontWeight: 700, textDecoration: 'underline', textUnderlineOffset: 2 }}>privacy &amp; policy</span></span></label>
                  <button onClick={doSignup} style={{ width: '100%', border: 'none', background: T.blue, color: '#fff', padding: '13px', borderRadius: 11, fontSize: 14.5, fontWeight: 800, cursor: 'pointer', fontFamily: F, boxShadow: '0 6px 16px rgba(20,87,230,.3)' }}>Sign up</button>
                </React.Fragment>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0 16px' }}>
                <div style={{ flex: 1, height: 1, background: T.line }} />
                <span style={{ fontSize: 12.5, fontWeight: 700, color: T.sub }}>{tab === 'login' ? 'Or sign in with' : 'Or sign up with'}</span>
                <div style={{ flex: 1, height: 1, background: T.line }} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                {[['Google', 'google'], ['Instagram', 'instagram'], ['Twitter', 'twitter']].map(([label, kind]) => (
                  <button key={kind} onClick={social(kind, label)} title={label}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, border: `1.5px solid ${T.line}`, background: '#fff', borderRadius: 11, padding: '11px 0', cursor: 'pointer', fontFamily: F, fontSize: 13, fontWeight: 700, color: T.ink }}>
                    <SocialMark kind={kind} /></button>
                ))}
              </div>

              <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 600, color: T.sub, marginTop: 20 }}>
                {tab === 'login' ? (
                  <span>Don't have an account? <span onClick={() => { setTab('signup'); setTouched(false); }} style={{ color: T.blue, fontWeight: 800, cursor: 'pointer' }}>Sign up</span></span>
                ) : (
                  <span>Already have an account? <span onClick={() => { setTab('login'); setTouched(false); }} style={{ color: T.blue, fontWeight: 800, cursor: 'pointer' }}>Sign in</span></span>
                )}
              </div>
            </div>
          </React.Fragment>
        )}
      </Overlay>
    );
  }

  // ── Product details modal ──
  function BuyNowBtn({ p }) {
    const onClick = (e) => {
      e.stopPropagation();
      CartStore.add(p.id);
      ModalStore.close();
      ToastStore.push(`${p.name} — checkout simulated. Our desk will confirm payment.`, { title: 'Purchase started', icon: 'check', tone: 'ok' });
    };
    return (
      <button onClick={onClick}
        style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, border: `1.5px solid ${T.ink}`, cursor: 'pointer', fontFamily: F,
          padding: '13px 18px', borderRadius: 12, fontSize: 15, fontWeight: 800, background: T.ink, color: '#fff' }}>
        <Icon name="bolt" size={18} color="#fff" /> Buy Now
      </button>
    );
  }

  function AddToCartLg({ p }) {
    const cart = useCart();
    const inCart = cart.has(p.id);
    const onClick = (e) => { e.stopPropagation(); cart.add(p.id); ToastStore.push(p.name, { title: 'Added to cart', icon: 'cart', tone: 'ok' }); };
    return (
      <button onClick={onClick}
        style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, border: 'none', cursor: 'pointer', fontFamily: F,
          padding: '13px 18px', borderRadius: 12, fontSize: 15, fontWeight: 800, background: inCart ? '#E5F4EC' : T.blue, color: inCart ? T.green : '#fff', boxShadow: inCart ? 'none' : '0 6px 16px rgba(20,87,230,.3)' }}>
        <Icon name={inCart ? 'check' : 'cart'} size={18} color={inCart ? T.green : '#fff'} stroke={inCart ? 2.4 : 2} />
        {inCart ? `In Cart · ${cart.qtyOf(p.id)}` : 'Add to Cart'}
      </button>
    );
  }

  function FaqRow({ q, a, open, onToggle }) {
    return (
      <div style={{ borderBottom: `1px solid ${T.line}` }}>
        <button onClick={onToggle}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, background: 'none', border: 'none', cursor: 'pointer', fontFamily: F, textAlign: 'left', padding: '15px 2px' }}>
          <span style={{ flex: 1, fontSize: 14.5, fontWeight: 800, color: T.ink }}>{q}</span>
          <span style={{ width: 26, height: 26, borderRadius: 8, background: open ? T.blue : T.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background .15s' }}>
            <Icon name={open ? 'minus' : 'plus'} size={15} color={open ? '#fff' : T.sub} stroke={2.4} />
          </span>
        </button>
        {open && <div style={{ fontSize: 13.5, color: T.sub, fontWeight: 600, lineHeight: 1.55, padding: '0 2px 16px', maxWidth: 760 }}>{a}</div>}
      </div>
    );
  }

  function RelatedCard({ id }) {
    const p = PRODUCTS.find((x) => x.id === id);
    if (!p) return null;
    return (
      <div onClick={() => ModalStore.open('productDetails', { id: p.id })}
        style={{ width: 200, flexShrink: 0, background: '#fff', border: `1px solid ${T.line}`, borderRadius: 13, overflow: 'hidden', display: 'flex', flexDirection: 'column', cursor: 'pointer' }}>
        <div style={{ height: 116, background: T.surface, borderBottom: `1px solid ${T.line}` }}><ProductShot icon={p.icon} img={p.image} bg={T.surface} tint="#A6B4CC" /></div>
        <div style={{ padding: '11px 12px 13px', display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div style={{ fontSize: 10.5, fontWeight: 800, color: T.blue, letterSpacing: 0.3, textTransform: 'uppercase' }}>{p.brand}</div>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: T.ink, lineHeight: 1.3, margin: '4px 0 8px', minHeight: 32 }}>{p.name}</div>
          <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <AnimatedPrice ugx={p.ugx} style={{ fontSize: 14.5, fontWeight: 800, color: T.ink }} />
            <AddBtn p={p} />
          </div>
        </div>
      </div>
    );
  }

  function ProductModal() {
    const data = ModalStore.getData() || {};
    const base = PRODUCTS.find((x) => x.id === data.id) || PRODUCTS[0];
    const p = productDetail(base);
    const off = p.was ? Math.round((1 - p.ugx / p.was) * 100) : 0;
    const [open, setOpen] = React.useState(0);
    return (
      <Overlay width={1000} onClose={() => ModalStore.close()}>
        <ModalHead title="Product Details" sub={p.sku} onClose={() => ModalStore.close()} />
        <div style={{ flex: '1 1 auto', overflowY: 'auto', background: T.surface }}>
          {/* hero */}
          <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: 24, padding: 24, background: '#fff', borderBottom: `1px solid ${T.line}` }}>
            <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', border: `1px solid ${T.line}`, background: T.surface, height: 360 }}>
              <ProductShot icon={p.icon} img={p.image} bg={T.surface} tint="#A6B4CC" pad={60} />
              {p.badge && <div style={{ position: 'absolute', top: 14, left: 14, background: p.badge === 'Best Seller' ? T.ink : p.badge === 'Deal' ? T.amber : T.blue, color: p.badge === 'Deal' ? T.amberInk : '#fff', fontSize: 11.5, fontWeight: 800, letterSpacing: 0.3, padding: '5px 11px', borderRadius: 999, textTransform: 'uppercase' }}>{p.badge}</div>}
              {off > 0 && <div style={{ position: 'absolute', bottom: 14, right: 14, background: T.red, color: '#fff', fontSize: 14, fontWeight: 800, padding: '5px 11px', borderRadius: 8 }}>−{off}%</div>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: T.blue, letterSpacing: 0.5, textTransform: 'uppercase' }}>{p.brand}</div>
              <div style={{ fontSize: 27, fontWeight: 800, color: T.ink, letterSpacing: -0.6, lineHeight: 1.15, margin: '6px 0 10px' }}>{p.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <Stars value={p.rating} size={17} />
                <span style={{ fontSize: 13.5, fontWeight: 700, color: T.ink }}>{p.rating}</span>
                <span style={{ fontSize: 13.5, fontWeight: 600, color: T.sub }}>· {p.reviewsCount} reviews</span>
                <span style={{ fontSize: 12.5, fontWeight: 800, color: T.green, background: '#E5F4EC', padding: '3px 9px', borderRadius: 999, marginLeft: 4 }}>{p.stock}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginBottom: 16 }}>
                <AnimatedPrice ugx={p.ugx} style={{ fontSize: 32, fontWeight: 800, color: T.ink }} />
                {p.was && <AnimatedPrice ugx={p.was} style={{ fontSize: 17, fontWeight: 600, color: T.sub, textDecoration: 'line-through', paddingBottom: 4 }} />}
                {off > 0 && <span style={{ fontSize: 13, fontWeight: 800, color: T.red, background: '#FDECEC', padding: '5px 10px', borderRadius: 8, marginBottom: 3 }}>Save {off}%</span>}
              </div>
              <div style={{ fontSize: 14, color: T.sub, fontWeight: 600, lineHeight: 1.55, marginBottom: 18 }}>{p.description}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
                {[['lock', 'Secure Checkout'], ['truck', 'Free Fast Shipping'], ['rotate', '30-Day Money-Back']].map(([ic, label]) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, background: T.surface, border: `1px solid ${T.line}`, borderRadius: 10, padding: '9px 13px' }}>
                    <Icon name={ic} size={17} color={T.blue} stroke={1.8} />
                    <span style={{ fontSize: 12.5, fontWeight: 800, color: T.ink }}>{label}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 'auto' }}>
                <AddToCartLg p={base} />
                <BuyNowBtn p={base} />
              </div>
            </div>
          </div>

          {/* reviews */}
          <div style={{ padding: '24px 24px 8px' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: T.ink, letterSpacing: -0.4, marginBottom: 14 }}>Customer Reviews</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {p.reviews.map((r, i) => (
                <div key={i} style={{ background: '#fff', border: `1px solid ${T.line}`, borderRadius: 13, padding: '15px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 9 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 999, background: T.blue, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, flexShrink: 0 }}>{r.author.charAt(0)}</div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 800, color: T.ink }}>{r.author}</div>
                      <div style={{ fontSize: 11.5, fontWeight: 600, color: T.sub }}>{r.role}</div>
                    </div>
                    <div style={{ marginLeft: 'auto' }}><Stars value={r.rating} size={13} /></div>
                  </div>
                  <div style={{ fontSize: 13, color: T.sub, fontWeight: 600, lineHeight: 1.5 }}>{r.comment}</div>
                </div>
              ))}
            </div>
          </div>

          {/* faqs */}
          <div style={{ padding: '20px 24px 8px' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: T.ink, letterSpacing: -0.4, marginBottom: 6 }}>Frequently Asked Questions</div>
            <div style={{ background: '#fff', border: `1px solid ${T.line}`, borderRadius: 13, padding: '2px 16px' }}>
              {p.faqs.map((f, i) => <FaqRow key={i} q={f.q} a={f.a} open={open === i} onToggle={() => setOpen(open === i ? -1 : i)} />)}
            </div>
          </div>

          {/* related */}
          <div style={{ padding: '20px 24px 26px' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: T.ink, letterSpacing: -0.4, marginBottom: 14 }}>Related Products</div>
            <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 6 }}>
              {p.relatedIds.map((id) => <RelatedCard key={id} id={id} />)}
            </div>
          </div>
        </div>
      </Overlay>
    );
  }

  // ── Order tracking modal ──
  function OrderModal() {
    const o = SAMPLE_ORDER;
    const subtotal = o.items.reduce((s, it) => { const p = PRODUCTS.find((x) => x.id === it.id); return s + (p ? p.ugx * it.qty : 0); }, 0);
    const total = subtotal - o.discountUgx + o.delivery;
    const cell = { padding: '12px 14px', fontSize: 13, textAlign: 'left' };
    const th = { ...cell, fontSize: 11.5, fontWeight: 800, color: T.sub, textTransform: 'uppercase', letterSpacing: 0.4, borderBottom: `1px solid ${T.line}`, background: T.surface };
    return (
      <Overlay width={820} onClose={() => ModalStore.close()}>
        <ModalHead title="Track Order" sub={`Order ${o.number}`} onClose={() => ModalStore.close()}>
          {o.status === 'Delivered' ? (
            <button onClick={() => window.printReceipt(window.receiptFromSample(o, AuthStore.get()))}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: 'none', cursor: 'pointer', fontFamily: F, padding: '10px 15px', borderRadius: 10, fontSize: 13.5, fontWeight: 800, background: T.blue, color: '#fff', boxShadow: '0 4px 12px rgba(20,87,230,.28)' }}>
              <Icon name="download" size={16} color="#fff" stroke={2.2} /> Download Receipt
            </button>
          ) : (
            <span style={{ fontSize: 12.5, fontWeight: 700, color: T.sub, background: T.surface, border: `1px solid ${T.line}`, padding: '8px 12px', borderRadius: 10 }}>Receipt available after delivery</span>
          )}
        </ModalHead>
        <div style={{ flex: '1 1 auto', overflowY: 'auto', padding: 24, background: T.surface }}>
          {/* order details table */}
          <div style={{ background: '#fff', border: `1px solid ${T.line}`, borderRadius: 14, overflow: 'hidden', marginBottom: 20 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: F, color: T.ink }}>
              <thead><tr>
                <th style={th}>Order Number</th><th style={th}>Order Placed</th><th style={th}>Order Delivered</th><th style={th}>No. of Items</th><th style={th}>Status</th>
              </tr></thead>
              <tbody><tr>
                <td style={{ ...cell, fontWeight: 800 }}>{o.number}</td>
                <td style={{ ...cell, fontWeight: 600, color: T.sub }}>{o.placed}</td>
                <td style={{ ...cell, fontWeight: 600, color: T.sub }}>{o.delivered}</td>
                <td style={{ ...cell, fontWeight: 700 }}>{o.itemsCount} items</td>
                <td style={cell}><span style={{ fontSize: 12, fontWeight: 800, color: T.green, background: '#E5F4EC', padding: '5px 11px', borderRadius: 999 }}>{o.status}</span></td>
              </tr></tbody>
            </table>
          </div>

          {/* timeline */}
          <div style={{ background: '#fff', border: `1px solid ${T.line}`, borderRadius: 14, padding: '20px 22px', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 20 }}>
              <Icon name="box" size={19} color={T.blue} stroke={1.8} />
              <span style={{ fontSize: 15, fontWeight: 800, color: T.ink }}>Order Tracking</span>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: T.sub, marginLeft: 'auto' }}>Order ID {o.number}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
              <div style={{ position: 'absolute', left: 18, right: 18, top: 14, height: 3, background: T.blue, borderRadius: 999 }} />
              {o.timeline.map((s, i) => (
                <div key={i} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', flex: 1, zIndex: 1 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 999, background: s.done ? T.blue : '#fff', border: `2px solid ${s.done ? T.blue : T.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="check" size={15} color={s.done ? '#fff' : T.line} stroke={2.6} />
                  </div>
                  <div style={{ fontSize: 12.5, fontWeight: 800, color: T.ink, marginTop: 9 }}>{s.step}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: T.sub, marginTop: 3, maxWidth: 110 }}>{s.date}</div>
                </div>
              ))}
            </div>
          </div>

          {/* items + totals */}
          <div style={{ background: '#fff', border: `1px solid ${T.line}`, borderRadius: 14, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: F, color: T.ink }}>
              <thead><tr><th style={th}>Product</th><th style={th}>Size</th><th style={{ ...th, textAlign: 'center' }}>Qty</th><th style={{ ...th, textAlign: 'right' }}>Price</th></tr></thead>
              <tbody>
                {o.items.map((it) => {
                  const p = PRODUCTS.find((x) => x.id === it.id); if (!p) return null;
                  return (
                    <tr key={it.id} style={{ borderBottom: `1px solid ${T.line}` }}>
                      <td style={cell}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 46, height: 46, borderRadius: 10, overflow: 'hidden', border: `1px solid ${T.line}`, flexShrink: 0 }}><ProductShot icon={p.icon} img={p.image} bg={T.surface} tint="#A6B4CC" pad={10} /></div>
                          <div style={{ minWidth: 0 }}><div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.3 }}>{p.name}</div><div style={{ fontSize: 11.5, fontWeight: 700, color: T.sub, marginTop: 2 }}>{p.sku}</div></div>
                        </div>
                      </td>
                      <td style={{ ...cell, fontWeight: 600, color: T.sub }}>{it.size}</td>
                      <td style={{ ...cell, fontWeight: 800, textAlign: 'center' }}>{it.qty}</td>
                      <td style={{ ...cell, textAlign: 'right' }}><AnimatedPrice ugx={p.ugx * it.qty} style={{ fontSize: 13.5, fontWeight: 800 }} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div style={{ padding: '16px 18px', background: T.surface, borderTop: `1px solid ${T.line}` }}>
              {[['Subtotal', subtotal, false], ['Discount', -o.discountUgx, false], ['Delivery', o.delivery, false]].map(([label, val, bold]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: T.sub }}>{label}</span>
                  {label === 'Delivery' && val === 0
                    ? <span style={{ fontSize: 13.5, fontWeight: 800, color: T.green }}>Free</span>
                    : <span style={{ fontSize: 13.5, fontWeight: 800, color: label === 'Discount' ? T.green : T.ink }}>{label === 'Discount' ? '− ' : ''}<AnimatedPrice ugx={Math.abs(val)} style={{ fontSize: 13.5, fontWeight: 800, color: label === 'Discount' ? T.green : T.ink }} /></span>}
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: 10, marginTop: 4, borderTop: `1px solid ${T.line}` }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: T.ink }}>Total</span>
                <AnimatedPrice ugx={total} style={{ fontSize: 22, fontWeight: 800, color: T.ink }} />
              </div>
            </div>
          </div>
        </div>
      </Overlay>
    );
  }

  // ── My Orders modal (customer order history + receipt download) ──
  function MyOrdersModal() {
    const auth = useAuth();
    const user = auth.get();
    const persisted = (window.loadCustomerOrders ? window.loadCustomerOrders(user) : []);
    // A delivered demo order so a receipt can always be previewed/downloaded.
    const sample = window.SAMPLE_ORDER;
    const cell = { padding: '13px 16px', fontSize: 13, textAlign: 'left', verticalAlign: 'middle' };
    const th = { ...cell, fontSize: 11.5, fontWeight: 800, color: T.sub, textTransform: 'uppercase', letterSpacing: 0.4, borderBottom: `1px solid ${T.line}`, background: T.surface };
    const statusColor = { Delivered: T.green, Pending: T.amberInk, Packed: T.blue, Shipped: '#7A5AF8', Cancelled: T.red };
    const ReceiptBtn = ({ delivered, onClick }) => delivered ? (
      <button onClick={onClick} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, border: 'none', cursor: 'pointer', fontFamily: F, padding: '8px 13px', borderRadius: 9, fontSize: 12.5, fontWeight: 800, background: T.blue, color: '#fff' }}>
        <Icon name="download" size={15} color="#fff" stroke={2.2} /> Receipt
      </button>
    ) : (
      <span style={{ fontSize: 11.5, fontWeight: 700, color: T.sub }}>Available after delivery</span>
    );
    const Line = ({ id, date, status, total, onReceipt }) => (
      <tr style={{ borderBottom: `1px solid ${T.line}` }}>
        <td style={{ ...cell, fontWeight: 800 }}>{id}</td>
        <td style={{ ...cell, color: T.sub, fontWeight: 600 }}>{date}</td>
        <td style={cell}><span style={{ fontSize: 11.5, fontWeight: 800, color: statusColor[status] || T.sub, background: (statusColor[status] || T.sub) + '1a', padding: '4px 10px', borderRadius: 999 }}>{status}</span></td>
        <td style={{ ...cell, textAlign: 'right' }}><AnimatedPrice ugx={total} style={{ fontSize: 13.5, fontWeight: 800 }} /></td>
        <td style={{ ...cell, textAlign: 'right' }}><ReceiptBtn delivered={status === 'Delivered'} onClick={onReceipt} /></td>
      </tr>
    );
    return (
      <Overlay width={760} onClose={() => ModalStore.close()}>
        <ModalHead title="My Orders" sub={user ? (user.email || [user.firstName, user.lastName].filter(Boolean).join(' ')) : 'Your order history'} onClose={() => ModalStore.close()} />
        <div style={{ flex: '1 1 auto', overflowY: 'auto', padding: 24, background: T.surface }}>
          <div style={{ background: '#fff', border: `1px solid ${T.line}`, borderRadius: 14, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: F, color: T.ink }}>
              <thead><tr><th style={th}>Order</th><th style={th}>Date</th><th style={th}>Status</th><th style={{ ...th, textAlign: 'right' }}>Total</th><th style={{ ...th, textAlign: 'right' }}>Receipt</th></tr></thead>
              <tbody>
                <Line id={sample.number} date={sample.placed} status={sample.status} total={(sample.items.reduce((s, it) => { const p = PRODUCTS.find((x) => x.id === it.id); return s + (p ? p.ugx * it.qty : 0); }, 0)) - sample.discountUgx + sample.delivery} onReceipt={() => window.printReceipt(window.receiptFromSample(sample, user))} />
                {persisted.map((o) => (
                  <Line key={o.id} id={o.id} date={new Date(o.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} status={o.status} total={o.total} onReceipt={() => window.printReceipt(window.receiptFromOrder(o, user))} />
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: T.sub, marginTop: 14, lineHeight: 1.5 }}>Receipts are available for delivered orders. New orders you place appear here and can be tracked from the desk.</div>
        </div>
      </Overlay>
    );
  }

  // ── Help modal (WhatsApp support) ──
  function HelpModal() {
    const WHATSAPP_NUMBER = '+256764250125'; // configurable support line
    const [msg, setMsg] = React.useState('');
    const openWhatsApp = () => {
      const base = 'https://wa.me/' + WHATSAPP_NUMBER.replace(/[^0-9]/g, '');
      const url = msg.trim() ? base + '?text=' + encodeURIComponent(msg.trim()) : base;
      window.open(url, '_blank', 'noopener');
    };
    const fld = { width: '100%', border: `1.5px solid ${T.line}`, borderRadius: 11, padding: '12px 14px', fontSize: 14, fontFamily: F, color: T.ink, outline: 'none', background: '#fff', boxSizing: 'border-box', resize: 'vertical', lineHeight: 1.5 };
    return (
      <Overlay width={440} onClose={() => ModalStore.close()}>
        <ModalHead title="How can we help you?" sub="We usually reply within minutes" onClose={() => ModalStore.close()} />
        <div style={{ padding: '20px 22px' }}>
          <div style={{ fontSize: 14, color: T.sub, fontWeight: 600, lineHeight: 1.55, marginBottom: 16 }}>Chat with our support team or send us a message.</div>
          <textarea value={msg} onChange={(e) => setMsg(e.target.value)} rows={3} placeholder="Type a quick message (optional)…" style={{ ...fld, marginBottom: 16 }} />
          <button onClick={openWhatsApp}
            style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10, border: 'none', cursor: 'pointer', fontFamily: F, padding: '13px', borderRadius: 12, fontSize: 15, fontWeight: 800, background: '#25D366', color: '#fff', boxShadow: '0 6px 16px rgba(37,211,102,.3)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M17.5 14.4c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.22 3.08.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.13-.27-.2-.57-.35zM12.05 21.5h-.01a9.4 9.4 0 0 1-4.8-1.32l-.34-.2-3.57.94.95-3.48-.22-.36a9.45 9.45 0 0 1-1.45-5.03c0-5.22 4.25-9.47 9.48-9.47 2.53 0 4.91.99 6.7 2.78a9.43 9.43 0 0 1 2.77 6.7c0 5.22-4.25 9.47-9.48 9.47zm8.06-17.53A11.36 11.36 0 0 0 12.04.65C5.76.65.65 5.76.65 12.04c0 2.01.53 3.96 1.52 5.69L.56 23.5l5.9-1.55a11.34 11.34 0 0 0 5.43 1.38h.01c6.28 0 11.39-5.11 11.39-11.39 0-3.04-1.18-5.9-3.34-8.05z"/></svg>
            Chat on WhatsApp
          </button>
        </div>
      </Overlay>
    );
  }

  // ── About Us modal ──
  function AboutModal() {
    const scrollTo = ModalStore.getData()?.scrollTo || null;
    const bodyRef = React.useRef(null);
    const contactRef = React.useRef(null);
    React.useEffect(() => {
      if (scrollTo === 'contact' && bodyRef.current && contactRef.current) {
        bodyRef.current.scrollTop = Math.max(0, contactRef.current.offsetTop - 16);
      }
    }, [scrollTo]);

    const stats = [
      ['clock', '17+', 'Years of experience'],
      ['package', '12,000+', 'Projects delivered'],
      ['user', '8,500+', 'Satisfied clients'],
      ['shield', '24', 'Awards & certifications'],
    ];

    const MailIcon = () => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.blue} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg>
    );
    const PhoneIcon = () => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.blue} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M5 4h4l2 5-3 2a12 12 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" /></svg>
    );
    const contactRows = [
      [<MailIcon key="m" />, 'Email', 'pinnaclepowersystems256@gmail.com', 'mailto:pinnaclepowersystems256@gmail.com'],
      [<PhoneIcon key="p" />, 'Phone', '+256 764 250 125', 'tel:+256764250125'],
      [<Icon key="a" name="pin" size={18} color={T.blue} stroke={1.9} />, 'Visit us', 'Plot 14, Industrial Area, Kampala', null],
    ];

    return (
      <Overlay width={800} onClose={() => ModalStore.close()}>
        <ModalHead title="About Us" sub="Pinnacle Power Systems Ltd" onClose={() => ModalStore.close()} />
        <div ref={bodyRef} style={{ flex: '1 1 auto', overflowY: 'auto', background: T.surface }}>
          {/* hero */}
          <div style={{ position: 'relative', overflow: 'hidden', background: `linear-gradient(115deg, ${T.ink}, #16284A)`, color: '#fff', padding: '34px 32px' }}>
            <div style={{ position: 'absolute', right: -40, top: -50, width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,176,32,.12)' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,176,32,.2)', color: T.amber, fontSize: 11.5, fontWeight: 800, letterSpacing: 0.3, padding: '5px 11px', borderRadius: 999, textTransform: 'uppercase', marginBottom: 16 }}>Authorised distributor · Since 2009</span>
              <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.7, lineHeight: 1.14, maxWidth: 560 }}>Powering Uganda's projects with genuine components.</div>
              <div style={{ fontSize: 15, color: 'rgba(255,255,255,.82)', margin: '14px 0 0', maxWidth: 600, lineHeight: 1.6 }}>Pinnacle Power Systems is Uganda's electrical supply marketplace — stocking authorised ABB, Schneider, Siemens and more for industrial, mechanical and domestic projects. From a single breaker to a full panel build, our engineers and sourcing desk keep your job moving with same-day Kampala dispatch and quotes in UGX, USD or EUR.</div>
            </div>
          </div>

          {/* stats */}
          <div style={{ padding: '22px 24px 6px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            {stats.map(([ic, num, label]) => (
              <div key={label} style={{ background: '#fff', border: `1px solid ${T.line}`, borderRadius: 14, padding: '18px 16px' }}>
                <div style={{ width: 42, height: 42, borderRadius: 11, background: T.chip, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}><Icon name={ic} size={22} color={T.blue} stroke={1.8} /></div>
                <div style={{ fontSize: 26, fontWeight: 800, color: T.ink, letterSpacing: -0.6, fontVariantNumeric: 'tabular-nums' }}>{num}</div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: T.sub, marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>

          {/* contact */}
          <div ref={contactRef} style={{ padding: '20px 24px 26px' }}>
            <div style={{ background: '#fff', border: `1px solid ${T.line}`, borderRadius: 14, padding: '20px 22px' }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: T.ink, letterSpacing: -0.3, marginBottom: 4 }}>Get in touch</div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: T.sub, marginBottom: 18 }}>Our team is available Mon–Sat. We usually reply within minutes.</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                {contactRows.map(([icon, label, value, href]) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, border: `1px solid ${T.line}`, borderRadius: 12, padding: '14px 15px', background: T.surface }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: '#fff', border: `1px solid ${T.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 11.5, fontWeight: 800, color: T.sub, textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</div>
                      {href
                        ? <a href={href} style={{ fontSize: 13.5, fontWeight: 700, color: T.ink, textDecoration: 'none', lineHeight: 1.4, display: 'block', marginTop: 3, wordBreak: 'break-word' }}>{value}</a>
                        : <div style={{ fontSize: 13.5, fontWeight: 700, color: T.ink, lineHeight: 1.4, marginTop: 3 }}>{value}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div style={{ flex: '0 0 auto', borderTop: `1px solid ${T.line}`, padding: '16px 22px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 13.5, fontWeight: 700, color: T.sub, flex: 1 }}>Questions about an order or a quote?</span>
          <button onClick={() => ModalStore.open('catalogue')} style={{ border: `1.5px solid ${T.line}`, background: '#fff', color: T.ink, padding: '12px 18px', borderRadius: 11, fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: F }}>Browse catalogue</button>
          <button onClick={() => ModalStore.open('help')} style={{ border: 'none', background: T.blue, color: '#fff', padding: '12px 20px', borderRadius: 11, fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: F, display: 'inline-flex', alignItems: 'center', gap: 8, boxShadow: '0 6px 16px rgba(20,87,230,.3)' }}>Contact us <Icon name="arrowRight" size={16} color="#fff" /></button>
        </div>
      </Overlay>
    );
  }

  // ── Toast host ──
  function ToastHost() {
    const list = useToasts();
    return (
      <div style={{ position: 'fixed', right: 20, bottom: 20, zIndex: 1100, display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end', pointerEvents: 'none' }}>
        {list.map((t) => (
          <div key={t.id} style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'flex-start', gap: 12, width: 330, background: '#fff', border: `1px solid ${T.line}`, borderLeft: `4px solid ${tone[t.tone]}`, borderRadius: 12, padding: '13px 14px', boxShadow: '0 12px 32px rgba(11,26,51,.18)', fontFamily: F, animation: 'ppsToast .26s cubic-bezier(.2,.9,.3,1.1)' }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, background: tone[t.tone] + '1f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={t.icon} size={17} color={tone[t.tone]} stroke={2.2} /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              {t.title && <div style={{ fontSize: 13.5, fontWeight: 800, color: T.ink }}>{t.title}</div>}
              <div style={{ fontSize: 12.5, fontWeight: 600, color: T.sub, lineHeight: 1.4, marginTop: t.title ? 2 : 0 }}>{t.msg}</div>
            </div>
            <button onClick={() => ToastStore.dismiss(t.id)} style={{ border: 'none', background: 'none', color: T.sub, cursor: 'pointer', padding: 2, display: 'flex', flexShrink: 0 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg></button>
          </div>
        ))}
      </div>
    );
  }

  // ── Terms & Conditions modal ──
  const TERMS = [
    { h: '1. Introduction', b: ['Welcome to Pinnacle Power Systems. These Terms and Conditions govern your use of our website and the purchase of products from our online store. By using our website and placing an order, you agree to be bound by these terms.'] },
    { h: '2. Definitions', b: ['"Company", "We", "Us", "Our" — refers to Pinnacle Power Systems.', '"Customer", "You", "Your" — refers to the user of our website and purchaser of goods.', '"Goods" — refers to the products advertised on our website.', '"Website" — refers to the Pinnacle Power Systems online store.'] },
    { h: '3. Eligibility', b: ['By using our website and placing an order, you confirm that you are at least 18 years old and legally capable of entering into binding contracts.'] },
    { h: '4. Account Registration', b: ['You may be required to create an account to place orders.', 'You are responsible for maintaining the confidentiality of your account credentials.', 'You agree to provide accurate, complete, and up-to-date information.', 'We reserve the right to suspend or terminate accounts that violate these terms.'] },
    { h: '5. Orders and Pricing', b: ['All orders are subject to acceptance and availability.', 'Prices are listed in the currency selected at checkout and are inclusive of applicable taxes unless stated otherwise.', 'We reserve the right to modify prices at any time without prior notice.', 'Once an order is placed, you will receive an order confirmation via email.', 'We reserve the right to cancel or refuse any order at our discretion.'] },
    { h: '6. Payment Terms', b: ['We accept payments via MoMo, credit/debit cards, and trade terms as displayed on our website.', 'Payment must be made in full before goods are dispatched.', 'You agree to provide valid payment details and authorize us to charge the total order amount.'] },
    { h: '7. Shipping and Delivery', b: ['Delivery timelines will be confirmed upon order placement.', 'We ship to the address provided by you during checkout.', 'Risk of loss or damage to goods passes to you upon delivery.', 'We are not liable for delays caused by circumstances beyond our reasonable control.'] },
    { h: '8. Returns and Refunds', b: ['If you are not satisfied with your purchase, please contact us within 14 days of receipt.', 'Goods must be returned in their original condition and packaging.', 'Refunds will be processed using the original payment method.', 'Custom or special-order items may not be eligible for return.'] },
    { h: '9. Intellectual Property', b: ['All content on our website, including logos, text, images, and designs, is the property of Pinnacle Power Systems.', 'You may not reproduce, distribute, or use any content without our prior written consent.'] },
    { h: '10. User Conduct', b: ['You agree to use our website for lawful purposes only.', 'You shall not upload or transmit viruses or malicious code; engage in fraudulent or deceptive activities; attempt to gain unauthorized access to our systems; or harass, abuse, or harm others.'] },
    { h: '11. Limitation of Liability', b: ['To the fullest extent permitted by law, we shall not be liable for any indirect, incidental, or consequential damages.', 'Our total liability for any claim arising from your use of our website or purchase of goods shall not exceed the total amount paid by you for the goods.'] },
    { h: '12. Disclaimer of Warranties', b: ['Our goods are provided "as is" without warranties of any kind, either express or implied.', 'We do not warrant that our website will be uninterrupted or error-free.'] },
    { h: '13. Governing Law', b: ['These terms shall be governed by and construed in accordance with the laws of Uganda.', 'Any disputes arising from these terms shall be subject to the exclusive jurisdiction of the courts of Uganda.'] },
    { h: '14. Changes to Terms', b: ['We reserve the right to update these Terms and Conditions at any time.', 'Changes will be effective immediately upon posting on our website.', 'Your continued use of our website constitutes acceptance of the updated terms.'] },
    { h: '15. Privacy Policy', b: ['Your privacy is important to us. Please review our Privacy Policy, which explains how we collect, use, and protect your personal information.', 'By using our website, you consent to the collection and use of your data as described in our Privacy Policy.'] },
    { h: '16. Contact Information', b: ['If you have any questions about these Terms and Conditions, please contact us at:', 'Email: pinnaclepowersystems256@gmail.com', 'Phone/WhatsApp: +256764250125'] },
  ];
  function TermsModal() {
    return (
      <Overlay width={800} onClose={() => ModalStore.close()}>
        <ModalHead title="Terms & Conditions" sub="Pinnacle Power Systems · Last updated June 2026" onClose={() => ModalStore.close()} />
        <div className="terms-content" style={{ flex: '1 1 auto', overflowY: 'auto', padding: '24px 28px 28px', background: T.surface }}>
          <p style={{ margin: '0 0 22px', fontWeight: 700 }}>Welcome to Pinnacle Power Systems. Please read these Terms &amp; Conditions carefully before using our website or placing an order.</p>
          {TERMS.map((s) => (
            <div key={s.h} style={{ marginBottom: 22 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: T.ink, marginBottom: 8 }}>{s.h}</div>
              {s.b.map((p, i) => (
                <p key={i} style={{ margin: '0 0 8px' }}>{p}</p>
              ))}
            </div>
          ))}
        </div>
        <div style={{ flex: '0 0 auto', borderTop: `1px solid ${T.line}`, padding: '16px 22px', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={() => ModalStore.close()} style={{ border: 'none', background: T.blue, color: '#fff', padding: '12px 24px', borderRadius: 11, fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: F }}>Close</button>
        </div>
      </Overlay>
    );
  }

  // ── Checkout: Confirm Order → MTN MoMo USSD simulation ──
  // Opened from the cart. Step 1 confirms the order + fees + payment method;
  // step 2 simulates the MTN Mobile Money USSD prompt; on success the order is
  // persisted to pps_orders (status Pending) and the cart is cleared.
  const ugxFmt = (n) => 'USh ' + Math.round(n || 0).toLocaleString('en-US');
  const MERCHANT = 'Pinnacle Power Systems';
  const MOMO_NUMBER = '+256764250125';

  // ── Delivery-area + WhatsApp helpers (Kampala vs outside) ──
  const KAMPALA_DELIVERY_FEE = 5000;
  const WA_NUMBER = '256764250125';
  const WA_DEFAULT_TEXT = 'Hello, I need delivery for my order outside Kampala.';
  const waUrl = (msg) => 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(msg || WA_DEFAULT_TEXT);
  // Simple, case-insensitive check for "Kampala" anywhere in the address.
  const detectDeliveryArea = (addr) => (/kampala/i.test(String(addr || '')) ? 'kampala' : 'outside');
  // Session only carries name/email — pull the full address from the client registry.
  const resolveClientAddress = (user) => {
    if (!user) return '';
    const c = ClientStore.findByEmail(user.email);
    return (c && c.address) || (user && user.address) || '';
  };
  const WhatsAppButton = ({ msg, label, full }) => (
    <a href={waUrl(msg)} target="_blank" rel="noopener noreferrer"
      style={{ display: full ? 'flex' : 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, textDecoration: 'none', background: '#25D366', color: '#fff', padding: '11px 16px', borderRadius: 11, fontSize: 13.5, fontWeight: 800, fontFamily: F, boxShadow: '0 4px 12px rgba(37,211,102,.3)' }}>
      <svg width="17" height="17" viewBox="0 0 24 24" fill="#fff" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.004c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 1.81c2.16 0 4.19.84 5.72 2.37a8.06 8.06 0 0 1 2.37 5.72c0 4.46-3.63 8.09-8.1 8.09a8.1 8.1 0 0 1-4.13-1.13l-.3-.18-3.12.82.83-3.04-.19-.31a8.04 8.04 0 0 1-1.24-4.3c0-4.46 3.63-8.1 8.1-8.1Zm-2.27 4.34c-.21 0-.55.08-.84.39-.29.31-1.1 1.08-1.1 2.62 0 1.55 1.13 3.04 1.28 3.25.16.21 2.2 3.36 5.34 4.58 2.61 1.03 3.14.82 3.71.77.57-.05 1.84-.75 2.1-1.48.26-.73.26-1.35.18-1.48-.08-.13-.29-.21-.6-.37-.31-.16-1.84-.91-2.13-1.01-.29-.11-.5-.16-.71.16-.21.31-.81 1.01-1 1.22-.18.21-.37.24-.68.08-.31-.16-1.31-.48-2.5-1.54-.92-.82-1.55-1.84-1.73-2.15-.18-.31-.02-.48.14-.63.14-.14.31-.37.47-.55.16-.18.21-.31.31-.52.11-.21.05-.39-.03-.55-.08-.16-.69-1.71-.95-2.34-.25-.61-.5-.53-.69-.54l-.59-.01Z" /></svg>
      {label || 'Chat on WhatsApp'}
    </a>
  );

  function CheckoutModal() {
    const cart = useCart();
    const rows = cart.get();
    const subtotal = cart.subtotal();
    const importFees = cart.importFees();
    // Delivery fee is now location-based: charged for Kampala, arranged for outside.
    const address = resolveClientAddress(AuthStore.get());
    const deliveryArea = detectDeliveryArea(address);
    const hasAddress = !!String(address || '').trim();
    const deliveryFee = deliveryArea === 'kampala' ? KAMPALA_DELIVERY_FEE : 0;
    const grandTotal = subtotal + importFees + deliveryFee;
    const [phase, setPhase] = React.useState('confirm'); // confirm | paying | success | failed
    const [amount, setAmount] = React.useState(grandTotal);
    const [orderId, setOrderId] = React.useState(null);

    const finalize = () => {
      const items = cart.get().map((r) => ({ id: r.id, qty: r.qty }));
      const order = window.placeCustomerOrder
        ? window.placeCustomerOrder({ user: AuthStore.get(), items, payment: 'MTN MoMo', importFees: cart.importFees(), transportFee: deliveryFee, deliveryArea, deliveryAddress: address })
        : null;
      setOrderId(order ? order.id : null);
      // Notify the admin inbox of the new order (non-blocking).
      if (order) {
        const itemsSummary = (order.items || []).map((it) => `${it.qty}× ${it.name}`).join(', ');
        notifyAdmin(EMAILJS_ORDER_TEMPLATE_ID, {
          subject: 'New order ' + order.id,
          order_id: order.id,
          client_name: order.clientName || order.customerName || 'Customer',
          client_email: order.customerEmail || '',
          total: ugxFmt(order.total),
          items_summary: itemsSummary,
          payment: order.payment || 'MTN MoMo',
          delivery_address: order.address || '',
        });
      }
      cart.clear();
      setPhase('success');
      ToastStore.push('Payment submitted — our team will verify it shortly.', { title: 'Payment submitted', icon: 'check', tone: 'ok' });
    };

    React.useEffect(() => {
      if (phase !== 'paying') return;
      const t = setTimeout(finalize, 3000); // simulate USSD round-trip; demo assumes success
      return () => clearTimeout(t);
    }, [phase]);

    const startPay = () => {
      if (rows.length === 0) { ToastStore.push('Your cart is empty.', { title: 'Nothing to pay for', icon: 'cart', tone: 'warn' }); return; }
      setAmount(grandTotal);
      setPhase('paying');
    };

    const lblRow = (label, node, opts = {}) => (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: opts.last ? 0 : 8 }}>
        <span style={{ fontSize: 13.5, fontWeight: opts.bold ? 800 : 700, color: opts.bold ? T.ink : T.sub }}>{label}</span>
        {node}
      </div>
    );

    // ── Step: Confirm order ──
    if (phase === 'confirm') {
      return (
        <Overlay width={560} onClose={() => ModalStore.close()}>
          <ModalHead title="Confirm your order" sub={`${cart.count()} item${cart.count() === 1 ? '' : 's'} · review before paying`} onClose={() => ModalStore.close()} />
          <div style={{ flex: '1 1 auto', overflowY: 'auto', padding: '18px 22px' }}>
            {rows.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 10px', color: T.sub, fontWeight: 700 }}>Your cart is empty.</div>
            ) : (
              <React.Fragment>
                <div style={{ border: `1px solid ${T.line}`, borderRadius: 14, overflow: 'hidden', marginBottom: 18 }}>
                  {rows.map((r, idx) => {
                    const p = PRODUCTS.find((x) => x.id === r.id); if (!p) return null;
                    const fee = p.imported === true ? (Number(p.import_fee) || 0) : 0;
                    return (
                      <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderBottom: idx === rows.length - 1 ? 'none' : `1px solid ${T.lineSoft || T.line}` }}>
                        <div style={{ width: 46, height: 46, borderRadius: 10, overflow: 'hidden', border: `1px solid ${T.line}`, flexShrink: 0 }}><ProductShot icon={p.icon} img={p.image} bg={T.surface} tint="#A6B4CC" pad={10} /></div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.3 }}>{p.name}</div>
                          <div style={{ fontSize: 11.5, fontWeight: 600, color: T.sub, marginTop: 2 }}>
                            <AnimatedPrice ugx={p.ugx} style={{ fontSize: 11.5 }} /> × {r.qty}
                            {fee > 0 && <span style={{ color: T.amberInk }}> · +<AnimatedPrice ugx={fee} style={{ fontSize: 11.5, color: T.amberInk }} /> import/unit</span>}
                          </div>
                        </div>
                        <AnimatedPrice ugx={p.ugx * r.qty} style={{ fontSize: 13.5, fontWeight: 800, color: T.ink }} />
                      </div>
                    );
                  })}
                </div>

                <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: 14, padding: '14px 16px', marginBottom: 16 }}>
                  {lblRow('Subtotal', <AnimatedPrice ugx={subtotal} style={{ fontSize: 14, fontWeight: 800, color: T.ink }} />)}
                  {importFees > 0 && lblRow('Import fees', <AnimatedPrice ugx={importFees} style={{ fontSize: 14, fontWeight: 800, color: T.ink }} />)}
                  {deliveryArea === 'kampala'
                    ? lblRow('Delivery Fee', <AnimatedPrice ugx={deliveryFee} style={{ fontSize: 14, fontWeight: 800, color: T.ink }} />)
                    : lblRow('Delivery', <span style={{ fontSize: 13.5, fontWeight: 800, color: T.amberInk }}>To be arranged</span>)}
                  <div style={{ borderTop: `1px solid ${T.line}`, margin: '12px 0 0', paddingTop: 12 }}>
                    {lblRow('Grand total', <AnimatedPrice ugx={grandTotal} style={{ fontSize: 20, fontWeight: 800, color: T.ink }} />, { bold: true, last: true })}
                  </div>
                </div>

                {deliveryArea === 'outside' && (
                  <div style={{ border: `1.5px solid ${T.amber}`, background: '#FFF8EC', borderRadius: 14, padding: '15px 16px', marginBottom: 16 }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 12 }}>
                      <Icon name="truck" size={19} color={T.amberInk} stroke={1.9} />
                      <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, lineHeight: 1.55 }}>
                        {hasAddress
                          ? 'Delivery outside Kampala requires custom arrangements. Please contact us via WhatsApp to arrange delivery. A delivery fee will be quoted based on your location.'
                          : 'We couldn\u2019t find a delivery address on your profile. Please contact us via WhatsApp to arrange delivery, or add your address in your profile. A delivery fee will be quoted based on your location.'}
                      </div>
                    </div>
                    <WhatsAppButton full label="Chat on WhatsApp to arrange delivery" />
                  </div>
                )}

                <div style={{ fontSize: 12, fontWeight: 800, color: T.sub, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>Payment method</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, border: `1.5px solid ${T.blue}`, background: T.chip, borderRadius: 12, padding: '13px 15px' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: '#FFCC00', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 11, fontWeight: 800, color: '#0B1A33' }}>MTN</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: T.ink }}>MTN Mobile Money</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: T.sub }}>You will receive a USSD prompt on your registered phone number.</div>
                  </div>
                  <Icon name="check" size={20} color={T.blue} stroke={2.4} />
                </div>
              </React.Fragment>
            )}
          </div>
          <div style={{ flex: '0 0 auto', borderTop: `1px solid ${T.line}`, padding: '16px 22px', display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button onClick={() => ModalStore.open('cart')} style={{ border: `1.5px solid ${T.line}`, background: '#fff', color: T.ink, padding: '12px 20px', borderRadius: 11, fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: F }}>Back to cart</button>
            <button onClick={startPay} disabled={rows.length === 0} style={{ border: 'none', background: rows.length === 0 ? T.line : T.blue, color: '#fff', padding: '12px 22px', borderRadius: 11, fontSize: 14, fontWeight: 800, cursor: rows.length === 0 ? 'default' : 'pointer', fontFamily: F, display: 'inline-flex', alignItems: 'center', gap: 8, boxShadow: rows.length === 0 ? 'none' : '0 6px 16px rgba(20,87,230,.3)' }}>
              Confirm &amp; Pay · {ugxFmt(grandTotal)}</button>
          </div>
        </Overlay>
      );
    }

    // ── Step: USSD payment simulation ──
    if (phase === 'paying') {
      return (
        <Overlay width={440} onClose={() => ModalStore.close()}>
          <ModalHead title="MTN Mobile Money" sub="Authorise the payment on your phone" onClose={() => ModalStore.close()} />
          <div style={{ padding: '24px 22px 28px' }}>
            <div style={{ border: `1px solid ${T.line}`, borderRadius: 16, overflow: 'hidden', marginBottom: 20 }}>
              <div style={{ background: '#FFCC00', color: '#0B1A33', padding: '12px 16px', fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>MTN MoMo</span><span style={{ fontVariantNumeric: 'tabular-nums' }}>*165#</span>
              </div>
              <div style={{ padding: '16px 18px' }}>
                {[['Merchant', MERCHANT], ['Amount', ugxFmt(amount)], ['Fees', 'USh 0']].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${T.lineSoft || T.line}` }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: T.sub }}>{k}</span>
                    <span style={{ fontSize: 13.5, fontWeight: 800, color: T.ink, fontVariantNumeric: 'tabular-nums' }}>{v}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0 0' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: T.sub }}>Pay to</span>
                  <span style={{ fontSize: 13.5, fontWeight: 800, color: T.ink, fontVariantNumeric: 'tabular-nums' }}>{MOMO_NUMBER}</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center', marginBottom: 14 }}>
              <span style={{ width: 22, height: 22, borderRadius: 999, border: `3px solid ${T.chip}`, borderTopColor: T.blue, display: 'inline-block', animation: 'ppsSpin .8s linear infinite' }} />
              <span style={{ fontSize: 14, fontWeight: 800, color: T.ink }}>Waiting for authorisation…</span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.sub, textAlign: 'center', lineHeight: 1.55 }}>You will receive a USSD prompt on your phone. Please enter your PIN to authorize the payment.</div>
          </div>
        </Overlay>
      );
    }

    // ── Step: Success ──
    return (
      <Overlay width={440} onClose={() => ModalStore.close()}>
        <ModalHead title="Order received" sub="Thank you for your purchase" onClose={() => ModalStore.close()} />
        <div style={{ padding: '30px 24px 26px', textAlign: 'center' }}>
          <div style={{ width: 68, height: 68, borderRadius: 999, background: T.green + '1f', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Icon name="check" size={34} color={T.green} stroke={2.6} /></div>
          <div style={{ fontSize: 19, fontWeight: 800, color: T.ink }}>Payment submitted</div>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: T.sub, margin: '8px 0 4px', lineHeight: 1.55 }}>
            Your payment of <strong style={{ color: T.ink }}>{ugxFmt(amount)}</strong> via MTN Mobile Money was submitted.</div>
          {orderId && <div style={{ fontSize: 13.5, fontWeight: 800, color: T.blue, fontVariantNumeric: 'tabular-nums', marginBottom: 4 }}>Order {orderId}</div>}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12.5, fontWeight: 800, color: T.amberInk, background: '#FFF4DC', padding: '7px 13px', borderRadius: 999, margin: '6px 0 10px' }}>
            <Icon name="shield" size={15} color={T.amberInk} stroke={2.2} /> Awaiting verification by our team</div>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: T.sub, lineHeight: 1.55, margin: '0 0 4px' }}>
            Your order will show <strong style={{ color: T.ink }}>Pending</strong> until an administrator confirms the payment.</div>
          {deliveryArea === 'outside' && (
            <div style={{ border: `1.5px solid ${T.amber}`, background: '#FFF8EC', borderRadius: 12, padding: '12px 14px', margin: '6px 0 16px', textAlign: 'left' }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: T.ink, lineHeight: 1.5, marginBottom: 10 }}>Your delivery is outside Kampala and will be arranged separately. Contact us on WhatsApp so we can quote and schedule delivery.</div>
              <WhatsAppButton full label="Arrange delivery on WhatsApp" />
            </div>
          )}
          <div style={{ fontSize: 13, fontWeight: 600, color: T.sub, marginBottom: 22 }}>We'll notify you as your order moves through each stage.</div>
          <button onClick={() => ModalStore.open('trackOrders')} style={{ width: '100%', border: 'none', background: T.blue, color: '#fff', padding: '13px', borderRadius: 11, fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: F, marginBottom: 10, boxShadow: '0 6px 16px rgba(20,87,230,.3)' }}>Track my order</button>
          <button onClick={() => ModalStore.close()} style={{ width: '100%', border: `1.5px solid ${T.line}`, background: '#fff', color: T.ink, padding: '13px', borderRadius: 11, fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: F }}>Done</button>
        </div>
      </Overlay>
    );
  }

  // ── Track Order modal (customer): lists the signed-in client's orders and,
  // on selection, shows the order detail + actual stage transition dates +
  // receipt download. A single order opens straight into the detail view. ──
  const TRACK_STAGES = ['Order Placed', 'Order Packed', 'In Transit', 'Out for Delivery'];
  const STATUS_RANK = { Pending: 0, 'Order Placed': 0, Packed: 1, 'Order Packed': 1, Shipped: 2, 'In Transit': 2, 'Out for Delivery': 3, Delivered: 4, Cancelled: -1 };
  const fmtStamp = (v) => {
    if (!v) return '';
    const d = new Date(v);
    if (isNaN(d)) return String(v);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ' · ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };
  const fmtDay = (v) => { const d = new Date(v); return isNaN(d) ? String(v) : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); };
  const trackStatusColor = { Delivered: T.green, Pending: T.amberInk, Packed: T.blue, Shipped: T.purple || '#7A5AF8', 'In Transit': T.teal || '#0EA5A3', 'Out for Delivery': '#7A5AF8', Cancelled: T.red };

  function TrackOrderModal() {
    const auth = useAuth();
    const user = auth.get();
    const persisted = window.loadCustomerOrders ? window.loadCustomerOrders(user) : [];
    const sample = window.SAMPLE_ORDER;
    const sampleTotal = sample.items.reduce((s, it) => { const p = PRODUCTS.find((x) => x.id === it.id); return s + (p ? p.ugx * it.qty : 0); }, 0) - sample.discountUgx + sample.delivery;
    const sampleNorm = {
      id: sample.number, date: sample.placed, status: sample.status, total: sampleTotal,
      timeline: sample.timeline.map((s) => ({ stage: s.step, date: s.date })),
      kind: 'sample', raw: sample,
    };
    const orderNorm = persisted.map((o) => ({
      id: o.id, date: o.date, status: o.status, total: o.total,
      timeline: o.timeline && o.timeline.length ? o.timeline : [{ stage: 'Order Placed', date: o.date }],
      kind: 'order', raw: o,
    }));
    const all = [...orderNorm, sampleNorm];
    const [selId, setSelId] = React.useState(all.length === 1 ? all[0].id : null);
    const fromList = all.length > 1;
    const sel = all.find((x) => x.id === selId) || null;

    const cell = { padding: '12px 14px', fontSize: 13, textAlign: 'left' };
    const th = { ...cell, fontSize: 11.5, fontWeight: 800, color: T.sub, textTransform: 'uppercase', letterSpacing: 0.4, borderBottom: `1px solid ${T.line}`, background: T.surface };

    // ── List view (multiple orders) ──
    if (!sel) {
      return (
        <Overlay width={760} onClose={() => ModalStore.close()}>
          <ModalHead title="Track Order" sub={`${all.length} order${all.length === 1 ? '' : 's'} · select one to view details`} onClose={() => ModalStore.close()} />
          <div style={{ flex: '1 1 auto', overflowY: 'auto', padding: 24, background: T.surface }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {all.map((o) => (
                <div key={o.id} onClick={() => setSelId(o.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 16, background: '#fff', border: `1px solid ${T.line}`, borderRadius: 14, padding: '16px 18px', cursor: 'pointer' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 11, background: T.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="box" size={22} color={T.blue} stroke={1.8} /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 800, color: T.ink, fontVariantNumeric: 'tabular-nums' }}>{o.id}</div>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: T.sub, marginTop: 2 }}>{fmtDay(o.date)}</div>
                  </div>
                  <span style={{ fontSize: 11.5, fontWeight: 800, color: trackStatusColor[o.status] || T.sub, background: (trackStatusColor[o.status] || T.sub) + '1a', padding: '5px 11px', borderRadius: 999 }}>{o.status}</span>
                  <AnimatedPrice ugx={o.total} style={{ fontSize: 15, fontWeight: 800, color: T.ink }} />
                  <Icon name="arrowRight" size={18} color={T.sub} />
                </div>
              ))}
            </div>
          </div>
        </Overlay>
      );
    }

    // ── Detail view ──
    const rank = STATUS_RANK[sel.status] != null ? STATUS_RANK[sel.status] : 0;
    const cancelled = sel.status === 'Cancelled';
    const dateForStage = (stage, idx) => {
      const t = sel.timeline.find((e) => e.stage === stage);
      if (t) return fmtStamp(t.date);
      if (idx === 0) return fmtDay(sel.date); // fall back to order date for "Order Placed"
      return '';
    };
    const itemRows = sel.kind === 'sample'
      ? sample.items.map((it) => { const p = PRODUCTS.find((x) => x.id === it.id) || {}; return { name: p.name || it.id, sku: p.sku || '', qty: it.qty, price: p.ugx || 0, size: it.size, import_fee: p.imported === true ? (Number(p.import_fee) || 0) : 0, imported: p.imported === true }; })
      : (sel.raw.items || []).map((it) => ({ name: it.name, sku: it.sku, qty: it.qty, price: it.price, import_fee: Number(it.import_fee) || 0, imported: it.imported === true }));
    const subtotal = itemRows.reduce((s, it) => s + it.price * it.qty, 0);
    const importFees = sel.kind === 'order' ? ((sel.raw.totals && sel.raw.totals.importFees) || sel.raw.importFees || 0) : 0;
    const deliveryArea = sel.kind === 'order'
      ? (sel.raw.deliveryArea || (sel.raw.totals && sel.raw.totals.deliveryArea) || detectDeliveryArea(sel.raw.address))
      : (sample.deliveryArea || 'kampala');
    const deliveryFee = sel.kind === 'order'
      ? ((sel.raw.totals && sel.raw.totals.deliveryFee != null) ? sel.raw.totals.deliveryFee
          : (sel.raw.deliveryFee != null ? sel.raw.deliveryFee : (sel.raw.transportFee || 0)))
      : (sample.delivery || 0);
    const discount = sel.kind === 'sample' ? (sample.discountUgx || 0) : 0;
    const delivered = sel.status === 'Delivered';
    const downloadReceipt = () => {
      if (sel.kind === 'sample') window.printReceipt(window.receiptFromSample(sample, user));
      else window.printReceipt(window.receiptFromOrder(sel.raw, user));
    };

    return (
      <Overlay width={820} onClose={() => ModalStore.close()}>
        <ModalHead title="Track Order" sub={`Order ${sel.id}`} onClose={() => ModalStore.close()}>
          {delivered ? (
            <button onClick={downloadReceipt}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: 'none', cursor: 'pointer', fontFamily: F, padding: '10px 15px', borderRadius: 10, fontSize: 13.5, fontWeight: 800, background: T.blue, color: '#fff', boxShadow: '0 4px 12px rgba(20,87,230,.28)' }}>
              <Icon name="download" size={16} color="#fff" stroke={2.2} /> Download Receipt
            </button>
          ) : (
            <span style={{ fontSize: 12.5, fontWeight: 700, color: T.sub, background: T.surface, border: `1px solid ${T.line}`, padding: '8px 12px', borderRadius: 10 }}>Receipt available after delivery</span>
          )}
        </ModalHead>
        <div style={{ flex: '1 1 auto', overflowY: 'auto', padding: 24, background: T.surface }}>
          {fromList && (
            <button onClick={() => setSelId(null)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: 'none', background: 'none', color: T.blue, fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: F, marginBottom: 14, padding: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg> All orders
            </button>
          )}

          {/* summary */}
          <div style={{ background: '#fff', border: `1px solid ${T.line}`, borderRadius: 14, overflow: 'hidden', marginBottom: 20 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: F, color: T.ink }}>
              <thead><tr><th style={th}>Order Number</th><th style={th}>Order Placed</th><th style={th}>No. of Items</th><th style={th}>Status</th>{sel.kind === 'order' && sel.raw.paymentStatus ? <th style={th}>Payment</th> : null}</tr></thead>
              <tbody><tr>
                <td style={{ ...cell, fontWeight: 800 }}>{sel.id}</td>
                <td style={{ ...cell, fontWeight: 600, color: T.sub }}>{fmtDay(sel.date)}</td>
                <td style={{ ...cell, fontWeight: 700 }}>{itemRows.reduce((s, it) => s + it.qty, 0)} items</td>
                <td style={cell}><span style={{ fontSize: 12, fontWeight: 800, color: trackStatusColor[sel.status] || T.sub, background: (trackStatusColor[sel.status] || T.sub) + '1a', padding: '5px 11px', borderRadius: 999 }}>{sel.status}</span></td>
                {sel.kind === 'order' && sel.raw.paymentStatus ? (
                  <td style={cell}><span style={{ fontSize: 12, fontWeight: 800, color: sel.raw.paymentStatus === 'Verified' ? T.green : T.amberInk, background: (sel.raw.paymentStatus === 'Verified' ? T.green : '#D9A419') + '1a', padding: '5px 11px', borderRadius: 999, whiteSpace: 'nowrap' }}>{sel.raw.paymentStatus === 'Verified' ? 'Verified' : 'Awaiting verification'}</span></td>
                ) : null}
              </tr></tbody>
            </table>
          </div>

          {/* timeline — actual transition dates */}
          <div style={{ background: '#fff', border: `1px solid ${T.line}`, borderRadius: 14, padding: '20px 22px', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 20 }}>
              <Icon name="box" size={19} color={T.blue} stroke={1.8} />
              <span style={{ fontSize: 15, fontWeight: 800, color: T.ink }}>Order Tracking</span>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: T.sub, marginLeft: 'auto' }}>Order ID {sel.id}</span>
            </div>
            {cancelled ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: '#FDECEC', borderRadius: 12, color: T.red, fontWeight: 800, fontSize: 13.5 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg> This order was cancelled.
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
                <div style={{ position: 'absolute', left: 18, right: 18, top: 14, height: 3, background: T.line, borderRadius: 999 }} />
                <div style={{ position: 'absolute', left: 18, top: 14, height: 3, width: `${rank <= 0 ? 0 : Math.min(rank, 3) / 3 * 100}%`, maxWidth: 'calc(100% - 36px)', background: T.blue, borderRadius: 999 }} />
                {TRACK_STAGES.map((stage, i) => {
                  const done = rank >= i;
                  const stamp = dateForStage(stage, i);
                  return (
                    <div key={stage} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', flex: 1, zIndex: 1 }}>
                      <div style={{ width: 30, height: 30, borderRadius: 999, background: done ? T.blue : '#fff', border: `2px solid ${done ? T.blue : T.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon name="check" size={15} color={done ? '#fff' : T.line} stroke={2.6} />
                      </div>
                      <div style={{ fontSize: 12.5, fontWeight: 800, color: done ? T.ink : T.sub, marginTop: 9 }}>{stage}</div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: T.sub, marginTop: 3, maxWidth: 120 }}>{done ? (stamp || '—') : 'Pending'}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* items + totals */}
          <div style={{ background: '#fff', border: `1px solid ${T.line}`, borderRadius: 14, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: F, color: T.ink }}>
              <thead><tr><th style={th}>Product</th><th style={{ ...th, textAlign: 'center' }}>Qty</th><th style={{ ...th, textAlign: 'right' }}>Price</th></tr></thead>
              <tbody>
                {itemRows.map((it, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.line}` }}>
                    <td style={cell}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.3 }}>{it.name}</div>
                        <div style={{ fontSize: 11.5, fontWeight: 700, color: T.sub, marginTop: 2 }}>{it.sku}</div>
                        {it.imported && it.import_fee > 0 && (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 800, color: T.amberInk, background: '#FFF4DC', padding: '2px 8px', borderRadius: 6, marginTop: 5 }}>
                            Import Fee: <AnimatedPrice ugx={it.import_fee} style={{ fontSize: 11, fontWeight: 800, color: T.amberInk }} /> /unit
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{ ...cell, fontWeight: 800, textAlign: 'center' }}>{it.qty}</td>
                    <td style={{ ...cell, textAlign: 'right' }}><AnimatedPrice ugx={it.price * it.qty} style={{ fontSize: 13.5, fontWeight: 800 }} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ padding: '16px 18px', background: T.surface, borderTop: `1px solid ${T.line}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: T.sub }}>Subtotal</span>
                <AnimatedPrice ugx={subtotal} style={{ fontSize: 13.5, fontWeight: 800, color: T.ink }} />
              </div>
              {discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: T.sub }}>Discount</span>
                  <span style={{ fontSize: 13.5, fontWeight: 800, color: T.green }}>− <AnimatedPrice ugx={discount} style={{ fontSize: 13.5, fontWeight: 800, color: T.green }} /></span>
                </div>
              )}
              {importFees > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: T.sub }}>Import Fees Total</span>
                  <AnimatedPrice ugx={importFees} style={{ fontSize: 13.5, fontWeight: 800, color: T.ink }} />
                </div>
              )}
              {deliveryArea === 'outside' ? (
                <div style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: T.sub }}>Delivery</span>
                    <span style={{ fontSize: 13.5, fontWeight: 800, color: T.amberInk }}>To be arranged</span>
                  </div>
                  <div style={{ border: `1.5px solid ${T.amber}`, background: '#FFF8EC', borderRadius: 12, padding: '12px 14px' }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: T.ink, lineHeight: 1.5, marginBottom: 10 }}>Delivery for this order is outside Kampala and arranged separately. Contact us on WhatsApp for delivery arrangements.</div>
                    <WhatsAppButton full label="Contact us on WhatsApp" />
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: T.sub }}>Delivery Fee</span>
                  {deliveryFee > 0 ? <AnimatedPrice ugx={deliveryFee} style={{ fontSize: 13.5, fontWeight: 800, color: T.ink }} /> : <span style={{ fontSize: 13.5, fontWeight: 800, color: T.green }}>Free</span>}
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: 10, marginTop: 4, borderTop: `1px solid ${T.line}` }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: T.ink }}>Total</span>
                <AnimatedPrice ugx={sel.total} style={{ fontSize: 22, fontWeight: 800, color: T.ink }} />
              </div>
            </div>
          </div>
        </div>
      </Overlay>
    );
  }

  // ── Host: renders active modal + toasts, manages body scroll lock ──
  function CommerceHost() {
    const [cur, setCur] = React.useState(ModalStore.get());
    React.useEffect(() => ModalStore.sub(setCur), []);
    React.useEffect(() => {
      const onKey = (e) => { if (e.key === 'Escape') ModalStore.close(); };
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }, []);
    React.useEffect(() => {
      document.body.style.overflow = cur ? 'hidden' : '';
      return () => { document.body.style.overflow = ''; };
    }, [cur]);
    return (
      <React.Fragment>
        {cur === 'catalogue' && <CatalogueModal />}
        {cur === 'cart' && <CartModal />}
        {cur === 'checkout' && <CheckoutModal />}
        {cur === 'trackOrders' && <TrackOrderModal />}
        {cur === 'inquiry' && <InquiryModal />}
        {cur === 'login' && <LoginModal />}
        {cur === 'productDetails' && <ProductModal />}
        {cur === 'orderTracking' && <OrderModal />}
        {cur === 'myOrders' && <MyOrdersModal />}
        {cur === 'help' && <HelpModal />}
        {cur === 'about' && <AboutModal />}
        {cur === 'terms' && <TermsModal />}
        <ToastHost />
      </React.Fragment>
    );
  }

  // keyframes (injected once)
  if (!document.getElementById('pps-commerce-style')) {
    const s = document.createElement('style');
    s.id = 'pps-commerce-style';
    s.textContent = '@keyframes ppsFade{from{opacity:0}to{opacity:1}}@keyframes ppsPop{from{opacity:0;transform:translateY(8px) scale(.98)}to{opacity:1;transform:none}}@keyframes ppsToast{from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:none}}@keyframes ppsSpin{to{transform:rotate(360deg)}}';
    document.head.appendChild(s);
  }

  Object.assign(window, { CartStore, useCart, AuthStore, useAuth, ToastStore, ModalStore, CommerceHost, AddBtn,
    openProductDetails: (id) => ModalStore.open('productDetails', { id }) });
})();
