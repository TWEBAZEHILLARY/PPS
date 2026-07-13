// employees.jsx — Employee Management (admin-only): add / edit / delete staff
// accounts with granular module permissions. Backed by UserStore (pps_users).
(function () {
  const { Icon } = window;
  const T = window.ADMIN_T, F = window.ADMIN_F;
  const { Card, PageHead, Button, IconBtn, Search, Select, Table, Td, Row, Empty, Pill,
    Field, Input, Modal, ConfirmStore, ToastStore, UserStore, useUsers, useAuth,
    A_MODULES } = window;

  // Permissions an employee can be granted. "Employees" is admin-only and is
  // never offered to staff (only the super-admin manages accounts).
  const STAFF_MODULES = A_MODULES.filter((m) => m !== 'Employees');

  const Avatar = ({ u, size = 38 }) => {
    const initials = ((u.firstName || '?').charAt(0) + (u.lastName || '').charAt(0)).toUpperCase();
    const bg = u.role === 'admin' ? T.amber : (u.isActive ? T.blue : T.sub);
    const fg = u.role === 'admin' ? T.amberInk : '#fff';
    return <div style={{ width: size, height: size, borderRadius: 999, background: bg, color: fg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.38, fontWeight: 800, flexShrink: 0 }}>{initials || '?'}</div>;
  };

  // ── Permission checklist control ─────────────────────────────────────────
  function PermGrid({ value, onToggle, disabled }) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
        {STAFF_MODULES.map((m) => {
          const on = value.includes(m);
          return (
            <button key={m} type="button" disabled={disabled} onClick={() => onToggle(m)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, border: `1.5px solid ${on ? T.blue : T.line}`, background: on ? T.blueWash : '#fff', borderRadius: 11, padding: '10px 12px', cursor: disabled ? 'default' : 'pointer', fontFamily: F, textAlign: 'left', transition: 'background .12s, border-color .12s', opacity: disabled ? 0.6 : 1 }}>
              <span style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0, border: `2px solid ${on ? T.blue : T.line}`, background: on ? T.blue : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {on && <Icon name="check" size={13} color="#fff" stroke={3} />}
              </span>
              <span style={{ fontSize: 13.5, fontWeight: 800, color: on ? T.blueDk : T.ink }}>{m}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // ── Add / Edit employee modal ────────────────────────────────────────────
  function EmployeeModal({ employee, onClose }) {
    const isNew = !employee;
    const isAdmin = employee && employee.role === 'admin';
    const [f, setF] = React.useState(() => employee
      ? { ...employee, permissions: (employee.permissions || []).slice() }
      : { firstName: '', lastName: '', username: '', password: '', jobTitle: '', role: 'staff', permissions: ['Products', 'Orders', 'Inquiries', 'Notifications'], isActive: true });
    const [err, setErr] = React.useState('');
    const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
    const togglePerm = (m) => setF((s) => ({ ...s, permissions: s.permissions.includes(m) ? s.permissions.filter((x) => x !== m) : [...s.permissions, m] }));

    const save = () => {
      if (!f.firstName.trim() || !f.lastName.trim()) { setErr('First and last name are required.'); return; }
      if (!f.username.trim()) { setErr('A username is required.'); return; }
      if (UserStore.usernameTaken(f.username, f.id)) { setErr('That username is already taken.'); return; }
      if (isNew && !f.password.trim()) { setErr('Set an initial password for this employee.'); return; }
      const payload = { ...f, firstName: f.firstName.trim(), lastName: f.lastName.trim(),
        username: f.username.trim().toLowerCase(), jobTitle: f.jobTitle.trim() || 'Staff',
        permissions: isAdmin ? A_MODULES.slice() : f.permissions };
      delete payload._newPw;
      const rec = UserStore.save(payload);
      onClose();
      ToastStore.push(`${rec.firstName} ${rec.lastName} ${isNew ? 'added' : 'updated'}.`, { title: isNew ? 'Employee added' : 'Employee saved', icon: 'check', tone: 'ok' });
    };

    return (
      <Modal title={isNew ? 'Add employee' : `${employee.firstName} ${employee.lastName}`} sub={isNew ? 'Create a staff account with module permissions' : (isAdmin ? 'Super administrator account' : '@' + employee.username)} width={620} onClose={onClose}
        footer={<React.Fragment><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" icon="check" onClick={save}>{isNew ? 'Add employee' : 'Save changes'}</Button></React.Fragment>}>
        {err && <div style={{ display: 'flex', alignItems: 'center', gap: 9, background: T.redWash, border: `1px solid #F6C9CB`, color: T.red, borderRadius: 11, padding: '10px 13px', fontSize: 13, fontWeight: 700, marginBottom: 16 }}><Icon name="minus" size={15} color={T.red} stroke={2.6} />{err}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Field label="First name"><Input value={f.firstName} onChange={set('firstName')} placeholder="Hillary" /></Field>
          <Field label="Last name"><Input value={f.lastName} onChange={set('lastName')} placeholder="Twebaze" /></Field>
          <Field label="Username"><Input value={f.username} onChange={set('username')} placeholder="hillary" disabled={isAdmin} style={isAdmin ? { background: T.surface, color: T.sub } : null} /></Field>
          <Field label="Job title"><Input value={f.jobTitle} onChange={set('jobTitle')} placeholder="Sales Officer" /></Field>
          <Field label={isNew ? 'Password' : 'Reset password'} hint={isNew ? '' : 'leave blank to keep current'} full>
            <Input type="text" value={isNew ? (f.password || '') : (f._newPw || '')} onChange={isNew ? set('password') : (e) => setF((s) => ({ ...s, _newPw: e.target.value, password: e.target.value || s.password }))} placeholder={isNew ? 'Set an initial password' : '••••••••'} />
          </Field>
        </div>

        {/* Signature preview */}
        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: T.surface, border: `1px solid ${T.line}`, borderRadius: 12 }}>
          <Icon name="doc" size={18} color={T.blue} stroke={1.9} />
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 800, color: T.sub, textTransform: 'uppercase', letterSpacing: 0.3 }}>Quotation signature</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: T.ink, fontStyle: 'italic', marginTop: 2 }}>{((f.firstName || '') + ' ' + (f.lastName || '')).trim() || '—'}</div>
          </div>
        </div>

        {/* Permissions */}
        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 12.5, fontWeight: 800, color: T.ink }}>Module access</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: T.sub }}>· tick the sections this employee can open</span>
          </div>
          {isAdmin
            ? <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 15px', background: '#FFF3DC', borderRadius: 12, color: T.amberInk, fontWeight: 800, fontSize: 13.5 }}><Icon name="shield" size={18} color={T.amberInk} stroke={2} />Full access to every module (super administrator).</div>
            : <PermGrid value={f.permissions} onToggle={togglePerm} />}
        </div>

        {/* Account status */}
        {!isAdmin && (
          <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 15px', border: `1px solid ${T.line}`, borderRadius: 12 }}>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: T.ink }}>Account active</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.sub, marginTop: 2 }}>Suspended accounts cannot sign in.</div>
            </div>
            <button type="button" onClick={() => setF((s) => ({ ...s, isActive: !s.isActive }))} style={{ width: 52, height: 30, borderRadius: 999, border: 'none', cursor: 'pointer', background: f.isActive ? T.green : T.line, position: 'relative', transition: 'background .15s', flexShrink: 0 }}>
              <span style={{ position: 'absolute', top: 3, left: f.isActive ? 25 : 3, width: 24, height: 24, borderRadius: 999, background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.25)', transition: 'left .15s' }} />
            </button>
          </div>
        )}
      </Modal>
    );
  }

  // ── Employees list ───────────────────────────────────────────────────────
  function Employees() {
    const users = useUsers();
    const auth = useAuth();
    const [q, setQ] = React.useState('');
    const [editing, setEditing] = React.useState(null);
    const [creating, setCreating] = React.useState(false);

    // Defensive: only the super-admin should ever reach this view.
    if (!auth || auth.role !== 'admin') return <Card><Empty icon="lock" title="Admins only" sub="Employee management is restricted to the administrator." /></Card>;

    const list = users.filter((u) => !q.trim() || (u.firstName + ' ' + u.lastName + ' ' + u.username + ' ' + (u.jobTitle || '')).toLowerCase().includes(q.trim().toLowerCase()));
    const staffCount = users.filter((u) => u.role !== 'admin').length;
    const isCurrentAdmin = !!auth && auth.role === 'admin';

    const del = (u) => {
      if (!isCurrentAdmin) { ToastStore.push('Access denied. Only admins can delete.', { title: 'Access denied', icon: 'lock', tone: 'error' }); return; }
      ConfirmStore.open({ title: 'Delete employee', sub: `${u.firstName} ${u.lastName}`, body: `Permanently remove this account? ${u.firstName} will no longer be able to sign in. This cannot be undone.`, confirmLabel: 'Delete', danger: true, onConfirm: () => { UserStore.remove(u.id); ToastStore.push(`${u.firstName} ${u.lastName} removed.`, { title: 'Employee deleted', icon: 'minus', tone: 'warn' }); } });
    };

    const cols = [{ label: 'Name' }, { label: 'Username' }, { label: 'Job title' }, { label: 'Permissions' }, { label: 'Status', align: 'center' }, { label: '', align: 'right', width: 96 }];
    return (
      <div>
        <PageHead title="Employees" sub={`${staffCount} staff account${staffCount === 1 ? '' : 's'} · 1 administrator`}>
          <Button icon="plus" onClick={() => setCreating(true)}>Add employee</Button>
        </PageHead>
        <Card pad={14} style={{ marginBottom: 16 }}><Search value={q} onChange={setQ} placeholder="Search name, username or role…" width={340} /></Card>
        {list.length === 0 ? <Card><Empty icon="user" title="No employees match" /></Card> : (
          <Table columns={cols}>
            {list.map((u, i) => {
              const isAdmin = u.role === 'admin';
              const perms = isAdmin ? 'All modules' : (u.permissions || []).join(', ') || '—';
              return (
                <Row key={u.id} i={i} onClick={() => setEditing(u)}>
                  <Td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <Avatar u={u} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <span style={{ fontSize: 13.5, fontWeight: 800, color: T.ink }}>{u.firstName} {u.lastName}</span>
                          {isAdmin && <span style={{ fontSize: 10, fontWeight: 800, color: T.amberInk, background: '#FFF3DC', padding: '2px 7px', borderRadius: 999, letterSpacing: 0.3 }}>ADMIN</span>}
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: T.sub }}>{u.signature}</div>
                      </div>
                    </div>
                  </Td>
                  <Td><span style={{ fontSize: 12.5, fontWeight: 700, color: T.ink, fontVariantNumeric: 'tabular-nums' }}>@{u.username}</span></Td>
                  <Td><span style={{ fontSize: 12.5, fontWeight: 600, color: T.sub }}>{u.jobTitle || '—'}</span></Td>
                  <Td><span style={{ fontSize: 12, color: T.sub, display: 'inline-block', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={perms}>{perms}</span></Td>
                  <Td align="center"><Pill status={u.isActive ? 'Active' : 'Suspended'} small /></Td>
                  <Td align="right">
                    <div style={{ display: 'inline-flex', gap: 7 }}>
                      <IconBtn icon="doc" tone="blue" title="Edit" onClick={(e) => { e.stopPropagation(); setEditing(u); }} />
                      {isCurrentAdmin && !isAdmin && <IconBtn icon="minus" tone="danger" title="Delete" onClick={(e) => { e.stopPropagation(); del(u); }} />}
                    </div>
                  </Td>
                </Row>
              );
            })}
          </Table>
        )}
        {creating && <EmployeeModal onClose={() => setCreating(false)} />}
        {editing && <EmployeeModal employee={editing} onClose={() => setEditing(null)} />}
      </div>
    );
  }

  window.AdminEmployees = Employees;
})();
