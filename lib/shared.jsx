// shared.jsx — currency store, animated price, icons, stars, product data.
// Exported to window for use by all direction components.

// ── Currency: base prices stored in UGX. Switching is GLOBAL across the
// whole canvas so every artboard's prices tween together on change. ──
// Exchange rates are admin-owned (localStorage `pps_currency_rates`, written by
// the admin console). Stored as UGX per 1 unit of each currency; base is UGX.
// Falls back to sensible defaults so the storefront behaves exactly as before
// when the admin has not set any rates.
const DEFAULT_CURRENCY_RATES = { usdToUgx: 3850, eurToUgx: 4150 };
function loadCurrencyRates() {
  try {
    const r = JSON.parse(localStorage.getItem('pps_currency_rates'));
    if (r && Number(r.usdToUgx) > 0 && Number(r.eurToUgx) > 0) {
      return { usdToUgx: Number(r.usdToUgx), eurToUgx: Number(r.eurToUgx) };
    }
  } catch (e) {}
  return { ...DEFAULT_CURRENCY_RATES };
}
const _CR = loadCurrencyRates();
const RATES = { UGX: 1, USD: 1 / _CR.usdToUgx, EUR: 1 / _CR.eurToUgx };
const SYM   = { UGX: 'USh', USD: '$', EUR: '€' };
const DECIMALS = { UGX: 0, USD: 2, EUR: 2 };

const CurrencyStore = (() => {
  let code = 'UGX';
  const subs = new Set();
  return {
    get: () => code,
    set: (c) => { if (c === code) return; code = c; subs.forEach((f) => f(code)); },
    sub: (f) => { subs.add(f); return () => subs.delete(f); },
  };
})();

function useCurrency() {
  const [code, setCode] = React.useState(CurrencyStore.get());
  React.useEffect(() => CurrencyStore.sub(setCode), []);
  return [code, CurrencyStore.set];
}

function fmtParts(ugx, code) {
  const v = ugx * RATES[code];
  const d = DECIMALS[code];
  const s = v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  return { sym: SYM[code], num: s };
}

