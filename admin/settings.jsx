// settings.jsx — admin-only Settings: currency exchange rates that drive the
// storefront's UGX/USD/EUR price displays. Stored in localStorage as
// pps_currency_rates (UGX per 1 unit), read by home.html on load.
(function () {
  const { Icon } = window;
  const T = window.ADMIN_T, F = window.ADMIN_F;
  const { Card, PageHead, Button, Field, Input, ConfirmStore, ToastStore,
    CurrencyRates, useCurrencyRates, A_DEFAULT_RATES, A_money,
    HeroMedia, useHeroMedia } = window;

  function RateField({ label, sym, value, onChange, err }) {
    return (
      <Field label={label}>
        <div style={{ display: 'flex', alignItems: 'stretch', border: `1.5px solid ${err ? T.red : T.line}`, borderRadius: 11, overflow: 'hidden', background: '#fff' }}>
          <span style={{ display: 'flex', alignItems: 'center', padding: '0 14px', background: T.surface, borderRight: `1.5px solid ${T.line}`, fontSize: 13.5, fontWeight: 800, color: T.sub }}>{sym}</span>
          <input type="number" min="1" value={value} onChange={(e) => onChange(e.target.value)}
            style={{ flex: 1, border: 'none', outline: 'none', padding: '11px 13px', fontSize: 15, fontWeight: 700, fontFamily: F, color: T.ink, background: 'transparent', fontVariantNumeric: 'tabular-nums' }} />
          <span style={{ display: 'flex', alignItems: 'center', padding: '0 14px', fontSize: 13, fontWeight: 700, color: T.faint }}>UGX</span>
        </div>
      </Field>
    );
  }

  // ── Homepage hero media manager ────────────────────────────────────
  // Add/delete the photos & videos that rotate behind the storefront hero
  // (“Industrial Supply, Delivered”). Stored in pps_hero_media; the home page
  // reads it on load, and cloud sync carries it to every visitor's browser.
  const MAX_IMG_EDGE = 1600;       // uploaded photos are downscaled to fit storage
  const MAX_VIDEO_BYTES = 2.5e6;   // bigger videos should be hosted and added by URL

  function compressImage(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, MAX_IMG_EDGE / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        resolve(c.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('bad image')); };
      img.src = url;
    });
  }
  const fileToDataUrl = (file) => new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result); r.onerror = reject; r.readAsDataURL(file);
  });

  function HeroMediaCard() {
    const media = useHeroMedia();
    const fileRef = React.useRef(null);
    const [url, setUrl] = React.useState('');
    const [busy, setBusy] = React.useState(false);

    const pushed = (ok, label) => {
      if (ok) ToastStore.push(`${label} added — live on the homepage hero.`, { title: 'Hero media added', icon: 'check', tone: 'ok' });
      else ToastStore.push('Browser storage is full. Delete some media or add smaller files / URLs.', { title: 'Could not save', icon: 'minus', tone: 'error' });
    };

    const onFile = async (e) => {
      const f = e.target.files && e.target.files[0];
      e.target.value = '';
      if (!f) return;
      const isVideo = f.type.startsWith('video');
      const isImage = f.type.startsWith('image');
      if (!isVideo && !isImage) { ToastStore.push('Only photo or video files can be added.', { title: 'Unsupported file', icon: 'minus', tone: 'warn' }); return; }
      if (isVideo && f.size > MAX_VIDEO_BYTES) {
        ToastStore.push('Video is too large to store in the browser (max ~2.5 MB). Host it online and paste its URL below instead.', { title: 'Video too large', icon: 'minus', tone: 'warn' });
        return;
      }
      setBusy(true);
      try {
        const src = isVideo ? await fileToDataUrl(f) : await compressImage(f);
        pushed(HeroMedia.add({ type: isVideo ? 'video' : 'image', src, name: f.name }), isVideo ? 'Video' : 'Photo');
      } catch (err) {
        ToastStore.push('That file could not be read.', { title: 'Upload failed', icon: 'minus', tone: 'error' });
      }
      setBusy(false);
    };

    const addUrl = () => {
      const v = url.trim();
      if (!v) return;
      const isVideo = /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(v);
      pushed(HeroMedia.add({ type: isVideo ? 'video' : 'image', src: v, name: v.split('/').pop() || v }), isVideo ? 'Video' : 'Photo');
      setUrl('');
    };

    const del = (m) => ConfirmStore.open({
      title: 'Delete hero media', sub: m.name || m.src, confirmLabel: 'Delete', danger: true,
      body: 'Remove this item from the homepage hero slideshow? Visitors will stop seeing it on their next page load.',
      onConfirm: () => { HeroMedia.remove(m.id); ToastStore.push('Removed from the hero slideshow.', { title: 'Media deleted', icon: 'minus', tone: 'warn' }); },
    });

    const restore = () => ConfirmStore.open({
      title: 'Restore built-in photos', confirmLabel: 'Restore',
      body: 'Replace the current list with the 11 built-in hero photos? Media you added will be removed.',
      onConfirm: () => { HeroMedia.reset(); ToastStore.push('Built-in hero photos restored.', { title: 'Hero media reset', icon: 'rotate', tone: 'info' }); },
    });

    return (
      <Card style={{ marginTop: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6, flexWrap: 'wrap' }}>
          <div style={{ width: 42, height: 42, borderRadius: 11, background: T.purpleWash, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="light" size={22} color={T.purple} stroke={2} /></div>
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: T.ink, letterSpacing: -0.3 }}>Homepage hero media</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.sub, marginTop: 2 }}>The photos &amp; videos rotating behind “Industrial Supply, Delivered” on the home page. {media.length} item{media.length === 1 ? '' : 's'}.</div>
          </div>
          <Button variant="ghost" icon="rotate" onClick={restore}>Restore built-in photos</Button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12, marginTop: 16 }}>
          {media.map((m) => (
            <div key={m.id} style={{ border: `1px solid ${T.line}`, borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
              <div style={{ position: 'relative', height: 92, background: T.navy }}>
                {m.type === 'video'
                  ? <video src={m.src} muted playsInline preload="metadata" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  : <img src={m.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
                <span style={{ position: 'absolute', top: 7, left: 7, fontSize: 10, fontWeight: 800, letterSpacing: 0.4, textTransform: 'uppercase', color: '#fff', background: 'rgba(11,26,51,.72)', padding: '3px 8px', borderRadius: 999 }}>{m.type === 'video' ? 'Video' : 'Photo'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px' }}>
                <span style={{ flex: 1, minWidth: 0, fontSize: 11.5, fontWeight: 700, color: T.sub, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.name || m.src}</span>
                <button onClick={() => del(m)} title="Delete" style={{ border: 'none', background: T.redWash, color: T.red, width: 26, height: 26, borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name="minus" size={14} color={T.red} stroke={2.6} /></button>
              </div>
            </div>
          ))}
          {media.length === 0 && (
            <div style={{ gridColumn: '1 / -1', padding: '22px 16px', textAlign: 'center', fontSize: 13, fontWeight: 700, color: T.sub, background: T.surface, borderRadius: 12 }}>
              No hero media — the homepage shows the plain brand gradient. Add a photo or video below.</div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 11, marginTop: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <input ref={fileRef} type="file" accept="image/*,video/*" onChange={onFile} style={{ display: 'none' }} />
          <Button variant="primary" icon="plus" onClick={() => fileRef.current && fileRef.current.click()}>{busy ? 'Processing…' : 'Upload photo / video'}</Button>
          <div style={{ display: 'flex', flex: 1, minWidth: 260, alignItems: 'stretch', border: `1.5px solid ${T.line}`, borderRadius: 11, overflow: 'hidden', background: '#fff' }}>
            <input value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addUrl()} placeholder="…or paste an image / video URL"
              style={{ flex: 1, border: 'none', outline: 'none', padding: '10px 13px', fontSize: 13.5, fontWeight: 600, fontFamily: F, color: T.ink, background: 'transparent' }} />
            <button onClick={addUrl} disabled={!url.trim()} style={{ border: 'none', background: url.trim() ? T.blue : T.line, color: '#fff', padding: '0 16px', fontSize: 13, fontWeight: 800, fontFamily: F, cursor: url.trim() ? 'pointer' : 'default' }}>Add</button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 14, padding: '11px 13px', background: T.surface, borderRadius: 11, border: `1px solid ${T.line}` }}>
          <Icon name="shield" size={16} color={T.sub} stroke={2} />
          <span style={{ fontSize: 12.5, fontWeight: 600, color: T.sub, lineHeight: 1.5 }}>Changes apply to the homepage on its next load. With cloud sync connected (lib/firebase-config.js) they reach every visitor on any computer; otherwise they apply to this browser.</span>
        </div>
      </Card>
    );
  }

  function Settings() {
    const saved = useCurrencyRates();
    const [usd, setUsd] = React.useState(String(saved.usdToUgx));
    const [eur, setEur] = React.useState(String(saved.eurToUgx));
    const [touched, setTouched] = React.useState(false);

    const usdN = Number(usd), eurN = Number(eur);
    const usdBad = !(usdN > 0), eurBad = !(eurN > 0);
    const valid = !usdBad && !eurBad;
    const dirty = String(saved.usdToUgx) !== usd.trim() || String(saved.eurToUgx) !== eur.trim();

    const save = () => {
      setTouched(true);
      if (!valid) { ToastStore.push('Enter a positive UGX value for each currency.', { title: 'Check the rates', icon: 'doc', tone: 'error' }); return; }
      CurrencyRates.save({ usdToUgx: usdN, eurToUgx: eurN });
      setUsd(String(usdN)); setEur(String(eurN)); setTouched(false);
      ToastStore.push('Exchange rates updated — live on the storefront prices.', { title: 'Rates saved', icon: 'check', tone: 'ok' });
    };
    const reset = () => ConfirmStore.open({
      title: 'Reset to default rates', confirmLabel: 'Reset',
      sub: `1 USD = ${A_DEFAULT_RATES.usdToUgx.toLocaleString()} UGX · 1 EUR = ${A_DEFAULT_RATES.eurToUgx.toLocaleString()} UGX`,
      body: 'Restore the default exchange rates? Storefront prices will recalculate on the next page load.',
      onConfirm: () => { CurrencyRates.reset(); const d = CurrencyRates.get(); setUsd(String(d.usdToUgx)); setEur(String(d.eurToUgx)); setTouched(false); ToastStore.push('Default exchange rates restored.', { title: 'Rates reset', icon: 'rotate', tone: 'info' }); },
    });

    // Live preview against a representative catalogue price (in UGX).
    const SAMPLE = 486000;
    const fmt = (v, sym, dec) => sym + ' ' + v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
    const preview = valid ? [
      ['UGX', fmt(SAMPLE, 'USh', 0)],
      ['USD', fmt(SAMPLE / usdN, '$', 2)],
      ['EUR', fmt(SAMPLE / eurN, '€', 2)],
    ] : null;

    return (
      <div>
        <PageHead title="Settings" sub="Currency, homepage hero &amp; storefront configuration — administrator only">
          {dirty && <span style={{ fontSize: 12.5, fontWeight: 800, color: T.amberInk, background: '#FFF3DC', padding: '7px 12px', borderRadius: 999 }}>Unsaved changes</span>}
        </PageHead>

        <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: 18, alignItems: 'start' }} className="adm-set-grid">
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
              <div style={{ width: 42, height: 42, borderRadius: 11, background: T.blueWash, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="bolt" size={22} color={T.blue} stroke={2} /></div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, color: T.ink, letterSpacing: -0.3 }}>Currency exchange rates</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.sub, marginTop: 2 }}>Base currency is <strong style={{ color: T.ink }}>UGX</strong>. Set how many shillings equal one unit of each currency.</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 20 }}>
              <RateField label="1 US Dollar equals" sym="$" value={usd} onChange={setUsd} err={touched && usdBad} />
              <RateField label="1 Euro equals" sym="€" value={eur} onChange={setEur} err={touched && eurBad} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 18, padding: '11px 13px', background: T.surface, borderRadius: 11, border: `1px solid ${T.line}` }}>
              <Icon name="shield" size={16} color={T.sub} stroke={2} />
              <span style={{ fontSize: 12.5, fontWeight: 600, color: T.sub, lineHeight: 1.5 }}>When a shopper switches currency on the storefront, each UGX price is divided by the matching rate. Changes apply on their next page load.</span>
            </div>

            <div style={{ display: 'flex', gap: 11, marginTop: 20 }}>
              <Button variant="primary" icon="check" onClick={save}>Save rates</Button>
              <Button variant="ghost" icon="rotate" onClick={reset}>Reset to defaults</Button>
            </div>
          </Card>

          <Card style={{ background: T.surface }}>
            <div style={{ fontSize: 12.5, fontWeight: 800, color: T.sub, textTransform: 'uppercase', letterSpacing: 0.5 }}>Live preview</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.sub, marginTop: 4, marginBottom: 16 }}>A {A_money(SAMPLE)} product, shown in each currency:</div>
            {preview ? preview.map(([code, val], i) => (
              <div key={code} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderTop: i ? `1px solid ${T.line}` : 'none' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 800, color: T.ink }}>
                  <span style={{ width: 30, height: 22, borderRadius: 6, background: '#fff', border: `1px solid ${T.line}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10.5, fontWeight: 800, color: T.blue }}>{code}</span>
                </span>
                <span style={{ fontSize: 16, fontWeight: 800, color: T.ink, fontVariantNumeric: 'tabular-nums' }}>{val}</span>
              </div>
            )) : <div style={{ fontSize: 13, fontWeight: 700, color: T.red }}>Enter valid rates to preview.</div>}
          </Card>
        </div>

        <HeroMediaCard />
      </div>
    );
  }

  if (!document.getElementById('adm-set-css')) {
    const s = document.createElement('style'); s.id = 'adm-set-css';
    s.textContent = '@media (max-width: 820px){ .adm-set-grid{grid-template-columns:1fr!important} }';
    document.head.appendChild(s);
  }

  window.AdminSettings = Settings;
})();
