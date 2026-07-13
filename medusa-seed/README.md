# E-PowerHub — Tronic Catalog Importer

An **additive** Medusa v2 seed script that imports the Tronic Uganda catalog into E-PowerHub. It does **not** touch any existing products, categories, settings, or infrastructure — it only adds new rows, and it's safe to re-run.

## What it does

1. **Pulls real data.** Fetches the live catalog from Tronic's public Shopify feed (`https://tronic.ug/products.json`, paginated) so every title, **multi-image set, price, model code, type and tags is genuine** — no fabricated specs, no guessed image URLs, no broken links. If the machine has no internet, it falls back to a small set of real, hand-verified rows baked into the script (`OFFLINE_SAMPLE`).
2. **Marks up +15%.** `new_price = round(original_price × 1.15)` in UGX (zero-decimal).
3. **Categorizes** every product into **Industrial / Mechanical / Domestic** by keyword rules (creating those categories only if they don't already exist).
4. **Tags "Sourced on Demand"** for special-order / rare gear (distribution boards, three-phase switchgear, DOL/soft starters, contactors, PLCs, stabilizers, pumps, custom/fire panels, etc., plus out-of-stock industrial items). Those variants are set `allow_backorder: true` so they stay orderable.
5. **Idempotent & non-destructive.** Imported products are namespaced with a `tronic-` handle prefix and skipped if already present, so existing data can never be overwritten.

## Run

```bash
npx medusa exec ./seed-tronic-catalog.js
```

## Options (env vars)

| Var | Default | Purpose |
|-----|---------|---------|
| `TRONIC_SOURCE` | `https://tronic.ug` | Source storefront |
| `MARKUP` | `1.15` | Price multiplier |
| `DRY_RUN=1` | off | Transform + log only, no DB writes |
| `EXPORT_JSON=./tronic-catalog.json` | off | Also write the normalized catalog to disk |
| `ENRICH_SPECS=1` | off | Crawl each product **page** for structured specs (voltage, current, wattage, IP rating, phase, base, lumens, HP, dimensions, material…) and store them as typed `metadata.specs`. One throttled request per product. |
| `ENRICH_LIMIT=N` | `0` (all) | Cap how many products to enrich (handy for a test run) |
| `REHOST_IMAGES=1` | off | Download every source image and re-host it via Medusa's **File Module**, replacing hot-linked CDN URLs with your own. Falls back to the original URL if a download fails (never a broken link). |

Preview without writing anything:

```bash
DRY_RUN=1 EXPORT_JSON=./tronic-catalog.json npx medusa exec ./seed-tronic-catalog.js
```

Full import **with** structured specs and self-hosted images:

```bash
ENRICH_SPECS=1 REHOST_IMAGES=1 npx medusa exec ./seed-tronic-catalog.js
```

Test the spec crawler on the first 25 products only:

```bash
ENRICH_SPECS=1 ENRICH_LIMIT=25 DRY_RUN=1 EXPORT_JSON=./preview.json npx medusa exec ./seed-tronic-catalog.js
```

## Spec extraction & image re-hosting

- **`ENRICH_SPECS`** parses each product's description first, then (when set) crawls the live product page and merges any spec tables/bullets it finds. It's conservative — a field is only recorded when the source actually states it, so you still never get invented values. Results land in `metadata.specs` as typed keys (`voltage`, `current`, `wattage`, `ip_rating`, `phase`, `base`, `lumens`, `horsepower`, `dimensions`, `material`, …).
- **`REHOST_IMAGES`** pulls each image and uploads it through whatever File Module provider your store is configured with (local, S3, etc.), so production isn't dependent on Tronic's CDN. Re-hosting is the right call if you intend to serve these images long-term — see the rights note below.

## Requirements & assumptions

- **Medusa v2.x** (the script resolves the Product Module from the DI container). Node 18+ for global `fetch`.
- A `ugx` currency must exist on the store/region. Add it in **Settings → Store/Currencies** (or your region config) before running, or change `CURRENCY` in the script.
- **v1 note:** if you're on Medusa v1, swap the write layer for `ProductService`: resolve `container.resolve("productService")`, call `productService.create(payload)` per product, and `productCategoryService` for categories. The `normalize()` output is engine-agnostic, so only section 4 of the script changes.

## Honest limitations (please read)

- **Specs depth.** Without `ENRICH_SPECS`, specs come from the feed description only. With it, each product page is crawled for additional spec tables. Either way, no spec is invented — if the source doesn't publish it, it isn't asserted.
- **The `OFFLINE_SAMPLE` is a real but partial subset** (network-free fallback). The full ~1,700-product import happens via the live fetch.
- **Rights:** this imports another store's listings, images and prices. Confirm you have permission/a reseller agreement to list Tronic's catalog before going to production. If you do, run with `REHOST_IMAGES=1` so you're serving your own copies rather than hot-linking their CDN.