// AnimatedPrice — tweens the numeric value when the global currency changes.
function AnimatedPrice({ ugx, style, symStyle, weight }) {
  const [code] = useCurrency();
  const [disp, setDisp] = React.useState(() => ugx * RATES[code]);
  const fromRef = React.useRef(ugx * RATES[code]);
  const raf = React.useRef(0);
  React.useEffect(() => {
    const target = ugx * RATES[code];
    const from = fromRef.current;
    const t0 = performance.now();
    const dur = 480;
    cancelAnimationFrame(raf.current);
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      const val = from + (target - from) * e;
      setDisp(val);
      fromRef.current = val;
      if (p < 1) raf.current = requestAnimationFrame(tick);
      else fromRef.current = target;
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [code, ugx]);
  const d = DECIMALS[code];
  const num = disp.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  return (
    <span style={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', fontWeight: weight, ...style }}>
      <span style={{ fontSize: '0.62em', opacity: 0.72, marginRight: '0.28em', fontWeight: 600, ...symStyle }}>{SYM[code]}</span>
      {num}
    </span>
  );
}

// Segmented currency switcher. theme = { active, activeText, idle, idleText, bg }
function CurrencySwitch({ theme, size = 'md' }) {
  const [code, set] = useCurrency();
  const pad = size === 'sm' ? '5px 9px' : '7px 12px';
  const fs = size === 'sm' ? 12 : 13;
  return (
    <div style={{ display: 'inline-flex', background: theme.bg, borderRadius: 999, padding: 3, gap: 2 }}>
      {['UGX', 'USD', 'EUR'].map((c) => {
        const on = c === code;
        return (
          <button key={c} onClick={() => set(c)}
            style={{ border: 'none', cursor: 'pointer', padding: pad, borderRadius: 999, fontSize: fs,
              fontWeight: 700, letterSpacing: 0.2, lineHeight: 1, fontFamily: 'inherit',
              background: on ? theme.active : 'transparent', color: on ? theme.activeText : theme.idleText,
              transition: 'background .2s, color .2s, transform .15s', transform: on ? 'scale(1)' : 'scale(1)' }}>
            {c}
          </button>
        );
      })}
    </div>
  );
}

// ── Line icons (clean, technical) used as product/category imagery and UI ──
const ICONS = {
  breaker: 'M7 3h10v5l-3 4v6h-4v-6L7 8z M9 3v3M15 3v3',
  contactor: 'M5 5h14v14H5z M5 10h14 M9 5v5 M15 5v5 M12 14v3',
  cable: 'M4 6c4 0 4 12 8 12s4-12 8-12 M4 6v0 M20 18v0',
  motor: 'M3 9h3v6H3z M6 7h11v10H6z M17 10h2v4h-2z M9 5v2 M13 5v2',
  panel: 'M4 3h16v18H4z M8 7h8 M8 11h8 M8 15h5',
  socket: 'M4 4h16v16H4z M9 9v3 M15 9v3 M9 16h6',
  light: 'M9 18h6 M10 21h4 M12 3a6 6 0 0 1 4 10.5V16H8v-2.5A6 6 0 0 1 12 3z',
  sensor: 'M12 3v4 M12 17v4 M3 12h4 M17 12h4 M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  transformer: 'M7 4v16 M17 4v16 M4 8h6 M4 12h6 M4 16h6 M14 8h6 M14 12h6 M14 16h6',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14z M20 20l-4-4',
  cart: 'M3 4h2l2.5 12h11l2-8H6 M9 20a1 1 0 1 0 0 2 1 1 0 0 0 0-2 M18 20a1 1 0 1 0 0 2 1 1 0 0 0 0-2',
  heart: 'M12 20S4 14.5 4 9a4 4 0 0 1 8-1 4 4 0 0 1 8 1c0 5.5-8 11-8 11z',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M5 20c1.5-4 12.5-4 14 0',
  star: 'M12 3l2.6 5.6 6 .7-4.4 4.1 1.2 6L12 16.6 6.6 19.4l1.2-6L3.4 9.3l6-.7z',
  bolt: 'M13 2L4 14h6l-1 8 9-12h-6z',
  truck: 'M3 6h11v9H3z M14 9h4l3 3v3h-7 M7 18a2 2 0 1 0 0 .1 M18 18a2 2 0 1 0 0 .1',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z M9 12l2 2 4-4',
  chevron: 'M8 5l7 7-7 7',
  chevronDown: 'M5 8l7 7 7-7',
  menu: 'M4 7h16 M4 12h16 M4 17h16',
  check: 'M5 12l5 5 9-11',
  plus: 'M12 5v14 M5 12h14',
  minus: 'M5 12h14',
  download: 'M12 3v12 M7 11l5 5 5-5 M4 20h16',
  mic: 'M12 4a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V7a3 3 0 0 0-3-3z M5 11a7 7 0 0 0 14 0 M12 18v3',
  camera: 'M4 8h3l2-2h6l2 2h3v11H4z M12 16a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z',
  pin: 'M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11z M12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  fire: 'M12 3c1 3-2 4-2 7a4 4 0 0 0 8 0c0-1-.5-2-1-2.5 .2 2-1 3-1.5 2.5C14.5 8 13 5 12 3z M8 13a4 4 0 0 0 8 0',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 7v5l3 2',
  doc: 'M6 3h8l4 4v14H6z M14 3v4h4 M9 13h6 M9 16h6',
  arrowRight: 'M5 12h14 M13 6l6 6-6 6',
  filter: 'M4 5h16 M7 12h10 M10 19h4',
  box: 'M21 8l-9-5-9 5v8l9 5 9-5z M3 8l9 5 9-5 M12 13v8',
  package: 'M21 8l-9-5-9 5v8l9 5 9-5z M3 8l9 5 9-5 M12 13v8 M16.5 5.5l-9 5',
  lock: 'M6 11h12v9H6z M9 11V8a3 3 0 0 1 6 0v3',
  rotate: 'M4 12a8 8 0 1 1 2.3 5.6 M4 18v-4h4',
};

function Icon({ name, size = 22, stroke = 2, color = 'currentColor', style, fill = 'none' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color}
      strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', flexShrink: 0, ...style }}>
      {ICONS[name].split(' M').map((seg, i) => <path key={i} d={(i ? 'M' : '') + seg} />)}
    </svg>
  );
}

// Star rating row
function Stars({ value = 4.5, size = 14, color = '#F5A524', empty = '#D9DDE3', gap = 1 }) {
  return (
    <span style={{ display: 'inline-flex', gap, lineHeight: 0 }}>
      {[0, 1, 2, 3, 4].map((i) => {
        const fillPct = Math.max(0, Math.min(1, value - i));
        const gid = 'sg' + Math.random().toString(36).slice(2, 8);
        return (
          <svg key={i} width={size} height={size} viewBox="0 0 24 24" style={{ display: 'block' }}>
            <defs><linearGradient id={gid}><stop offset={`${fillPct * 100}%`} stopColor={color} /><stop offset={`${fillPct * 100}%`} stopColor={empty} /></linearGradient></defs>
            <path d="M12 3l2.6 5.6 6 .7-4.4 4.1 1.2 6L12 16.6 6.6 19.4l1.2-6L3.4 9.3l6-.7z" fill={`url(#${gid})`} />
          </svg>
        );
      })}
    </span>
  );
}

// A clean "product photo": real image when `img` (URL or Base64 data string)
// is supplied, otherwise a soft tinted panel + category line icon placeholder.
// Falls back to the icon automatically if the image fails to load.
function ProductShot({ icon, bg = '#F1F4F9', tint = '#9AA7BD', pad = 22, radius = 0, style, img }) {
  const [failed, setFailed] = React.useState(false);
  React.useEffect(() => { setFailed(false); }, [img]);
  const showImg = img && !failed;
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: bg, borderRadius: radius,
      display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', ...style }}>
      {showImg ? (
        <img src={img} alt="" loading="lazy" onError={() => setFailed(true)}
          style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
      ) : (
        <React.Fragment>
          <div style={{ position: 'absolute', inset: 0, backgroundImage:
            `radial-gradient(circle at 70% 22%, rgba(255,255,255,.7), transparent 55%)` }} />
          <Icon name={icon} size={`calc(100% - ${pad * 2}px)`} stroke={1.1} color={tint} style={{ maxWidth: 120, maxHeight: 120, opacity: 0.92 }} />
        </React.Fragment>
      )}
    </div>
  );
}

