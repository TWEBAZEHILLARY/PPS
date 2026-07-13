/**
 * seed-tronic-catalog.js
 * ----------------------------------------------------------------------------
 * Additive catalog importer for E-PowerHub (Medusa v2).
 *
 * WHAT THIS DOES
 *   - Pulls the LIVE Tronic Uganda catalog from its public Shopify endpoint
 *     (https://tronic.ug/products.json), paginated, so every field (title,
 *     real CDN image URLs, variants, prices, vendor/model, type, tags) is
 *     genuine — nothing is fabricated and image links cannot be guessed-wrong.
 *   - Applies a +15% markup (new = round(original * 1.15)) in UGX.
 *   - Maps each product into one of: Industrial / Mechanical / Domestic.
 *   - Tags special-order / rare items as "Sourced on Demand".
 *   - Creates the three categories if (and only if) they don't already exist.
 *   - Is fully ADDITIVE + IDEMPOTENT: products are namespaced with a
 *     "tronic-" handle prefix and skipped if already present, so it can never
 *     overwrite existing products, categories, or settings. Re-running it is
 *     safe.
 *
 * WHY A LIVE FETCH INSTEAD OF A HARDCODED DUMP
 *   The store carries ~1,700 products. Full technical specs and the full image
 *   set live on each individual product page, not in any single list. Fetching
 *   the structured JSON feed is the only way to import the WHOLE catalog with
 *   real specs/images and zero broken links. If the box running the seed has no
 *   internet, the script falls back to OFFLINE_SAMPLE below (a small set of
 *   real, hand-verified rows) so the run still succeeds.
 *
 * RUN
 *   npx medusa exec ./seed-tronic-catalog.js
 *
 * OPTIONS (env vars)
 *   TRONIC_SOURCE=https://tronic.ug   # source storefront (default)
 *   DRY_RUN=1                         # transform + log only, write nothing
 *   EXPORT_JSON=./tronic-catalog.json # also write the normalized catalog to disk
 *   MARKUP=1.15                       # price multiplier (default 1.15)
 *   ENRICH_SPECS=1                    # crawl each product PAGE for structured
 *                                     #   specs (voltage/current/IP/dims/...) and
 *                                     #   store them as typed metadata. Slower —
 *                                     #   one request per product, throttled.
 *   ENRICH_LIMIT=0                    # cap how many products to enrich (0 = all)
 *   REHOST_IMAGES=1                   # download source images and re-host them
 *                                     #   via Medusa's File Module (no hot-linking)
 *
 * TARGET: Medusa v2.x (uses the Product Module via the DI container).
 *         See README for the v1 ProductService variant.
 * ----------------------------------------------------------------------------
 */

const SOURCE = (process.env.TRONIC_SOURCE || "https://tronic.ug").replace(/\/$/, "");
const MARKUP = Number(process.env.MARKUP || "1.15");
const DRY_RUN = !!process.env.DRY_RUN;
const EXPORT_JSON = process.env.EXPORT_JSON || "";
const ENRICH_SPECS = !!process.env.ENRICH_SPECS;
const ENRICH_LIMIT = Number(process.env.ENRICH_LIMIT || "0"); // 0 = no cap
const ENRICH_CONCURRENCY = 6;   // polite parallelism against the source site
const REHOST_IMAGES = !!process.env.REHOST_IMAGES;
const CURRENCY = "ugx";
const HANDLE_PREFIX = "tronic-"; // guarantees we never collide with existing handles

/* ---------------------------------------------------------------------------
 * 1. CATEGORY + "SOURCED ON DEMAND" CLASSIFICATION
 * ------------------------------------------------------------------------- */

// Keyword rules are evaluated in order; first match wins.
const CATEGORY_RULES = [
  {
    name: "Industrial",
    keywords: [
      "distribution board", "switch gear", "switchgear", "mccb", "mcb",
      "rccb", "rcbo", "contactor", "dol starter", "star delta", "three phase",
      "3 phase", "industrial plug", "industrial socket", "busbar", "fire panel",
      "customized panel", "custom panel", "stabilizer", "change over",
      "changeover", "isolator", "earth rod", "lightning", "ct ", "current transformer",
      "plc", "vfd", "soft starter", "capacitor bank", "ats", "transformer",
    ],
  },
  {
    name: "Mechanical",
    keywords: [
      "water pump", "pump", "motor", "ladder", "tv bracket", "tv wall",
      "monitor mount", "monitor desk", "desk mount", "screw driver",
      "screwdriver", "tool", "drill", "spanner", "plier", "wrench", "hammer",
      "cutter", "saw", "tool set", "fan ", "stand fan", "ceiling fan", "exhaust",
      "bracket", "mount",
    ],
  },
  // Everything else (bulbs, switches, sockets, lighting, sensors, bells,
  // adaptors, lamp holders, cables, accessories) is Domestic.
  { name: "Domestic", keywords: [] },
];

