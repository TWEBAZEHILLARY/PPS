// pdp-b.jsx — Direction B · "Ampere" — Product Detail (editorial · procurement item)
(function () {
  const T = { ink: '#0E1A24', navy: '#13283A', lime: '#C9F24E', limeInk: '#1B2A06', paper: '#FBFAF7', card: '#FFFFFF', line: '#E7E3DA', sub: '#5F6B76', soft: '#F1EEE7' };
  const FD = "'Space Grotesk', system-ui, sans-serif";
  const FB = "'Hanken Grotesk', system-ui, sans-serif";
  const { Icon, Stars, AnimatedPrice, CurrencySwitch, ProductShot, PRODUCTS } = window;
  const curTheme = { bg: T.soft, active: T.ink, activeText: '#fff', idle: 'transparent', idleText: T.sub };

  const VARIANTS = [{ a: '4.0 kW', ugx: 2180000 }, { a: '5.5 kW', ugx: 2740000 }, { a: '7.5 kW', ugx: 3460000 }, { a: '11 kW', ugx: 4820000 }];
  const TIERS = [{ q: '1–2', mult: 1 }, { q: '3–5', mult: 0.95 }, { q: '6–10', mult: 0.9 }, { q: '11+', mult: 0.84 }];

  function PDPB() {
    const [vi, setVi] = React.useState(1);
    const [qty, setQty] = React.useState(1);
    const [thumb, setThumb] = React.useState(0);
    const v = VARIANTS[vi];
    const tierIdx = qty >= 11 ? 3 : qty >= 6 ? 2 : qty >= 3 ? 1 : 0;
    const unit = Math.round(v.ugx * TIERS[tierIdx].mult);

    return (
      <div style={{ fontFamily: FB, background: T.paper, color: T.ink, width: '100%', WebkitFontSmoothing: 'antialiased' }}>
        {/* top bar */}
        <div style={{ borderBottom: `1px solid ${T.line}`, fontSize: 13, color: T.sub }}><div style={{ padding: '0 56px', height: 44, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><span style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}><Icon name="shield" size={15} color={T.ink} /> Genuine, authorised stock — dispatched from Kampala</span><div style={{ display: 'flex', gap: 22, alignItems: 'center' }}><CurrencySwitch theme={curTheme} size="sm" /><span style={{ fontWeight: 600 }}>Support</span></div></div></div>
        <div style={{ padding: '0 56px', height: 80, display: 'flex', alignItems: 'center', gap: 40, borderBottom: `1px solid ${T.line}` }}>
          <div style={{ fontFamily: FD, fontWeight: 700, fontSize: 24, letterSpacing: -0.8, display: 'flex', alignItems: 'center', gap: 9 }}><div style={{ width: 29, height: 29, borderRadius: 8, background: T.ink, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="bolt" size={17} color={T.lime} fill={T.lime} /></div>Ampère</div>
          <div style={{ display: 'flex', gap: 30, flex: 1, fontSize: 15, fontWeight: 600, color: T.sub }}>{['Catalog', 'Brands', 'Solutions', 'Source a Part', 'Trade'].map((n) => <span key={n} style={{ cursor: 'pointer' }}>{n}</span>)}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}><div style={{ display: 'flex', alignItems: 'center', gap: 9, height: 42, padding: '0 16px', border: `1px solid ${T.line}`, borderRadius: 999, color: T.sub, fontSize: 14, width: 200, background: '#fff' }}><Icon name="search" size={18} /> Search…</div><button style={{ position: 'relative', border: 'none', background: 'none', cursor: 'pointer', color: T.ink }}><Icon name="cart" size={23} /><span style={{ position: 'absolute', top: -6, right: -8, background: T.lime, color: T.limeInk, fontSize: 11, fontWeight: 700, width: 18, height: 18, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>3</span></button></div>
        </div>

        <div style={{ padding: '20px 56px 0', display: 'flex', alignItems: 'center', gap: 9, fontSize: 13.5, color: T.sub, fontWeight: 600 }}>{['Catalog', 'Motors & Drives', 'Induction Motors', 'WEG W22'].map((b, i, a) => <React.Fragment key={b}><span style={{ cursor: 'pointer', color: i === a.length - 1 ? T.ink : T.sub }}>{b}</span>{i < a.length - 1 && <Icon name="chevron" size={13} color={T.sub} />}</React.Fragment>)}</div>

        {/* main */}
        <div style={{ padding: '24px 56px 0', display: 'grid', gridTemplateColumns: '1.05fr 0.95fr', gap: 48 }}>
          {/* gallery */}
          <div>
            <div style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 24, height: 500, position: 'relative', overflow: 'hidden' }}>
              <ProductShot icon="motor" bg={T.card} tint="#A9B0AC" pad={48} />
              <div style={{ position: 'absolute', top: 18, left: 18, background: T.lime, color: T.limeInk, fontSize: 12, fontWeight: 700, padding: '6px 13px', borderRadius: 999 }}>Made to order</div>
            </div>
            <div style={{ display: 'flex', gap: 14, marginTop: 16 }}>{['motor', 'panel', 'doc', 'sensor'].map((ic, i) => <div key={i} onClick={() => setThumb(i)} style={{ width: 92, height: 92, borderRadius: 16, border: `2px solid ${thumb === i ? T.ink : T.line}`, background: T.card, cursor: 'pointer', overflow: 'hidden' }}><ProductShot icon={ic} bg={T.card} tint="#A9B0AC" pad={18} /></div>)}</div>
          </div>

          {/* info */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.sub, letterSpacing: 1, textTransform: 'uppercase' }}>WEG · Authorised distributor</div>
            <div style={{ fontFamily: FD, fontSize: 38, fontWeight: 700, letterSpacing: -1.2, lineHeight: 1.08, margin: '12px 0 14px' }}>W22 IE3 Induction Motor {v.a} 3-Phase</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Stars value={4.9} size={16} color="#E8B23A" /><span style={{ fontSize: 14, fontWeight: 700 }}>4.9</span><span style={{ fontSize: 14, color: T.sub }}>· 37 reviews</span></div><span style={{ fontSize: 13.5, color: T.sub, fontFamily: FD }}>SKU WEG-W22-{vi}</span></div>

            <div style={{ fontFamily: FD, marginBottom: 26 }}><AnimatedPrice ugx={unit} style={{ fontSize: 38, fontWeight: 700, color: T.ink, fontFamily: FD }} /><span style={{ fontSize: 15, color: T.sub, marginLeft: 10, fontFamily: FB }}>per unit · excl. VAT</span></div>

            {/* variant */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, fontFamily: FD }}>Power rating — <span style={{ color: T.sub }}>{v.a}</span></div>
              <div style={{ display: 'flex', gap: 12 }}>{VARIANTS.map((vv, i) => <button key={vv.a} onClick={() => setVi(i)} style={{ flex: 1, padding: '14px 0', borderRadius: 14, border: `2px solid ${i === vi ? T.ink : T.line}`, background: i === vi ? T.ink : '#fff', color: i === vi ? '#fff' : T.ink, cursor: 'pointer', fontFamily: FB, transition: 'all .15s' }}><div style={{ fontFamily: FD, fontSize: 15, fontWeight: 600 }}>{vv.a}</div></button>)}</div>
            </div>

            {/* bulk tiers */}
            <div style={{ marginBottom: 26 }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, fontFamily: FD, display: 'flex', alignItems: 'center', gap: 10 }}>Volume pricing <span style={{ fontSize: 12, fontWeight: 700, color: T.limeInk, background: T.lime, padding: '3px 10px', borderRadius: 999 }}>Save to 16%</span></div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>{TIERS.map((t, i) => { const on = i === tierIdx; return <div key={t.q} style={{ border: `2px solid ${on ? T.ink : T.line}`, background: on ? T.soft : '#fff', borderRadius: 14, padding: '14px 10px', textAlign: 'center', transition: 'all .2s' }}><div style={{ fontSize: 12.5, color: T.sub, fontWeight: 600 }}>{t.q} units</div><AnimatedPrice ugx={Math.round(v.ugx * t.mult)} style={{ fontSize: 14, fontWeight: 700, fontFamily: FD, display: 'block', marginTop: 5 }} /></div>; })}</div>
            </div>

            {/* qty + CTAs */}
            <div style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 20, padding: '22px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                <span style={{ fontSize: 15, fontWeight: 700, fontFamily: FD }}>Quantity</span>
                <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${T.line}`, borderRadius: 999, overflow: 'hidden' }}><button onClick={() => setQty((q) => Math.max(1, q - 1))} style={{ width: 42, height: 44, border: 'none', background: '#fff', cursor: 'pointer', color: T.ink, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="minus" size={16} /></button><span style={{ width: 48, textAlign: 'center', fontSize: 17, fontWeight: 700, fontFamily: FD }}>{qty}</span><button onClick={() => setQty((q) => q + 1)} style={{ width: 42, height: 44, border: 'none', background: '#fff', cursor: 'pointer', color: T.ink, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="plus" size={16} /></button></div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: T.soft, borderRadius: 14, fontSize: 13.5, fontWeight: 600, marginBottom: 18 }}><Icon name="clock" size={18} color={T.ink} /> Made to order · ships in 7–10 working days</div>
              <button style={{ width: '100%', background: T.lime, color: T.limeInk, border: 'none', padding: '17px', borderRadius: 999, fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: FB, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}><Icon name="search" size={20} color={T.limeInk} /> Request This Item</button>
              <button style={{ width: '100%', background: '#fff', color: T.ink, border: `2px solid ${T.ink}`, padding: '15px', borderRadius: 999, fontSize: 15.5, fontWeight: 700, cursor: 'pointer', fontFamily: FB, marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}><Icon name="cart" size={19} /> Add to Cart</button>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 18 }}>{[['download', 'Datasheet'], ['heart', 'Save'], ['shield', '3-yr warranty']].map(([ic, l]) => <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: T.sub, fontWeight: 600, cursor: 'pointer' }}><Icon name={ic} size={16} color={T.sub} /> {l}</span>)}</div>
            </div>
          </div>
        </div>

        {/* specs editorial */}
        <div style={{ padding: '64px 56px 0' }}>
          <div style={{ fontFamily: FD, fontSize: 28, fontWeight: 700, letterSpacing: -0.8, marginBottom: 24 }}>Technical specification</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 56px' }}>{[['Output power', v.a], ['Efficiency class', 'IE3 Premium'], ['Synchronous speed', '1500 rpm'], ['Full-load speed', '1465 rpm'], ['Frame size', '132M'], ['Protection', 'IP55'], ['Insulation class', 'F (155 °C)'], ['Voltage', '400/690 V'], ['Frequency', '50 Hz'], ['Poles', '4'], ['Cooling', 'TEFC IC411'], ['Duty', 'S1 continuous']].map(([k, val]) => <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 4px', borderBottom: `1px solid ${T.line}`, fontSize: 14.5 }}><span style={{ color: T.sub }}>{k}</span><span style={{ fontWeight: 700, fontFamily: FD }}>{val}</span></div>)}</div>
        </div>

        {/* reviews */}
        <div style={{ padding: '56px 56px 0' }}>
          <div style={{ fontFamily: FD, fontSize: 28, fontWeight: 700, letterSpacing: -0.8, marginBottom: 24 }}>What engineers say</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 18 }}>{[['Mukasa Industrial', 5, 'Specified three of these for a pump skid. Genuine WEG, IE3 efficiency as stated.'], ['R. Atim, M.Eng', 5, 'The made-to-order flow was painless — quoted in USD, delivered in 8 days.'], ['Kato Power Ltd', 5, 'Quiet, well-balanced motor. The datasheet and dimensional drawing matched exactly.']].map(([n, r, t]) => <div key={n} style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 18, padding: '22px 24px' }}><Stars value={r} size={15} color="#E8B23A" /><div style={{ fontSize: 14.5, color: T.ink, lineHeight: 1.55, margin: '12px 0 16px' }}>{t}</div><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontFamily: FD, fontSize: 14, fontWeight: 600 }}>{n}</span><span style={{ fontSize: 11.5, color: T.limeInk, fontWeight: 700, background: T.lime, padding: '2px 8px', borderRadius: 999 }}>Verified</span></div></div>)}</div>
        </div>

        {/* related */}
        <div style={{ padding: '56px 56px 56px' }}>
          <div style={{ fontFamily: FD, fontSize: 28, fontWeight: 700, letterSpacing: -0.8, marginBottom: 24 }}>Pairs well with</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 18 }}>{[PRODUCTS[1], PRODUCTS[7], PRODUCTS[8], PRODUCTS[4]].map((p) => <div key={p.id} style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 18, overflow: 'hidden', cursor: 'pointer' }}><div style={{ height: 170, background: T.soft }}><ProductShot icon={p.icon} bg={T.soft} tint="#A9B0AC" /></div><div style={{ padding: '16px 18px' }}><div style={{ fontSize: 12, fontWeight: 700, color: T.sub, textTransform: 'uppercase', letterSpacing: 0.5 }}>{p.brand}</div><div style={{ fontFamily: FD, fontSize: 15, fontWeight: 600, lineHeight: 1.3, margin: '6px 0 10px', minHeight: 39 }}>{p.name}</div><AnimatedPrice ugx={p.ugx} style={{ fontSize: 18, fontWeight: 700, fontFamily: FD }} /></div></div>)}</div>
        </div>
      </div>
    );
  }
  window.PDPB = PDPB;
})();
