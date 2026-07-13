// pdp-c.jsx — Direction C · "Circuit" — Product Detail (industrial · procurement item)
(function () {
  const T = { ink: '#14171A', graphite: '#1E2327', orange: '#FF5A1F', surface: '#F4F4F0', card: '#FFFFFF', line: '#E2E2DB', sub: '#6C727A', green: '#19A86B' };
  const FS = "'IBM Plex Sans', system-ui, sans-serif";
  const FM = "'IBM Plex Mono', ui-monospace, monospace";
  const { Icon, Stars, AnimatedPrice, CurrencySwitch, ProductShot, PRODUCTS } = window;
  const curTheme = { bg: 'rgba(255,255,255,.1)', active: T.orange, activeText: '#fff', idle: 'transparent', idleText: 'rgba(255,255,255,.7)' };
  const Mono = ({ children, style }) => <span style={{ fontFamily: FM, ...style }}>{children}</span>;

  const VARIANTS = [{ a: '0.6 m', ugx: 2480000 }, { a: '0.9 m', ugx: 2840000 }, { a: '1.2 m', ugx: 3180000 }, { a: '1.5 m', ugx: 3620000 }];
  const TIERS = [{ q: '1', mult: 1 }, { q: '2–4', mult: 0.96 }, { q: '5–9', mult: 0.91 }, { q: '10+', mult: 0.85 }];

  function PDPC() {
    const [vi, setVi] = React.useState(2);
    const [qty, setQty] = React.useState(1);
    const [thumb, setThumb] = React.useState(0);
    const [tab, setTab] = React.useState('specs');
    const v = VARIANTS[vi];
    const tierIdx = qty >= 10 ? 3 : qty >= 5 ? 2 : qty >= 2 ? 1 : 0;
    const unit = Math.round(v.ugx * TIERS[tierIdx].mult);

    return (
      <div style={{ fontFamily: FS, background: T.surface, color: T.ink, width: '100%', WebkitFontSmoothing: 'antialiased' }}>
        {/* top bar */}
        <div style={{ background: T.ink, color: '#fff', height: 40, padding: '0 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><Mono style={{ fontSize: 12, color: 'rgba(255,255,255,.75)', letterSpacing: 0.5 }}>ELECTRICAL SUPPLY · KAMPALA UG · 3 CURRENCIES</Mono><div style={{ display: 'flex', gap: 20, alignItems: 'center' }}><CurrencySwitch theme={curTheme} size="sm" /><Mono style={{ fontSize: 12, color: 'rgba(255,255,255,.75)' }}>SIGN IN</Mono></div></div>
        <div style={{ background: T.card, borderBottom: `1px solid ${T.line}`, padding: '0 40px', height: 72, display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><div style={{ width: 34, height: 34, background: T.orange, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="bolt" size={20} color="#fff" fill="#fff" /></div><div style={{ fontWeight: 700, fontSize: 21, letterSpacing: 2 }}>CIRCUIT</div></div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', height: 46, border: `2px solid ${T.ink}`, background: '#fff' }}><input readOnly placeholder="Part number, brand or spec…" style={{ flex: 1, border: 'none', outline: 'none', fontFamily: FM, fontSize: 13, padding: '0 15px', background: 'transparent', color: T.ink }} /><button style={{ height: '100%', border: 'none', background: T.ink, color: '#fff', padding: '0 18px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><Icon name="search" size={18} color="#fff" /></button></div>
          <button style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 9, border: 'none', background: T.ink, color: '#fff', cursor: 'pointer', padding: '11px 14px' }}><Icon name="cart" size={20} color="#fff" /><Mono style={{ fontSize: 12 }}>3 · </Mono><AnimatedPrice ugx={894000} style={{ fontSize: 12.5, fontWeight: 600, fontFamily: FM }} symStyle={{ fontFamily: FM }} /></button>
        </div>

        <div style={{ padding: '16px 40px 0', display: 'flex', alignItems: 'center', gap: 8 }}>{['HOME', 'AUTOMATION', 'SAFETY', 'SIRIUS'].map((b, i, a) => <React.Fragment key={b}><Mono style={{ fontSize: 11.5, color: i === a.length - 1 ? T.ink : T.sub, fontWeight: i === a.length - 1 ? 600 : 400, cursor: 'pointer' }}>{b}</Mono>{i < a.length - 1 && <Mono style={{ fontSize: 11.5, color: T.sub }}>/</Mono>}</React.Fragment>)}</div>

        {/* main */}
        <div style={{ padding: '16px 40px 0', display: 'grid', gridTemplateColumns: '1fr 1fr 380px', gap: 24 }}>
          {/* gallery */}
          <div>
            <div style={{ border: `1px solid ${T.line}`, background: T.card, height: 420, position: 'relative', overflow: 'hidden' }}>
              <ProductShot icon="sensor" bg={T.card} tint="#9BA298" radius={0} pad={40} />
              <div style={{ position: 'absolute', top: 0, left: 0, background: T.ink, color: '#fff', fontFamily: FM, fontSize: 11, padding: '5px 10px' }}>SIEMENS · TYPE 4</div>
              <div style={{ position: 'absolute', top: 0, right: 0, background: T.orange, color: '#fff', fontFamily: FM, fontSize: 11, padding: '5px 10px' }}>MADE TO ORDER</div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>{['sensor', 'panel', 'doc', 'contactor'].map((ic, i) => <div key={i} onClick={() => setThumb(i)} style={{ width: 80, height: 80, border: `2px solid ${thumb === i ? T.orange : T.line}`, background: T.card, cursor: 'pointer', overflow: 'hidden' }}><ProductShot icon={ic} bg={T.card} tint="#9BA298" radius={0} pad={14} /></div>)}</div>
          </div>

          {/* info */}
          <div>
            <Mono style={{ fontSize: 11.5, color: T.sub, display: 'block', marginBottom: 8 }}>SKU SIE-SIRIUS-{vi}{vi}4</Mono>
            <div style={{ fontSize: 25, fontWeight: 700, letterSpacing: -0.5, lineHeight: 1.2, marginBottom: 12 }}>SIRIUS Safety Light Curtain 14 mm · {v.a} Protected Height</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}><Stars value={5} size={15} color={T.orange} /><Mono style={{ fontSize: 12.5, color: T.sub }}>5.0 / 12 reviews</Mono><Mono style={{ fontSize: 11.5, color: '#fff', background: T.orange, padding: '3px 8px' }}>PRO</Mono></div>

            {/* spec strip */}
            <div style={{ border: `1px solid ${T.line}`, background: T.card, marginBottom: 20 }}>
              <div style={{ background: T.graphite, color: '#fff', padding: '8px 14px' }}><Mono style={{ fontSize: 11.5, letterSpacing: 1 }}>KEY SPECIFICATIONS</Mono></div>
              {[['Type / category', 'Type 4 · PLe'], ['Resolution', '14 mm (finger)'], ['Protected height', v.a], ['Range', '0.3 – 6 m'], ['Response time', '≤ 10 ms'], ['Interface', 'PROFIsafe / IO-Link']].map(([k, val], i) => <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 14px', borderTop: i ? `1px solid ${T.line}` : 'none' }}><Mono style={{ fontSize: 12, color: T.sub }}>{k}</Mono><Mono style={{ fontSize: 12, fontWeight: 600 }}>{val}</Mono></div>)}
            </div>

            {/* variant */}
            <div style={{ marginBottom: 20 }}>
              <Mono style={{ fontSize: 12, fontWeight: 600, letterSpacing: 0.5, display: 'block', marginBottom: 10 }}>PROTECTED HEIGHT — {v.a.toUpperCase()}</Mono>
              <div style={{ display: 'flex', gap: 8 }}>{VARIANTS.map((vv, i) => <button key={vv.a} onClick={() => setVi(i)} style={{ flex: 1, padding: '12px 0', border: `2px solid ${i === vi ? T.orange : T.line}`, background: i === vi ? T.ink : '#fff', color: i === vi ? '#fff' : T.ink, cursor: 'pointer', fontFamily: FM, fontSize: 13, fontWeight: 600 }}>{vv.a}</button>)}</div>
            </div>

            {/* tiers */}
            <div>
              <Mono style={{ fontSize: 12, fontWeight: 600, letterSpacing: 0.5, display: 'block', marginBottom: 10 }}>VOLUME PRICING <span style={{ color: T.orange }}>· SAVE TO 15%</span></Mono>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>{TIERS.map((t, i) => { const on = i === tierIdx; return <div key={t.q} style={{ border: `2px solid ${on ? T.orange : T.line}`, background: on ? '#FFF2EC' : '#fff', padding: '11px 8px', textAlign: 'center' }}><Mono style={{ fontSize: 11, color: T.sub, display: 'block' }}>{t.q} UNIT{t.q === '1' ? '' : 'S'}</Mono><AnimatedPrice ugx={Math.round(v.ugx * t.mult)} style={{ fontSize: 13, fontWeight: 700, fontFamily: FM, display: 'block', marginTop: 4 }} symStyle={{ fontFamily: FM }} /></div>; })}</div>
            </div>
          </div>

          {/* buy box */}
          <div>
            <div style={{ border: `1px solid ${T.line}`, background: T.card, padding: '20px 20px', position: 'sticky', top: 16 }}>
              <AnimatedPrice ugx={unit} style={{ fontSize: 30, fontWeight: 700, fontFamily: FM }} symStyle={{ fontFamily: FM }} />
              <Mono style={{ fontSize: 11.5, color: T.sub, display: 'block', marginTop: 3 }}>PER UNIT · EXCL. VAT</Mono>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '16px 0', padding: '10px 12px', background: T.surface, border: `1px solid ${T.line}` }}><Icon name="clock" size={17} color={T.orange} /><Mono style={{ fontSize: 11.5, fontWeight: 500 }}>MADE TO ORDER · SHIPS 10–14 DAYS</Mono></div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}><Mono style={{ fontSize: 12, fontWeight: 600 }}>QUANTITY</Mono><div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${T.line}` }}><button onClick={() => setQty((q) => Math.max(1, q - 1))} style={{ width: 38, height: 40, border: 'none', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.ink }}><Icon name="minus" size={15} /></button><Mono style={{ width: 44, textAlign: 'center', fontSize: 15, fontWeight: 700 }}>{qty}</Mono><button onClick={() => setQty((q) => q + 1)} style={{ width: 38, height: 40, border: 'none', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.ink }}><Icon name="plus" size={15} /></button></div></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 0', borderTop: `1px solid ${T.line}`, borderBottom: `1px solid ${T.line}`, marginBottom: 16 }}><Mono style={{ fontSize: 12, color: T.sub }}>SUBTOTAL ({qty})</Mono><AnimatedPrice ugx={unit * qty} style={{ fontSize: 15, fontWeight: 700, fontFamily: FM }} symStyle={{ fontFamily: FM }} /></div>
              <button style={{ width: '100%', background: T.orange, color: '#fff', border: 'none', padding: '15px', fontFamily: FM, fontSize: 14, fontWeight: 600, letterSpacing: 0.5, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9 }}><Icon name="search" size={18} color="#fff" /> REQUEST THIS ITEM</button>
              <button style={{ width: '100%', background: '#fff', color: T.ink, border: `2px solid ${T.ink}`, padding: '13px', fontFamily: FM, fontSize: 13.5, fontWeight: 600, letterSpacing: 0.5, cursor: 'pointer', marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9 }}><Icon name="cart" size={17} /> ADD TO CART</button>
              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}><button style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, border: `1px solid ${T.line}`, background: '#fff', padding: '10px', cursor: 'pointer', color: T.ink }}><Icon name="download" size={16} color={T.sub} /><Mono style={{ fontSize: 11.5 }}>DATASHEET</Mono></button><button style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, border: `1px solid ${T.line}`, background: '#fff', padding: '10px', cursor: 'pointer', color: T.ink }}><Icon name="heart" size={16} color={T.sub} /><Mono style={{ fontSize: 11.5 }}>SAVE</Mono></button></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, paddingTop: 14, borderTop: `1px solid ${T.line}` }}><Icon name="shield" size={16} color={T.green} /><Mono style={{ fontSize: 11, color: T.sub }}>GENUINE SIEMENS · 24-MONTH WARRANTY</Mono></div>
            </div>
          </div>
        </div>

        {/* tabs */}
        <div style={{ padding: '36px 40px 0' }}>
          <div style={{ display: 'flex', gap: 0, borderBottom: `2px solid ${T.line}`, marginBottom: 22 }}>{[['specs', 'SPECIFICATIONS'], ['docs', 'DOCUMENTS'], ['qa', 'Q&A (8)'], ['reviews', 'REVIEWS (12)']].map(([k, l]) => <button key={k} onClick={() => setTab(k)} style={{ border: 'none', background: 'none', padding: '11px 18px', cursor: 'pointer', borderBottom: `3px solid ${tab === k ? T.orange : 'transparent'}`, marginBottom: -2 }}><Mono style={{ fontSize: 12.5, fontWeight: 600, color: tab === k ? T.ink : T.sub, letterSpacing: 0.5 }}>{l}</Mono></button>)}</div>
          {tab === 'specs' && <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 56px' }}>{[['Safety type', 'Type 4 (IEC 61496)'], ['Performance level', 'PLe / SIL 3'], ['Resolution', '14 mm finger detection'], ['Protected height', v.a], ['Number of beams', vi === 0 ? '40' : vi === 1 ? '60' : vi === 2 ? '80' : '100'], ['Operating range', '0.3 – 6 m'], ['Response time', '≤ 10 ms'], ['Supply voltage', '24 V DC ±20%'], ['Outputs', '2 × OSSD, PNP'], ['Enclosure', 'IP65 / IP67'], ['Interface', 'PROFIsafe / IO-Link'], ['Operating temp.', '−30 °C to +55 °C']].map(([k, val]) => <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 4px', borderBottom: `1px solid ${T.line}` }}><Mono style={{ fontSize: 12.5, color: T.sub }}>{k}</Mono><Mono style={{ fontSize: 12.5, fontWeight: 600, textAlign: 'right' }}>{val}</Mono></div>)}</div>}
          {tab === 'docs' && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>{[['Technical datasheet', 'PDF · 3.1 MB'], ['Operating instructions', 'PDF · 4.8 MB'], ['EC declaration', 'PDF · 320 KB'], ['CAD model (STEP)', 'ZIP · 6.4 MB'], ['Wiring diagram', 'PDF · 1.2 MB'], ['TÜV certificate', 'PDF · 540 KB']].map(([a, b]) => <div key={a} style={{ display: 'flex', alignItems: 'center', gap: 12, border: `1px solid ${T.line}`, background: T.card, padding: '14px 16px', cursor: 'pointer' }}><div style={{ width: 40, height: 40, border: `1px solid ${T.line}`, background: T.surface, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="doc" size={20} color={T.orange} /></div><div style={{ flex: 1 }}><div style={{ fontSize: 13.5, fontWeight: 600 }}>{a}</div><Mono style={{ fontSize: 11, color: T.sub }}>{b}</Mono></div><Icon name="download" size={18} color={T.sub} /></div>)}</div>}
          {tab === 'qa' && <div style={{ maxWidth: 760 }}>{[['Can this be cascaded for an L-shaped guarding zone?', 'Yes — up to 3 curtains can be series-connected via the muting interface module.'], ['Is the IO-Link variant in stock or made to order?', 'All protected-height variants are made to order; typical lead time is 10–14 days.']].map(([q, a]) => <div key={q} style={{ padding: '16px 0', borderBottom: `1px solid ${T.line}` }}><div style={{ display: 'flex', gap: 10, fontSize: 14.5, fontWeight: 600, marginBottom: 8 }}><Mono style={{ color: T.orange }}>Q</Mono>{q}</div><div style={{ display: 'flex', gap: 10, fontSize: 13.5, color: T.sub, lineHeight: 1.5 }}><Mono style={{ color: T.green, fontWeight: 700 }}>A</Mono>{a}</div></div>)}</div>}
          {tab === 'reviews' && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>{[['Lugazi Mill Automation', 5, 'Integrated cleanly with our F-CPU over PROFIsafe. Response time as spec.'], ['SafeGuard Systems', 5, 'Robust IP67 housing — survived a dusty packaging line install.'], ['B. Ssali, CMSE', 5, 'The made-to-order quote came back in USD within a day. Smooth.']].map(([n, r, t]) => <div key={n} style={{ border: `1px solid ${T.line}`, background: T.card, padding: '18px 20px' }}><Stars value={r} size={14} color={T.orange} /><div style={{ fontSize: 13.5, color: T.ink, lineHeight: 1.5, margin: '11px 0 14px' }}>{t}</div><Mono style={{ fontSize: 12, fontWeight: 600 }}>{n}</Mono></div>)}</div>}
        </div>

        {/* related */}
        <div style={{ padding: '36px 40px 48px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 16 }}><Mono style={{ fontSize: 12, color: T.orange, fontWeight: 600 }}>+</Mono><div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5 }}>Compatible accessories</div></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>{[PRODUCTS[1], PRODUCTS[7], PRODUCTS[8], PRODUCTS[5]].map((p) => <div key={p.id} style={{ border: `1px solid ${T.line}`, background: T.card, cursor: 'pointer' }}><div style={{ height: 150, background: T.surface, borderBottom: `1px solid ${T.line}` }}><ProductShot icon={p.icon} bg={T.surface} tint="#A7AEA4" radius={0} /></div><div style={{ padding: '12px 14px' }}><Mono style={{ fontSize: 10.5, color: T.sub }}>{p.brand.toUpperCase()}</Mono><div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.3, margin: '5px 0 8px', minHeight: 35 }}>{p.name}</div><AnimatedPrice ugx={p.ugx} style={{ fontSize: 15, fontWeight: 700, fontFamily: FM }} symStyle={{ fontFamily: FM }} /></div></div>)}</div>
        </div>
      </div>
    );
  }
  window.PDPC = PDPC;
})();
