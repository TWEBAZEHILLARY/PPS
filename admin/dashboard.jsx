// dashboard.jsx — Dashboard (metrics + recent activity) and Reports (charts).
(function () {
  const { Icon } = window;
  const T = window.ADMIN_T, F = window.ADMIN_F;
  const { Card, PageHead, Pill, Button, Router, useData, A_money, A_moneyK, A_priceOf, A_fmtDate, A_relTime } = window;

  // ── Metric card ──────────────────────────────────────────────────────────
  function Metric({ icon, label, value, accent, tone, onClick }) {
    return (
      <div onClick={onClick} style={{ background: '#fff', border: `1px solid ${T.line}`, borderRadius: 16, padding: '18px 18px', boxShadow: '0 1px 2px rgba(11,26,51,.04)', cursor: onClick ? 'pointer' : 'default', transition: 'box-shadow .15s, transform .15s' }}
        onMouseEnter={onClick ? (e) => { e.currentTarget.style.boxShadow = '0 8px 22px rgba(11,26,51,.10)'; e.currentTarget.style.transform = 'translateY(-2px)'; } : undefined}
        onMouseLeave={onClick ? (e) => { e.currentTarget.style.boxShadow = '0 1px 2px rgba(11,26,51,.04)'; e.currentTarget.style.transform = 'none'; } : undefined}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 11, background: (accent || T.blue) + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={icon} size={20} color={accent || T.blue} stroke={2} /></div>
          <div style={{ fontSize: 12.5, fontWeight: 800, color: T.sub, lineHeight: 1.3 }}>{label}</div>
        </div>
        <div style={{ fontSize: 30, fontWeight: 800, color: tone || T.ink, letterSpacing: -1, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      </div>
    );
  }

  function Dashboard() {
    const d = useData();
    const products = d.products, orders = d.orders, clients = d.clients, inquiries = d.inquiries;
    const totalProducts = products.length;
    const totalOrders = orders.length;
    const totalClients = clients.length;
    const pendingInquiries = inquiries.filter((q) => q.status === 'New' || q.status === 'In Progress').length;
    const pendingOrders = orders.filter((o) => o.status === 'Pending' || o.status === 'Packed').length;
    const lowStock = products.filter((p) => p.stock < 5);
    const revenue = orders.filter((o) => o.status !== 'Cancelled').reduce((s, o) => s + o.total, 0);

    const recentOrders = orders.slice().sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
    const recentInquiries = inquiries.slice().sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

    const Section = ({ title, action, children }) => (
      <Card pad={0} style={{ overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '15px 18px', borderBottom: `1px solid ${T.line}` }}>
          <div style={{ fontSize: 15.5, fontWeight: 800, color: T.ink }}>{title}</div>
          <div style={{ flex: 1 }} />
          {action}
        </div>
        {children}
      </Card>
    );
    const LinkBtn = ({ to, children }) => <button onClick={() => Router.go(to)} style={{ border: 'none', background: 'none', color: T.blue, fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: F, display: 'inline-flex', alignItems: 'center', gap: 4 }}>{children}<Icon name="arrowRight" size={14} color={T.blue} /></button>;

    return (
      <div>
        <PageHead title="Dashboard" sub="Live overview · figures update as you manage orders and inquiries" />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 16 }}>
          <Metric icon="box" label="Total Products" value={totalProducts} accent={T.blue} onClick={() => Router.go('products')} />
          <Metric icon="cart" label="Total Orders" value={totalOrders} accent={T.purple} onClick={() => Router.go('orders')} />
          <Metric icon="user" label="Total Clients" value={totalClients} accent={T.teal} onClick={() => Router.go('clients')} />
          <Metric icon="doc" label="Pending Inquiries" value={pendingInquiries} accent={T.amber} onClick={() => Router.go('inquiries')} />
          <Metric icon="truck" label="Pending Orders" value={pendingOrders} accent={T.blueDk} onClick={() => Router.go('orders')} />
          <Metric icon="bolt" label="Low Stock Alerts" value={lowStock.length} accent={T.red} tone={lowStock.length ? T.red : T.ink} onClick={() => Router.go('products')} />
        </div>

        <Card style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: T.greenWash, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="shield" size={22} color={T.green} stroke={2} /></div>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: T.sub }}>Revenue · fulfilled & in-progress</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: T.ink, letterSpacing: -0.6 }}>{A_money(revenue)}</div>
            </div>
          </div>
          <div style={{ flex: 1 }} />
          <Button icon="filter" variant="ghost" onClick={() => Router.go('reports')}>View reports</Button>
        </Card>

        {lowStock.length > 0 && (
          <Card style={{ marginBottom: 16, borderColor: '#F6C9CB', background: '#FFF8F8' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: T.redWash, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="bolt" size={18} color={T.red} stroke={2.2} /></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: T.ink }}>{lowStock.length} product{lowStock.length === 1 ? '' : 's'} low on stock (under 5 units)</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                  {lowStock.map((p) => (
                    <button key={p.id} onClick={() => Router.go('products')} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, border: `1px solid ${T.line}`, background: '#fff', borderRadius: 999, padding: '5px 11px 5px 6px', cursor: 'pointer', fontFamily: F }}>
                      <span style={{ width: 22, height: 22, borderRadius: 999, background: T.redWash, color: T.red, fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{p.stock}</span>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: T.ink, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 }}>
          <Section title="Recent Orders" action={<LinkBtn to="orders">All orders</LinkBtn>}>
            {recentOrders.map((o, i) => (
              <div key={o.id} onClick={() => Router.go('orders', { focus: o.id })} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 18px', borderBottom: i < recentOrders.length - 1 ? `1px solid ${T.lineSoft}` : 'none', cursor: 'pointer' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = T.surface)} onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: T.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="package" size={18} color={T.sub} stroke={1.8} /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: T.ink }}>{o.id} · {o.clientName}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.sub, marginTop: 2 }}>{A_fmtDate(o.date)} · {o.items.length} item{o.items.length === 1 ? '' : 's'}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: T.ink, marginBottom: 5 }}>{A_money(o.total)}</div>
                  <Pill status={o.status} small />
                </div>
              </div>
            ))}
          </Section>

          <Section title="Recent Inquiries" action={<LinkBtn to="inquiries">All inquiries</LinkBtn>}>
            {recentInquiries.map((q, i) => (
              <div key={q.id} onClick={() => Router.go('inquiries', { focus: q.id })} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 18px', borderBottom: i < recentInquiries.length - 1 ? `1px solid ${T.lineSoft}` : 'none', cursor: 'pointer' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = T.surface)} onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: T.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="doc" size={18} color={T.sub} stroke={1.8} /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: T.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.subject}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.sub, marginTop: 2 }}>{q.clientName} · {A_relTime(q.date)}</div>
                </div>
                <Pill status={q.status} small />
              </div>
            ))}
          </Section>
        </div>
      </div>
    );
  }

  // ── Reports · Overview tab (analytics charts) ──────────────────────────────
  function Reports({ embedded } = {}) {
    const d = useData();
    const { orders, products } = d;
    const fulfilled = orders.filter((o) => o.status !== 'Cancelled');

    // Sales over last 7 days
    const days = [];
    const today = new Date('2026-06-22T00:00:00');
    for (let i = 6; i >= 0; i--) { const dt = new Date(today); dt.setDate(dt.getDate() - i); days.push(dt); }
    const salesByDay = days.map((dt) => {
      const key = dt.toISOString().slice(0, 10);
      const total = fulfilled.filter((o) => o.date === key).reduce((s, o) => s + o.total, 0);
      return { label: dt.toLocaleDateString('en-GB', { weekday: 'short' }), date: dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }), total };
    });
    const maxSale = Math.max(1, ...salesByDay.map((x) => x.total));

    // Top selling
    const soldMap = {};
    fulfilled.forEach((o) => o.items.forEach((it) => {
      if (!soldMap[it.productId]) soldMap[it.productId] = { name: it.name, sku: it.sku, qty: 0, revenue: 0 };
      soldMap[it.productId].qty += it.qty; soldMap[it.productId].revenue += it.qty * it.price;
    }));
    const topSelling = Object.values(soldMap).sort((a, b) => b.qty - a.qty).slice(0, 6);

    // Revenue by category
    const catMap = {};
    fulfilled.forEach((o) => o.items.forEach((it) => { catMap[it.category] = (catMap[it.category] || 0) + it.qty * it.price; }));
    const catTotal = Object.values(catMap).reduce((s, v) => s + v, 0) || 1;
    const palette = [T.blue, T.amber, T.teal, T.purple, T.green, T.red, T.blueDk, T.sub];
    const catData = Object.entries(catMap).map(([name, value], i) => ({ name, value, pct: value / catTotal, color: palette[i % palette.length] })).sort((a, b) => b.value - a.value);
    let acc = 0;
    const conic = catData.map((c) => { const start = acc * 360; acc += c.pct; return `${c.color} ${start}deg ${acc * 360}deg`; }).join(', ');

    // Order status distribution
    const statuses = window.A_ORDER_STATUSES;
    const statusColor = { Pending: T.amber, Packed: T.blue, Shipped: T.purple, 'In Transit': T.teal, 'Out for Delivery': T.purple, Delivered: T.green, Cancelled: T.red };
    const statusCount = statuses.map((s) => ({ status: s, count: orders.filter((o) => o.status === s).length, color: statusColor[s] }));
    const statusTotal = orders.length || 1;

    const exportCsv = () => {
      window.ToastStore.push('reports-summary.csv generated and downloaded.', { title: 'Export ready', icon: 'download', tone: 'ok' });
    };

    const H = ({ children }) => <div style={{ fontSize: 15.5, fontWeight: 800, color: T.ink, marginBottom: 16 }}>{children}</div>;

    return (
      <div>
        {!embedded && (
          <PageHead title="Reports & Analytics" sub="Generated from live order and product data">
            <Button icon="download" variant="dark" onClick={exportCsv}>Export CSV</Button>
          </PageHead>
        )}

        <Card style={{ marginBottom: 16 }}>
          <H>Sales Overview · last 7 days</H>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {salesByDay.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 84, flexShrink: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: T.ink }}>{s.label}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: T.sub }}>{s.date}</div>
                </div>
                <div style={{ flex: 1, height: 26, background: T.surface, borderRadius: 8, overflow: 'hidden' }}>
                  <div style={{ width: `${Math.max(s.total ? 4 : 0, (s.total / maxSale) * 100)}%`, height: '100%', background: `linear-gradient(90deg, ${T.blue}, ${T.blueDk})`, borderRadius: 8, animation: 'aBar .6s ease' }} />
                </div>
                <div style={{ width: 110, textAlign: 'right', flexShrink: 0, fontSize: 13, fontWeight: 800, color: s.total ? T.ink : T.faint, fontVariantNumeric: 'tabular-nums' }}>{s.total ? A_money(s.total) : '—'}</div>
              </div>
            ))}
          </div>
        </Card>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16, marginBottom: 16 }}>
          <Card>
            <H>Revenue by Category</H>
            <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
              <div style={{ width: 150, height: 150, borderRadius: 999, flexShrink: 0, background: `conic-gradient(${conic})`, position: 'relative' }}>
                <div style={{ position: 'absolute', inset: 38, borderRadius: 999, background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.sub }}>Total</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: T.ink }}>{A_moneyK(catTotal)}</div>
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 160, display: 'flex', flexDirection: 'column', gap: 9 }}>
                {catData.map((c) => (
                  <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <span style={{ width: 11, height: 11, borderRadius: 3, background: c.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: T.ink, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                    <span style={{ fontSize: 12.5, fontWeight: 800, color: T.sub, fontVariantNumeric: 'tabular-nums' }}>{Math.round(c.pct * 100)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card>
            <H>Order Status Distribution</H>
            <div style={{ display: 'flex', height: 16, borderRadius: 999, overflow: 'hidden', marginBottom: 18, background: T.surface }}>
              {statusCount.filter((s) => s.count).map((s) => <div key={s.status} title={`${s.status}: ${s.count}`} style={{ width: `${(s.count / statusTotal) * 100}%`, background: s.color }} />)}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 11 }}>
              {statusCount.map((s) => (
                <div key={s.status} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <span style={{ width: 11, height: 11, borderRadius: 3, background: s.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: T.ink, flex: 1 }}>{s.status}</span>
                  <span style={{ fontSize: 13.5, fontWeight: 800, color: T.ink, fontVariantNumeric: 'tabular-nums' }}>{s.count}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card pad={0} style={{ overflow: 'hidden' }}>
          <div style={{ padding: '16px 18px', borderBottom: `1px solid ${T.line}` }}><div style={{ fontSize: 15.5, fontWeight: 800, color: T.ink }}>Top Selling Products</div></div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: 480, borderCollapse: 'collapse', fontFamily: F }}>
              <thead><tr>
                {['Product', 'SKU', 'Qty Sold', 'Revenue'].map((h, i) => <th key={h} style={{ textAlign: i > 1 ? 'right' : 'left', fontSize: 11.5, fontWeight: 800, color: T.sub, textTransform: 'uppercase', letterSpacing: 0.4, padding: '12px 18px', background: T.surface, borderBottom: `1px solid ${T.line}` }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {topSelling.map((p, i) => (
                  <tr key={i} style={{ borderBottom: i < topSelling.length - 1 ? `1px solid ${T.lineSoft}` : 'none' }}>
                    <td style={{ padding: '12px 18px', fontSize: 13.5, fontWeight: 700, color: T.ink }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ width: 22, height: 22, borderRadius: 7, background: i === 0 ? T.amber : T.surface, color: i === 0 ? T.amberInk : T.sub, fontSize: 11.5, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 300 }}>{p.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 18px', fontSize: 12.5, fontWeight: 700, color: T.sub, fontVariantNumeric: 'tabular-nums' }}>{p.sku}</td>
                    <td style={{ padding: '12px 18px', fontSize: 13.5, fontWeight: 800, color: T.ink, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{p.qty}</td>
                    <td style={{ padding: '12px 18px', fontSize: 13.5, fontWeight: 800, color: T.ink, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{A_money(p.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  }

  Object.assign(window, { AdminDashboard: Dashboard, AdminReportsOverview: Reports });
})();
