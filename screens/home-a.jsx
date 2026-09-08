// home-a.jsx — Direction A · "Voltway" — bright, dense marketplace (blue + amber)
(function () {
  const T = {
    ink: '#0B1A33', sub: '#5A6B85', blue: '#1457E6', blueDk: '#0E3FB0',
    amber: '#FFB020', amberInk: '#5A3A00', surface: '#F4F7FC', line: '#E4E9F2',
    chip: '#EEF3FC', green: '#119C5B', red: '#E5484D',
  };
  const F = "'Plus Jakarta Sans', system-ui, sans-serif";
  const { Icon, Stars, AnimatedPrice, CurrencySwitch, ProductShot, PRODUCTS, CATEGORIES, BRANDS, PPSLogo, ppsGo, useCart, useAuth, ModalStore, ToastStore, CommerceHost } = window;

  const curTheme = { bg: 'rgba(255,255,255,.14)', active: '#fff', activeText: T.blue, idle: 'transparent', idleText: 'rgba(255,255,255,.85)' };

  function Pill({ children, bg, color, style }) {
    return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: bg, color, fontSize: 11.5,
      fontWeight: 800, letterSpacing: 0.3, padding: '4px 9px', borderRadius: 999, textTransform: 'uppercase', whiteSpace: 'nowrap', ...style }}>{children}</span>;
  }

  function FooterLink({ label, onClick }) {
    const [hover, setHover] = React.useState(false);
    return <div onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ fontSize: 13.5, marginBottom: 9, cursor: 'pointer', color: hover ? '#fff' : 'inherit', transition: 'color .15s', width: 'fit-content' }}>{label}</div>;
  }

  function Card({ p, w, flame }) {
    const off = p.was ? Math.round((1 - p.ugx / p.was) * 100) : 0;
    const cart = useCart();
    const inCart = cart.has(p.id);
    return (
      <div data-product-id={p.id} onClick={() => ModalStore.open('productDetails', { id: p.id })} style={{ width: w, background: '#fff', border: `1px solid ${T.line}`, borderRadius: 14, overflow: 'hidden',
        display: 'flex', flexDirection: 'column', transition: 'box-shadow .18s, transform .18s', cursor: 'pointer' }}>
        <div style={{ position: 'relative', height: 168, background: T.surface, borderBottom: `1px solid ${T.line}` }}>
          <ProductShot icon={p.icon} img={p.image} bg={T.surface} tint="#A6B4CC" />
          {p.badge && <div style={{ position: 'absolute', top: 10, left: 10 }}>
            <Pill bg={p.badge === 'Best Seller' ? T.ink : p.badge === 'Deal' ? T.amber : T.blue}
              color={p.badge === 'Deal' ? T.amberInk : '#fff'}>{p.badge}</Pill></div>}
          <button onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', top: 8, right: 8, width: 34, height: 34, borderRadius: 999, border: `1px solid ${T.line}`,
            background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: T.sub }}>
            <Icon name="heart" size={17} /></button>
          {off > 0 && <div style={{ position: 'absolute', bottom: 10, right: 10, background: T.red, color: '#fff', fontSize: 12,
            fontWeight: 800, padding: '3px 8px', borderRadius: 7 }}>−{off}%</div>}
          {flame && <div style={{ position: 'absolute', bottom: 10, left: 10, width: 30, height: 30, borderRadius: 999, background: T.red,
            display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 8px rgba(229,72,77,.4)' }}><Icon name="fire" size={17} color="#fff" /></div>}
        </div>
        <div style={{ padding: '13px 14px 15px', display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div style={{ fontSize: 11.5, fontWeight: 800, color: T.blue, letterSpacing: 0.4, textTransform: 'uppercase' }}>{p.brand}</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.ink, lineHeight: 1.32, margin: '5px 0 8px', minHeight: 37 }}>{p.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <Stars value={p.rating} size={13} /><span style={{ fontSize: 12, color: T.sub, fontWeight: 600 }}>{p.rating} ({p.reviews})</span>
          </div>
          <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div>
              <AnimatedPrice ugx={p.ugx} style={{ fontSize: 18, fontWeight: 800, color: T.ink }} />
              {p.was && <div style={{ fontSize: 12, color: T.sub, textDecoration: 'line-through', marginTop: 1 }}>
                <AnimatedPrice ugx={p.was} style={{ fontSize: 12 }} /></div>}
            </div>
            <button onClick={(e) => { e.stopPropagation(); cart.add(p.id); ToastStore.push(p.name, { title: 'Added to cart', icon: 'cart', tone: 'ok' }); }}
              title={inCart ? 'In cart' : 'Add to cart'}
              style={{ width: 40, height: 40, borderRadius: 11, border: 'none', background: inCart ? '#E5F4EC' : T.blue, color: inCart ? T.green : '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: inCart ? 'none' : '0 4px 12px rgba(20,87,230,.32)' }}>
              <Icon name={inCart ? 'check' : 'cart'} size={19} stroke={inCart ? 2.4 : 2} /></button>
          </div>
        </div>
      </div>
    );
  }

  // CHANGE 2 — single distributor logo tile with image + graceful text fallback.
  function DistributorLogo({ k }) {
    const [failed, setFailed] = React.useState(false);
    return (
      <div style={{ height: 72, border: `1px solid ${T.line}`, borderRadius: 12, background: '#fff', display: 'flex',
        alignItems: 'center', justifyContent: 'center', padding: '0 18px', overflow: 'hidden' }}>
        {failed
          ? <span style={{ fontSize: 13, fontWeight: 800, color: T.sub, letterSpacing: 0.3 }}>Distributor</span>
          : <img src={`uploads/${k}.png`} alt="Distributor logo" onError={() => setFailed(true)}
              style={{ maxWidth: '100%', maxHeight: 38, width: 'auto', height: 'auto', objectFit: 'contain', display: 'block' }} />}
      </div>
    );
  }

  // CHANGE 3 & 4 — generic horizontal product carousel: responsive visible count,
  // arrows (slide one card), autoplay every 4s pausing on hover, and dot indicators.
  function Carousel({ items, emptyMsg, accent, flame }) {
    const wrapRef = React.useRef(null);
    const [visible, setVisible] = React.useState(4);
    const [w, setW] = React.useState(0);
    const [start, setStart] = React.useState(0);
    const [hover, setHover] = React.useState(false);
    const gap = 16;
    React.useLayoutEffect(() => {
      const calc = () => {
        const width = wrapRef.current ? wrapRef.current.offsetWidth : 1200;
        setW(width);
        setVisible(width < 560 ? 1 : width < 860 ? 2 : width < 1120 ? 3 : 4);
      };
      calc();
      window.addEventListener('resize', calc);
      return () => window.removeEventListener('resize', calc);
    }, []);
    const maxStart = Math.max(0, items.length - visible);
    const positions = maxStart + 1;
    React.useEffect(() => { setStart((s) => Math.min(s, maxStart)); }, [maxStart]);
    React.useEffect(() => {
      if (hover || items.length <= visible) return;
      const i = setInterval(() => setStart((s) => (s >= maxStart ? 0 : s + 1)), 4000);
      return () => clearInterval(i);
    }, [hover, maxStart, visible, items.length]);

    if (!items.length) {
      return (
        <div style={{ border: `1px dashed ${T.line}`, borderRadius: 14, padding: '40px 24px', textAlign: 'center',
          color: T.sub, fontSize: 15, fontWeight: 700, background: T.surface }}>{emptyMsg}</div>
      );
    }

    const cardW = visible ? Math.max(0, (w - (visible - 1) * gap) / visible) : 0;
    const step = cardW + gap;
    const prev = () => setStart((s) => (s <= 0 ? maxStart : s - 1));
    const next = () => setStart((s) => (s >= maxStart ? 0 : s + 1));
    const navBtn = { position: 'absolute', top: 84, transform: 'translateY(-50%)', width: 40, height: 40, borderRadius: 999,
      border: `1px solid ${T.line}`, background: '#fff', boxShadow: '0 6px 18px rgba(11,26,51,.16)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 5 };

    return (
      <div style={{ position: 'relative' }} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
        <div ref={wrapRef} style={{ overflow: 'hidden' }}>
          <div style={{ display: 'flex', gap, transform: `translateX(${-start * step}px)`, transition: 'transform .45s cubic-bezier(.22,.61,.36,1)' }}>
            {items.map((p) => (
              <div key={p.id} style={{ flex: `0 0 ${cardW}px`, maxWidth: cardW }}>
                <Card p={p} w="100%" flame={flame} />
              </div>
            ))}
          </div>
        </div>
        {positions > 1 && (
          <React.Fragment>
            <button onClick={prev} aria-label="Previous" style={{ ...navBtn, left: 4 }}>
              <Icon name="chevron" size={20} color={accent} style={{ transform: 'rotate(180deg)' }} /></button>
            <button onClick={next} aria-label="Next" style={{ ...navBtn, right: 4 }}>
              <Icon name="chevron" size={20} color={accent} /></button>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 7, marginTop: 16 }}>
              {Array.from({ length: positions }).map((_, i) => (
                <button key={i} onClick={() => setStart(i)} aria-label={`Go to slide ${i + 1}`}
                  style={{ width: i === start ? 22 : 8, height: 8, borderRadius: 999, border: 'none', padding: 0,
                    background: i === start ? accent : T.line, cursor: 'pointer', transition: 'all .25s' }} />
              ))}
            </div>
          </React.Fragment>
        )}
      </div>
    );
  }

  function Flip({ v, label }) {
    return <div style={{ textAlign: 'center' }}>
      <div style={{ background: T.ink, color: '#fff', fontSize: 24, fontWeight: 800, fontVariantNumeric: 'tabular-nums',
        padding: '8px 10px', borderRadius: 9, minWidth: 46, position: 'relative', boxShadow: 'inset 0 -1px 0 rgba(255,255,255,.12)' }}>
        <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 1, background: 'rgba(255,255,255,.12)' }} />
        {String(v).padStart(2, '0')}</div>
      <div style={{ fontSize: 10, fontWeight: 700, color: T.sub, marginTop: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
    </div>;
  }

  function Countdown() {
    const [t, setT] = React.useState(2 * 3600 + 14 * 60 + 36);
    React.useEffect(() => { const i = setInterval(() => setT((x) => (x > 0 ? x - 1 : 0)), 1000); return () => clearInterval(i); }, []);
    return <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
      <Flip v={Math.floor(t / 3600)} label="hrs" /><span style={{ color: T.ink, fontWeight: 800, fontSize: 20, marginTop: -14 }}>:</span>
      <Flip v={Math.floor((t % 3600) / 60)} label="min" /><span style={{ color: T.ink, fontWeight: 800, fontSize: 20, marginTop: -14 }}>:</span>
      <Flip v={t % 60} label="sec" />
    </div>;
  }

  function HeaderSearch() {
    const [q, setQ] = React.useState('');
    const [debounced, setDebounced] = React.useState('');
    const [open, setOpen] = React.useState(false);
    const [active, setActive] = React.useState(0);
    const boxRef = React.useRef(null);
    React.useEffect(() => { const t = setTimeout(() => setDebounced(q), 300); return () => clearTimeout(t); }, [q]);
    React.useEffect(() => {
      const onDoc = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); };
      document.addEventListener('mousedown', onDoc); return () => document.removeEventListener('mousedown', onDoc);
    }, []);
    const term = debounced.trim().toLowerCase();
    const results = term ? PRODUCTS.filter((p) => (p.name + ' ' + p.sku + ' ' + p.brand + ' ' + p.cat).toLowerCase().includes(term)).slice(0, 10) : [];
    const choose = (p) => { setOpen(false); setQ(''); ModalStore.open('productDetails', { id: p.id }); };
    const onKey = (e) => {
      if (!open || !results.length) { if (e.key === 'Enter' && results[0]) choose(results[0]); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(results.length - 1, a + 1)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
      else if (e.key === 'Enter') { e.preventDefault(); choose(results[active] || results[0]); }
      else if (e.key === 'Escape') { setOpen(false); }
    };
    return (
      <div ref={boxRef} className="ka-search" style={{ flex: 1, position: 'relative' }}>
        <div className="ka-search-bar" style={{ display: 'flex', alignItems: 'center', height: 50, border: `2px solid ${T.blue}`, borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
          <div className="ka-search-cat" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 16px', borderRight: `1px solid ${T.line}`, fontSize: 14, fontWeight: 700, color: T.ink, height: '100%' }}>
            All <Icon name="chevronDown" size={15} color={T.sub} /></div>
          <input className="ka-search-input" aria-label="Search products" value={q} onChange={(e) => { setQ(e.target.value); setOpen(true); setActive(0); }} onFocus={() => q && setOpen(true)} onKeyDown={onKey}
            placeholder="Search 18,000+ products, brands and part numbers…" style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14.5, padding: '0 16px', fontFamily: F, color: T.ink, background: 'transparent' }} />
          <div className="ka-search-extra" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '0 16px', color: T.sub }}>
            <Icon name="mic" size={19} /><Icon name="camera" size={19} /></div>
          <button className="ka-search-btn" aria-label="Search" onClick={() => results[0] && choose(results[0])} style={{ height: '100%', border: 'none', background: T.blue, color: '#fff', padding: '0 22px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <Icon name="search" size={20} color="#fff" /></button>
        </div>
        {open && term && (
          <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0, background: '#fff', border: `1px solid ${T.line}`, borderRadius: 14, boxShadow: '0 18px 50px rgba(11,26,51,.2)', zIndex: 50, overflow: 'hidden' }}>
            {results.length === 0 ? (
              <div style={{ padding: '22px 18px', display: 'flex', alignItems: 'center', gap: 12, color: T.sub }}>
                <Icon name="search" size={20} color={T.sub} /><div style={{ fontSize: 13.5, fontWeight: 700, color: T.ink }}>No products match “{debounced.trim()}”.</div></div>
            ) : (
              <React.Fragment>
                <div style={{ maxHeight: 420, overflowY: 'auto' }}>
                  {results.map((p, i) => (
                    <div key={p.id} onMouseEnter={() => setActive(i)} onClick={() => choose(p)}
                      style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '11px 14px', cursor: 'pointer', background: i === active ? T.surface : '#fff', borderBottom: i < results.length - 1 ? `1px solid ${T.line}` : 'none' }}>
                      <div style={{ width: 46, height: 46, borderRadius: 10, overflow: 'hidden', border: `1px solid ${T.line}`, flexShrink: 0 }}><ProductShot icon={p.icon} img={p.image} bg={T.surface} tint="#A6B4CC" pad={10} /></div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: T.blue, letterSpacing: 0.3, textTransform: 'uppercase' }}>{p.brand}</div>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: T.ink, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                        <div style={{ fontSize: 11.5, fontWeight: 700, color: T.sub, marginTop: 1 }}>{p.sku}</div>
                      </div>
                      <AnimatedPrice ugx={p.ugx} style={{ fontSize: 14.5, fontWeight: 800, color: T.ink }} />
                    </div>
                  ))}
                </div>
                <div onClick={() => { setOpen(false); ModalStore.open('catalogue'); }} style={{ padding: '11px 14px', borderTop: `1px solid ${T.line}`, background: T.surface, fontSize: 13, fontWeight: 800, color: T.blue, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}>
                  See all results in catalogue <Icon name="arrowRight" size={15} color={T.blue} /></div>
              </React.Fragment>
            )}
          </div>
        )}
      </div>
    );
  }

  function HeroSlideshow() {
    // Media is admin-managed: the admin console (Settings → Homepage hero media)
    // writes pps_hero_media — [{ id, type: 'image'|'video', src }]. Falls back
    // to the built-in 1.jpg … 11.jpg when the admin hasn't customised it yet.
    const DEFAULT_COUNT = 11;
    const media = React.useMemo(() => {
      try {
        const r = JSON.parse(localStorage.getItem('pps_hero_media'));
        if (Array.isArray(r)) return r.filter((m) => m && m.src);
      } catch (e) {}
      return Array.from({ length: DEFAULT_COUNT }, (_, i) => ({ id: 'default-' + (i + 1), type: 'image', src: (i + 1) + '.jpg' }));
    }, []);
    const [idx, setIdx] = React.useState(0);
    React.useEffect(() => {
      if (media.length < 2) return;
      // Photos rotate every 3s; videos get 8s of play before advancing.
      const cur = media[idx % media.length];
      const t = setTimeout(() => setIdx((x) => (x + 1) % media.length), cur && cur.type === 'video' ? 8000 : 3000);
      return () => clearTimeout(t);
    }, [idx, media]);
    if (media.length === 0) return null; // admin removed everything — keep the brand gradient
    return (
      <React.Fragment>
        {media.map((m, i) => (
          m.type === 'video' ? (
            <video key={m.id || i} src={m.src} muted autoPlay loop playsInline aria-hidden="true"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: i === idx % media.length ? 1 : 0, transition: 'opacity .9s ease-in-out', zIndex: 0 }} />
          ) : (
            <div key={m.id || i} aria-hidden="true" style={{ position: 'absolute', inset: 0, backgroundImage: `url(${m.src})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: i === idx % media.length ? 1 : 0, transition: 'opacity .9s ease-in-out', zIndex: 0 }} />
          )
        ))}
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 1 }} />
      </React.Fragment>
    );
  }

  // Mobile/tablet only (≤991px): matches the CSS breakpoint in index.html where the
  // desktop category rail is hidden and "All Categories" opens a drawer instead.
  function useIsMobile() {
    const q = '(max-width: 991px)';
    const [m, setM] = React.useState(() => window.matchMedia(q).matches);
    React.useEffect(() => {
      const mq = window.matchMedia(q); const h = (e) => setM(e.matches);
      mq.addEventListener('change', h); return () => mq.removeEventListener('change', h);
    }, []);
    return m;
  }

  function CategoryDrawer({ open, onClose, openCat, trackOrder, returnRef }) {
    const panelRef = React.useRef(null);
    React.useEffect(() => {
      if (!open) return;
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      const first = panelRef.current && panelRef.current.querySelector('button');
      if (first) first.focus();
      const onKey = (e) => {
        if (e.key === 'Escape') { e.preventDefault(); onClose(); return; }
        if (e.key === 'Tab' && panelRef.current) {
          const f = Array.from(panelRef.current.querySelectorAll('button:not([disabled])'));
          if (!f.length) return;
          const a = f[0], z = f[f.length - 1];
          if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
          else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
        }
      };
      document.addEventListener('keydown', onKey);
      return () => {
        document.removeEventListener('keydown', onKey);
        document.body.style.overflow = prevOverflow;
        if (returnRef && returnRef.current) returnRef.current.focus();
      };
    }, [open]);
    if (!open) return null;
    const go = (fn) => () => { onClose(); fn(); };
    const item = { display: 'flex', alignItems: 'center', gap: 12, width: '100%', minHeight: 48, padding: '11px 16px', border: 'none', background: '#fff', color: T.ink, fontFamily: F, fontSize: 15, fontWeight: 600, textAlign: 'left', cursor: 'pointer', borderBottom: `1px solid ${T.line}` };
    return (
      <div className="ka-drawer-root">
        <div onClick={onClose} aria-hidden="true" style={{ position: 'fixed', inset: 0, background: 'rgba(11,26,51,.55)', zIndex: 900 }} />
        <div ref={panelRef} id="ka-category-drawer" role="dialog" aria-modal="true" aria-label="Categories menu" className="ka-drawer"
          style={{ position: 'fixed', top: 0, bottom: 0, left: 0, width: 'min(340px, 88vw)', background: '#fff', zIndex: 901, overflowY: 'auto', boxShadow: '0 0 60px rgba(11,26,51,.35)', fontFamily: F, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 12px 12px 16px', borderBottom: `1px solid ${T.line}`, background: T.ink, color: '#fff' }}>
            <div style={{ fontSize: 16, fontWeight: 800 }}>All Categories</div>
            <button className="ka-drawer-item" aria-label="Close menu" onClick={onClose} style={{ width: 44, height: 44, border: 'none', background: 'rgba(255,255,255,.12)', borderRadius: 10, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg></button>
          </div>
          {CATEGORIES.map((c) => <button key={c.name} className="ka-drawer-item" onClick={go(() => openCat(c.name))} style={item}>
            <Icon name={c.icon} size={20} color={T.blue} stroke={1.6} /><span style={{ flex: 1 }}>{c.name}</span><Icon name="chevron" size={15} color={T.sub} /></button>)}
          <button className="ka-drawer-item" onClick={go(() => openCat())} style={{ ...item, color: T.blue, fontWeight: 800 }}><Icon name="filter" size={20} color={T.blue} /><span style={{ flex: 1 }}>Browse full catalogue</span><Icon name="arrowRight" size={16} color={T.blue} /></button>
          <div style={{ padding: '14px 16px 6px', fontSize: 11.5, fontWeight: 800, color: T.sub, textTransform: 'uppercase', letterSpacing: 0.6 }}>Quick links</div>
          <button className="ka-drawer-item" onClick={go(trackOrder)} style={item}><Icon name="box" size={20} color={T.sub} /><span style={{ flex: 1 }}>Track Order</span></button>
          <button className="ka-drawer-item" onClick={go(() => ModalStore.open('inquiry'))} style={{ ...item, color: T.amberInk, background: '#FFF4DC' }}><Icon name="search" size={20} color={T.amberInk} /><span style={{ flex: 1 }}>Source a Rare Part</span></button>
          <button className="ka-drawer-item" onClick={go(() => ModalStore.open('help'))} style={{ ...item, borderBottom: 'none' }}><Icon name="doc" size={20} color={T.sub} /><span style={{ flex: 1 }}>Help</span></button>
        </div>
      </div>
    );
  }

  function HomeA() {
    const isMobile = useIsMobile();
    const [drawer, setDrawer] = React.useState(false);
    const catBtnRef = React.useRef(null);
    React.useEffect(() => { if (!isMobile) setDrawer(false); }, [isMobile]);
    const navLinks = ['Circuit Protection', 'Cables', 'Motors & Drives', 'Tech', 'Lighting', 'Enclosures'];
    const cart = useCart();
    const auth = useAuth();
    const loggedIn = auth.isLoggedIn();
    const openCat = (category) => ModalStore.open('catalogue', category ? { category } : null);
    const brandsRef = React.useRef(null);
    const trackOrder = () => {
      if (auth.isLoggedIn()) { ModalStore.open('trackOrders'); }
      else { ToastStore.push('Please log in to view your orders.', { title: 'Sign in required', icon: 'box', tone: 'warn' }); ModalStore.open('login'); }
    };
    const viewBrands = () => brandsRef.current && brandsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const navCat = { 'Circuit Protection': 'Circuit Protection', 'Cables': 'Cables & Wiring', 'Motors & Drives': 'Motors & Drives', 'Tech': 'Tech', 'Lighting': 'Lighting', 'Enclosures': 'Enclosures' };
    // CHANGE 3 & 4 — data-driven from the same pps_products tags the admin owns.
    const hasTag = (p, t) => Array.isArray(p.tags) && p.tags.includes(t);
    // Cap each featured carousel at the 8 most-recent tagged products. PRODUCTS keeps
    // the admin's array order (newest first, since the admin unshifts new items), so
    // slicing the first 8 yields the newest 8. If fewer are tagged, all show; if none,
    // the Carousel renders its emptyMsg.
    const POPULAR = PRODUCTS.filter((p) => hasTag(p, 'Popular this week')).slice(0, 8);
    const FLASH = PRODUCTS.filter((p) => hasTag(p, 'Flash Deals')).slice(0, 8);
    return (
      <div style={{ fontFamily: F, background: '#fff', color: T.ink, width: '100%', WebkitFontSmoothing: 'antialiased' }}>
        {/* utility bar */}
        <div className="ka-topbar" style={{ background: T.ink, color: '#fff', fontSize: 13, fontWeight: 600 }}>
          <div className="ka-gut ka-topbar-row" style={{ padding: '0 40px', height: 42, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="ka-topbar-msg" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,.85)' }}>
              <Icon name="truck" size={16} color={T.amber} /> Free delivery in Kampala on orders over <span style={{ color: '#fff' }}>USh&nbsp;500,000</span>
            </div>
            <div className="ka-topbar-tools" style={{ display: 'flex', alignItems: 'center', gap: 18, color: 'rgba(255,255,255,.85)' }}>
              <CurrencySwitch theme={curTheme} size="sm" />
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="pin" size={15} /> Deliver to Kampala</span>
              <span className="ka-topbar-help" role="button" tabIndex={0} style={{ cursor: 'pointer' }} onClick={() => ModalStore.open('help')} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ModalStore.open('help'); } }}>Help</span>
            </div>
          </div>
        </div>
        {/* header */}
        <div className="ka-header ka-gut" style={{ background: '#fff', borderBottom: `1px solid ${T.line}`, padding: '0 40px' }}>
          <div className="ka-header-row" style={{ height: 78, display: 'flex', alignItems: 'center', gap: 28 }}>
            <div className="ka-logo"><PPSLogo size={42} onClick={() => ppsGo('home')} /></div>
            <HeaderSearch />
            <div className="ka-actions" style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
              <button className="ka-action ka-action-track" aria-label="Track Order" title="Track Order" style={{ display: 'flex', alignItems: 'center', gap: 8, border: 'none', background: 'none', cursor: 'pointer', color: T.ink, fontFamily: F }} onClick={trackOrder}>
                <Icon name="box" size={22} color={T.sub} /><div className="ka-action-label" style={{ textAlign: 'left' }}><div style={{ fontSize: 11, color: T.sub }}>Orders</div><div style={{ fontSize: 13.5, fontWeight: 700 }}>Track Order</div></div></button>
              <button className="ka-action" aria-label={loggedIn ? 'Account' : 'Sign in'} title={loggedIn ? 'Account' : 'Sign in'} style={{ display: 'flex', alignItems: 'center', gap: 8, border: 'none', background: 'none', cursor: 'pointer', color: T.ink, fontFamily: F }} onClick={() => ModalStore.open('login')}>
                {loggedIn && auth.get().photoURL
                  ? <img src={auth.get().photoURL} alt="" referrerPolicy="no-referrer" style={{ width: 26, height: 26, borderRadius: 999, objectFit: 'cover', flexShrink: 0 }} />
                  : <Icon name="user" size={22} color={T.sub} />}<div className="ka-action-label" style={{ textAlign: 'left' }}><div style={{ fontSize: 11, color: T.sub }}>Account</div><div style={{ fontSize: 13.5, fontWeight: 700 }}>{loggedIn ? `Welcome, ${auth.get().firstName}` : 'Sign in'}</div></div></button>
              <button className="ka-action" aria-label={`Cart, ${cart.count()} items`} title="Cart" style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8, border: 'none', background: 'none', cursor: 'pointer', color: T.ink, fontFamily: F }} onClick={() => ModalStore.open('cart')}>
                <div style={{ position: 'relative' }}><Icon name="cart" size={24} color={T.ink} />
                  {cart.count() > 0 && <span style={{ position: 'absolute', top: -7, right: -9, background: T.amber, color: T.amberInk, fontSize: 11, fontWeight: 800, minWidth: 19, height: 19, padding: '0 5px', borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{cart.count()}</span>}</div>
                <div className="ka-action-label" style={{ textAlign: 'left' }}><div style={{ fontSize: 11, color: T.sub }}>Cart</div><div style={{ fontSize: 13.5, fontWeight: 700 }}><AnimatedPrice ugx={cart.total()} style={{ fontSize: 13.5 }} /></div></div></button>
            </div>
          </div>
          {/* nav */}
          <div className="ka-nav" style={{ height: 52, display: 'flex', alignItems: 'center', gap: 26, fontSize: 14, fontWeight: 600 }}>
            <button ref={catBtnRef} className="ka-cat-btn" aria-expanded={isMobile ? drawer : undefined} aria-controls={isMobile ? 'ka-category-drawer' : undefined} aria-haspopup={isMobile ? 'dialog' : undefined}
              style={{ display: 'flex', alignItems: 'center', gap: 9, background: T.blue, color: '#fff', border: 'none', padding: '10px 16px', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: F }}
              onClick={() => { if (isMobile) setDrawer((d) => !d); else openCat(); }}>
              <Icon name="menu" size={18} color="#fff" /> All Categories</button>
            <div className="ka-nav-spacer" style={{ flex: 1 }} />
            <span className="ka-rare" role="button" tabIndex={0} style={{ display: 'flex', alignItems: 'center', gap: 7, color: T.amberInk, background: '#FFF4DC', padding: '7px 13px', borderRadius: 9, fontWeight: 800, cursor: 'pointer' }} onClick={() => ModalStore.open('inquiry')} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ModalStore.open('inquiry'); } }}>
              <Icon name="search" size={16} color={T.amberInk} /> Source a Rare Part</span>
          </div>
        </div>
        <CategoryDrawer open={isMobile && drawer} onClose={() => setDrawer(false)} openCat={openCat} trackOrder={trackOrder} returnRef={catBtnRef} />

        {/* hero */}
        <div className="ka-hero ka-gut" style={{ padding: '24px 40px 0', display: 'grid', gridTemplateColumns: '236px 1fr', gap: 18 }}>
          <div className="ka-sidebar" style={{ border: `1px solid ${T.line}`, borderRadius: 14, overflow: 'hidden', background: '#fff' }}>
            {CATEGORIES.map((c, i) => <div key={c.name} onClick={() => openCat(c.name)} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 15px', fontSize: 13.5, fontWeight: 600, color: T.ink, borderBottom: i < CATEGORIES.length - 1 ? `1px solid ${T.line}` : 'none', cursor: 'pointer' }}>
              <Icon name={c.icon} size={19} color={T.blue} stroke={1.6} /><span style={{ flex: 1 }}>{c.name}</span><Icon name="chevron" size={14} color={T.sub} /></div>)}
          </div>
          <div className="ka-banner" style={{ borderRadius: 16, overflow: 'hidden', position: 'relative', background: `linear-gradient(120deg, ${T.blueDk}, ${T.blue})`, color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '54px 60px', minHeight: 392 }}>
            <HeroSlideshow />
            <div className="ka-banner-deco" style={{ position: 'absolute', right: -40, top: -40, width: 320, height: 320, borderRadius: '50%', background: 'rgba(255,255,255,.07)' }} />
            <div className="ka-banner-deco" style={{ position: 'absolute', right: 60, bottom: -60, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,176,32,.16)' }} />
            <Pill bg="rgba(255,255,255,.16)" color="#fff" style={{ alignSelf: 'flex-start', marginBottom: 16, position: 'relative', zIndex: 2 }}>Industrial Supply, Delivered</Pill>
            <div className="ka-hero-h1" style={{ fontSize: 54, fontWeight: 800, lineHeight: 1.06, letterSpacing: -1.4, maxWidth: 620, position: 'relative', zIndex: 2 }}>Every component your project runs on.</div>
            <div className="ka-hero-sub" style={{ fontSize: 19, color: 'rgba(255,255,255,.85)', margin: '16px 0 30px', maxWidth: 560, lineHeight: 1.5, position: 'relative', zIndex: 2 }}>Genuine ABB, Schneider & Siemens stock — priced in UGX, USD or EUR with same-day Kampala dispatch.</div>
            <div className="ka-hero-ctas" style={{ display: 'flex', gap: 12, position: 'relative', zIndex: 2 }}>
              <button style={{ background: T.amber, color: T.amberInk, border: 'none', padding: '15px 28px', borderRadius: 11, fontSize: 16, fontWeight: 800, cursor: 'pointer', fontFamily: F }} onClick={() => openCat()}>Shop catalog</button>
              <button style={{ background: 'rgba(255,255,255,.14)', color: '#fff', border: '1px solid rgba(255,255,255,.3)', padding: '15px 28px', borderRadius: 11, fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: F }} onClick={viewBrands}>View brands</button>
            </div>
          </div>
        </div>

        {/* trust strip */}
        <div className="ka-gut" style={{ padding: '22px 40px 0' }}>
          <div className="ka-trust" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
            {[['truck', 'Same-day dispatch', 'On Kampala stock orders'], ['shield', '100% genuine', 'Authorised distributor'], ['doc', 'Datasheets included', 'Specs & certs on every SKU'], ['user', 'Engineer support', 'Mon–Sat · +256 764 250 125']].map(([ic, a, b]) => (
              <div key={a} style={{ display: 'flex', alignItems: 'center', gap: 13, border: `1px solid ${T.line}`, borderRadius: 13, padding: '15px 17px', background: '#fff' }}>
                <div style={{ width: 42, height: 42, borderRadius: 11, background: T.chip, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={ic} size={22} color={T.blue} stroke={1.7} /></div>
                <div><div style={{ fontSize: 14, fontWeight: 800 }}>{a}</div><div style={{ fontSize: 12.5, color: T.sub, fontWeight: 600 }}>{b}</div></div>
              </div>))}
          </div>
        </div>

        {/* flash deals */}
        <div className="ka-gut" style={{ padding: '30px 40px 0' }}>
          <div style={{ border: `1px solid ${T.line}`, borderRadius: 18, overflow: 'hidden' }}>
            <div className="ka-flash-head" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', background: 'linear-gradient(90deg,#FFF1F1,#FFF7EC)', borderBottom: `1px solid ${T.line}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: T.red, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="fire" size={24} color="#fff" /></div>
                <div><div style={{ fontSize: 21, fontWeight: 800, letterSpacing: -0.4 }}>Flash Deals</div><div style={{ fontSize: 13, color: T.sub, fontWeight: 600 }}>Today's lowest prices — going fast</div></div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}><span style={{ fontSize: 13, fontWeight: 700, color: T.sub }}>Ends in</span><Countdown /></div>
            </div>
            <div className="ka-flash-body" style={{ padding: 20 }}>
              <Carousel items={FLASH} emptyMsg="No flash deals available right now." accent={T.red} flame={true} />
            </div>
          </div>
        </div>

        {/* featured products */}
        <div className="ka-gut" style={{ padding: '34px 40px 0' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ fontSize: 23, fontWeight: 800, letterSpacing: -0.5 }}>Popular this week</div>
            <span style={{ fontSize: 14, fontWeight: 700, color: T.blue, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }} onClick={() => openCat()}>View all <Icon name="arrowRight" size={16} color={T.blue} /></span>
          </div>
          <Carousel items={POPULAR} emptyMsg="No popular items at the moment." accent={T.blue} />
        </div>

        {/* RFQ banner */}
        <div className="ka-gut" style={{ padding: '34px 40px 0' }}>
          <div className="ka-rfq" style={{ borderRadius: 18, overflow: 'hidden', background: `linear-gradient(115deg, ${T.ink}, #16284A)`, color: '#fff', display: 'grid', gridTemplateColumns: '1.4fr 1fr', position: 'relative' }}>
            <div className="ka-rfq-main" style={{ padding: '40px 44px' }}>
              <Pill bg="rgba(255,176,32,.2)" color={T.amber} style={{ marginBottom: 16 }}>Rare Inquiry · RFQ</Pill>
              <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: -0.8, lineHeight: 1.12, maxWidth: 480 }}>Obsolete, hard-to-find or bulk? We'll source it for you.</div>
              <div style={{ fontSize: 15.5, color: 'rgba(255,255,255,.82)', margin: '14px 0 24px', maxWidth: 460, lineHeight: 1.5 }}>Upload a datasheet or photo, set your quantity, and pick your currency. Our procurement team replies with a locked quote.</div>
              <div className="ka-rfq-ctas" style={{ display: 'flex', gap: 12 }}>
                <button style={{ background: T.amber, color: T.amberInk, border: 'none', padding: '13px 24px', borderRadius: 11, fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: F }} onClick={() => ModalStore.open('inquiry')}>Start an inquiry</button>
                <button style={{ background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,.3)', padding: '13px 24px', borderRadius: 11, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: F }}>How it works</button>
              </div>
            </div>
            <div className="ka-rfq-steps" style={{ borderLeft: '1px solid rgba(255,255,255,.12)', padding: '32px 36px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 14 }}>
              {[['1', 'Submit your spec', 'Part number, photo or datasheet'], ['2', 'Get a locked quote', 'In UGX, USD or EUR within 24h'], ['3', 'Confirm & pay', 'MoMo, card or trade terms']].map(([n, a, b]) => (
                <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 999, border: `2px solid ${T.amber}`, color: T.amber, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 15, flexShrink: 0 }}>{n}</div>
                  <div><div style={{ fontSize: 15, fontWeight: 800 }}>{a}</div><div style={{ fontSize: 13, color: 'rgba(255,255,255,.7)', fontWeight: 600 }}>{b}</div></div>
                </div>))}
            </div>
          </div>
        </div>

        {/* brands */}
        <div className="ka-gut" style={{ padding: '34px 40px 0' }} ref={brandsRef}>
          <div style={{ fontSize: 13, fontWeight: 800, color: T.sub, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>Genuine distributor for</div>
          <div className="ka-brands" style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 12 }}>
            {['A', 'B', 'C', 'D', 'E', 'F'].map((k) => <DistributorLogo key={k} k={k} />)}
          </div>
        </div>

        {/* footer */}
        <div className="ka-footer ka-gut" style={{ marginTop: 40, background: T.ink, color: 'rgba(255,255,255,.7)', padding: '40px 40px 28px' }}>
          <div className="ka-footer-grid" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr', gap: 30, paddingBottom: 28, borderBottom: '1px solid rgba(255,255,255,.12)' }}>
            <div>
              <div style={{ marginBottom: 12 }}><PPSLogo size={38} tile="#fff" peak={T.blue} cap={T.amber} text="#fff" sub="rgba(255,255,255,.6)" shadow={false} /></div>
              <div style={{ fontSize: 13.5, lineHeight: 1.6, maxWidth: 280 }}>Uganda's electrical supply marketplace — industrial, mechanical & domestic. Plot 14, Industrial Area, Kampala.</div>
            </div>
            {[
              ['Shop', [
                ['Circuit Protection', () => ModalStore.open('catalogue', { category: 'Circuit Protection' })],
                ['Cables & Wiring', () => ModalStore.open('catalogue', { category: 'Cables & Wiring' })],
                ['Motors & Drives', () => ModalStore.open('catalogue', { category: 'Motors & Drives' })],
                ['Lighting', () => ModalStore.open('catalogue', { category: 'Lighting' })],
              ]],
              ['Services', [
                ['Source a Rare Part', () => ModalStore.open('inquiry')],
                ['Trade Accounts', () => ModalStore.open('inquiry', { service: 'Trade Accounts' })],
                ['Bulk Quotes', () => ModalStore.open('inquiry', { service: 'Bulk Quotes' })],
                ['Delivery', () => ModalStore.open('inquiry', { service: 'Delivery' })],
              ]],
              ['Company', [
                ['About', () => ModalStore.open('about')],
                ['Contact', () => ModalStore.open('about', { scrollTo: 'contact' })],
                ['Careers', () => ToastStore.push("We're always looking for talented people — send your CV to kavogrid@gmail.com.", { title: 'Careers at KAVO', icon: 'user', tone: 'info' })],
              ]],
            ].map(([h, items]) => (
              <div key={h}><div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 12 }}>{h}</div>
                {items.map(([label, onClick]) => <FooterLink key={label} label={label} onClick={onClick} />)}</div>))}
          </div>
          <div className="ka-footer-bottom" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 20, fontSize: 13 }}>
            <span>© 2026 KAVO (U) Ltd. All prices incl. VAT.</span>
            <span className="ka-pay" style={{ display: 'flex', gap: 10 }}>{['MTN MoMo', 'Airtel', 'Visa', 'Mastercard', 'PayPal'].map((p) => <span key={p} style={{ background: 'rgba(255,255,255,.1)', padding: '5px 11px', borderRadius: 7, fontSize: 12, fontWeight: 700, color: '#fff' }}>{p}</span>)}</span>
          </div>
        </div>
        <CommerceHost />
      </div>
    );
  }
  window.HomeA = HomeA;
})();