// Read the admin-owned catalogue from localStorage, normalising admin product
// records (regularPrice/salePrice/category/specs) into the storefront shape
// (ugx/was/cat/spec). Returns an EMPTY array when storage is empty or
// unreadable, so the storefront only ever reflects admin-added products.
function loadProducts() {
  try {
    const raw = localStorage.getItem('pps_products');
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr) && arr.length) {
        return arr.map((p) => {
          const ugx = p.salePrice || p.regularPrice || p.ugx;
          const was = p.salePrice ? p.regularPrice : (p.was || null);
          const spec = p.spec || (p.specs || '').split('\n')
            .map((l) => l.split(':').slice(1).join(':').trim()).filter(Boolean).slice(0, 3).join(' · ');
          const n = Number(p.stock);
          const stock = isNaN(n) ? (p.stock || 'In stock') : (n > 5 ? 'In stock' : n > 0 ? 'Low stock' : 'Out of stock');
          return {
            ...p, ugx, was, cat: ((p.cat || p.category) === 'Automation' ? 'Tech' : (p.cat || p.category)), icon: p.icon || 'box',
            brand: p.brand || 'Pinnacle', rating: p.rating || 4.5, reviews: p.reviews || 0,
            badge: p.badge || (p.tags && p.tags[0]) || null, spec, stock,
          };
        });
      }
    }
  } catch (e) {}
  return [];
}
const PRODUCTS = loadProducts();

const CATEGORIES = [
  { icon: 'breaker', name: 'Circuit Protection', count: '2,140' },
  { icon: 'contactor', name: 'Control Gear', count: '1,860' },
  { icon: 'cable', name: 'Cables & Wiring', count: '3,420' },
  { icon: 'motor', name: 'Motors & Drives', count: '940' },
  { icon: 'panel', name: 'Enclosures', count: '1,275' },
  { icon: 'light', name: 'Lighting', count: '2,030' },
  { icon: 'socket', name: 'Wiring Devices', count: '1,690' },
  { icon: 'sensor', name: 'Tech', count: '760' },
];

const BRANDS = ['ABB', 'Schneider', 'Siemens', 'Legrand', 'Eaton', 'WEG', 'Philips', 'Nexans'];

