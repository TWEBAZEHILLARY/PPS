// home-b.jsx — Direction B · "Ampere" — editorial, spacious (navy + electric lime)
(function () {
  const T = {
    ink: '#0E1A24', navy: '#13283A', lime: '#C9F24E', limeInk: '#1B2A06',
    paper: '#FBFAF7', card: '#FFFFFF', line: '#E7E3DA', sub: '#5F6B76', soft: '#F1EEE7',
  };
  const FD = "'Space Grotesk', system-ui, sans-serif";
  const FB = "'Hanken Grotesk', system-ui, sans-serif";
  const { Icon, Stars, AnimatedPrice, CurrencySwitch, ProductShot, PRODUCTS, CATEGORIES, BRANDS } = window;
  const curTheme = { bg: T.soft, active: T.ink, activeText: '#fff', idle: 'transparent', idleText: T.sub };

  function BigCard({ p }) {
    return (
      <div style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 20, overflow: 'hidden', display: 'flex', flexDirection: 'column', cursor: 'pointer' }}>
        <div style={{ position: 'relative', height: 230, background: T.soft }}>
          <ProductShot icon={p.icon} bg={T.soft} tint="#A9B0AC" pad={28} />
          <button style={{ position: 'absolute', top: 14, right: 14, width: 38, height: 38, borderRadius: 999, border: 'none', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: T.sub }}><Icon name="heart" size={18} /></button>
          {p.badge && <div style={{ position: 'absolute', top: 14, left: 14, background: T.lime, color: T.limeInk, fontSize: 11.5, fontWeight: 700, padding: '5px 11px', borderRadius: 999, letterSpacing: 0.3 }}>{p.badge}</div>}
        </div>
        <div style={{ padding: '20px 22px 22px', display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.sub, letterSpacing: 1, textTransform: 'uppercase', fontFamily: FB }}>{p.brand}</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: T.ink, lineHeight: 1.25, margin: '8px 0 10px', fontFamily: FD, letterSpacing: -0.3, minHeight: 45 }}>{p.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}><Stars value={p.rating} size={14} color="#E8B23A" /><span style={{ fontSize: 13, color: T.sub, fontFamily: FB }}>{p.rating} · {p.reviews} reviews</span></div>
          <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, borderTop: `1px solid ${T.line}` }}>
            <div><AnimatedPrice ugx={p.ugx} style={{ fontSize: 23, fontWeight: 700, color: T.ink, fontFamily: FD }} />
              {p.was && <span style={{ fontSize: 13, color: T.sub, textDecoration: 'line-through', marginLeft: 8, fontFamily: FB }}><AnimatedPrice ugx={p.was} style={{ fontSize: 13 }} /></span>}</div>
            <button style={{ display: 'flex', alignItems: 'center', gap: 8, background: T.ink, color: '#fff', border: 'none', padding: '11px 18px', borderRadius: 999, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: FB }}><Icon name="plus" size={16} color="#fff" /> Add</button>
          </div>
        </div>
      </div>
    );
  }

  function HomeB() {
    const nav = ['Catalog', 'Brands', 'Solutions', 'Source a Part', 'Trade'];
    return (
      <div style={{ fontFamily: FB, background: T.paper, color: T.ink, width: '100%', WebkitFontSmoothing: 'antialiased' }}>
        {/* top bar */}
        <div style={{ borderBottom: `1px solid ${T.line}`, fontSize: 13, color: T.sub }}>
          <div style={{ padding: '0 56px', height: 44, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}><Icon name="shield" size={15} color={T.ink} /> Genuine, authorised stock — dispatched from Kampala</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}><CurrencySwitch theme={curTheme} size="sm" /><span style={{ fontWeight: 600 }}>Track order</span><span style={{ fontWeight: 600 }}>Support</span></div>
          </div>
        </div>
        {/* header */}
        <div style={{ padding: '0 56px', height: 84, display: 'flex', alignItems: 'center', gap: 40, borderBottom: `1px solid ${T.line}` }}>
          <div style={{ fontFamily: FD, fontWeight: 700, fontSize: 25, letterSpacing: -0.8, display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: T.ink, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="bolt" size={18} color={T.lime} fill={T.lime} /></div>Ampère</div>
          <div style={{ display: 'flex', gap: 30, flex: 1, fontSize: 15, fontWeight: 600 }}>{nav.map((n, i) => <span key={n} style={{ cursor: 'pointer', color: i === 3 ? T.ink : T.sub, position: 'relative' }}>{n}{i === 3 && <span style={{ position: 'absolute', bottom: -28, left: 0, right: 0, height: 2, background: T.ink }} />}</span>)}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, height: 42, padding: '0 16px', border: `1px solid ${T.line}`, borderRadius: 999, color: T.sub, fontSize: 14, width: 230, background: '#fff' }}><Icon name="search" size={18} /> Search products…</div>
            <button style={{ border: 'none', background: 'none', cursor: 'pointer', color: T.ink }}><Icon name="user" size={23} /></button>
            <button style={{ position: 'relative', border: 'none', background: 'none', cursor: 'pointer', color: T.ink }}><Icon name="cart" size={23} /><span style={{ position: 'absolute', top: -6, right: -8, background: T.lime, color: T.limeInk, fontSize: 11, fontWeight: 700, width: 18, height: 18, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>3</span></button>
          </div>
        </div>

        {/* hero */}
        <div style={{ padding: '54px 56px 0', display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: 48, alignItems: 'center' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: T.soft, padding: '7px 14px', borderRadius: 999, fontSize: 13, fontWeight: 700, color: T.sub, marginBottom: 26 }}><span style={{ width: 7, height: 7, borderRadius: 999, background: T.lime, boxShadow: `0 0 0 3px ${T.lime}33` }} /> 18,000+ SKUs · 3 currencies · 24h sourcing</div>
            <div style={{ fontFamily: FD, fontSize: 60, fontWeight: 700, lineHeight: 1.02, letterSpacing: -2.2 }}>The supply line<br />for serious<br />electrical work.</div>
            <div style={{ fontSize: 18, color: T.sub, lineHeight: 1.55, margin: '24px 0 32px', maxWidth: 460 }}>From a single MCB to a full switchboard — source genuine industrial, mechanical and domestic gear, priced in UGX, USD or EUR.</div>
            <div style={{ display: 'flex', gap: 14, marginBottom: 40 }}>
              <button style={{ background: T.ink, color: '#fff', border: 'none', padding: '16px 30px', borderRadius: 999, fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: FB, display: 'flex', alignItems: 'center', gap: 9 }}>Browse catalog <Icon name="arrowRight" size={18} color="#fff" /></button>
              <button style={{ background: T.lime, color: T.limeInk, border: 'none', padding: '16px 30px', borderRadius: 999, fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: FB }}>Source a rare part</button>
            </div>
            <div style={{ display: 'flex', gap: 44 }}>{[['98%', 'In-stock fill rate'], ['24h', 'RFQ quote time'], ['4.8★', '2,400+ reviews']].map(([a, b]) => <div key={b}><div style={{ fontFamily: FD, fontSize: 28, fontWeight: 700, letterSpacing: -0.5 }}>{a}</div><div style={{ fontSize: 13.5, color: T.sub, marginTop: 2 }}>{b}</div></div>)}</div>
          </div>
          <div style={{ position: 'relative' }}>
            <div style={{ background: T.navy, borderRadius: 28, padding: 36, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: '50%', background: 'rgba(201,242,78,.14)' }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}><span style={{ color: T.lime, fontSize: 13, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>Featured</span><span style={{ color: 'rgba(255,255,255,.6)', fontSize: 13 }}>In stock now</span></div>
              <div style={{ background: '#fff', borderRadius: 18, height: 230, marginBottom: 22, overflow: 'hidden' }}><ProductShot icon="breaker" bg="#fff" tint="#9BA7B5" pad={30} /></div>
              <div style={{ color: '#fff' }}>
                <div style={{ fontSize: 12.5, color: T.lime, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>ABB</div>
                <div style={{ fontFamily: FD, fontSize: 21, fontWeight: 600, margin: '6px 0 14px', letterSpacing: -0.3 }}>Tmax XT 3-Pole MCCB 63A</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <AnimatedPrice ugx={486000} style={{ fontSize: 26, fontWeight: 700, color: '#fff', fontFamily: FD }} />
                  <button style={{ background: T.lime, color: T.limeInk, border: 'none', padding: '12px 22px', borderRadius: 999, fontSize: 14.5, fontWeight: 700, cursor: 'pointer', fontFamily: FB }}>Add to cart</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* categories editorial */}
        <div style={{ padding: '64px 56px 0' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 26 }}>
            <div style={{ fontFamily: FD, fontSize: 30, fontWeight: 700, letterSpacing: -0.8 }}>Shop by category</div>
            <span style={{ fontSize: 15, fontWeight: 700, color: T.sub, display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}>All categories <Icon name="arrowRight" size={17} color={T.sub} /></span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
            {CATEGORIES.slice(0, 8).map((c) => (
              <div key={c.name} style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 18, padding: '24px 24px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 16, minHeight: 150 }}>
                <div style={{ width: 50, height: 50, borderRadius: 13, background: T.soft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={c.icon} size={26} color={T.ink} stroke={1.5} /></div>
                <div style={{ marginTop: 'auto' }}><div style={{ fontFamily: FD, fontSize: 17, fontWeight: 600, letterSpacing: -0.3 }}>{c.name}</div><div style={{ fontSize: 13.5, color: T.sub, marginTop: 3 }}>{c.count} products</div></div>
              </div>))}
          </div>
        </div>

        {/* curated rail */}
        <div style={{ padding: '64px 56px 0' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 26 }}>
            <div><div style={{ fontSize: 14, fontWeight: 700, color: T.sub, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Engineer-picked</div><div style={{ fontFamily: FD, fontSize: 30, fontWeight: 700, letterSpacing: -0.8 }}>Trusted on every site</div></div>
            <span style={{ fontSize: 15, fontWeight: 700, color: T.sub, display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}>View all <Icon name="arrowRight" size={17} color={T.sub} /></span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 18 }}>{[PRODUCTS[0], PRODUCTS[3], PRODUCTS[6], PRODUCTS[8]].map((p) => <BigCard key={p.id} p={p} />)}</div>
        </div>

        {/* RFQ editorial feature */}
        <div style={{ padding: '64px 56px 0' }}>
          <div style={{ background: T.ink, borderRadius: 28, overflow: 'hidden', display: 'grid', gridTemplateColumns: '1fr 0.85fr', position: 'relative' }}>
            <div style={{ padding: '52px 56px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(201,242,78,.14)', color: T.lime, padding: '7px 14px', borderRadius: 999, fontSize: 13, fontWeight: 700, letterSpacing: 0.5, marginBottom: 24 }}>RARE INQUIRY</div>
              <div style={{ fontFamily: FD, fontSize: 42, fontWeight: 700, color: '#fff', letterSpacing: -1.2, lineHeight: 1.08 }}>If it exists, we'll find it.</div>
              <div style={{ fontSize: 17, color: 'rgba(255,255,255,.72)', lineHeight: 1.55, margin: '18px 0 30px', maxWidth: 440 }}>Obsolete relays, discontinued drives, oversized cable runs. Send a spec or photo and our sourcing desk returns a locked quote in your currency.</div>
              <button style={{ background: T.lime, color: T.limeInk, border: 'none', padding: '16px 30px', borderRadius: 999, fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: FB, display: 'flex', alignItems: 'center', gap: 9 }}>Start an inquiry <Icon name="arrowRight" size={18} color={T.limeInk} /></button>
            </div>
            <div style={{ background: T.navy, padding: '52px 48px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 22 }}>
              {[['Submit spec', 'Part #, photo or datasheet'], ['Locked quote', 'UGX / USD / EUR · within 24h'], ['Confirm & pay', 'MoMo · card · trade terms']].map(([a, b], i) => (
                <div key={a} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 999, background: T.lime, color: T.limeInk, fontFamily: FD, fontWeight: 700, fontSize: 17, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</div>
                  <div style={{ color: '#fff' }}><div style={{ fontFamily: FD, fontSize: 17, fontWeight: 600 }}>{a}</div><div style={{ fontSize: 13.5, color: 'rgba(255,255,255,.65)', marginTop: 2 }}>{b}</div></div>
                </div>))}
            </div>
          </div>
        </div>

        {/* brands */}
        <div style={{ padding: '64px 56px 0' }}>
          <div style={{ textAlign: 'center', fontSize: 13.5, fontWeight: 700, color: T.sub, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 26 }}>Authorised distributor</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>{BRANDS.map((b) => <div key={b} style={{ fontFamily: FD, fontSize: 24, fontWeight: 600, color: T.ink, opacity: 0.55, letterSpacing: -0.5 }}>{b}</div>)}</div>
        </div>

        {/* footer */}
        <div style={{ marginTop: 64, borderTop: `1px solid ${T.line}`, padding: '48px 56px 32px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 1fr', gap: 40, paddingBottom: 36 }}>
            <div>
              <div style={{ fontFamily: FD, fontWeight: 700, fontSize: 24, letterSpacing: -0.8, display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}><div style={{ width: 28, height: 28, borderRadius: 7, background: T.ink, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="bolt" size={17} color={T.lime} fill={T.lime} /></div>Ampère</div>
              <div style={{ fontSize: 14.5, color: T.sub, lineHeight: 1.6, maxWidth: 300 }}>The electrical supply line for serious work across Uganda. Plot 14, Industrial Area, Kampala.</div>
            </div>
            {[['Shop', ['Catalog', 'Brands', 'New arrivals', 'Flash deals']], ['Source', ['Rare inquiry', 'Bulk quotes', 'Trade account', 'Delivery']], ['Company', ['About', 'Contact', 'Careers', 'Support']]].map(([h, items]) => (
              <div key={h}><div style={{ fontFamily: FD, fontSize: 15, fontWeight: 600, marginBottom: 14 }}>{h}</div>{items.map((it) => <div key={it} style={{ fontSize: 14, color: T.sub, marginBottom: 10, cursor: 'pointer' }}>{it}</div>)}</div>))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 24, borderTop: `1px solid ${T.line}`, fontSize: 13.5, color: T.sub }}>
            <span>© 2026 Ampère Uganda. Prices incl. VAT.</span>
            <span style={{ display: 'flex', gap: 10 }}>{['MTN MoMo', 'Airtel', 'Visa', 'Mastercard', 'PayPal'].map((p) => <span key={p} style={{ border: `1px solid ${T.line}`, padding: '5px 12px', borderRadius: 999, fontSize: 12.5, fontWeight: 600 }}>{p}</span>)}</span>
          </div>
        </div>
      </div>
    );
  }
  window.HomeB = HomeB;
})();