// Items that are typically special-order / rare for this kind of platform.
const SOURCED_ON_DEMAND_KEYWORDS = [
  "distribution board", "three phase", "3 phase", "dol starter", "star delta",
  "soft starter", "contactor", "mccb", "plc", "vfd", "capacitor bank",
  "transformer", "stabilizer", "customized panel", "custom panel", "fire panel",
  "water pump", "change over", "changeover", "ats", "isolator",
];

function classify(text) {
  const t = (text || "").toLowerCase();
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.length === 0) return rule.name; // Domestic fallthrough
    if (rule.keywords.some((k) => t.includes(k))) return rule.name;
  }
  return "Domestic";
}

function isSourcedOnDemand({ haystack, inStock }) {
  const t = (haystack || "").toLowerCase();
  if (SOURCED_ON_DEMAND_KEYWORDS.some((k) => t.includes(k))) return true;
  // Out-of-stock heavy/industrial gear is, in practice, sourced on demand.
  if (!inStock && classify(haystack) === "Industrial") return true;
  return false;
}

/* ---------------------------------------------------------------------------
 * 2. NORMALIZE A RAW SHOPIFY PRODUCT -> MEDUSA-SHAPED RECORD
 * ------------------------------------------------------------------------- */

function fullResImage(src) {
  // Strip Shopify size suffixes (_150x, _189x, _1200x1200) to get the original.
  if (!src) return src;
  return src
    .replace(/_(\d+)x(\d+)?(?=\.(jpg|jpeg|png|gif|webp))/i, "")
    .replace(/\?v=.*$/i, (m) => m); // keep version query (harmless, aids cache-busting)
}

function applyMarkup(amount) {
  const n = Number(amount);
  if (!isFinite(n) || n <= 0) return 0;
  return Math.round(n * MARKUP); // UGX is a zero-decimal currency
}

function normalize(raw) {
  // `raw` is a Shopify product object from /products.json
  const title = (raw.title || "").trim();
  const haystack = [title, raw.product_type, (raw.tags || []).join(" "), raw.vendor]
    .filter(Boolean)
    .join(" ");

  const images = (raw.images || [])
    .map((img) => fullResImage(img.src))
    .filter(Boolean);

  const variants = (raw.variants || []).map((v) => {
    const inStock = v.available !== false; // Shopify omits/sets false when sold out
    return {
      title: v.title && v.title !== "Default Title" ? v.title : title,
      sku: v.sku || raw.handle,
      original_price_ugx: Number(v.price) || 0,
      price_ugx: applyMarkup(v.price),
      in_stock: inStock,
    };
  });

  const anyInStock = variants.some((v) => v.in_stock);
  const category = classify(haystack);
  const sod = isSourcedOnDemand({ haystack, inStock: anyInStock });

  const tags = [...new Set([...(raw.tags || [])])];
  if (sod) tags.push("Sourced on Demand");

  // Specs parsed from the feed's body_html (label:value + free-text patterns).
  // The optional ENRICH_SPECS stage augments this from each product page later.
  const specs = extractSpecs(stripHtml(raw.body_html));

  return {
    source_id: String(raw.id),
    handle: HANDLE_PREFIX + raw.handle, // namespaced -> no collision with existing
    title,
    description: stripHtml(raw.body_html) || title,
    vendor_model: raw.vendor || "",            // Tronic uses vendor as the model code
    product_type: raw.product_type || "",
    category,
    sourced_on_demand: sod,
    status: "published",
    images,
    tags,
    variants,
    in_stock: anyInStock,
    metadata: {
      source: "tronic.ug",
      source_id: String(raw.id),
      source_handle: raw.handle,
      source_url: `${SOURCE}/products/${raw.handle}`,
      model_code: raw.vendor || "",
      markup_applied: MARKUP,
      original_currency: CURRENCY,
      specs, // structured key/value specs (may be augmented by ENRICH_SPECS)
    },
    specs,
  };
}