// ── Product detail enrichment ──────────────────────────────────────────────
// Each catalogue product is augmented (on demand) with the richer fields a
// product-details view needs: marketing copy, customer reviews, FAQs and a
// list of related SKUs in the same category. Kept as a derive-on-read helper
// so the base PRODUCTS array stays the lightweight source of truth.
const REVIEW_AUTHORS = [
  ['Brian Ssemwogerere', 'Site Electrician, Kampala'],
  ['Aisha Nakato', 'Procurement, Jinja Steel'],
  ['David Okoth', 'Panel Builder'],
  ['Grace Atim', 'Facilities Engineer'],
  ['Ronald Mugisha', 'Contractor'],
];
const REVIEW_BODIES = [
  'Exactly as specced — genuine part, sealed packaging and the datasheet matched. Fitted first time.',
  'Arrived same day in Kampala. Build quality is solid and the terminals are clean. Will order again.',
  'Good price for an authorised-distributor item. Saved us a long lead time sourcing it elsewhere.',
  'Works perfectly on our panel. Support desk answered a wiring question within the hour.',
  'No complaints — performs to spec and the ratings are honest. Recommended for industrial use.',
];

function productReviews(p) {
  // Deterministic per-product selection so a product always shows the same set.
  const seed = p.id.replace(/\D/g, '') * 1 || 1;
  const out = [];
  const n = 3;
  for (let i = 0; i < n; i++) {
    const ai = (seed + i * 2) % REVIEW_AUTHORS.length;
    const bi = (seed + i * 3) % REVIEW_BODIES.length;
    const r = i === 0 ? Math.min(5, Math.round(p.rating)) : (i === 1 ? 5 : 4);
    out.push({ author: REVIEW_AUTHORS[ai][0], role: REVIEW_AUTHORS[ai][1], rating: r, comment: REVIEW_BODIES[bi] });
  }
  return out;
}

function productFaqs(p) {
  return [
    { q: 'Shipping & Returns', a: 'Same-day dispatch on in-stock Kampala orders placed before 3pm. Nationwide delivery in 1–3 working days. 30-day returns on unused items in original packaging.' },
    { q: 'Product Specifications', a: `${p.spec}. Supplied with the manufacturer datasheet and, where applicable, a certificate of conformity. SKU ${p.sku}.` },
    { q: 'Warranty Information', a: `Backed by the ${p.brand} manufacturer warranty against defects. As an authorised distributor we handle any warranty claim on your behalf.` },
    { q: 'Bulk & Trade Pricing', a: 'Volume tiers and Net-30 terms are available on a trade account. Add the item to a quote or contact our desk for project pricing.' },
  ];
}

function relatedFor(p) {
  const same = PRODUCTS.filter((x) => x.cat === p.cat && x.id !== p.id);
  const fill = PRODUCTS.filter((x) => x.cat !== p.cat && x.id !== p.id);
  return [...same, ...fill].slice(0, 6).map((x) => x.id);
}

function productDetail(p) {
  return {
    ...p,
    reviewsCount: p.reviews,
    description: `Genuine ${p.brand} ${p.name.replace(p.brand + ' ', '')} — ${p.spec}. Supplied directly from authorised-distributor stock with full traceability and datasheet. Engineered for reliable industrial duty and ready for same-day dispatch from our Kampala warehouse.`,
    highlights: ['Secure Checkout', 'Free Fast Shipping', '30-Day Money-Back Guarantee'],
    reviews: productReviews(p),
    faqs: productFaqs(p),
    relatedIds: relatedFor(p),
  };
}

// ── Sample order (used by the order-tracking modal) ──
const SAMPLE_ORDER = {
  number: '#2315482546',
  placed: 'Feb 20, 2024',
  delivered: 'Feb 24, 2024',
  status: 'Delivered',
  itemsCount: 2,
  timeline: [
    { step: 'Order Placed', date: 'Feb 20, 2024 · 09:14', done: true },
    { step: 'Order Packed', date: 'Feb 20, 2024 · 14:02', done: true },
    { step: 'In Transit', date: 'Feb 22, 2024 · 08:30', done: true },
    { step: 'Out for Delivery', date: 'Feb 24, 2024 · 10:45', done: true },
  ],
  items: [
    { id: 'p1', size: '3-Pole · 63A', qty: 1 },
    { id: 'p6', size: '32A · IP67', qty: 1 },
  ],
  delivery: 5000,
  deliveryArea: 'kampala',
  discountUgx: 58000,
};

Object.assign(window, {
  CurrencyStore, useCurrency, AnimatedPrice, CurrencySwitch, fmtParts,
  Icon, Stars, ProductShot, PRODUCTS, CATEGORIES, BRANDS, RATES, SYM,
  productDetail, SAMPLE_ORDER,
});
