// products.jsx — Product management: table + add/edit modal (source of truth for storefront).
(function () {
  const { Icon } = window;
  const T = window.ADMIN_T, F = window.ADMIN_F;
  const { Card, PageHead, Button, IconBtn, Search, Select, Table, Td, Row, Empty, Thumb, TagChip, Pill,
    Field, Input, Textarea, Modal, ConfirmStore, useData, DataStore, ToastStore,
    A_money, A_priceOf, A_CATEGORIES, A_CAT_ICON, A_TAG_OPTIONS, A_uid } = window;

  function ProductModal({ product, onClose }) {
    const editing = !!product;
    const blank = { id: '', name: '', sku: '', category: A_CATEGORIES[0], brand: '', regularPrice: '', salePrice: '', description: '', specs: '', stock: '', image: '', tags: [], featured: false, home_bested: false, imported: false, import_fee: 0, icon: A_CAT_ICON[A_CATEGORIES[0]] };
    const [f, setF] = React.useState(product ? { ...blank, ...product, regularPrice: product.regularPrice ?? '', salePrice: product.salePrice ?? '', stock: product.stock ?? '' } : blank);
    const [customTag, setCustomTag] = React.useState('');
    const [touched, setTouched] = React.useState(false);
    const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
    const toggleTag = (t) => setF((s) => ({ ...s, tags: s.tags.includes(t) ? s.tags.filter((x) => x !== t) : [...s.tags, t] }));
    const addCustom = () => { const t = customTag.trim(); if (t && !f.tags.includes(t)) setF((s) => ({ ...s, tags: [...s.tags, t] })); setCustomTag(''); };
    const onImageFile = (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      if (file.size > 1024 * 1024) {
        ToastStore.push('Image is larger than 1MB — choose a smaller file or paste a URL instead.', { title: 'Image too large', icon: 'doc', tone: 'error' });
        e.target.value = ''; return;
      }
      const reader = new FileReader();
      reader.onload = () => setF((s) => ({ ...s, image: reader.result }));
      reader.readAsDataURL(file);
      e.target.value = '';
    };
    const uploaded = typeof f.image === 'string' && f.image.startsWith('data:');

    const valid = f.name.trim() && f.regularPrice !== '' && Number(f.regularPrice) > 0 && f.stock !== '';
    const save = () => {
      setTouched(true);
      if (!valid) { ToastStore.push('Add a name, regular price and stock quantity.', { title: 'Check the form', icon: 'doc', tone: 'error' }); return; }
      const sku = f.sku.trim() || (f.brand.trim().slice(0, 3).toUpperCase() || 'PPS') + '-' + Math.random().toString(36).slice(2, 7).toUpperCase();
      const prod = {
        ...f, id: f.id || A_uid('p'), sku, name: f.name.trim(), brand: f.brand.trim(),
        regularPrice: Number(f.regularPrice), salePrice: f.salePrice === '' ? null : Number(f.salePrice),
        stock: Number(f.stock), icon: f.icon || A_CAT_ICON[f.category] || 'box',
        home_bested: !!f.home_bested, imported: !!f.imported, import_fee: f.imported ? (Number(f.import_fee) || 0) : 0,
        rating: f.rating || 4.5, reviews: f.reviews || 0,
      };
      DataStore.saveProduct(prod);
      onClose();
      ToastStore.push(`${prod.name} ${editing ? 'updated' : 'added'} — live on the storefront.`, { title: editing ? 'Product saved' : 'Product added', icon: 'check', tone: 'ok' });
    };

    const allTags = [...A_TAG_OPTIONS, ...f.tags.filter((t) => !A_TAG_OPTIONS.includes(t))];
    const err = (cond) => (touched && cond ? { borderColor: T.red } : null);

    return (
      <Modal title={editing ? 'Edit Product' : 'Add Product'} sub={editing ? product.sku : 'New catalogue item — saved to pps_products'} width={720} onClose={onClose}
        footer={<React.Fragment>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" icon="check" onClick={save}>{editing ? 'Save changes' : 'Add product'}</Button>
        </React.Fragment>}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Field label="Product name" full><Input value={f.name} onChange={set('name')} placeholder="Tmax XT 3-Pole MCCB 63A" style={err(!f.name.trim())} /></Field>
          <Field label="SKU" hint="auto-generates if blank"><Input value={f.sku} onChange={set('sku')} placeholder="ABB-XT1S160-63" /></Field>
          <Field label="Brand"><Input value={f.brand} onChange={set('brand')} placeholder="ABB" /></Field>
          <Field label="Category"><Select value={f.category} onChange={(v) => setF((s) => ({ ...s, category: v, icon: A_CAT_ICON[v] || s.icon }))} options={A_CATEGORIES} /></Field>
          <Field label="Stock quantity"><Input type="number" min="0" value={f.stock} onChange={set('stock')} placeholder="24" style={err(f.stock === '')} /></Field>
          <Field label="Regular price (UGX)"><Input type="number" min="0" value={f.regularPrice} onChange={set('regularPrice')} placeholder="545000" style={err(!(Number(f.regularPrice) > 0))} /></Field>
          <Field label="Sale price (UGX)" hint="optional"><Input type="number" min="0" value={f.salePrice} onChange={set('salePrice')} placeholder="486000" /></Field>
          <Field label="Description" full><Textarea rows={2} value={f.description} onChange={set('description')} placeholder="Short marketing description shown on the product page." /></Field>
          <Field label="Specifications" hint="one key: value per line" full><Textarea rows={3} value={f.specs} onChange={set('specs')} placeholder={'Rating: 63A\nPoles: 3P\nBreaking: 36kA'} /></Field>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={window.A_lbl}>Product image<span style={{ color: T.sub, fontWeight: 600 }}> · shown on the storefront &amp; table thumbnail</span></label>
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <Thumb p={{ image: f.image, icon: f.icon || A_CAT_ICON[f.category], category: f.category }} size={64} radius={12} />
              <div style={{ flex: 1, display: 'grid', gap: 10, minWidth: 0 }}>
                <Input value={uploaded ? '' : f.image} onChange={set('image')} placeholder="https://… image URL" disabled={uploaded} style={uploaded ? { background: T.surface, color: T.faint } : null} />
                <label style={{ display: 'flex', alignItems: 'center', gap: 9, border: `1.5px dashed ${T.line}`, borderRadius: 11, padding: '10px 13px', cursor: 'pointer', background: T.surface, fontSize: 13, fontWeight: 700, color: T.sub }}>
                  <Icon name="download" size={16} color={T.blue} stroke={2.2} />
                  Upload image (or enter URL above)
                  <input type="file" accept=".jpg,.jpeg,.png,.gif,.webp,.svg,image/*" onChange={onImageFile} style={{ display: 'none' }} />
                </label>
                {f.image && <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, color: T.sub }}>
                  <span>{uploaded ? 'Uploaded image attached' : 'Using image URL'}</span>
                  <button onClick={() => setF((s) => ({ ...s, image: '' }))} style={{ border: 'none', background: 'none', color: T.red, fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: F, padding: 0 }}>Remove</button>
                </div>}
              </div>
            </div>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={window.A_lbl}>Tags</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
              {allTags.map((t) => {
                const on = f.tags.includes(t);
                return <button key={t} onClick={() => toggleTag(t)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: `1.5px solid ${on ? T.blue : T.line}`, background: on ? T.blueWash : '#fff', color: on ? T.blueDk : T.sub, cursor: 'pointer', fontFamily: F, padding: '7px 12px', borderRadius: 999, fontSize: 12.5, fontWeight: 800 }}>
                  {on && <Icon name="check" size={13} color={T.blueDk} stroke={2.6} />}{t}</button>;
              })}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Input value={customTag} onChange={(e) => setCustomTag(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustom(); } }} placeholder="Add a custom tag…" style={{ flex: 1 }} />
              <Button variant="ghost" icon="plus" onClick={addCustom}>Add tag</Button>
            </div>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={window.A_lbl}>Availability &amp; sourcing</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <label onClick={() => setF((s) => ({ ...s, home_bested: !s.home_bested }))} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '12px 14px', border: `1.5px solid ${f.home_bested ? T.blue : T.line}`, borderRadius: 12, cursor: 'pointer', background: f.home_bested ? T.blueWash : '#fff' }}>
                <span style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${f.home_bested ? T.blue : T.line}`, background: f.home_bested ? T.blue : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{f.home_bested && <Icon name="check" size={14} color="#fff" stroke={3} />}</span>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: T.ink }}>Home Bested</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.sub }}>Locally available · adds transport fee</div>
                </div>
              </label>
              <label onClick={() => setF((s) => ({ ...s, imported: !s.imported }))} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '12px 14px', border: `1.5px solid ${f.imported ? T.blue : T.line}`, borderRadius: 12, cursor: 'pointer', background: f.imported ? T.blueWash : '#fff' }}>
                <span style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${f.imported ? T.blue : T.line}`, background: f.imported ? T.blue : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{f.imported && <Icon name="check" size={14} color="#fff" stroke={3} />}</span>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: T.ink }}>Imported</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.sub }}>Charges a per-unit importation fee</div>
                </div>
              </label>
            </div>
          </div>

          {f.imported && (
            <Field label="Importation Fee (per unit · UGX)" hint="charged per unit at checkout" full>
              <Input type="number" min="0" value={f.import_fee} onChange={set('import_fee')} placeholder="500" />
            </Field>
          )}

          <div style={{ gridColumn: '1 / -1' }}>
            <label onClick={() => setF((s) => ({ ...s, featured: !s.featured }))} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '12px 14px', border: `1.5px solid ${f.featured ? T.blue : T.line}`, borderRadius: 12, cursor: 'pointer', background: f.featured ? T.blueWash : '#fff' }}>
              <span style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${f.featured ? T.blue : T.line}`, background: f.featured ? T.blue : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{f.featured && <Icon name="check" size={14} color="#fff" stroke={3} />}</span>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: T.ink }}>Customised product</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.sub }}>This product is made to order and will be delivered within 7 working days.</div>
              </div>
            </label>
          </div>
        </div>
      </Modal>
    );
  }

  function Products() {
    const d = useData();
    const [q, setQ] = React.useState('');
    const [cat, setCat] = React.useState('All');
    const [editing, setEditing] = React.useState(null); // product | 'new' | null

    const list = d.products.filter((p) => {
      if (cat !== 'All' && p.category !== cat) return false;
      if (q.trim()) { const s = (p.name + ' ' + p.sku + ' ' + (p.brand || '') + ' ' + p.category).toLowerCase(); if (!s.includes(q.trim().toLowerCase())) return false; }
      return true;
    });

    const del = (p) => ConfirmStore.open({
      title: 'Delete product', danger: true, confirmLabel: 'Delete', sub: p.sku,
      body: `Remove “${p.name}” from the catalogue? This updates the storefront immediately and cannot be undone.`,
      onConfirm: () => { DataStore.deleteProduct(p.id); ToastStore.push(`${p.name} removed from the catalogue.`, { title: 'Product deleted', icon: 'check', tone: 'warn' }); },
    });

    const columns = [
      { label: 'Product' }, { label: 'SKU' }, { label: 'Category' },
      { label: 'Price', align: 'right' }, { label: 'Stock', align: 'center' }, { label: 'Home Bested', align: 'center' }, { label: 'Imported', align: 'center' }, { label: 'Tags' }, { label: '', align: 'right', width: 96 },
    ];

    return (
      <div>
        <PageHead title="Products" sub={`${d.products.length} items · single source of truth for the storefront catalogue`}>
          <Button icon="plus" onClick={() => setEditing('new')}>Add product</Button>
        </PageHead>

        <Card pad={14} style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <Search value={q} onChange={setQ} placeholder="Search name, SKU or brand…" width={320} />
          <Select value={cat} onChange={setCat} options={['All', ...A_CATEGORIES]} width={210} />
          <div style={{ flex: 1 }} />
          <div style={{ fontSize: 13, fontWeight: 700, color: T.sub }}>{list.length} shown</div>
        </Card>

        {list.length === 0 ? <Card><Empty icon="box" title="No products match" sub="Try another search or category." /></Card> : (
          <Table columns={columns}>
            {list.map((p, i) => {
              const sale = p.salePrice && p.salePrice < p.regularPrice;
              return (
                <Row key={p.id} i={i}>
                  <Td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <Thumb p={p} size={44} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 800, color: T.ink, display: 'flex', alignItems: 'center', gap: 7 }}>
                          <span style={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                          {p.featured && <Icon name="star" size={14} color={T.amber} fill={T.amber} />}
                        </div>
                        <div style={{ fontSize: 11.5, fontWeight: 700, color: T.sub }}>{p.brand}</div>
                      </div>
                    </div>
                  </Td>
                  <Td><span style={{ fontSize: 12, fontWeight: 700, color: T.sub, fontVariantNumeric: 'tabular-nums' }}>{p.sku}</span></Td>
                  <Td><span style={{ fontSize: 12.5, fontWeight: 700, color: T.ink }}>{p.category}</span></Td>
                  <Td align="right">
                    <div style={{ fontSize: 13.5, fontWeight: 800, color: T.ink, fontVariantNumeric: 'tabular-nums' }}>{A_money(A_priceOf(p))}</div>
                    {sale && <div style={{ fontSize: 11.5, fontWeight: 600, color: T.sub, textDecoration: 'line-through', fontVariantNumeric: 'tabular-nums' }}>{A_money(p.regularPrice)}</div>}
                  </Td>
                  <Td align="center">
                    <span style={{ fontSize: 12.5, fontWeight: 800, color: p.stock < 5 ? T.red : T.ink, background: p.stock < 5 ? T.redWash : 'transparent', padding: p.stock < 5 ? '3px 9px' : 0, borderRadius: 999, fontVariantNumeric: 'tabular-nums' }}>{p.stock}</span>
                  </Td>
                  <Td align="center">
                    <span style={{ fontSize: 15, lineHeight: 1 }} title={p.home_bested ? 'Home Bested' : 'Not local'}>{p.home_bested ? '✅' : '❌'}</span>
                  </Td>
                  <Td align="center">
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                      <span style={{ fontSize: 15, lineHeight: 1 }} title={p.imported ? 'Imported' : 'Not imported'}>{p.imported ? '✅' : '❌'}</span>
                      {p.imported && (Number(p.import_fee) || 0) > 0 && <span style={{ fontSize: 11, fontWeight: 700, color: T.sub, fontVariantNumeric: 'tabular-nums' }}>{A_money(p.import_fee)}</span>}
                    </div>
                  </Td>
                  <Td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, maxWidth: 180 }}>
                      {p.tags && p.tags.length ? p.tags.slice(0, 3).map((t) => <TagChip key={t} tag={t} />) : <span style={{ fontSize: 12, color: T.faint }}>—</span>}
                    </div>
                  </Td>
                  <Td align="right">
                    <div style={{ display: 'inline-flex', gap: 7 }}>
                      <IconBtn icon="doc" tone="blue" title="Edit" onClick={() => setEditing(p)} />
                      <IconBtn icon="minus" tone="danger" title="Delete" onClick={() => del(p)} />
                    </div>
                  </Td>
                </Row>
              );
            })}
          </Table>
        )}

        {editing && <ProductModal product={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
      </div>
    );
  }

  Object.assign(window, { AdminProducts: Products });
})();