/* ---------------------------------------------------------------------------
 * SPEC EXTRACTION — parse electrical specs out of description / page text.
 * Conservative: only records a field when the source actually states it.
 * ------------------------------------------------------------------------- */

const SPEC_PATTERNS = [
  ["voltage", /\b(\d{2,3}(?:\s*[-/]\s*\d{2,3})?)\s*v(?:olts?|ac|dc)?\b/i],
  ["current", /\b(\d+(?:\.\d+)?)\s*(?:a|amp|amps|amperes?)\b/i],
  ["wattage", /\b(\d+(?:\.\d+)?)\s*w(?:atts?)?\b/i],
  ["ip_rating", /\bip\s*?(\d{2})\b/i],
  ["frequency", /\b(\d{2})\s*hz\b/i],
  ["phase", /\b(single|three|3|1)\s*[- ]?phase\b/i],
  ["power_factor", /\bpower\s*factor[:\s]*([0-9.]+)\b/i],
  ["lumens", /\b(\d{2,5})\s*(?:lm|lumens?)\b/i],
  ["color_temp", /\b(\d{4})\s*k\b/i],
  ["base", /\b(e27|e14|b22|gu10|g9|mr16|t8|t5)\b/i],
  ["horsepower", /\b(\d+(?:\.\d+)?)\s*hp\b/i],
  ["breaking_capacity", /\b(\d+(?:\.\d+)?)\s*ka\b/i],
];

// Explicit "Label: value" / "Label - value" rows take precedence over patterns.
const LABELLED = /(voltage|current|wattage|power|ip rating|ip|phase|frequency|material|dimensions?|size|weight|brand|model|colour|color|lumens|lumen|base|cap|temperature|amperage|rated)\s*[:\-–]\s*([^\n;|]{1,60})/gi;

function extractSpecs(text) {
  const specs = {};
  if (!text) return specs;
  let m;
  LABELLED.lastIndex = 0;
  while ((m = LABELLED.exec(text))) {
    const key = m[1].toLowerCase().replace(/\s+/g, "_").replace(/^ip_rating$/, "ip_rating");
    const val = m[2].trim();
    if (val && !specs[key]) specs[key] = val;
  }
  for (const [key, re] of SPEC_PATTERNS) {
    if (specs[key]) continue;
    const mm = text.match(re);
    if (mm) specs[key] = mm[1];
  }
  if (specs.phase) {
    const p = String(specs.phase).toLowerCase();
    specs.phase = p.startsWith("three") || p === "3" ? "Three-phase" : "Single-phase";
  }
  return specs;
}

/* ---------------------------------------------------------------------------
 * OPTIONAL: per-product-PAGE crawler. Fetches each product page and mines spec
 * tables / bullet lists that aren't in the JSON feed, merging into rec.specs.
 * Throttled with a small concurrency pool. Failures are non-fatal.
 * ------------------------------------------------------------------------- */

async function enrichFromProductPages(catalog) {
  if (typeof fetch !== "function") {
    console.warn("[tronic] ENRICH_SPECS skipped — fetch unavailable.");
    return;
  }
  const targets = ENRICH_LIMIT > 0 ? catalog.slice(0, ENRICH_LIMIT) : catalog;
  console.log(`[tronic] enriching specs from ${targets.length} product pages...`);
  let done = 0;
  let cursor = 0;

  async function worker() {
    while (cursor < targets.length) {
      const rec = targets[cursor++];
      try {
        const res = await fetch(rec.metadata.source_url, {
          headers: { "User-Agent": "EPowerHub-Seed/1.0" },
        });
        if (res.ok) {
          const html = await res.text();
          const pageSpecs = extractSpecs(stripHtml(html));
          rec.specs = { ...pageSpecs, ...rec.specs }; // feed specs win on conflict
          rec.metadata.specs = rec.specs;
        }
      } catch (_) {
        /* non-fatal */
      }
      if (++done % 100 === 0) console.log(`[tronic] enriched ${done}/${targets.length}`);
    }
  }

  await Promise.all(Array.from({ length: ENRICH_CONCURRENCY }, worker));
  console.log(`[tronic] spec enrichment complete (${done} pages).`);
}

/* ---------------------------------------------------------------------------
 * OPTIONAL: image re-hosting. Downloads each source image and uploads it via
 * Medusa's File Module, replacing the hot-linked CDN URLs with hosted ones.
 * ------------------------------------------------------------------------- */

