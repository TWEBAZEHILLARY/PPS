// ui.jsx — shared admin UI primitives: cards, tables, pills, fields, modal, toasts.
(function () {
  const { Icon } = window;
  const T = window.ADMIN_T, F = window.ADMIN_F;

  // ── Status pill ───────────────────────────────────────────────────────
  const PILL = {
    // orders
    Pending: { fg: T.amberInk, bg: '#FFF3DC' }, Packed: { fg: T.blueDk, bg: T.blueWash },
    Shipped: { fg: T.purple, bg: T.purpleWash }, Delivered: { fg: T.green, bg: T.greenWash },
    'In Transit': { fg: T.teal, bg: T.tealWash }, 'Out for Delivery': { fg: T.purple, bg: T.purpleWash },
    Cancelled: { fg: T.red, bg: T.redWash },
    // inquiries
    New: { fg: T.blueDk, bg: T.blueWash }, 'In Progress': { fg: T.amberInk, bg: '#FFF3DC' }, Resolved: { fg: T.green, bg: T.greenWash },
    // quotes
    Sent: { fg: T.green, bg: T.greenWash },
    // clients
    Active: { fg: T.green, bg: T.greenWash }, Suspended: { fg: T.red, bg: T.redWash },
  };
  function Pill({ status, small }) {
    const c = PILL[status] || { fg: T.sub, bg: T.surface };
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: small ? 11 : 12, fontWeight: 800,
        color: c.fg, background: c.bg, padding: small ? '3px 9px' : '4px 11px', borderRadius: 999, whiteSpace: 'nowrap' }}>
        <span style={{ width: 6, height: 6, borderRadius: 999, background: c.fg }} />{status}
      </span>
    );
  }

  // ── Tag chip ──────────────────────────────────────────────────────────
  function TagChip({ tag }) {
    const map = {
      'Flash Deals': { fg: T.red, bg: T.redWash }, 'Popular this week': { fg: T.blueDk, bg: T.blueWash },
      'New Arrival': { fg: T.teal, bg: T.tealWash }, 'Best Seller': { fg: T.amberInk, bg: '#FFF3DC' },
      'Clearance': { fg: T.purple, bg: T.purpleWash },
    };
    const c = map[tag] || { fg: T.sub, bg: T.surface };
    return <span style={{ fontSize: 10.5, fontWeight: 800, color: c.fg, background: c.bg, padding: '2px 8px', borderRadius: 6, whiteSpace: 'nowrap' }}>{tag}</span>;
  }

  // ── Page header ─────────────────────────────────────────────────────────
  function PageHead({ title, sub, children }) {
    return (
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, marginBottom: 22, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: T.ink, letterSpacing: -0.6 }}>{title}</h1>
          {sub && <div style={{ fontSize: 14, color: T.sub, fontWeight: 600, marginTop: 5 }}>{sub}</div>}
        </div>
        <div style={{ flex: 1 }} />
        {children}
      </div>
    );
  }

  // ── Card ──────────────────────────────────────────────────────────────
  function Card({ children, style, pad = 20 }) {
    return <div style={{ background: '#fff', border: `1px solid ${T.line}`, borderRadius: 16, padding: pad, boxShadow: '0 1px 2px rgba(11,26,51,.04)', ...style }}>{children}</div>;
  }

  // ── Buttons ─────────────────────────────────────────────────────────────
  const btnBase = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, border: 'none', cursor: 'pointer', fontFamily: F, fontWeight: 800, borderRadius: 11, transition: 'background .15s, box-shadow .15s, opacity .15s', whiteSpace: 'nowrap' };
  function Button({ children, onClick, variant = 'primary', size = 'md', icon, style, type }) {
    const pad = size === 'sm' ? '8px 13px' : '11px 17px';
    const fs = size === 'sm' ? 13 : 14;
    const variants = {
      primary: { background: T.blue, color: '#fff', boxShadow: '0 4px 12px rgba(20,87,230,.26)' },
      accent: { background: T.amber, color: T.amberInk },
      ghost: { background: '#fff', color: T.ink, border: `1.5px solid ${T.line}` },
      danger: { background: T.redWash, color: T.red, border: `1.5px solid #F6C9CB` },
      dark: { background: T.ink, color: '#fff' },
    };
    return (
      <button type={type || 'button'} onClick={onClick} style={{ ...btnBase, ...variants[variant], padding: pad, fontSize: fs, ...style }}>
        {icon && <Icon name={icon} size={size === 'sm' ? 15 : 17} color={variants[variant].color} stroke={2.3} />}
        {children}
      </button>
    );
  }
  function IconBtn({ icon, onClick, title, tone = 'ink', size = 16 }) {
    const col = { ink: T.sub, danger: T.red, blue: T.blue }[tone];
    return (
      <button onClick={onClick} title={title} style={{ ...btnBase, width: 34, height: 34, padding: 0, background: '#fff', border: `1px solid ${T.line}`, color: col }}>
        <Icon name={icon} size={size} color={col} stroke={2.1} />
      </button>
    );
  }

  // ── Search input ─────────────────────────────────────────────────────────
  function Search({ value, onChange, placeholder, width = 280 }) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, width, height: 42, border: `1.5px solid ${T.line}`, borderRadius: 11, padding: '0 12px', background: '#fff' }}>
        <Icon name="search" size={17} color={T.sub} />
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', fontFamily: F, fontSize: 14, color: T.ink, background: 'transparent' }} />
        {value && <button onClick={() => onChange('')} style={{ border: 'none', background: 'none', cursor: 'pointer', color: T.sub, padding: 0, display: 'flex' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg></button>}
      </div>
    );
  }

  // ── Select / segmented filter ────────────────────────────────────────────
  function Select({ value, onChange, options, width }) {
    return (
      <div style={{ position: 'relative', width }}>
        <select value={value} onChange={(e) => onChange(e.target.value)}
          style={{ appearance: 'none', WebkitAppearance: 'none', width: '100%', height: 42, border: `1.5px solid ${T.line}`, borderRadius: 11, padding: '0 38px 0 13px', fontFamily: F, fontSize: 14, fontWeight: 700, color: T.ink, background: '#fff', cursor: 'pointer', outline: 'none' }}>
          {options.map((o) => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
        </select>
        <span style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
          <Icon name="chevronDown" size={16} color={T.sub} /></span>
      </div>
    );
  }

  // ── Table shell ─────────────────────────────────────────────────────────
  function Table({ columns, children }) {
    return (
      <div style={{ overflowX: 'auto', border: `1px solid ${T.line}`, borderRadius: 16, background: '#fff' }}>
        <table style={{ width: '100%', minWidth: 720, borderCollapse: 'collapse', fontFamily: F }}>
          <thead><tr>
            {columns.map((c, i) => <th key={i} style={{ textAlign: c.align || 'left', fontSize: 11.5, fontWeight: 800, color: T.sub, textTransform: 'uppercase', letterSpacing: 0.4, padding: '13px 16px', borderBottom: `1px solid ${T.line}`, background: T.surface, whiteSpace: 'nowrap', width: c.width }}>{c.label}</th>)}
          </tr></thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    );
  }
  const Td = ({ children, align, style }) => <td style={{ padding: '13px 16px', fontSize: 13.5, color: T.ink, textAlign: align || 'left', verticalAlign: 'middle', ...style }}>{children}</td>;
  function Row({ children, onClick, i }) {
    return <tr onClick={onClick} style={{ borderBottom: `1px solid ${T.lineSoft}`, cursor: onClick ? 'pointer' : 'default', background: i % 2 ? '#FBFCFE' : '#fff', transition: 'background .12s' }}
      onMouseEnter={onClick ? (e) => (e.currentTarget.style.background = T.blueWash) : undefined}
      onMouseLeave={onClick ? (e) => (e.currentTarget.style.background = i % 2 ? '#FBFCFE' : '#fff') : undefined}>{children}</tr>;
  }

  function Empty({ icon = 'search', title, sub }) {
    return (
      <div style={{ textAlign: 'center', padding: '52px 20px', color: T.sub }}>
        <div style={{ width: 56, height: 56, borderRadius: 999, background: T.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}><Icon name={icon} size={26} color={T.faint} /></div>
        <div style={{ fontSize: 16, fontWeight: 800, color: T.ink }}>{title}</div>
        {sub && <div style={{ fontSize: 13.5, marginTop: 4 }}>{sub}</div>}
      </div>
    );
  }

  // ── Product thumbnail (image url or icon placeholder) ────────────────────
  function Thumb({ p, size = 40, radius = 9 }) {
    return (
      <div style={{ width: size, height: size, borderRadius: radius, overflow: 'hidden', flexShrink: 0, border: `1px solid ${T.line}`, background: T.surface }}>
        {p.image
          ? <img src={p.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; }} />
          : <window.ProductShot icon={p.icon || window.A_CAT_ICON[p.category] || 'box'} bg={T.surface} tint="#A6B4CC" pad={Math.round(size * 0.22)} />}
      </div>
    );
  }

  // ── Form fields ─────────────────────────────────────────────────────────
  const fieldCss = { width: '100%', border: `1.5px solid ${T.line}`, borderRadius: 11, padding: '11px 13px', fontSize: 14, fontFamily: F, color: T.ink, outline: 'none', background: '#fff', boxSizing: 'border-box' };
  const lblCss = { fontSize: 12.5, fontWeight: 800, color: T.ink, marginBottom: 6, display: 'block' };
  function Field({ label, children, hint, full }) {
    return (
      <div style={{ gridColumn: full ? '1 / -1' : 'auto' }}>
        <label style={lblCss}>{label}{hint && <span style={{ color: T.sub, fontWeight: 600 }}> · {hint}</span>}</label>
        {children}
      </div>
    );
  }
  const Input = (props) => <input {...props} style={{ ...fieldCss, ...(props.style || {}) }} />;
  const Textarea = (props) => <textarea {...props} style={{ ...fieldCss, resize: 'vertical', lineHeight: 1.5, ...(props.style || {}) }} />;

  // ── Modal shell ─────────────────────────────────────────────────────────
  function Modal({ title, sub, onClose, width = 640, children, footer }) {
    React.useEffect(() => {
      const onKey = (e) => { if (e.key === 'Escape') onClose(); };
      window.addEventListener('keydown', onKey);
      document.body.style.overflow = 'hidden';
      return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
    }, []);
    return (
      <div onMouseDown={onClose} style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(11,26,51,.55)', backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '44px 20px', overflowY: 'auto', animation: 'aFade .16s ease' }}>
        <div onMouseDown={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: width, background: '#fff', borderRadius: 18, boxShadow: '0 28px 80px rgba(11,26,51,.42)', overflow: 'hidden', fontFamily: F, color: T.ink, display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 88px)', animation: 'aPop .2s cubic-bezier(.2,.9,.3,1.15)' }}>
          <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 14, padding: '17px 22px', borderBottom: `1px solid ${T.line}` }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: -0.4 }}>{title}</div>
              {sub && <div style={{ fontSize: 13, color: T.sub, fontWeight: 600, marginTop: 2 }}>{sub}</div>}
            </div>
            <div style={{ flex: 1 }} />
            <button onClick={onClose} style={{ flexShrink: 0, width: 36, height: 36, borderRadius: 10, border: `1px solid ${T.line}`, background: '#fff', color: T.sub, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg></button>
          </div>
          <div style={{ flex: '1 1 auto', overflowY: 'auto', padding: 22 }}>{children}</div>
          {footer && <div style={{ flex: '0 0 auto', borderTop: `1px solid ${T.line}`, padding: '15px 22px', display: 'flex', gap: 11, justifyContent: 'flex-end', background: T.surface }}>{footer}</div>}
        </div>
      </div>
    );
  }

  // ── Confirm dialog (store-driven) ────────────────────────────────────────
  const ConfirmStore = (() => { let cfg = null; const subs = new Set(); return { open: (c) => { cfg = c; subs.forEach((f) => f(cfg)); }, close: () => { cfg = null; subs.forEach((f) => f(null)); }, sub: (f) => { subs.add(f); return () => subs.delete(f); } }; })();
  function ConfirmHost() {
    const [cfg, setCfg] = React.useState(null);
    React.useEffect(() => ConfirmStore.sub(setCfg), []);
    if (!cfg) return null;
    return (
      <Modal title={cfg.title} sub={cfg.sub} width={420} onClose={ConfirmStore.close}
        footer={<React.Fragment>
          <Button variant="ghost" onClick={ConfirmStore.close}>Cancel</Button>
          <Button variant={cfg.danger ? 'danger' : 'primary'} icon={cfg.danger ? 'minus' : 'check'} onClick={() => { cfg.onConfirm(); ConfirmStore.close(); }}>{cfg.confirmLabel || 'Confirm'}</Button>
        </React.Fragment>}>
        <div style={{ fontSize: 14, color: T.sub, fontWeight: 600, lineHeight: 1.55 }}>{cfg.body}</div>
      </Modal>
    );
  }

  // ── Toast host ─────────────────────────────────────────────────────────
  const tone = { ok: T.green, warn: T.amber, error: T.red, info: T.blue };
  function ToastHost() {
    const list = window.useToasts();
    return (
      <div style={{ position: 'fixed', right: 22, bottom: 22, zIndex: 3000, display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end', pointerEvents: 'none' }}>
        {list.map((t) => (
          <div key={t.id} style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'flex-start', gap: 12, width: 330, background: '#fff', border: `1px solid ${T.line}`, borderLeft: `4px solid ${tone[t.tone]}`, borderRadius: 12, padding: '13px 14px', boxShadow: '0 12px 32px rgba(11,26,51,.18)', fontFamily: F, animation: 'aToast .26s cubic-bezier(.2,.9,.3,1.1)' }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, background: tone[t.tone] + '1f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={t.icon} size={17} color={tone[t.tone]} stroke={2.2} /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              {t.title && <div style={{ fontSize: 13.5, fontWeight: 800, color: T.ink }}>{t.title}</div>}
              <div style={{ fontSize: 12.5, fontWeight: 600, color: T.sub, lineHeight: 1.4, marginTop: t.title ? 2 : 0 }}>{t.msg}</div>
            </div>
            <button onClick={() => window.ToastStore.dismiss(t.id)} style={{ border: 'none', background: 'none', color: T.sub, cursor: 'pointer', padding: 2, display: 'flex', flexShrink: 0 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg></button>
          </div>
        ))}
      </div>
    );
  }

  if (!document.getElementById('admin-anim')) {
    const s = document.createElement('style'); s.id = 'admin-anim';
    s.textContent = '@keyframes aFade{from{opacity:0}to{opacity:1}}@keyframes aPop{from{opacity:0;transform:translateY(8px) scale(.985)}to{opacity:1;transform:none}}@keyframes aToast{from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:none}}@keyframes aBar{from{width:0}}';
    document.head.appendChild(s);
  }

  Object.assign(window, { Pill, TagChip, PageHead, Card, Button, IconBtn, Search, Select, Table, Td, Row, Empty, Thumb, Field, Input, Textarea, Modal, ConfirmStore, ConfirmHost, ToastHost, A_field: fieldCss, A_lbl: lblCss });
})();
