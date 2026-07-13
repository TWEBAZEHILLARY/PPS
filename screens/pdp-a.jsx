// pdp-a.jsx — Direction A · "Voltway" — Product Detail
(function () {
  const T = {
    ink: '#0B1A33', sub: '#5A6B85', blue: '#1457E6', blueDk: '#0E3FB0', amber: '#FFB020', amberInk: '#5A3A00',
    surface: '#F4F7FC', line: '#E4E9F2', chip: '#EEF3FC', green: '#119C5B', red: '#E5484D',
  };
  const F = "'Plus Jakarta Sans', system-ui, sans-serif";
  const { Icon, Stars, AnimatedPrice, CurrencySwitch, ProductShot, PRODUCTS, PPSLogo, ppsGo } = window;
  const curTheme = { bg: 'rgba(255,255,255,.14)', active: '#fff', activeText: T.blue, idle: 'transparent', idleText: 'rgba(255,255,255,.85)' };

  const VARIANTS = [
    { a: '40A', ugx: 412000, icon: 'breaker' }, { a: '63A', ugx: 486000, icon: 'breaker' },
    { a: '100A', ugx: 624000, icon: 'breaker' }, { a: '160A', ugx: 812000, icon: 'breaker' },
  ];
  const TIERS = [{ q: '1–4', mult: 1 }, { q: '5–9', mult: 0.94 }, { q: '10–24', mult: 0.88 }, { q: '25+', mult: 0.81 }];

  function PDPA() {
    const [vi, setVi] = React.useState(1);
    const [qty, setQty] = React.useState(1);
    const [tab, setTab] = React.useState('specs');
    const [thumb, setThumb] = React.useState(0);
    const v = VARIANTS[vi];
    const tierIdx = qty >= 25 ? 3 : qty >= 10 ? 2 : qty >= 5 ? 1 : 0;
    const unit = Math.round(v.ugx * TIERS[tierIdx].mult);

    return (
      <div style={{ fontFamily: F, background: '#fff', color: T.ink, width: '100%', WebkitFontSmoothing: 'antialiased' }}>
        {/* compact header */}
        <div style={{ background: T.ink, color: '#fff', height: 40, padding: '0 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,.85)', fontWeight: 600 }}><Icon name="truck" size={15} color={T.amber} /> Free Kampala delivery over USh 500,000</span>
          <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}><CurrencySwitch theme={curTheme} size="sm" /><span style={{ color: 'rgba(255,255,255,.85)', fontWeight: 600 }}>Track order</span></div>
        </div>
        <div style={{ borderBottom: `1px solid ${T.line}`, padding: '0 40px', height: 72, display: 'flex', alignItems: 'center', gap: 26 }}>
          <PPSLogo size={40} onClick={() => ppsGo('home')} />
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', height: 46, border: `2px solid ${T.blue}`, borderRadius: 12, overflow: 'hidden' }}>
            <input readOnly placeholder="Search products…" style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, padding: '0 16px', fontFamily: F, background: 'transparent', color: T.ink }} />
            <button style={{ height: '100%', border: 'none', background: T.blue, color: '#fff', padding: '0 20px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><Icon name="search" size={19} color="#fff" /></button>
          </div>
          <button style={{ position: 'relative', border: 'none', background: 'none', cursor: 'pointer', color: T.ink }}><Icon name="cart" size={24} /><span style={{ position: 'absolute', top: -6, right: -8, background: T.amber, color: T.amberInk, fontSize: 11, fontWeight: 800, width: 18, height: 18, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>3</span></button>
        </div>

        {/* breadcrumb */}
        <div style={{ padding: '16px 40px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: T.sub, fontWeight: 600 }}>
          {['Home', 'Circuit Protection', 'MCCB', 'ABB Tmax XT'].map((b, i, a) => <React.Fragment key={b}><span onClick={() => b === 'Home' && ppsGo('home')} style={{ cursor: 'pointer', color: i === a.length - 1 ? T.ink : T.sub }}>{b}</span>{i < a.length - 1 && <Icon name="chevron" size={13} color={T.sub} />}</React.Fragment>)}
        </div>

        {/* main */}
        <div style={{ padding: '4px 40px 0', display: 'grid', gridTemplateColumns: '1fr 1fr 360px', gap: 28 }}>
          {/* gallery */}
          <div>
            <div style={{ border: `1px solid ${T.line}`, borderRadius: 16, height: 440, background: T.surface, position: 'relative', overflow: 'hidden' }}>
              <ProductShot icon={v.icon} bg={T.surface} tint="#A6B4CC" pad={40} />
              <div style={{ position: 'absolute', top: 14, left: 14, background: T.ink, color: '#fff', fontSize: 11.5, fontWeight: 800, padding: '5px 11px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: 0.3 }}>Best Seller</div>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 14 }}>
              {['breaker', 'panel', 'doc', 'contactor'].map((ic, i) => <div key={i} onClick={() => setThumb(i)} style={{ width: 84, height: 84, borderRadius: 11, border: `2px solid ${thumb === i ? T.blue : T.line}`, background: T.surface, cursor: 'pointer', overflow: 'hidden' }}><ProductShot icon={ic} bg={T.surface} tint="#A6B4CC" pad={16} /></div>)}
            </div>
          </div>

          {/* info */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: T.blue, letterSpacing: 0.4, textTransform: 'uppercase' }}>ABB · Authorised</div>
            <div style={{ fontSize: 27, fontWeight: 800, letterSpacing: -0.6, lineHeight: 1.18, margin: '8px 0 12px' }}>Tmax XT2N 3-Pole Moulded Case Circuit Breaker {v.a} 415V</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}><Stars value={4.7} size={16} /><span style={{ fontSize: 13.5, fontWeight: 700 }}>4.7</span><span style={{ fontSize: 13.5, color: T.sub }}>128 reviews</span></div>
              <span style={{ color: T.line }}>|</span><span style={{ fontSize: 13.5, color: T.sub, fontWeight: 600 }}>SKU ABB-XT2N-{v.a}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 700, color: T.green, marginLeft: 'auto' }}><span style={{ width: 7, height: 7, borderRadius: 999, background: T.green }} /> In stock · 42 units</span>
            </div>
            <div style={{ background: T.surface, borderRadius: 14, padding: '18px 20px', marginBottom: 20 }}>
              <div style={{ fontSize: 13.5, color: T.sub, fontWeight: 700, marginBottom: 8 }}>Key specifications</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 24px' }}>{[['Rated current', v.a], ['Poles', '3P'], ['Breaking cap.', '36 kA'], ['Voltage', '415 V AC'], ['Trip unit', 'Thermomagnetic'], ['Standard', 'IEC 60947-2']].map(([k, val]) => <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5 }}><span style={{ color: T.sub }}>{k}</span><span style={{ fontWeight: 700 }}>{val}</span></div>)}</div>
            </div>
            {/* variant */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13.5, fontWeight: 800, marginBottom: 10 }}>Rated current: <span style={{ color: T.blue }}>{v.a}</span></div>
              <div style={{ display: 'flex', gap: 10 }}>{VARIANTS.map((vv, i) => <button key={vv.a} onClick={() => setVi(i)} style={{ flex: 1, padding: '12px 0', borderRadius: 11, border: `2px solid ${i === vi ? T.blue : T.line}`, background: i === vi ? T.chip : '#fff', cursor: 'pointer', fontFamily: F, transition: 'all .15s' }}><div style={{ fontSize: 15, fontWeight: 800, color: i === vi ? T.blue : T.ink }}>{vv.a}</div><div style={{ fontSize: 11.5, color: T.sub, marginTop: 2 }}><AnimatedPrice ugx={vv.ugx} style={{ fontSize: 11.5 }} /></div></button>)}</div>
            </div>
            {/* bulk tiers */}
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 800, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>Bulk tier pricing <span style={{ fontSize: 11.5, fontWeight: 800, color: T.green, background: '#E6F6EE', padding: '3px 8px', borderRadius: 999 }}>SAVE UP TO 19%</span></div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>{TIERS.map((t, i) => { const on = i === tierIdx; return <div key={t.q} style={{ border: `2px solid ${on ? T.amber : T.line}`, background: on ? '#FFF8EA' : '#fff', borderRadius: 11, padding: '12px 10px', textAlign: 'center', boxShadow: on ? '0 0 0 4px rgba(255,176,32,.18)' : 'none', transition: 'all .2s' }}><div style={{ fontSize: 12.5, color: T.sub, fontWeight: 700 }}>{t.q} pcs</div><AnimatedPrice ugx={Math.round(v.ugx * t.mult)} style={{ fontSize: 14.5, fontWeight: 800, color: on ? T.amberInk : T.ink, display: 'block', marginTop: 4 }} /></div>; })}</div>
            </div>
          </div>

          {/* buy box */}
          <div>
            <div style={{ border: `1px solid ${T.line}`, borderRadius: 16, padding: '22px 22px', position: 'sticky', top: 20, boxShadow: '0 8px 30px rgba(11,26,51,.07)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}><AnimatedPrice ugx={unit} style={{ fontSize: 32, fontWeight: 800, color: T.ink }} />{tierIdx > 0 && <span style={{ fontSize: 13, color: T.green, fontWeight: 800, marginBottom: 6 }}>tier price</span>}</div>
              <div style={{ fontSize: 13, color: T.sub, marginTop: 2 }}>per unit · incl. VAT</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '16px 0', padding: '11px 14px', background: T.surface, borderRadius: 11, fontSize: 13.5, fontWeight: 600 }}><Icon name="truck" size={18} color={T.blue} /> Dispatched today if ordered by 4 PM</div>
              {/* qty */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}><span style={{ fontSize: 14, fontWeight: 700 }}>Quantity</span>
                <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${T.line}`, borderRadius: 10, overflow: 'hidden' }}>
                  <button onClick={() => setQty((q) => Math.max(1, q - 1))} style={{ width: 38, height: 40, border: 'none', background: '#fff', cursor: 'pointer', color: T.ink, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="minus" size={16} /></button>
                  <span style={{ width: 46, textAlign: 'center', fontSize: 16, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{qty}</span>
                  <button onClick={() => setQty((q) => q + 1)} style={{ width: 38, height: 40, border: 'none', background: '#fff', cursor: 'pointer', color: T.ink, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="plus" size={16} /></button>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 16, fontWeight: 700 }}><span style={{ color: T.sub }}>Subtotal ({qty})</span><AnimatedPrice ugx={unit * qty} style={{ fontSize: 16, fontWeight: 800, color: T.ink }} /></div>
              <button style={{ width: '100%', background: T.blue, color: '#fff', border: 'none', padding: '15px', borderRadius: 12, fontSize: 15.5, fontWeight: 800, cursor: 'pointer', fontFamily: F, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, whiteSpace: 'nowrap', boxShadow: '0 8px 20px rgba(20,87,230,.3)' }}><Icon name="cart" size={20} color="#fff" /> Add to Cart</button>
              <button style={{ width: '100%', background: '#fff', color: T.amberInk, border: `2px solid ${T.amber}`, padding: '13px', borderRadius: 12, fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: F, marginTop: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, whiteSpace: 'nowrap' }}><Icon name="search" size={19} color={T.amberInk} /> Request a Bulk Quote</button>
              <div style={{ display: 'flex', gap: 8, marginTop: 16, paddingTop: 16, borderTop: `1px solid ${T.line}` }}>
                <button style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, border: `1px solid ${T.line}`, background: '#fff', padding: '10px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', color: T.ink, fontFamily: F }}><Icon name="heart" size={17} color={T.sub} /> Save</button>
                <button style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, border: `1px solid ${T.line}`, background: '#fff', padding: '10px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', color: T.ink, fontFamily: F }}><Icon name="download" size={17} color={T.sub} /> Datasheet</button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 14, fontSize: 12.5, color: T.sub, fontWeight: 600 }}><Icon name="shield" size={17} color={T.green} /> Genuine ABB · 24-month warranty</div>
            </div>
          </div>
        </div>

        {/* tabs */}
        <div style={{ padding: '40px 40px 0' }}>
          <div style={{ display: 'flex', gap: 4, borderBottom: `2px solid ${T.line}`, marginBottom: 24 }}>
            {[['specs', 'Specifications'], ['datasheet', 'Documents'], ['qa', 'Q&A (14)'], ['reviews', 'Reviews (128)']].map(([k, l]) => <button key={k} onClick={() => setTab(k)} style={{ border: 'none', background: 'none', padding: '12px 18px', fontSize: 15, fontWeight: 700, cursor: 'pointer', color: tab === k ? T.blue : T.sub, borderBottom: `3px solid ${tab === k ? T.blue : 'transparent'}`, marginBottom: -2, fontFamily: F }}>{l}</button>)}
          </div>
          {tab === 'specs' && <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 60px' }}>{[['Rated current (In)', v.a], ['Number of poles', '3'], ['Rated voltage (Ue)', '415 V AC'], ['Breaking capacity (Icu)', '36 kA @ 415V'], ['Trip unit type', 'Thermomagnetic TMD'], ['Frame size', 'XT2 160'], ['Standard', 'IEC/EN 60947-2'], ['Terminal type', 'Front, screw'], ['Operating temp.', '−25 °C to +70 °C'], ['Mounting', 'DIN rail / plate'], ['Degree of protection', 'IP40 (terminals)'], ['Mechanical life', '25,000 ops']].map(([k, val], i) => <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '13px 4px', borderBottom: `1px solid ${T.line}`, fontSize: 14 }}><span style={{ color: T.sub }}>{k}</span><span style={{ fontWeight: 700, textAlign: 'right' }}>{val}</span></div>)}</div>}
          {tab === 'datasheet' && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>{[['Technical datasheet', 'PDF · 2.4 MB'], ['Installation guide', 'PDF · 1.1 MB'], ['CE declaration', 'PDF · 480 KB'], ['CAD drawing', 'DWG · 3.2 MB'], ['Trip curves', 'PDF · 760 KB'], ['Warranty terms', 'PDF · 220 KB']].map(([a, b]) => <div key={a} style={{ display: 'flex', alignItems: 'center', gap: 14, border: `1px solid ${T.line}`, borderRadius: 12, padding: '16px 18px', cursor: 'pointer' }}><div style={{ width: 42, height: 42, borderRadius: 10, background: T.chip, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="doc" size={22} color={T.blue} /></div><div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 700 }}>{a}</div><div style={{ fontSize: 12.5, color: T.sub }}>{b}</div></div><Icon name="download" size={20} color={T.sub} /></div>)}</div>}
          {tab === 'qa' && <div style={{ maxWidth: 760 }}>{[['Is this compatible with the XT2 motor protection trip unit?', 'Yes — the XT2N frame accepts both thermomagnetic and electronic Ekip trip units.'], ['Do you supply matching auxiliary contacts?', 'We stock the AUX-C and SOR shunt-trip accessories — search ABB-XT-AUX.'], ['What lead time for 50+ units?', 'Stock covers up to 42 units same-day; larger volumes ship within 5 working days.']].map(([q, a]) => <div key={q} style={{ padding: '16px 0', borderBottom: `1px solid ${T.line}` }}><div style={{ display: 'flex', gap: 10, fontSize: 15, fontWeight: 700, marginBottom: 8 }}><span style={{ color: T.blue }}>Q</span>{q}</div><div style={{ display: 'flex', gap: 10, fontSize: 14, color: T.sub, lineHeight: 1.5 }}><span style={{ color: T.green, fontWeight: 800 }}>A</span>{a}</div></div>)}</div>}
          {tab === 'reviews' && <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 40 }}><div style={{ textAlign: 'center', border: `1px solid ${T.line}`, borderRadius: 14, padding: 24 }}><div style={{ fontSize: 48, fontWeight: 800 }}>4.7</div><Stars value={4.7} size={20} /><div style={{ fontSize: 13, color: T.sub, marginTop: 8 }}>128 verified reviews</div></div><div>{[['Okello E.', 5, 'Genuine ABB, sealed packaging. Fitted into our XT2 panel without issue.'], ['Nakato Engineering', 5, 'Ordered 12 for a switchboard build — bulk tier pricing saved us real money.'], ['Bwambale P.', 4, 'Good breaker, fast Kampala delivery. Datasheet download was handy.']].map(([n, r, t]) => <div key={n} style={{ padding: '16px 0', borderBottom: `1px solid ${T.line}` }}><div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}><span style={{ fontSize: 14, fontWeight: 800 }}>{n}</span><Stars value={r} size={14} /><span style={{ fontSize: 12, color: T.green, fontWeight: 700, background: '#E6F6EE', padding: '2px 8px', borderRadius: 999 }}>Verified</span></div><div style={{ fontSize: 14, color: T.sub, lineHeight: 1.5 }}>{t}</div></div>)}</div></div>}
        </div>

        {/* related */}
        <div style={{ padding: '40px 40px 48px' }}>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5, marginBottom: 16 }}>Frequently bought together</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>{[PRODUCTS[1], PRODUCTS[4], PRODUCTS[5], PRODUCTS[8]].map((p) => <div key={p.id} onClick={() => ppsGo('product')} style={{ border: `1px solid ${T.line}`, borderRadius: 14, overflow: 'hidden', cursor: 'pointer' }}><div style={{ height: 150, background: T.surface, borderBottom: `1px solid ${T.line}` }}><ProductShot icon={p.icon} bg={T.surface} tint="#A6B4CC" /></div><div style={{ padding: '13px 14px' }}><div style={{ fontSize: 11.5, fontWeight: 800, color: T.blue, textTransform: 'uppercase' }}>{p.brand}</div><div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.3, margin: '5px 0 8px', minHeight: 35 }}>{p.name}</div><AnimatedPrice ugx={p.ugx} style={{ fontSize: 16, fontWeight: 800 }} /></div></div>)}</div>
        </div>
      </div>
    );
  }
  window.PDPA = PDPA;
})();