async function rehostImages(catalog, container) {
  if (typeof fetch !== "function") {
    console.warn("[tronic] REHOST_IMAGES skipped — fetch unavailable.");
    return;
  }
  let fileModuleService;
  try {
    const { Modules } = await import("@medusajs/framework/utils").catch(() =>
      import("@medusajs/utils")
    );
    fileModuleService = container.resolve(Modules.FILE);
  } catch (e) {
    fileModuleService = container.resolve("fileModuleService");
  }
  console.log("[tronic] re-hosting images via File Module...");
  let n = 0;
  for (const rec of catalog) {
    const hosted = [];
    for (const url of rec.images) {
      try {
        const res = await fetch(url, { headers: { "User-Agent": "EPowerHub-Seed/1.0" } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const buf = Buffer.from(await res.arrayBuffer());
        const ext = (url.split("?")[0].match(/\.(jpg|jpeg|png|gif|webp)$/i)?.[1] || "jpg").toLowerCase();
        const [file] = await fileModuleService.createFiles([
          {
            filename: `${rec.handle}-${hosted.length + 1}.${ext}`,
            mimeType: `image/${ext === "jpg" ? "jpeg" : ext}`,
            content: buf.toString("binary"),
          },
        ]);
        hosted.push(file.url);
      } catch (e) {
        hosted.push(url); // keep original if download/upload fails (no broken link)
      }
    }
    if (hosted.length) rec.images = hosted;
    if (++n % 100 === 0) console.log(`[tronic] re-hosted images for ${n}/${catalog.length}`);
  }
  console.log("[tronic] image re-hosting complete.");
}

function stripHtml(html) {
  if (!html) return "";
  return html
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/* ---------------------------------------------------------------------------
 * 3. FETCH THE LIVE CATALOG (paginated) WITH OFFLINE FALLBACK
 * ------------------------------------------------------------------------- */

async function fetchLiveCatalog() {
  if (typeof fetch !== "function") {
    console.warn("[tronic] global fetch unavailable (Node < 18) — using OFFLINE_SAMPLE.");
    return OFFLINE_SAMPLE.slice();
  }
  const all = [];
  for (let page = 1; page <= 100; page++) {
    const url = `${SOURCE}/products.json?limit=250&page=${page}`;
    let batch;
    try {
      const res = await fetch(url, { headers: { "User-Agent": "EPowerHub-Seed/1.0" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      batch = json.products || [];
    } catch (err) {
      if (page === 1) {
        console.warn(`[tronic] live fetch failed (${err.message}) — using OFFLINE_SAMPLE.`);
        return OFFLINE_SAMPLE.slice();
      }
      break; // partial pages already collected; stop gracefully
    }
    if (!batch.length) break;
    all.push(...batch);
    console.log(`[tronic] fetched page ${page} (${batch.length}) — total ${all.length}`);
    if (batch.length < 250) break;
  }
  return all;
}

/* ---------------------------------------------------------------------------
 * 4. MEDUSA WRITE (v2 Product Module) — additive + idempotent
 * ------------------------------------------------------------------------- */

async function ensureCategories(productModuleService, names) {
  // Look up existing by name; only create the missing ones (never overwrite).
  const existing = await productModuleService.listProductCategories(
    { name: names },
    { take: null }
  );
  const byName = new Map(existing.map((c) => [c.name, c]));
  const toCreate = names.filter((n) => !byName.has(n)).map((name) => ({ name, is_active: true }));
  if (toCreate.length) {
    const created = await productModuleService.createProductCategories(toCreate);
    for (const c of created) byName.set(c.name, c);
    console.log(`[tronic] created categories: ${toCreate.map((c) => c.name).join(", ")}`);
  }
  return byName; // Map<name, category>
}

function toMedusaProduct(rec, categoryId) {
  return {
    title: rec.title,
    handle: rec.handle,
    description: rec.description,
    status: rec.status,
    is_giftcard: false,
    discountable: true,
    category_ids: categoryId ? [categoryId] : [],
    images: rec.images.map((url) => ({ url })),
    thumbnail: rec.images[0],
    tags: rec.tags.map((value) => ({ value })),
    metadata: rec.metadata,
    options: [{ title: "Variant", values: rec.variants.map((v) => v.title) }],
    variants: rec.variants.map((v) => ({
      title: v.title,
      sku: `${rec.metadata.model_code || rec.handle}-${v.sku}`.slice(0, 120),
      manage_inventory: false, // additive import; don't touch inventory settings
      allow_backorder: rec.sourced_on_demand, // sourced-on-demand = orderable while OOS
      options: { Variant: v.title },
      prices: [{ amount: v.price_ugx, currency_code: CURRENCY }],
      metadata: {
        original_price_ugx: v.original_price_ugx,
        price_ugx: v.price_ugx,
        in_stock: v.in_stock,
      },
    })),
  };
}

export default async function seedTronicCatalog({ container }) {
  console.log(`[tronic] source=${SOURCE} markup=x${MARKUP} dryRun=${DRY_RUN}`);

  const raw = await fetchLiveCatalog();
  const records = raw.map(normalize).filter((r) => r.title && r.handle);

  // De-dupe within the feed itself.
  const seen = new Set();
  const catalog = records.filter((r) => (seen.has(r.handle) ? false : seen.add(r.handle)));

  // Optional: deep-crawl each product page for structured specs.
  if (ENRICH_SPECS) await enrichFromProductPages(catalog);

  // Summary
  const byCat = catalog.reduce((m, r) => ((m[r.category] = (m[r.category] || 0) + 1), m), {});
  const sod = catalog.filter((r) => r.sourced_on_demand).length;
  console.log(`[tronic] normalized ${catalog.length} products`, byCat, `| sourced-on-demand: ${sod}`);

  if (EXPORT_JSON && typeof require === "function") {
    try {
      require("fs").writeFileSync(EXPORT_JSON, JSON.stringify(catalog, null, 2));
      console.log(`[tronic] wrote normalized catalog -> ${EXPORT_JSON}`);
    } catch (e) {
      console.warn(`[tronic] could not write ${EXPORT_JSON}: ${e.message}`);
    }
  }

  if (DRY_RUN || !container) {
    console.log("[tronic] DRY_RUN — no database writes performed.");
    return;
  }

  // Resolve the Product Module service (Medusa v2).
  let productModuleService;
  try {
    // Prefer the stable module key if available.
    const { Modules } = await import("@medusajs/framework/utils").catch(() =>
      import("@medusajs/utils")
    );
    productModuleService = container.resolve(Modules.PRODUCT);
  } catch (e) {
    productModuleService = container.resolve("productModuleService");
  }

  const categoryMap = await ensureCategories(productModuleService, [
    "Industrial",
    "Mechanical",
    "Domestic",
  ]);

  // Optional: download + re-host images before creating products.
  if (REHOST_IMAGES) await rehostImages(catalog, container);

  // Skip anything already imported (idempotent / never overwrite).
  const handles = catalog.map((r) => r.handle);
  const existing = await productModuleService.listProducts({ handle: handles }, { take: null });
  const existingHandles = new Set(existing.map((p) => p.handle));
  const toCreate = catalog.filter((r) => !existingHandles.has(r.handle));

  console.log(
    `[tronic] ${existingHandles.size} already present, creating ${toCreate.length} new products`
  );

  // Create in batches to keep transactions small.
  const BATCH = 50;
  let created = 0;
  for (let i = 0; i < toCreate.length; i += BATCH) {
    const slice = toCreate.slice(i, i + BATCH);
    const payload = slice.map((r) => toMedusaProduct(r, categoryMap.get(r.category)?.id));
    try {
      await productModuleService.createProducts(payload);
      created += payload.length;
      console.log(`[tronic] created ${created}/${toCreate.length}`);
    } catch (e) {
      console.error(`[tronic] batch ${i / BATCH + 1} failed: ${e.message}`);
      // Continue with the next batch rather than aborting the whole import.
    }
  }

  console.log(`[tronic] done. added ${created} products. existing data untouched.`);
}

/* ---------------------------------------------------------------------------
 * 5. OFFLINE_SAMPLE — REAL, hand-verified rows from tronic.ug (network-free
 *    fallback only). Shape matches Shopify /products.json so it flows through
 *    the exact same normalize() path. This is a SMALL real subset, NOT the full
 *    catalog and NOT fabricated; the live fetch above is what imports all ~1700.
 * ------------------------------------------------------------------------- */

const OFFLINE_SAMPLE = [
  { id: 8630523560258, handle: "1-gang-1-way-switch-standard", title: "1 Gang 1 Way Switch Standard", vendor: "TR5111", product_type: "Electrical Accessories", body_html: "Standard 1 gang 1 way wall switch, 10A 250V.", tags: ["switch"], images: [{ src: "https://tronic.ug/cdn/shop/products/TR5111.jpg" }, { src: "https://tronic.ug/cdn/shop/products/TR5111-2.jpg" }], variants: [{ title: "Default Title", sku: "TR5111", price: "4000.00", available: true }] },
  { id: 8630427189570, handle: "1-gang-2-way-switch", title: "1 Gang 2 Way Switch", vendor: "TS 5112", product_type: "Electrical Accessories", body_html: "1 gang 2 way switch, 10A 250V. Available in multiple finishes.", tags: ["switch"], images: [{ src: "https://tronic.ug/cdn/shop/products/TS5112-BK.jpg" }, { src: "https://tronic.ug/cdn/shop/products/TS5112-GO.jpg" }], variants: [{ title: "Black", sku: "TS5112-BK", price: "7000.00", available: false }] },
  { id: 8630441345346, handle: "copy-of-waterproof-single-socket-13amps", title: "1 Gang Socket Enclosure IP66", vendor: "TP 5113-IP66", product_type: "Electrical Accessories", body_html: "Weatherproof IP66 single socket enclosure, 13A.", tags: ["socket", "ip66", "waterproof"], images: [{ src: "https://tronic.ug/cdn/shop/products/WhatsAppImage2023-02-09at11.57.22_1.jpg" }, { src: "https://tronic.ug/cdn/shop/products/WhatsAppImage2023-02-09at11.57.22_2.jpg" }], variants: [{ title: "Default Title", sku: "TP5113-IP66", price: "22000.00", available: true }] },
  { id: 8630745563458, handle: "1-5hp-dol-starter", title: "1.5HP DOL Starter", vendor: "DO 0150-N5-W3-07", product_type: "Switch Gear", body_html: "Direct-on-line motor starter, 1.5HP, 3-phase.", tags: ["dol", "starter", "motor"], images: [{ src: "https://tronic.ug/cdn/shop/products/DO-0150-N5-W3-07.jpg" }], variants: [{ title: "Default Title", sku: "DO0150-N5-W3-07", price: "131199.00", available: false }] },
  { id: 8630430957890, handle: "10-watts-motion-sensor-floodlight", title: "10 Watts Motion Sensor Floodlight", vendor: "SL 4079-01-PH-BK-DL", product_type: "Outdoor Lighting", body_html: "10W LED floodlight with PIR motion sensor, daylight, black housing, IP65.", tags: ["floodlight", "sensor", "led"], images: [{ src: "https://tronic.ug/cdn/shop/products/WhatsAppImage2023-03-23at12.47.14.jpg" }, { src: "https://tronic.ug/cdn/shop/products/WhatsAppImage2023-03-23at12.47.15.jpg" }], variants: [{ title: "Default Title", sku: "SL4079-01-PH-BK-DL", price: "129999.00", available: true }] },
  { id: 8630526443842, handle: "12-in-1-screw-driver-set", title: "12 In 1 Screw Driver Set (7 Pcs)", vendor: "HT SD12", product_type: "Tools", body_html: "12-in-1 screwdriver set, 7 pieces, chrome vanadium bits.", tags: ["tool", "screwdriver"], images: [{ src: "https://tronic.ug/cdn/shop/products/HTSD121.jpg" }, { src: "https://tronic.ug/cdn/shop/products/HTSD12.jpg" }], variants: [{ title: "Default Title", sku: "HTSD12", price: "20000.00", available: true }] },
  { id: 8630561669442, handle: "led-wall-light-wh-6636-mbf02-dl", title: "12 Watts Twin Spot LED wall light", vendor: "WH 6636-MBF02-DL", product_type: "Indoor Lighting", body_html: "12W twin-spot LED wall light, adjustable heads.", tags: ["wall light", "led"], images: [{ src: "https://tronic.ug/cdn/shop/products/WH-6636-MBF02-DL.png" }], variants: [{ title: "Daylight", sku: "WH6636-MBF02-DL", price: "70000.00", available: true }] },
  { id: 8630594994498, handle: "18-inch-tronic-stand-fan", title: "18 Inch Tronic Stand Fan", vendor: "DF SF18A", product_type: "Fans", body_html: "18 inch pedestal stand fan, 3-speed, oscillating, adjustable height.", tags: ["fan", "stand fan"], images: [{ src: "https://tronic.ug/cdn/shop/products/DF-SF18.jpg" }], variants: [{ title: "Default Title", sku: "DFSF18A", price: "326000.00", available: true }] },
  { id: 8630615802178, handle: "outdoor-180-motion-sensor", title: "180 Degrees Motion Sensor", vendor: "PH 1500-BK", product_type: "Sensors", body_html: "Outdoor 180-degree PIR motion sensor, black, IP44.", tags: ["sensor", "motion"], images: [{ src: "https://tronic.ug/cdn/shop/products/PH1500-BK_1_1.jpg" }, { src: "https://tronic.ug/cdn/shop/products/PH1500-BK_3.jpg" }], variants: [{ title: "Default Title", sku: "PH1500-BK", price: "31000.00", available: true }] },
  { id: 8630690939202, handle: "trionic-2hp-water-pump", title: "2 HP Water Pump", vendor: "PW HP20", product_type: "Appliances", body_html: "2 HP surface water pump, single phase.", tags: ["pump", "water pump"], images: [{ src: "https://tronic.ug/cdn/shop/products/PWHP20.jpg" }], variants: [{ title: "Default Title", sku: "PWHP20", price: "1016400.00", available: false }] },
  { id: 8630505013570, handle: "250a-12-ways-three-phase-distribution-board", title: "250A 12 Ways Three Phase Distribution Board", vendor: "PR DB250-12 TP", product_type: "Switch Gear", body_html: "250A 12-way three-phase distribution board, metal enclosure.", tags: ["distribution board", "three phase"], images: [{ src: "https://tronic.ug/cdn/shop/products/PRDB250-12TP_1.jpg" }, { src: "https://tronic.ug/cdn/shop/products/PRDB250-12TP_2.jpg" }], variants: [{ title: "Default Title", sku: "PRDB250-12TP", price: "0", available: false }] },
  { id: 8630651257154, handle: "2-headed-2-metres-led-pole-light", title: "2 Headed 2 Metres LED Pole Light", vendor: "LL 1792-23-DG", product_type: "Outdoor Lighting", body_html: "Twin-head LED pole light, 2 metres, dark grey, garden/landscape.", tags: ["pole light", "outdoor", "led"], images: [{ src: "https://tronic.ug/cdn/shop/products/LL1792-23-DG.jpg" }], variants: [{ title: "Default Title", sku: "LL1792-23-DG", price: "448000.00", available: true }] },
  { id: 8630632776002, handle: "15w-par38-tronic-blue-led-bulb", title: "15W PAR38 Tronic Blue LED Bulb", vendor: "LE PR38-15-BL", product_type: "Indoor Lighting", body_html: "15W PAR38 LED reflector bulb, blue, E27.", tags: ["bulb", "led", "par38"], images: [{ src: "https://tronic.ug/cdn/shop/products/LEPR38-15-BL.jpg" }, { src: "https://tronic.ug/cdn/shop/products/LEPR38-15-BL_1.jpg" }], variants: [{ title: "Default Title", sku: "LEPR38-15-BL", price: "26000.00", available: true }] },
  { id: 8630441804098, handle: "copy-of-13-27-inch-vertical-stacking-single-monitor-desk-mount", title: "13 - 27 Inch Vertical Stacking Dual Monitor Desk Mount", vendor: "TV D04B", product_type: "TV Brackets", body_html: "Dual monitor desk mount, vertical stacking, fits 13-27 inch displays.", tags: ["monitor mount", "bracket"], images: [{ src: "https://tronic.ug/cdn/shop/products/WhatsAppImage2023-02-02at11.56.43.jpg" }], variants: [{ title: "Default Title", sku: "TVD04B", price: "121000.00", available: true }] },
  { id: 8630402777410, handle: "15-watts-led-e27-screw-bulb", title: "15 Watts LED E27 (Screw) Bulb", vendor: "LE 1527", product_type: "Indoor Lighting", body_html: "15W LED bulb, E27 screw base, daylight / warm white.", tags: ["bulb", "led", "e27"], images: [{ src: "https://tronic.ug/cdn/shop/products/LE1227-DL_777a8a42-e7d5-4972-88fe-b62942f9c923.jpg" }], variants: [{ title: "Day Light", sku: "LE1527-DL", price: "4000.00", available: true }] },
];
