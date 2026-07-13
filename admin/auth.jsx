// auth.jsx — login security, session management, role-based access (RBAC).
// Gates the whole admin console behind a login screen. Accounts live in
// localStorage (pps_users); the active session lives in sessionStorage
// (this browser session) or localStorage (Remember me).
(function () {
  const { Icon } = window;
  const T = window.ADMIN_T, F = window.ADMIN_F;
  const { Button, ToastStore } = window;

  // ── Permission modules (granular RBAC) ──────────────────────────────────
  const MODULES = ['Products', 'Clients', 'Orders', 'Inquiries', 'Quotes', 'Reports', 'Notifications', 'Employees'];

  // The single hardcoded admin email permitted to trigger a password reset.
  const ADMIN_EMAIL = 'twebazehillary@gmail.com';

  // ── Password-reset link (real email via EmailJS) ────────────────────────
  // The reset link the email points back to, plus where the token + expiry live.
  const RESET_LINK_BASE = 'https://pinnaclepowersystems.ug/admin.html';
  const RESET_TOKEN_KEY = 'pps_reset_token';
  const RESET_TTL = 15 * 60 * 1000; // token valid for 15 minutes

  // ── EmailJS credentials ─────────────────────────────────────────────────
  // Replace these three with the values from your EmailJS dashboard
  // (https://dashboard.emailjs.com). Until then the flow still works for
  // testing — the reset link is logged to the browser console instead.
  //   • Public Key:  Account → General
  //   • Service ID:  Email Services → (your service)
  //   • Template ID: Email Templates → (your template). The template must
  //     reference {{reset_link}} and send to {{to_email}}.
  const EMAILJS_PUBLIC_KEY  = 'YOUR_PUBLIC_KEY';
  const EMAILJS_SERVICE_ID  = 'YOUR_SERVICE_ID';
  const EMAILJS_TEMPLATE_ID = 'YOUR_TEMPLATE_ID';
  const isPlaceholder = (v) => !v || /^YOUR_/.test(v);
  const emailjsReady = () => typeof window.emailjs !== 'undefined'
    && !isPlaceholder(EMAILJS_PUBLIC_KEY) && !isPlaceholder(EMAILJS_SERVICE_ID) && !isPlaceholder(EMAILJS_TEMPLATE_ID);
  try { if (typeof window.emailjs !== 'undefined' && !isPlaceholder(EMAILJS_PUBLIC_KEY)) window.emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY }); } catch (e) {}

  // Token storage + validation (localStorage: pps_reset_token).
  const makeToken = () => (window.crypto && crypto.randomUUID ? crypto.randomUUID() : 'tok_' + Math.random().toString(36).slice(2) + Date.now().toString(36));
  const writeResetToken = (token) => { try { localStorage.setItem(RESET_TOKEN_KEY, JSON.stringify({ token, email: ADMIN_EMAIL, expires: Date.now() + RESET_TTL })); } catch (e) {} };
  const readResetToken = () => { try { const r = localStorage.getItem(RESET_TOKEN_KEY); return r ? JSON.parse(r) : null; } catch (e) { return null; } };
  const clearResetToken = () => { try { localStorage.removeItem(RESET_TOKEN_KEY); } catch (e) {} };
  const validateToken = (token) => { const rec = readResetToken(); return !!(rec && token && rec.token === token && Date.now() <= rec.expires); };

  // Generate a fresh token, persist it, and email the reset link to the admin.
  // Always returns { ok, sent, resetLink }; falls back to a console log if the
  // EmailJS keys aren't configured or the network send fails.
  async function sendResetEmail() {
    const token = makeToken();
    writeResetToken(token);
    const resetLink = `${RESET_LINK_BASE}?reset=${token}`;
    if (emailjsReady()) {
      try {
        await window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
          to_email: ADMIN_EMAIL, email: ADMIN_EMAIL, reset_link: resetLink, expiry_minutes: 15,
        });
        return { ok: true, sent: true, resetLink };
      } catch (err) {
        console.warn('[PPS] EmailJS send failed — falling back to console link.', err);
        console.log('%c[PPS] Password reset link (fallback):', 'font-weight:bold;color:#1457E6', resetLink);
        return { ok: true, sent: false, resetLink, error: err };
      }
    }
    console.log('%c[PPS] Password reset link (EmailJS not configured):', 'font-weight:bold;color:#1457E6', resetLink);
    return { ok: true, sent: false, resetLink };
  }

  // Read / strip the ?reset=TOKEN query parameter.
  const getResetTokenFromUrl = () => { try { return new URLSearchParams(window.location.search).get('reset'); } catch (e) { return null; } };
  const clearResetUrlParam = () => { try { const u = new URL(window.location.href); u.searchParams.delete('reset'); window.history.replaceState({}, document.title, u.pathname + u.search + u.hash); } catch (e) {} };

  // ── User store (pps_users) ──────────────────────────────────────────────
  const USERS_KEY = 'pps_users';
  const readUsers = () => { try { const r = localStorage.getItem(USERS_KEY); return r ? JSON.parse(r) : null; } catch (e) { return null; } };
  const writeUsers = (list) => { try { localStorage.setItem(USERS_KEY, JSON.stringify(list)); } catch (e) {} };

  // Seed: super-admin (Hillary) + one demo staff account. Plain-text passwords
  // are demo-only — production would hash + verify server-side.
  function seedUsers() {
    if (readUsers()) return;
    const admin = {
      id: 'u_admin', firstName: 'Hillary', lastName: 'Twebaze', username: 'admin',
      password: 'Abubakar@00#', email: ADMIN_EMAIL, jobTitle: 'Administrator',
      role: 'admin', signature: 'Hillary Twebaze', permissions: MODULES.slice(), isActive: true,
    };
    // No demo accounts — only the hardcoded super-admin is seeded.
    writeUsers([admin]);
  }
  seedUsers();

  const UserStore = (() => {
    const subs = new Set();
    let list = readUsers() || [];
    const emit = () => { list = list.slice(); subs.forEach((f) => f(list)); };
    const persist = () => writeUsers(list);
    const uid = () => 'u_' + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-3);
    return {
      all: () => list,
      sub: (f) => { subs.add(f); return () => subs.delete(f); },
      find: (username) => list.find((u) => u.username.toLowerCase() === (username || '').trim().toLowerCase()),
      findById: (id) => list.find((u) => u.id === id),
      usernameTaken: (username, exceptId) => list.some((u) => u.username.toLowerCase() === (username || '').trim().toLowerCase() && u.id !== exceptId),
      save: (u) => {
        const rec = { ...u, signature: ((u.firstName || '') + ' ' + (u.lastName || '')).trim() };
        const i = list.findIndex((x) => x.id === rec.id);
        if (i >= 0) list[i] = rec; else { rec.id = rec.id || uid(); list.push(rec); }
        persist(); emit(); return rec;
      },
      remove: (id) => { list = list.filter((u) => u.id !== id); persist(); emit(); },
    };
  })();
  function useUsers() { const [l, set] = React.useState(UserStore.all()); React.useEffect(() => UserStore.sub(set), []); return l; }

  const SESSION_KEY = 'pps_session';
  const REMEMBER_KEY = 'pps_remember';
  const EIGHT_HOURS = 8 * 60 * 60 * 1000;
  const WARN_BEFORE = 60 * 1000; // 1 minute before expiry
  const now = () => Date.now();
  const initialsOf = (u) => ((u.firstName || u.username || '?').charAt(0) + (u.lastName || '').charAt(0)).toUpperCase() || '?';

  // ── Auth store ──────────────────────────────────────────────────────────
  const AuthStore = (() => {
    const subs = new Set();
    const readRaw = () => {
      try { const s = sessionStorage.getItem(SESSION_KEY); if (s) return JSON.parse(s); } catch (e) {}
      try { const l = localStorage.getItem(SESSION_KEY); if (l) return JSON.parse(l); } catch (e) {}
      return null;
    };
    const clearStores = () => {
      try { sessionStorage.removeItem(SESSION_KEY); } catch (e) {}
      try { localStorage.removeItem(SESSION_KEY); } catch (e) {}
    };
    const writeStore = (session, remember) => {
      clearStores();
      const blob = JSON.stringify(session);
      try {
        if (remember) { localStorage.setItem(SESSION_KEY, blob); localStorage.setItem(REMEMBER_KEY, '1'); }
        else { sessionStorage.setItem(SESSION_KEY, blob); localStorage.removeItem(REMEMBER_KEY); }
      } catch (e) {}
    };
    const isRemembered = () => { try { return localStorage.getItem(REMEMBER_KEY) === '1'; } catch (e) { return false; } };

    let session = (() => { const s = readRaw(); return s && s.expires > now() ? s : null; })();
    if (!session) clearStores();

    const emit = () => subs.forEach((f) => f(session));
    const sessionFromUser = (u) => ({
      userId: u.id, username: u.username, role: u.role,
      name: ((u.firstName || '') + ' ' + (u.lastName || '')).trim() || u.username,
      firstName: u.firstName || '', lastName: u.lastName || '',
      title: u.jobTitle || (u.role === 'admin' ? 'Administrator' : 'Staff'),
      initials: initialsOf(u), signature: u.signature || ((u.firstName || '') + ' ' + (u.lastName || '')).trim(),
      email: u.email || '',
      permissions: u.role === 'admin' ? MODULES.slice() : (u.permissions || []).slice(),
      loginTime: now(), expires: now() + EIGHT_HOURS,
    });

    return {
      current: () => session,
      sub: (f) => { subs.add(f); return () => subs.delete(f); },
      // Validate username + password against pps_users.
      login: (username, password) => {
        const u = UserStore.find(username);
        if (!u || u.password !== password) return { ok: false, error: 'Incorrect username or password.' };
        if (!u.isActive) return { ok: false, error: 'This account has been suspended. Contact the administrator.' };
        return { ok: true, user: u };
      },
      // Reset the super-admin password (Gmail-verified flow). Updates pps_users.
      resetAdminPassword: (newPassword) => {
        const u = UserStore.find('admin') || UserStore.all().find((x) => (x.email || '').toLowerCase() === ADMIN_EMAIL);
        if (!u) return { ok: false, error: 'No administrator account found.' };
        UserStore.save({ ...u, password: newPassword });
        return { ok: true };
      },
      establish: (user, remember) => { session = sessionFromUser(user); writeStore(session, remember); emit(); },
      logout: () => { session = null; clearStores(); emit(); },
      can: (module) => !!session && (session.role === 'admin' || (session.permissions || []).includes(module)),
      touch: () => {
        if (!session) return;
        session = { ...session, expires: now() + EIGHT_HOURS };
        writeStore(session, isRemembered());
      },
      expiresAt: () => (session ? session.expires : 0),
    };
  })();

  function useAuth() {
    const [s, set] = React.useState(AuthStore.current());
    React.useEffect(() => AuthStore.sub(set), []);
    return s;
  }

  // ════════════════════════════════ LOGIN ═══════════════════════════════════
  const inputCss = { width: '100%', height: 50, border: `1.5px solid ${T.line}`, borderRadius: 12, padding: '0 14px', fontSize: 15, fontFamily: F, fontWeight: 600, color: T.ink, outline: 'none', background: '#fff', boxSizing: 'border-box', transition: 'border-color .15s, box-shadow .15s' };

  // ═══════════════════════ PASSWORD RESET (real email via EmailJS) ══════════
  // Step A — request: verify the registered admin email, generate a token,
  // store it (pps_reset_token, 15-min expiry) and email a reset link.
  // Step B — set new password — happens when the emailed link is opened
  // (?reset=TOKEN), handled by ResetLinkGate / SetPasswordOverlay below.
  function ResetModal({ onClose }) {
    const [email, setEmail] = React.useState(ADMIN_EMAIL);
    const [busy, setBusy] = React.useState(false);
    const [sent, setSent] = React.useState(false);
    const emailRef = React.useRef(null);
    React.useEffect(() => { if (emailRef.current) { emailRef.current.focus(); emailRef.current.select(); } }, []);
    React.useEffect(() => {
      const onKey = (e) => { if (e.key === 'Escape') onClose(); };
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }, []);

    const focusRing = (e) => { e.target.style.borderColor = T.blue; e.target.style.boxShadow = `0 0 0 3px ${T.blue}22`; };
    const blurRing = (e) => { e.target.style.borderColor = T.line; e.target.style.boxShadow = 'none'; };

    const sendLink = async (e) => {
      if (e) e.preventDefault();
      if (email.trim().toLowerCase() !== ADMIN_EMAIL) {
        ToastStore.push('This email is not associated with an admin account.', { title: 'Email not recognised', icon: 'lock', tone: 'error' });
        return;
      }
      setBusy(true);
      const res = await sendResetEmail();
      setBusy(false);
      if (res.sent) {
        ToastStore.push(`Reset link sent to ${ADMIN_EMAIL}. Please check your inbox (and spam folder).`, { title: 'Reset link sent', icon: 'check', tone: 'ok' });
      } else {
        ToastStore.push('Email service unavailable. The reset link was logged to the browser console for testing.', { title: 'Link generated (offline)', icon: 'clock', tone: 'warn' });
      }
      setSent(true);
    };

    return (
      <div onMouseDown={onClose} style={{ position: 'fixed', inset: 0, zIndex: 6000, fontFamily: F, background: 'rgba(11,26,51,.55)', backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', animation: 'aFade .16s ease' }}>
        <div onMouseDown={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 430, background: '#fff', borderRadius: 18, boxShadow: '0 28px 80px rgba(11,26,51,.42)', overflow: 'hidden', color: T.ink, animation: 'aPop .2s cubic-bezier(.2,.9,.3,1.15)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '22px 24px 0' }}>
            <div style={{ width: 46, height: 46, borderRadius: 12, background: T.blueWash, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name="lock" size={22} color={T.blue} stroke={2.1} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 21, fontWeight: 800, letterSpacing: -0.5 }}>Reset Password</div>
              <div style={{ fontSize: 13, color: T.sub, fontWeight: 600, marginTop: 3 }}>
                Enter your registered email address. We&rsquo;ll send you a reset link.
              </div>
            </div>
            <button type="button" onClick={onClose} aria-label="Close" style={{ flexShrink: 0, width: 34, height: 34, borderRadius: 10, border: `1px solid ${T.line}`, background: '#fff', color: T.sub, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          </div>

          {sent ? (
            <div style={{ padding: '20px 24px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11, background: T.greenWash, border: '1px solid #C7E8D5', color: T.green, borderRadius: 12, padding: '14px 14px', fontSize: 13, fontWeight: 700, lineHeight: 1.5 }}>
                <Icon name="check" size={17} color={T.green} stroke={2.6} />
                <span>A password reset link is on its way to <strong>{ADMIN_EMAIL}</strong>. Open it to set a new password — the link expires in 15 minutes.</span>
              </div>
              <button type="button" onClick={onClose} style={{ width: '100%', height: 50, marginTop: 18, border: `1.5px solid ${T.line}`, borderRadius: 12, background: '#fff', color: T.ink, fontSize: 15, fontWeight: 800, fontFamily: F, cursor: 'pointer' }}>Done</button>
            </div>
          ) : (
            <form onSubmit={sendLink} style={{ padding: '18px 24px 24px' }}>
              <label style={{ fontSize: 12.5, fontWeight: 800, color: T.ink, display: 'block', marginBottom: 7 }}>Email address</label>
              <input ref={emailRef} value={email} onChange={(e) => setEmail(e.target.value)} onFocus={focusRing} onBlur={blurRing}
                type="email" placeholder="you@example.com" autoComplete="email" style={{ ...inputCss, marginBottom: 18 }} />
              <button type="submit" disabled={busy} style={{ width: '100%', height: 50, border: 'none', borderRadius: 12, background: busy ? T.blueDk : T.blue, color: '#fff', fontSize: 15, fontWeight: 800, fontFamily: F, cursor: busy ? 'default' : 'pointer', boxShadow: '0 8px 22px rgba(20,87,230,.32)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, transition: 'background .15s' }}>
                {busy ? <React.Fragment><span className="pps-spin" style={{ width: 18, height: 18, borderRadius: 999, border: '2.5px solid rgba(255,255,255,.4)', borderTopColor: '#fff', display: 'inline-block' }} />Sending…</React.Fragment>
                  : <React.Fragment>Send Reset Link<Icon name="arrowRight" size={18} color="#fff" stroke={2.4} /></React.Fragment>}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // ═══════════════════════ SET NEW PASSWORD (from emailed link) ═════════════
  // Full-screen overlay shown when a valid ?reset=TOKEN is present in the URL.
  function SetPasswordOverlay({ onDone }) {
    const [newPw, setNewPw] = React.useState('');
    const [confirmPw, setConfirmPw] = React.useState('');
    const [show, setShow] = React.useState(false);
    const pwRef = React.useRef(null);
    React.useEffect(() => { if (pwRef.current) pwRef.current.focus(); }, []);

    const focusRing = (e) => { e.target.style.borderColor = T.blue; e.target.style.boxShadow = `0 0 0 3px ${T.blue}22`; };
    const blurRing = (e) => { e.target.style.borderColor = T.line; e.target.style.boxShadow = 'none'; };
    const pwWrap = { position: 'relative', marginBottom: 16 };
    const eyeBtn = { position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', color: T.blue, fontWeight: 800, fontSize: 12.5, cursor: 'pointer', fontFamily: F, padding: '8px 8px' };

    const doReset = (e) => {
      if (e) e.preventDefault();
      if (!newPw || !confirmPw) { ToastStore.push('Enter and confirm your new password.', { title: 'Password required', icon: 'lock', tone: 'error' }); return; }
      if (newPw.length < 6) { ToastStore.push('Password must be at least 6 characters.', { title: 'Password too short', icon: 'lock', tone: 'error' }); return; }
      if (newPw !== confirmPw) { ToastStore.push('Passwords do not match. Please re-enter.', { title: 'Passwords don\u2019t match', icon: 'lock', tone: 'error' }); return; }
      const res = AuthStore.resetAdminPassword(newPw);
      if (!res.ok) { ToastStore.push(res.error, { title: 'Reset failed', icon: 'lock', tone: 'error' }); return; }
      clearResetToken();
      AuthStore.logout();
      ToastStore.push('Password updated successfully. Please log in with your new password.', { title: 'Password updated', icon: 'check', tone: 'ok' });
      onDone();
    };

    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 7000, fontFamily: F, background: 'rgba(11,26,51,.6)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', animation: 'aFade .16s ease' }}>
        <div style={{ width: '100%', maxWidth: 430, background: '#fff', borderRadius: 18, boxShadow: '0 28px 80px rgba(11,26,51,.42)', overflow: 'hidden', color: T.ink, animation: 'aPop .2s cubic-bezier(.2,.9,.3,1.15)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '22px 24px 0' }}>
            <div style={{ width: 46, height: 46, borderRadius: 12, background: T.blueWash, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name="lock" size={22} color={T.blue} stroke={2.1} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 21, fontWeight: 800, letterSpacing: -0.5 }}>Set New Password</div>
              <div style={{ fontSize: 13, color: T.sub, fontWeight: 600, marginTop: 3 }}>Choose a new password for the admin account.</div>
            </div>
          </div>
          <form onSubmit={doReset} style={{ padding: '18px 24px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: T.greenWash, border: '1px solid #C7E8D5', color: T.green, borderRadius: 11, padding: '10px 12px', fontSize: 12.5, fontWeight: 700, marginBottom: 18 }}>
              <Icon name="check" size={15} color={T.green} stroke={2.6} />Reset link verified — {ADMIN_EMAIL}
            </div>
            <label style={{ fontSize: 12.5, fontWeight: 800, color: T.ink, display: 'block', marginBottom: 7 }}>New Password</label>
            <div style={pwWrap}>
              <input ref={pwRef} value={newPw} onChange={(e) => setNewPw(e.target.value)} onFocus={focusRing} onBlur={blurRing}
                type={show ? 'text' : 'password'} placeholder="At least 6 characters" autoComplete="new-password" style={{ ...inputCss, paddingRight: 64 }} />
              <button type="button" onClick={() => setShow((s) => !s)} style={eyeBtn}>{show ? 'Hide' : 'Show'}</button>
            </div>
            <label style={{ fontSize: 12.5, fontWeight: 800, color: T.ink, display: 'block', marginBottom: 7 }}>Confirm Password</label>
            <div style={pwWrap}>
              <input value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} onFocus={focusRing} onBlur={blurRing}
                type={show ? 'text' : 'password'} placeholder="Re-enter new password" autoComplete="new-password" style={{ ...inputCss, paddingRight: 64 }} />
            </div>
            <button type="submit" style={{ width: '100%', height: 50, border: 'none', borderRadius: 12, background: T.blue, color: '#fff', fontSize: 15, fontWeight: 800, fontFamily: F, cursor: 'pointer', boxShadow: '0 8px 22px rgba(20,87,230,.32)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, marginTop: 2 }}>
              Update Password<Icon name="check" size={18} color="#fff" stroke={2.6} />
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Reads ?reset=TOKEN on load; shows the overlay only for a valid, unexpired
  // token that matches pps_reset_token. Otherwise toasts + strips the param.
  function ResetLinkGate() {
    const [token, setToken] = React.useState(null);
    React.useEffect(() => {
      const t = getResetTokenFromUrl();
      if (!t) return;
      if (!validateToken(t)) {
        ToastStore.push('Invalid or expired reset link. Please request a new one.', { title: 'Reset link invalid', icon: 'lock', tone: 'error' });
        clearResetToken();
        clearResetUrlParam();
        return;
      }
      setToken(t);
    }, []);
    if (!token) return null;
    return <SetPasswordOverlay onDone={() => { clearResetUrlParam(); setToken(null); }} />;
  }

  function LoginScreen() {
    const [username, setUsername] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [show, setShow] = React.useState(false);
    const [remember, setRemember] = React.useState(false);
    const [error, setError] = React.useState('');
    const [busy, setBusy] = React.useState(false);
    const [resetOpen, setResetOpen] = React.useState(false);
    const userRef = React.useRef(null);
    React.useEffect(() => { if (userRef.current) userRef.current.focus(); }, []);

    const finish = (user) => {
      setBusy(true);
      setTimeout(() => {
        AuthStore.establish(user, remember);
        const first = user.firstName || user.username;
        ToastStore.push(`Signed in as ${user.firstName ? (user.firstName + ' ' + user.lastName).trim() : user.username}.`, { title: `Welcome back, ${first}!`, icon: 'shield', tone: 'ok' });
      }, 380);
    };

    const submit = (e) => {
      if (e) e.preventDefault();
      setError('');
      if (!username.trim() || !password) { setError('Enter your username and password.'); return; }
      const res = AuthStore.login(username, password);
      if (!res.ok) {
        const msg = /incorrect/i.test(res.error) ? 'Invalid username or password. Please try again.' : res.error;
        setError(msg);
        ToastStore.push(msg, { title: 'Sign-in failed', icon: 'lock', tone: 'error' });
        setPassword('');
        return;
      }
      finish(res.user);
    };

    const focusRing = (e) => { e.target.style.borderColor = T.blue; e.target.style.boxShadow = `0 0 0 3px ${T.blue}22`; };
    const blurRing = (e) => { e.target.style.borderColor = T.line; e.target.style.boxShadow = 'none'; };

    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 5000, fontFamily: F, display: 'flex', alignItems: 'stretch',
        background: `linear-gradient(150deg, ${T.navy} 0%, ${T.navy2} 55%, #0A2C6B 100%)` }}>
        {/* Brand panel (hidden on small screens via media query) */}
        <div className="pps-login-brand" style={{ flex: '1 1 0', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '54px 56px', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, opacity: 0.5, backgroundImage: 'radial-gradient(circle at 78% 18%, rgba(20,87,230,.55), transparent 46%), radial-gradient(circle at 12% 88%, rgba(255,176,32,.18), transparent 42%)' }} />
          <div style={{ position: 'relative' }}><window.PPSLogo size={34} text="#fff" /></div>
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 999, background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.16)', color: 'rgba(255,255,255,.86)', fontSize: 12, fontWeight: 800, letterSpacing: 0.4, marginBottom: 22 }}>
              <Icon name="lock" size={13} color="#FFB020" stroke={2.2} />SECURE ADMIN ACCESS
            </div>
            <h1 style={{ margin: 0, fontSize: 40, lineHeight: 1.08, fontWeight: 800, color: '#fff', letterSpacing: -1 }}>Run the catalogue,<br />orders, quotes &amp;<br />team from one console.</h1>
            <p style={{ margin: '18px 0 0', fontSize: 15.5, lineHeight: 1.6, color: 'rgba(255,255,255,.66)', fontWeight: 500, maxWidth: 420 }}>Manage products, build quotations, fulfil orders and your staff accounts — every change publishes straight to the Pinnacle Power Systems storefront.</p>
          </div>
          <div style={{ position: 'relative', display: 'flex', gap: 26, color: 'rgba(255,255,255,.5)', fontSize: 12.5, fontWeight: 700 }}>
            <span>© 2026 Pinnacle Power Systems</span>
          </div>
        </div>

        {/* Form panel */}
        <div style={{ flex: '0 0 clamp(380px, 38%, 520px)', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 30px', boxShadow: '-20px 0 60px rgba(0,0,0,.28)' }} className="pps-login-form">
          <form onSubmit={submit} style={{ width: '100%', maxWidth: 360 }}>
            <div className="pps-login-mark" style={{ display: 'none', marginBottom: 26 }}><window.PPSLogo size={30} /></div>
            <h2 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: T.ink, letterSpacing: -0.6 }}>Sign in to Admin</h2>
            <p style={{ margin: '7px 0 28px', fontSize: 14, color: T.sub, fontWeight: 600 }}>Pinnacle Power Systems Admin Console</p>

            {error && (
              <div style={{ marginBottom: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, background: T.redWash, border: `1px solid #F6C9CB`, color: T.red, borderRadius: 11, padding: '11px 13px', fontSize: 13, fontWeight: 700 }}>
                  <Icon name="minus" size={16} color={T.red} stroke={2.6} />{error}
                </div>
                <button type="button" onClick={() => { setError(''); setResetOpen(true); }} style={{ marginTop: 9, border: 'none', background: 'none', color: T.blue, fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: F, padding: 0, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <Icon name="lock" size={13} color={T.blue} stroke={2.3} />Forgot your password? Reset it
                </button>
              </div>
            )}

            <label style={{ fontSize: 12.5, fontWeight: 800, color: T.ink, display: 'block', marginBottom: 7 }}>Username</label>
            <input ref={userRef} value={username} onChange={(e) => setUsername(e.target.value)} onFocus={focusRing} onBlur={blurRing}
              placeholder="user" autoComplete="username" style={{ ...inputCss, marginBottom: 18 }} />

            <label style={{ fontSize: 12.5, fontWeight: 800, color: T.ink, display: 'block', marginBottom: 7 }}>Password</label>
            <div style={{ position: 'relative', marginBottom: 16 }}>
              <input value={password} onChange={(e) => setPassword(e.target.value)} onFocus={focusRing} onBlur={blurRing}
                type={show ? 'text' : 'password'} placeholder="••••••••" autoComplete="current-password" style={{ ...inputCss, paddingRight: 64 }} />
              <button type="button" onClick={() => setShow((s) => !s)} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', color: T.blue, fontWeight: 800, fontSize: 12.5, cursor: 'pointer', fontFamily: F, padding: '8px 8px' }}>{show ? 'Hide' : 'Show'}</button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer', userSelect: 'none' }}>
                <span onClick={() => setRemember((r) => !r)} style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${remember ? T.blue : T.line}`, background: remember ? T.blue : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background .15s, border-color .15s' }}>
                  {remember && <Icon name="check" size={13} color="#fff" stroke={3} />}
                </span>
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>Remember me</span>
              </label>
              <button type="button" onClick={() => setResetOpen(true)} style={{ border: 'none', background: 'none', color: T.blue, fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: F, padding: 0 }}>Forgot password?</button>
            </div>

            <button type="submit" disabled={busy} style={{ width: '100%', height: 52, border: 'none', borderRadius: 12, background: busy ? T.blueDk : T.blue, color: '#fff', fontSize: 15.5, fontWeight: 800, fontFamily: F, cursor: busy ? 'default' : 'pointer', boxShadow: '0 8px 22px rgba(20,87,230,.32)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, transition: 'background .15s' }}>
              {busy ? <React.Fragment><span className="pps-spin" style={{ width: 18, height: 18, borderRadius: 999, border: '2.5px solid rgba(255,255,255,.4)', borderTopColor: '#fff', display: 'inline-block' }} />Signing in…</React.Fragment>
                : <React.Fragment>Sign in<Icon name="arrowRight" size={18} color="#fff" stroke={2.4} /></React.Fragment>}
            </button>
          </form>
        </div>
        {resetOpen && <ResetModal onClose={() => setResetOpen(false)} />}
      </div>
    );
  }

  // ═══════════════════════ SESSION WATCHER + TIMEOUT WARNING ═════════════════
  function SessionWatcher() {
    const [warnLeft, setWarnLeft] = React.useState(0);
    React.useEffect(() => {
      let lastTouch = 0;
      const activity = () => {
        const t = Date.now();
        if (t - lastTouch > 30000) { lastTouch = t; AuthStore.touch(); }
      };
      const evts = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
      evts.forEach((e) => window.addEventListener(e, activity, { passive: true }));
      const tick = setInterval(() => {
        if (!AuthStore.current()) return;
        const left = AuthStore.expiresAt() - Date.now();
        if (left <= 0) {
          clearInterval(tick);
          AuthStore.logout();
          ToastStore.push('Your session expired after inactivity.', { title: 'Signed out', icon: 'clock', tone: 'warn' });
        } else if (left <= WARN_BEFORE) { setWarnLeft(Math.ceil(left / 1000)); }
        else { setWarnLeft(0); }
      }, 1000);
      return () => { evts.forEach((e) => window.removeEventListener(e, activity)); clearInterval(tick); };
    }, []);
    if (!warnLeft) return null;
    const stay = () => { AuthStore.touch(); setWarnLeft(0); };
    const mm = String(Math.floor(warnLeft / 60)).padStart(2, '0');
    const ss = String(warnLeft % 60).padStart(2, '0');
    return (
      <div style={{ position: 'fixed', left: '50%', bottom: 26, transform: 'translateX(-50%)', zIndex: 4000, width: 'min(440px, calc(100vw - 40px))',
        background: '#fff', border: `1px solid ${T.line}`, borderTop: `3px solid ${T.amber}`, borderRadius: 16, boxShadow: '0 22px 60px rgba(11,26,51,.28)', padding: '16px 18px', fontFamily: F, display: 'flex', alignItems: 'center', gap: 14, animation: 'aPop .2s ease' }}>
        <div style={{ width: 42, height: 42, borderRadius: 11, background: '#FFF3DC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="clock" size={21} color={T.amberInk} stroke={2} /></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: T.ink }}>Session expiring soon</div>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: T.sub, marginTop: 2 }}>You'll be signed out in <strong style={{ color: T.ink, fontVariantNumeric: 'tabular-nums' }}>{mm}:{ss}</strong> due to inactivity.</div>
        </div>
        <Button size="sm" variant="primary" onClick={stay}>Stay signed in</Button>
      </div>
    );
  }

  if (!document.getElementById('pps-auth-css')) {
    const s = document.createElement('style'); s.id = 'pps-auth-css';
    s.textContent = `@keyframes ppsSpin{to{transform:rotate(360deg)}}.pps-spin{animation:ppsSpin .7s linear infinite}
      @media (max-width: 860px){ .pps-login-brand{display:none!important} .pps-login-form{flex:1 1 100%!important;box-shadow:none!important} .pps-login-mark{display:block!important} }`;
    document.head.appendChild(s);
  }

  Object.assign(window, { AuthStore, useAuth, LoginScreen, SessionWatcher, ResetLinkGate, UserStore, useUsers, A_MODULES: MODULES });
})();
