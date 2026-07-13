// home-c.jsx — Direction C · "Circuit" — industrial / technical (mono specs + safety orange)
(function () {
  const T = {
    ink: '#14171A', graphite: '#1E2327', orange: '#FF5A1F', orangeDk: '#E0440C',
    surface: '#F4F4F0', card: '#FFFFFF', line: '#E2E2DB', line2: '#D2D2C9', sub: '#6C727A', yellow: '#FFC400',
  };
  const FS = "'IBM Plex Sans', system-ui, sans-serif";
  const FM = "'IBM Plex Mono', ui-monospace, monospace";
  const { Icon, Stars, AnimatedPrice, CurrencySwitch, ProductShot, PRODUCTS, CATEGORIES, BRANDS } = window;
  const curTheme = { bg: 'rgba(255,255,255,.1)', active: T.orange, activeText: '#fff', idle: 'transparent', idleText: 'rgba(255,255,255,.7)' };

  const Mono = ({ children, style }) => <span style={{ fontFamily: FM, ...style }}>{children}</span>;

  function TechCard({ p }) {
    const off = p.was ? Math.round((1 - p.ugx / p.was) * 100) : 0;
    return (
      <div style={{ background: T.card, border: `1px solid ${T.line}`, display: 'flex', flexDirection: 'column', cursor: 'pointer' }}>
        <div style={{ position: 'relative', height: 176, background: T.surface, borderBottom: `1px solid ${T.line}` }}>
          <ProductShot icon={p.icon} bg={T.surface} tint="#A7AEA4" radius={0} />
          <div style={{ position: 'absolute', top: 0, left: 0, background: T.ink, color: '#fff', fontFamily: FM, fontSize: 10.5, fontWeight: 500, padding: '4px 8px', letterSpacing: 0.5 }}>{p.brand.toUpperCase()}</div>
          {off > 0 && <div style={{ position: 'absolute', top: 0, right: 0, background: T.orange, color: '#fff', fontFamily: FM, fontSize: 11, fontWeight: 600, padding: '4px 8px' }}>−{off}%</div>}
          <button style={{ position: 'absolute', bottom: 8, right: 8, width: 32, height: 32, border: `1px solid ${T.line}`, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: T.sub }}><Icon name="heart" size={16} /></button>
        </div>
        <div style={{ padding: '13px 14px 14px', display: 'flex', flexDirection: 'column', flex: 1 }}>
          <Mono style={{ fontSize: 11, color: T.sub, marginBottom: 6 }}>SKU-{p.id.toUpperCase()}{p.id.length === 2 ? '00' : '0'}{p.reviews}</Mono>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.ink, lineHeight: 1.3, minHeight: 37 }}>{p.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '9px 0' }}>
            <Mono style={{ fontSize: 11, color: '#fff', background: T.graphite, padding: '3px 7px' }}>{p.spec}</Mono>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 11 }}><Stars value={p.rating} size={12} color={T.orange} /><Mono style={{ fontSize: 11.5, color: T.sub }}>{p.rating} / {p.reviews}</Mono></div>
          <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', paddingTop: 11, borderTop: `1px solid ${T.line}` }}>
            <div><AnimatedPrice ugx={p.ugx} style={{ fontSize: 17, fontWeight: 700, color: T.ink, fontFamily: FM }} symStyle={{ fontFamily: FM }} />
              {p.stock === 'In stock' ? <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}><span style={{ width: 6, height: 6, borderRadius: 999, background: '#19A86B' }} /><Mono style={{ fontSize: 10.5, color: '#19A86B' }}>IN STOCK</Mono></div>
                : <Mono style={{ fontSize: 10.5, color: T.orange, marginTop: 3, display: 'block' }}>{p.stock.toUpperCase()}</Mono>}</div>
            <button style={{ width: 38, height: 38, border: 'none', background: T.orange, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Icon name="cart" size={18} color="#fff" /></button>
          </div>
        </div>
      </div>
    );
  }

  function HomeC() {
    const nav = ['CIRCUIT PROTECTION', 'CABLES', 'MOTORS', 'AUTOMATION', 'LIGHTING', 'ENCLOSURES'];
    const grid = `linear-gradient(${T.line2} 1px, transparent 1px), linear-gradient(90deg, ${T.line2} 1px, transparent 1px)`;
    return (
      <div style={{ fontFamily: FS, background: T.surface, color: T.ink, width: '100%', WebkitFontSmoothing: 'antialiased' }}>
        {/* top bar */}
        <div style={{ background: T.ink, color: '#fff' }}>
          <div style={{ padding: '0 40px', height: 40, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Mono style={{ fontSize: 12, color: 'rgba(255,255,255,.75)', letterSpacing: 0.5 }}>ELECTRICAL SUPPLY · INDUSTRIAL / MECHANICAL / DOMESTIC · KAMPALA UG</Mono>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}><CurrencySwitch theme={curTheme} size="sm" /><Mono style={{ fontSize: 12, color: 'rgba(255,255,255,.75)' }}>TRACK</Mono><Mono style={{ fontSize: 12, color: 'rgba(255,255,255,.75)' }}>SIGN IN</Mono></div>
          </div>
        </div>
        {/* header */}
        <div style={{ background: T.card, borderBottom: `1px solid ${T.line}`, padding: '0 40px' }}>
          <div style={{ height: 76, display: 'flex', alignItems: 'center', gap: 26 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, background: T.orange, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="bolt" size={22} color="#fff" fill="#fff" /></div>
              <div style={{ fontWeight: 700, fontSize: 22, letterSpacing: 2, fontFamily: FS }}>CIRCUIT</div>
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', height: 48, border: `2px solid ${T.ink}`, background: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '0 15px', borderRight: `1px solid ${T.line}`, height: '100%', fontFamily: FM, fontSize: 12.5, fontWeight: 500 }}>ALL <Icon name="chevronDown" size={14} color={T.sub} /></div>
              <input readOnly placeholder="Part number, brand or spec…" style={{ flex: 1, border: 'none', outline: 'none', fontFamily: FM, fontSize: 13.5, padding: '0 15px', background: 'transparent', color: T.ink }} />
              <div style={{ display: 'flex', gap: 12, padding: '0 14px', color: T.sub }}><Icon name="mic" size={18} /><Icon name="camera" size={18} /></div>
              <button style={{ height: '100%', border: 'none', background: T.ink, color: '#fff', padding: '0 20px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><Icon name="search" size={19} color="#fff" /></button>
            </div>
            <button style={{ display: 'flex', alignItems: 'center', gap: 8, border: `1px solid ${T.line}`, background: '#fff', cursor: 'pointer', padding: '10px 12px', fontFamily: FS }}><Icon name="user" size={20} color={T.ink} /><Mono style={{ fontSize: 12 }}>ACCOUNT</Mono></button>
            <button style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 9, border: 'none', background: T.ink, color: '#fff', cursor: 'pointer', padding: '11px 14px', fontFamily: FS }}>
              <Icon name="cart" size={20} color="#fff" /><div style={{ textAlign: 'left' }}><Mono style={{ fontSize: 10, color: 'rgba(255,255,255,.6)', display: 'block' }}>3 ITEMS</Mono><AnimatedPrice ugx={894000} style={{ fontSize: 13, fontWeight: 600, color: '#fff', fontFamily: FM }} symStyle={{ fontFamily: FM }} /></div></button>
          </div>
          {/* nav */}
          <div style={{ height: 48, display: 'flex', alignItems: 'stretch', gap: 0, borderTop: `1px solid ${T.line}` }}>
            <button style={{ display: 'flex', alignItems: 'center', gap: 8, background: T.graphite, color: '#fff', border: 'none', padding: '0 18px', cursor: 'pointer', fontFamily: FM, fontSize: 12.5, fontWeight: 500, letterSpacing: 0.5 }}><Icon name="menu" size={16} color="#fff" /> ALL CATEGORIES</button>
            {nav.map((l) => <span key={l} style={{ display: 'flex', alignItems: 'center', padding: '0 16px', fontFamily: FM, fontSize: 12.5, color: T.ink, cursor: 'pointer', letterSpacing: 0.3 }}>{l}</span>)}
            <div style={{ flex: 1 }} />
            <button style={{ display: 'flex', alignItems: 'center', gap: 8, background: T.orange, color: '#fff', border: 'none', padding: '0 20px', cursor: 'pointer', fontFamily: FM, fontSize: 12.5, fontWeight: 600, letterSpacing: 0.5 }}><Icon name="search" size={15} color="#fff" /> SOURCE A RARE PART</button>
          </div>
        </div>

        {/* hero */}
        <div style={{ position: 'relative', background: T.graphite, color: '#fff', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: grid, backgroundSize: '44px 44px', opacity: 0.06 }} />
          <div style={{ position: 'relative', padding: '52px 40px', display: 'grid', gridTemplateColumns: '1fr 420px', gap: 44, alignItems: 'center' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 9, border: `1px solid rgba(255,255,255,.2)`, padding: '7px 13px', marginBottom: 24 }}><span style={{ width: 7, height: 7, background: T.orange }} /><Mono style={{ fontSize: 12, color: 'rgba(255,255,255,.85)', letterSpacing: 0.5 }}>18,420 SKUS · 3 CURRENCIES · 24H RFQ</Mono></div>
              <div style={{ fontSize: 54, fontWeight: 700, lineHeight: 1.04, letterSpacing: -1.5 }}>Engineered supply,<br />priced to spec.</div>
              <div style={{ fontSize: 16.5, color: 'rgba(255,255,255,.72)', lineHeight: 1.55, margin: '20px 0 30px', maxWidth: 480, fontFamily: FS }}>Genuine industrial and domestic electrical stock with full datasheets — quoted in UGX, USD or EUR and dispatched same-day from Kampala.</div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button style={{ background: T.orange, color: '#fff', border: 'none', padding: '15px 28px', cursor: 'pointer', fontFamily: FM, fontSize: 14, fontWeight: 600, letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 9 }}>BROWSE CATALOG <Icon name="arrowRight" size={17} color="#fff" /></button>
                <button style={{ background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,.3)', padding: '15px 28px', cursor: 'pointer', fontFamily: FM, fontSize: 14, fontWeight: 500, letterSpacing: 0.5 }}>SOURCE A PART</button>
              </div>
            </div>
            <div style={{ background: '#fff', color: T.ink, border: `1px solid ${T.line}` }}>
              <div style={{ height: 210, background: T.surface, borderBottom: `1px solid ${T.line}`, position: 'relative' }}><ProductShot icon="motor" bg={T.surface} tint="#9BA298" radius={0} /><div style={{ position: 'absolute', top: 0, left: 0, background: T.ink, color: '#fff', fontFamily: FM, fontSize: 10.5, padding: '4px 8px' }}>FEATURED · WEG</div></div>
              <div style={{ padding: '16px 18px' }}>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 10 }}>W22 IE3 Induction Motor 5.5kW</div>
                {[['OUTPUT', '5.5 kW'], ['SPEED', '1465 rpm'], ['PROTECTION', 'IP55'], ['STOCK', '4 units']].map(([k, v]) => <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderTop: `1px solid ${T.line}` }}><Mono style={{ fontSize: 11.5, color: T.sub }}>{k}</Mono><Mono style={{ fontSize: 11.5, fontWeight: 600 }}>{v}</Mono></div>)}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}><AnimatedPrice ugx={2740000} style={{ fontSize: 22, fontWeight: 700, fontFamily: FM }} symStyle={{ fontFamily: FM }} /><button style={{ background: T.orange, color: '#fff', border: 'none', padding: '11px 18px', cursor: 'pointer', fontFamily: FM, fontSize: 12.5, fontWeight: 600 }}>ADD</button></div>
              </div>
            </div>
          </div>
        </div>

        {/* trust band */}
        <div style={{ background: T.ink, color: '#fff' }}>
          <div style={{ padding: '0 40px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {[['truck', 'SAME-DAY DISPATCH'], ['shield', '100% GENUINE STOCK'], ['doc', 'FULL DATASHEETS'], ['clock', '24H RFQ QUOTES'], ['user', 'ENGINEER SUPPORT']].map(([ic, t]) => <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Icon name={ic} size={18} color={T.orange} /><Mono style={{ fontSize: 12, letterSpacing: 0.5, color: 'rgba(255,255,255,.85)' }}>{t}</Mono></div>)}
          </div>
        </div>

        {/* category grid */}
        <div style={{ padding: '40px 40px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}><Mono style={{ fontSize: 12, color: T.orange, fontWeight: 600 }}>01</Mono><div style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.5 }}>Categories</div></div>
            <Mono style={{ fontSize: 12.5, color: T.sub, cursor: 'pointer' }}>VIEW ALL →</Mono>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 0, border: `1px solid ${T.line}`, background: T.line }}>
            {CATEGORIES.map((c) => (
              <div key={c.name} style={{ background: T.card, padding: '20px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, borderRight: '1px solid transparent' }}>
                <div style={{ width: 46, height: 46, border: `1px solid ${T.line}`, background: T.surface, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={c.icon} size={24} color={T.ink} stroke={1.5} /></div>
                <div><div style={{ fontSize: 15, fontWeight: 600 }}>{c.name}</div><Mono style={{ fontSize: 11.5, color: T.sub }}>{c.count} ITEMS</Mono></div>
              </div>))}
          </div>
        </div>

        {/* product grid */}
        <div style={{ padding: '40px 40px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}><Mono style={{ fontSize: 12, color: T.orange, fontWeight: 600 }}>02</Mono><div style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.5 }}>Top stocked products</div></div>
            <Mono style={{ fontSize: 12.5, color: T.sub, cursor: 'pointer' }}>VIEW ALL →</Mono>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 14 }}>{PRODUCTS.slice(0, 5).map((p) => <TechCard key={p.id} p={p} />)}</div>
        </div>
        <div style={{ padding: '14px 40px 0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 14 }}>{PRODUCTS.slice(5, 9).map((p) => <TechCard key={p.id} p={p} />)}
            <div style={{ background: T.orange, color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 22, cursor: 'pointer' }}>
              <Icon name="arrowRight" size={28} color="#fff" /><div style={{ fontSize: 19, fontWeight: 700, marginTop: 14, lineHeight: 1.2 }}>See all 18,420 products</div><Mono style={{ fontSize: 12, marginTop: 8, color: 'rgba(255,255,255,.85)' }}>FULL CATALOG →</Mono></div>
          </div>
        </div>

        {/* RFQ band */}
        <div style={{ padding: '40px 40px 0' }}>
          <div style={{ background: T.ink, color: '#fff', display: 'grid', gridTemplateColumns: '1fr 1fr', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, backgroundImage: grid, backgroundSize: '44px 44px', opacity: 0.05 }} />
            <div style={{ position: 'relative', padding: '44px 44px' }}>
              <Mono style={{ fontSize: 12, color: T.orange, fontWeight: 600, letterSpacing: 1, display: 'block', marginBottom: 18 }}>RARE INQUIRY · RFQ</Mono>
              <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: -1, lineHeight: 1.1, maxWidth: 460 }}>Obsolete or hard-to-find? Submit a spec, get a locked quote.</div>
              <div style={{ fontSize: 15.5, color: 'rgba(255,255,255,.72)', margin: '16px 0 26px', maxWidth: 440, lineHeight: 1.55, fontFamily: FS }}>Upload a datasheet or photo and set your quantity. Our procurement desk replies within 24 hours with pricing in your currency.</div>
              <button style={{ background: T.orange, color: '#fff', border: 'none', padding: '15px 28px', cursor: 'pointer', fontFamily: FM, fontSize: 14, fontWeight: 600, letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 9 }}>START AN INQUIRY <Icon name="arrowRight" size={17} color="#fff" /></button>
            </div>
            <div style={{ position: 'relative', background: T.graphite, padding: '44px 44px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 0, borderLeft: '1px solid rgba(255,255,255,.1)' }}>
              {[['01', 'SUBMIT SPEC', 'Part #, photo or datasheet'], ['02', 'LOCKED QUOTE', 'UGX / USD / EUR · within 24h'], ['03', 'CONFIRM & PAY', 'MoMo · card · trade terms']].map(([n, a, b]) => (
                <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '16px 0', borderTop: '1px solid rgba(255,255,255,.12)' }}>
                  <Mono style={{ fontSize: 22, fontWeight: 600, color: T.orange }}>{n}</Mono>
                  <div><div style={{ fontSize: 15, fontWeight: 600 }}>{a}</div><Mono style={{ fontSize: 12, color: 'rgba(255,255,255,.6)', marginTop: 3, display: 'block' }}>{b}</Mono></div>
                </div>))}
            </div>
          </div>
        </div>

        {/* brands */}
        <div style={{ padding: '40px 40px 0' }}>
          <Mono style={{ fontSize: 12, color: T.sub, fontWeight: 600, letterSpacing: 1, display: 'block', marginBottom: 14 }}>AUTHORISED DISTRIBUTOR</Mono>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8,1fr)', gap: 0, border: `1px solid ${T.line}`, background: T.line }}>{BRANDS.map((b) => <div key={b} style={{ background: T.card, height: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, letterSpacing: -0.3 }}>{b}</div>)}</div>
        </div>

        {/* footer */}
        <div style={{ marginTop: 40, background: T.ink, color: 'rgba(255,255,255,.7)', padding: '40px 40px 26px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: 30, paddingBottom: 28, borderBottom: '1px solid rgba(255,255,255,.12)' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}><div style={{ width: 30, height: 30, background: T.orange, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="bolt" size={18} color="#fff" fill="#fff" /></div><span style={{ fontWeight: 700, fontSize: 19, letterSpacing: 2, color: '#fff' }}>CIRCUIT</span></div>
              <div style={{ fontSize: 13.5, lineHeight: 1.6, maxWidth: 290, fontFamily: FS }}>Engineered electrical supply for Uganda. Plot 14, Industrial Area, Kampala. +256 764 250 125.</div>
            </div>
            {[['SHOP', ['Circuit Protection', 'Cables', 'Motors & Drives', 'Lighting']], ['SOURCE', ['Rare Inquiry', 'Bulk Quotes', 'Trade Account', 'Delivery']], ['COMPANY', ['About', 'Brands', 'Contact', 'Careers']]].map(([h, items]) => (
              <div key={h}><Mono style={{ fontSize: 12.5, fontWeight: 600, color: '#fff', letterSpacing: 0.5, display: 'block', marginBottom: 13 }}>{h}</Mono>{items.map((it) => <div key={it} style={{ fontSize: 13.5, marginBottom: 9, cursor: 'pointer', fontFamily: FS }}>{it}</div>)}</div>))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 20 }}>
            <Mono style={{ fontSize: 12, color: 'rgba(255,255,255,.6)' }}>© 2026 CIRCUIT UGANDA LTD · PRICES INCL. VAT</Mono>
            <span style={{ display: 'flex', gap: 8 }}>{['MTN MOMO', 'AIRTEL', 'VISA', 'MASTERCARD', 'PAYPAL'].map((p) => <Mono key={p} style={{ background: 'rgba(255,255,255,.1)', padding: '5px 10px', fontSize: 11, fontWeight: 500, color: '#fff' }}>{p}</Mono>)}</span>
          </div>
        </div>
      </div>
    );
  }
  window.HomeC = HomeC;
})();
