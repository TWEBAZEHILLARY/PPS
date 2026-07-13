// app.jsx — admin shell: sidebar nav, header with notification bell, view router.
(function () {
  const { Icon } = window;
  const T = window.ADMIN_T, F = window.ADMIN_F;
  const { useData, useRouter, DataStore, Router, ToastStore, ConfirmHost, ToastHost, ConfirmStore,
    A_relTime, A_fmtDate, useAuth, AuthStore, LoginScreen, SessionWatcher, ResetLinkGate } = window;

  const NAV = [
    { id: 'dashboard', label: 'Dashboard', icon: 'box' },
    { id: 'reports', label: 'Reports', icon: 'filter' },
    { id: 'products', label: 'Products', icon: 'package' },
    { id: 'clients', label: 'Clients', icon: 'user' },
    { id: 'orders', label: 'Orders', icon: 'cart' },
    { id: 'inquiries', label: 'Inquiries', icon: 'doc' },
    { id: 'quotes', label: 'Quotes', icon: 'download' },
    { id: 'employees', label: 'Employees', icon: 'shield' },
    { id: 'settings', label: 'Settings', icon: 'lock' },
  ];
  // RBAC: each view maps to the permission module that unlocks it.
  // Dashboard is always available to a signed-in user. Settings is admin-only.
  const VIEW_PERM = { dashboard: null, reports: 'Reports', products: 'Products', clients: 'Clients', orders: 'Orders', inquiries: 'Inquiries', quotes: 'Quotes', employees: 'Employees', settings: '__admin__' };
  const canView = (auth, id) => !!auth && (VIEW_PERM[id] === '__admin__' ? auth.role === 'admin' : (!VIEW_PERM[id] || auth.role === 'admin' || (auth.permissions || []).includes(VIEW_PERM[id])));

  // ── Sidebar ──────────────────────────────────────────────────────────────
  function Sidebar({ view, go, open, onClose }) {
    const d = useData();
    const auth = useAuth();
    const navItems = NAV.filter((n) => canView(auth, n.id));
    const counts = {
      products: d.products.length,
      orders: d.orders.filter((o) => o.status === 'Pending' || o.status === 'Packed').length,
      inquiries: d.inquiries.filter((q) => q.status === 'New').length,
    };
    const Item = ({ n }) => {
      const active = view === n.id;
      const badge = counts[n.id];
      return (
        <button onClick={() => { go(n.id); onClose(); }} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', border: 'none', cursor: 'pointer', fontFamily: F, textAlign: 'left',
          padding: '11px 14px', borderRadius: 12, marginBottom: 3, fontSize: 14, fontWeight: 800,
          background: active ? T.blue : 'transparent', color: active ? '#fff' : 'rgba(255,255,255,.72)', transition: 'background .15s, color .15s' }}
          onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,.08)'; e.currentTarget.style.color = '#fff'; } }}
          onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,.72)'; } }}>
          <Icon name={n.icon} size={19} color={active ? '#fff' : 'rgba(255,255,255,.66)'} stroke={2} />
          <span style={{ flex: 1 }}>{n.label}</span>
          {badge > 0 && <span style={{ minWidth: 22, height: 22, padding: '0 7px', borderRadius: 999, background: active ? 'rgba(255,255,255,.25)' : T.amber, color: active ? '#fff' : T.amberInk, fontSize: 11.5, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{badge}</span>}
        </button>
      );
    };
    return (
      <React.Fragment>
        {open && <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(11,26,51,.5)', zIndex: 90, display: 'none' }} className="adm-scrim" />}
        <aside className="adm-side" style={{ width: 248, flexShrink: 0, background: T.navy, display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh', transform: open ? 'translateX(0)' : undefined }}>
          <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid rgba(255,255,255,.09)' }}>
            <window.PPSLogo size={30} text="#fff" />
            <div style={{ fontSize: 11.5, fontWeight: 800, color: 'rgba(255,255,255,.5)', letterSpacing: 1.4, textTransform: 'uppercase', marginTop: 12 }}>Admin Console</div>
          </div>
          <nav style={{ flex: 1, overflowY: 'auto', padding: '14px 12px' }}>
            {navItems.map((n) => <Item key={n.id} n={n} />)}
          </nav>
          <div style={{ padding: 12, borderTop: '1px solid rgba(255,255,255,.09)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '6px 8px 12px' }}>
              <div style={{ width: 38, height: 38, borderRadius: 999, background: `linear-gradient(135deg, ${T.blue}, ${T.blueDk})`, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, flexShrink: 0 }}>{auth ? auth.initials : '–'}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', lineHeight: 1.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{auth ? auth.name : ''}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{auth ? auth.title : ''}</div>
              </div>
            </div>
            <button onClick={() => ConfirmStore.open({ title: 'Sign out', sub: auth ? auth.name : '', body: 'End your session and return to the login screen?', confirmLabel: 'Sign out', onConfirm: () => { AuthStore.logout(); ToastStore.push('Logged out successfully', { title: 'Signed out', icon: 'shield', tone: 'info' }); } })}
              style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', border: '1px solid rgba(255,255,255,.14)', background: 'transparent', color: 'rgba(255,255,255,.7)', cursor: 'pointer', fontFamily: F, padding: '10px 13px', borderRadius: 11, fontSize: 12.5, fontWeight: 800, transition: 'background .15s, color .15s' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(229,72,77,.16)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(229,72,77,.4)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,.7)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,.14)'; }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></svg>Sign Out</button>
          </div>
        </aside>
      </React.Fragment>
    );
  }

  // ── Notification bell + dropdown ────────────────────────────────────────
  function Bell() {
    const d = useData();
    const auth = useAuth();
    const [open, setOpen] = React.useState(false);
    const ref = React.useRef(null);
    const notifs = DataStore.notifications();
    const unread = notifs.filter((n) => !n.read).length;
    if (!AuthStore.can('Notifications')) return null;
    React.useEffect(() => {
      const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
      document.addEventListener('mousedown', onDoc); return () => document.removeEventListener('mousedown', onDoc);
    }, []);
    const click = (n) => { DataStore.markRead(n.id); setOpen(false); Router.go(n.kind === 'order' ? 'orders' : 'inquiries', { focus: n.refId }); };
    return (
      <div ref={ref} style={{ position: 'relative' }}>
        <button onClick={() => setOpen((o) => !o)} style={{ position: 'relative', width: 44, height: 44, borderRadius: 12, border: `1px solid ${T.line}`, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke={T.ink} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg>
          {unread > 0 && <span style={{ position: 'absolute', top: 6, right: 6, minWidth: 18, height: 18, padding: '0 5px', borderRadius: 999, background: T.red, color: '#fff', fontSize: 10.5, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff' }}>{unread}</span>}
        </button>
        {open && (
          <div style={{ position: 'absolute', top: 52, right: 0, width: 360, maxWidth: '90vw', background: '#fff', border: `1px solid ${T.line}`, borderRadius: 16, boxShadow: '0 20px 50px rgba(11,26,51,.22)', zIndex: 200, overflow: 'hidden', animation: 'aPop .16s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', borderBottom: `1px solid ${T.line}` }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: T.ink }}>Notifications</div>
              {unread > 0 && <span style={{ marginLeft: 8, fontSize: 11.5, fontWeight: 800, color: T.red, background: T.redWash, padding: '2px 8px', borderRadius: 999 }}>{unread} new</span>}
              <div style={{ flex: 1 }} />
              {unread > 0 && <button onClick={() => DataStore.markAllRead()} style={{ border: 'none', background: 'none', color: T.blue, fontWeight: 800, fontSize: 12.5, cursor: 'pointer', fontFamily: F }}>Mark all read</button>}
            </div>
            <div style={{ maxHeight: 380, overflowY: 'auto' }}>
              {notifs.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: T.sub }}>
                  <div style={{ width: 46, height: 46, borderRadius: 999, background: T.greenWash, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}><Icon name="check" size={22} color={T.green} stroke={2.4} /></div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: T.ink }}>All caught up</div>
                  <div style={{ fontSize: 12.5, marginTop: 3 }}>No pending orders or new inquiries.</div>
                </div>
              ) : notifs.map((n) => (
                <button key={n.id} onClick={() => click(n)} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, width: '100%', textAlign: 'left', border: 'none', borderBottom: `1px solid ${T.lineSoft}`, background: n.read ? '#fff' : T.blueWash + '66', cursor: 'pointer', fontFamily: F, padding: '13px 16px' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = T.surface)} onMouseLeave={(e) => (e.currentTarget.style.background = n.read ? '#fff' : T.blueWash + '66')}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: n.kind === 'order' ? T.blueWash : '#FFF3DC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={n.kind === 'order' ? 'cart' : 'doc'} size={17} color={n.kind === 'order' ? T.blue : T.amberInk} stroke={2} /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 800, color: T.ink }}>{n.title}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: T.sub, marginTop: 2 }}>{n.who} · {A_relTime(n.date)}</div>
                  </div>
                  {!n.read && <span style={{ width: 8, height: 8, borderRadius: 999, background: T.blue, flexShrink: 0, marginTop: 6 }} />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Header ───────────────────────────────────────────────────────────────
  function Header({ onMenu }) {
    const auth = useAuth();
    return (
      <header style={{ position: 'sticky', top: 0, zIndex: 80, background: 'rgba(255,255,255,.85)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', borderBottom: `1px solid ${T.line}`, display: 'flex', alignItems: 'center', gap: 14, padding: '12px 22px' }}>
        <button className="adm-burger" onClick={onMenu} style={{ display: 'none', width: 42, height: 42, borderRadius: 11, border: `1px solid ${T.line}`, background: '#fff', cursor: 'pointer', alignItems: 'center', justifyContent: 'center' }}><Icon name="menu" size={20} color={T.ink} /></button>
        <a href="home.html" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 800, color: T.sub, textDecoration: 'none' }}>
          <Icon name="shield" size={16} color={T.sub} stroke={2} />View storefront
        </a>
        <div style={{ flex: 1 }} />
        <Bell />
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, paddingLeft: 6 }}>
          <div style={{ textAlign: 'right' }} className="adm-admin-name">
            <div style={{ fontSize: 13.5, fontWeight: 800, color: T.ink, lineHeight: 1.2 }}>{auth ? auth.name : ''}</div>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: T.sub }}>{auth ? auth.title : ''}</div>
          </div>
          <div style={{ width: 42, height: 42, borderRadius: 999, background: `linear-gradient(135deg, ${T.blue}, ${T.blueDk})`, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, flexShrink: 0 }}>{auth ? auth.initials : '–'}</div>
        </div>
      </header>
    );
  }

  // ── App ──────────────────────────────────────────────────────────────────
  function App() {
    const auth = useAuth();
    const [view, go] = useRouter();
    const [menu, setMenu] = React.useState(false);
    // RBAC guard: bounce out of any view the signed-in user can't access.
    React.useEffect(() => {
      if (auth && !canView(auth, view)) {
        go('dashboard');
        ToastStore.push('You don\u2019t have permission to open that section.', { title: 'Access denied', icon: 'lock', tone: 'error' });
      }
    }, [auth, view]);
    if (!auth) return (<React.Fragment><LoginScreen /><ResetLinkGate /><ToastHost /></React.Fragment>);
    const Views = {
      dashboard: window.AdminDashboard, reports: window.AdminReports, products: window.AdminProducts,
      clients: window.AdminClients, orders: window.AdminOrders, inquiries: window.AdminInquiries, quotes: window.AdminQuotes,
      employees: window.AdminEmployees, settings: window.AdminSettings,
    };
    const View = Views[view] || window.AdminDashboard;
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: T.page, fontFamily: F }}>
        <Sidebar view={view} go={go} open={menu} onClose={() => setMenu(false)} />
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <Header onMenu={() => setMenu(true)} />
          <main style={{ flex: 1, padding: '24px 28px 60px', maxWidth: 1320, width: '100%', margin: '0 auto' }}>
            <View key={view} />
          </main>
        </div>
        <ToastHost />
        <ConfirmHost />
        <SessionWatcher />
        <ResetLinkGate />
      </div>
    );
  }

  // responsive styles
  if (!document.getElementById('adm-resp')) {
    const s = document.createElement('style'); s.id = 'adm-resp';
    s.textContent = `
      @media (max-width: 900px){
        .adm-side{position:fixed!important;left:0;top:0;z-index:100;transform:translateX(-100%);transition:transform .25s ease;box-shadow:0 0 40px rgba(0,0,0,.3)}
        .adm-side[style*="translateX(0"]{transform:translateX(0)!important}
        .adm-scrim{display:block!important}
        .adm-burger{display:flex!important}
      }
      @media (max-width: 560px){ .adm-admin-name{display:none} }
    `;
    document.head.appendChild(s);
  }

  window.AdminApp = App;
})();
