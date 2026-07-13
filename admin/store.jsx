// store.jsx — Pinnacle Power Systems admin data layer.
// Single source of truth: localStorage. The storefront (home.html) is meant to
// read pps_products from the same place (see reference snippet in admin.html).
// Purely additive — does not touch the existing storefront code.
(function () {
  // ── ONE-TIME DATA RESET ─────────────────────────────────────────────────
  // On the first load after this update, wipe the existing Clients, Orders,
  // Inquiries and Quotes so the console starts afresh. Products (pps_products)
  // and employee accounts (pps_users) are deliberately preserved. Keys are set
  // to an empty list (not removed) so the seeders below do NOT re-populate them.
  // Guarded by the pps_data_reset flag so it only ever runs once.
  try {
    if (!localStorage.getItem('pps_data_reset')) {
      ['pps_clients', 'pps_orders', 'pps_inquiries', 'pps_quotes', 'pps_quotations', 'pps_notifications']
        .forEach((k) => localStorage.setItem(k, '[]'));
      localStorage.setItem('pps_data_reset', 'true');
    }
  } catch (e) {}

  // ── Brand tokens (mirrors the live storefront palette) ──────────────────
  const T = {
    ink: '#0B1A33', sub: '#5A6B85', faint: '#8A98B0',
    blue: '#1457E6', blueDk: '#0E3FB0', blueWash: '#EAF0FE',
    amber: '#FFB020', amberInk: '#5A3A00',
    navy: '#0B1A33', navy2: '#13294D',
    surface: '#F4F7FC', page: '#EEF2F8', line: '#E4E9F2', lineSoft: '#EDF1F7',
    green: '#119C5B', greenWash: '#E5F4EC',
    red: '#E5484D', redWash: '#FDECEC',
    purple: '#7A5AF8', purpleWash: '#EFEBFE',
    teal: '#0EA5A3', tealWash: '#E2F5F4',
  };
  const F = "'Plus Jakarta Sans', system-ui, sans-serif";

  // ── Helpers ─────────────────────────────────────────────────────────────
  const money = (ugx) => 'USh ' + Math.round(ugx || 0).toLocaleString('en-US');
  const moneyK = (ugx) => {
    const n = Math.round(ugx || 0);
    if (n >= 1e6) return 'USh ' + (n / 1e6).toFixed(n % 1e6 === 0 ? 0 : 1) + 'M';
    if (n >= 1e3) return 'USh ' + Math.round(n / 1e3) + 'K';
    return 'USh ' + n;
  };
  const priceOf = (p) => (p && p.salePrice ? p.salePrice : (p ? p.regularPrice : 0));
  const fmtDate = (iso) => {
    const d = new Date(iso); if (isNaN(d)) return iso;
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };
  const fmtDateShort = (iso) => {
    const d = new Date(iso); if (isNaN(d)) return iso;
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  };
  const relTime = (iso) => {
    const d = new Date(iso); const now = new Date('2026-06-22T12:00:00');
    const days = Math.round((now - d) / 86400000);
    if (days <= 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return days + ' days ago';
    if (days < 30) return Math.round(days / 7) + 'w ago';
    return Math.round(days / 30) + 'mo ago';
  };
  const uid = (pfx) => pfx + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-3);

  const CATEGORIES = ['Circuit Protection', 'Control Gear', 'Cables & Wiring', 'Motors & Drives', 'Enclosures', 'Lighting', 'Wiring Devices', 'Tech'];
  const CAT_ICON = {
    'Circuit Protection': 'breaker', 'Control Gear': 'contactor', 'Cables & Wiring': 'cable',
    'Motors & Drives': 'motor', 'Enclosures': 'panel', 'Lighting': 'light',
    'Wiring Devices': 'socket', 'Tech': 'sensor',
  };
  const TAG_OPTIONS = ['Flash Deals', 'Popular this week', 'New Arrival', 'Best Seller', 'Clearance'];
  const ORDER_STATUSES = ['Pending', 'Packed', 'Shipped', 'In Transit', 'Out for Delivery', 'Delivered', 'Cancelled'];
  const INQUIRY_STATUSES = ['New', 'In Progress', 'Resolved'];
  const PAYMENTS = ['Mobile Money', 'Bank Transfer', 'Card', 'Cash on Delivery'];

  // ── Seed data ───────────────────────────────────────────────────────────
  const SEED_PRODUCTS = [
    { sku: 'ABB-XT1S160-63', brand: 'ABB', icon: 'breaker', name: 'Tmax XT 3-Pole MCCB 63A 415V', category: 'Circuit Protection', regularPrice: 545000, salePrice: 486000, stock: 24, tags: ['Flash Deals', 'Best Seller'], featured: true, rating: 4.7, reviews: 128, specs: 'Rating: 63A\nPoles: 3P\nBreaking: 36kA\nVoltage: 415V', description: 'Genuine ABB Tmax XT moulded-case circuit breaker for industrial distribution boards.' },
    { sku: 'SCH-LC1D25BD', brand: 'Schneider', icon: 'contactor', name: 'TeSys D Contactor 25A 3P 24VDC', category: 'Control Gear', regularPrice: 312000, salePrice: null, stock: 16, tags: ['Popular this week'], featured: false, rating: 4.6, reviews: 84, specs: 'Rating: 25A\nDuty: AC-3\nPower: 11kW\nCoil: 24VDC', description: 'Schneider TeSys D 3-pole contactor for motor switching and control circuits.' },
    { sku: 'NEX-SWA4C16', brand: 'Nexans', icon: 'cable', name: 'XLPE Armoured Cable 4-Core 16mm² (per m)', category: 'Cables & Wiring', regularPrice: 44000, salePrice: 38500, stock: 320, tags: ['Flash Deals'], featured: false, rating: 4.8, reviews: 211, specs: 'Size: 16mm²\nType: SWA\nRating: 0.6/1kV\nCores: 4', description: 'Steel-wire-armoured XLPE power cable for underground and industrial runs.' },
    { sku: 'WEG-W22-55-IE3', brand: 'WEG', icon: 'motor', name: 'W22 IE3 Induction Motor 5.5kW 3-Phase', category: 'Motors & Drives', regularPrice: 2740000, salePrice: null, stock: 3, tags: ['New Arrival'], featured: false, rating: 4.9, reviews: 37, specs: 'Power: 5.5kW\nSpeed: 1465rpm\nProtection: IP55\nEfficiency: IE3', description: 'High-efficiency WEG W22 three-phase induction motor for pumps and fans.' },
    { sku: 'LEG-XL3-160-24', brand: 'Legrand', icon: 'panel', name: 'XL³ Distribution Board IP65 24-Way', category: 'Enclosures', regularPrice: 760000, salePrice: 695000, stock: 12, tags: ['Clearance'], featured: false, rating: 4.5, reviews: 52, specs: 'Ways: 24\nProtection: IP65\nMaterial: Steel\nMount: Wall', description: 'Legrand XL³ metal distribution enclosure for clean, compliant installations.' },
    { sku: 'MK-IS32-IP67', brand: 'MK Electric', icon: 'socket', name: 'Industrial Socket Outlet 32A IP67', category: 'Wiring Devices', regularPrice: 118000, salePrice: 96000, stock: 40, tags: ['Flash Deals'], featured: true, rating: 4.4, reviews: 96, specs: 'Rating: 32A\nConfig: 3P+N+E\nProtection: IP67', description: 'Weatherproof industrial socket for outdoor and washdown environments.' },
    { sku: 'PHI-BY120P-150', brand: 'Philips', icon: 'light', name: 'CoreLine LED Highbay 150W 5000K', category: 'Lighting', regularPrice: 489000, salePrice: 428000, stock: 22, tags: ['Popular this week'], featured: false, rating: 4.7, reviews: 143, specs: 'Power: 150W\nOutput: 19500lm\nCCT: 5000K\nProtection: IP65', description: 'Philips CoreLine LED highbay for warehouses and production halls.' },
    { sku: 'SIE-3RG78-14', brand: 'Siemens', icon: 'sensor', name: 'SIRIUS Safety Light Curtain 14mm', category: 'Tech', regularPrice: 3180000, salePrice: null, stock: 2, tags: ['New Arrival'], featured: false, rating: 5.0, reviews: 12, specs: 'Type: 4\nResolution: 14mm\nRange: 1.2m', description: 'Siemens SIRIUS Type-4 safety light curtain for machine guarding.' },
    { sku: 'HAM-PT500-MQMJ', brand: 'Hammond', icon: 'transformer', name: 'Control Transformer 500VA 415/110V', category: 'Control Gear', regularPrice: 598000, salePrice: 540000, stock: 9, tags: ['Best Seller'], featured: false, rating: 4.6, reviews: 41, specs: 'Rating: 500VA\nPrimary: 415V\nSecondary: 110V\nFreq: 50Hz', description: 'Encapsulated control transformer for panel control voltage supply.' },
    { sku: 'EAT-PFL6-40B', brand: 'Eaton', icon: 'breaker', name: 'xEffect RCBO 40A 30mA Type B', category: 'Circuit Protection', regularPrice: 189000, salePrice: 164000, stock: 30, tags: ['Flash Deals'], featured: false, rating: 4.5, reviews: 73, specs: 'Rating: 40A\nTrip: 30mA\nType: B\nBreaking: 6kA', description: 'Eaton xEffect combined RCD/MCB for final-circuit earth-leakage protection.' },
    { sku: 'ABB-TA25DU25', brand: 'ABB', icon: 'contactor', name: 'TA25 Thermal Overload Relay 18-25A', category: 'Control Gear', regularPrice: 208000, salePrice: null, stock: 18, tags: [], featured: false, rating: 4.6, reviews: 54, specs: 'Range: 18–25A\nClass: 10\nMount: Contactor', description: 'ABB TA25 thermal overload relay for motor protection circuits.' },
    { sku: 'NEX-H07VK6-100', brand: 'Nexans', icon: 'cable', name: 'H07V-K Single-Core 6mm² 100m Drum', category: 'Cables & Wiring', regularPrice: 312000, salePrice: null, stock: 26, tags: ['Popular this week'], featured: false, rating: 4.7, reviews: 118, specs: 'Size: 6mm²\nRating: 450/750V\nLength: 100m', description: 'Flexible single-core building wire for panel and conduit wiring.' },
    { sku: 'SCH-ATV320U22N4', brand: 'Schneider', icon: 'motor', name: 'Altivar 320 VFD 2.2kW 3-Phase', category: 'Motors & Drives', regularPrice: 2240000, salePrice: 1980000, stock: 4, tags: ['Clearance'], featured: false, rating: 4.8, reviews: 29, specs: 'Power: 2.2kW\nInput: 380–500V\nProtection: IP20', description: 'Schneider Altivar 320 compact variable-speed drive for machine builders.' },
    { sku: 'LEG-PLX-12M66', brand: 'Legrand', icon: 'panel', name: 'Plexo IP66 Enclosure 12-Module', category: 'Enclosures', regularPrice: 184000, salePrice: null, stock: 35, tags: [], featured: false, rating: 4.4, reviews: 61, specs: 'Modules: 12\nProtection: IP66\nImpact: IK07', description: 'Legrand Plexo weatherproof modular enclosure for harsh environments.' },
    { sku: 'PHI-RC132V-36', brand: 'Philips', icon: 'light', name: 'CoreLine LED Panel 36W 4000K 600×600', category: 'Lighting', regularPrice: 172000, salePrice: 148000, stock: 60, tags: ['Flash Deals', 'Popular this week'], featured: false, rating: 4.6, reviews: 204, specs: 'Power: 36W\nOutput: 3600lm\nGlare: UGR<19', description: 'Slim recessed LED panel for offices and commercial ceilings.' },
    { sku: 'MK-K2747WHI', brand: 'MK Electric', icon: 'socket', name: 'Logic Plus 13A Twin Switched Socket', category: 'Wiring Devices', regularPrice: 42000, salePrice: null, stock: 120, tags: [], featured: false, rating: 4.5, reviews: 312, specs: 'Rating: 13A\nGangs: 2\nFinish: Metalclad', description: 'MK Logic Plus twin switched socket — durable, BS-approved.' },
    { sku: 'SIE-6ES7212-1AE40', brand: 'Siemens', icon: 'sensor', name: 'SIMATIC S7-1200 CPU 1212C DC/DC', category: 'Tech', regularPrice: 1390000, salePrice: 1240000, stock: 8, tags: ['Best Seller', 'Popular this week'], featured: true, rating: 4.9, reviews: 46, specs: 'I/O: 8DI/6DO\nAnalog: 2AI\nComms: PROFINET', description: 'Siemens SIMATIC S7-1200 compact PLC for small automation projects.' },
    { sku: 'SCH-LV429630', brand: 'Schneider', icon: 'breaker', name: 'Compact NSX100F 3-Pole MCCB 100A', category: 'Circuit Protection', regularPrice: 680000, salePrice: 612000, stock: 14, tags: [], featured: false, rating: 4.7, reviews: 58, specs: 'Rating: 100A\nPoles: 3P\nBreaking: 36kA', description: 'Schneider Compact NSX moulded-case breaker for main distribution.' },
    { sku: 'ABB-ACS180-1K5', brand: 'ABB', icon: 'motor', name: 'ACS180 Machinery Drive 1.5kW 3-Phase', category: 'Motors & Drives', regularPrice: 1450000, salePrice: 1290000, stock: 6, tags: ['New Arrival'], featured: false, rating: 4.7, reviews: 22, specs: 'Power: 1.5kW\nInput: 380–480V\nProtection: IP20', description: 'ABB ACS180 micro drive for conveyors, pumps and fans.' },
    { sku: 'EAT-CXSE-PIR', brand: 'Eaton', icon: 'sensor', name: 'xComfort Wireless PIR Occupancy Sensor', category: 'Tech', regularPrice: 268000, salePrice: null, stock: 1, tags: ['New Arrival'], featured: false, rating: 4.3, reviews: 17, specs: 'Range: 8m\nComms: Wireless\nBattery: 2yr', description: 'Eaton xComfort wireless occupancy sensor for smart lighting control.' },
  ].map((p, i) => ({ id: 'p' + (i + 1), image: '', ...p }));

  // ── Imported catalogue (Tronic.ug — Lighting + Circuit Protection) ────────
  // Prices captured in UGX, then a 15% markup applied in-code (rounded to 2dp)
  // so the arithmetic is provably consistent across every imported item.
  const MARKUP = 1.15;
  const _mk = (n) => Math.round(n * MARKUP * 100) / 100;
  const _poles = (s) => /four|4-?\s?pole/i.test(s) ? '4P' : /triple|3-?\s?pole/i.test(s) ? '3P' : /double|2-?\s?pole/i.test(s) ? '2P' : '1P';

  // [sku, name, originalUGX, stock, imageURL]
  const LIGHTING_SRC = [
    ['PL 6011-3D', '3D Glass Ceiling Lamp', 114000, 10, 'https://tronic.ug/cdn/shop/products/PL6011-3D_189x.jpg?v=1756822596'],
    ['KD 1821-WH', 'Crystal Frame LED Changeable Ceiling Light', 68000, 0, 'https://tronic.ug/cdn/shop/products/KD1821-WH_189x.jpg?v=1756821632'],
    ['KD 1832-WH', 'White & Gold Changeable Ceiling Light', 104000, 0, 'https://tronic.ug/cdn/shop/products/KD1832-WH_189x.jpg?v=1756822027'],
    ['KD 1921-WH', 'Crystal Decorative Glass LED Ceiling Light', 109000, 10, 'https://tronic.ug/cdn/shop/products/KD1921-WH_189x.jpg?v=1756822455'],
    ['WH 2009', 'Simple Acrylic LED Wall Light 12W', 76000, 10, 'https://tronic.ug/cdn/shop/products/WH2009-DL_189x.jpg?v=1756821441'],
    ['KD 1829-WH', 'Simple LED Changeable Ceiling Light', 156000, 10, 'https://tronic.ug/cdn/shop/products/KD1829-WH_189x.jpg?v=1756822459'],
    ['KD 1826-WH', 'Crystal White Changeable Ceiling Light', 120000, 10, 'https://tronic.ug/cdn/shop/products/KD1826-WH_189x.jpg?v=1756822462'],
    ['PL 1110-04', 'Twisted Vintage Fixture with Frosted Glass', 161000, 10, 'https://tronic.ug/cdn/shop/products/PL1110-04_189x.jpg?v=1756822598'],
    ['KD 1809-WH', 'Crystal & Sparkling LED Ceiling Light', 78000, 0, 'https://tronic.ug/cdn/shop/products/KD1809-WH_189x.jpg?v=1756821633'],
    ['LL 2004-02-DL-SS', 'Square Silver Ceiling Light', 109000, 10, 'https://tronic.ug/cdn/shop/products/LL2004-02-DL-SS_189x.jpg?v=1756821891'],
    ['KD 1820-WH', '3-Colour Ceiling Light with Fan', 302000, 10, 'https://tronic.ug/cdn/shop/products/KD1820-WH_189x.jpg?v=1756821929'],
    ['KD 1926-WH', 'Sparkling Shimmer LED Ceiling Light', 97000, 10, 'https://tronic.ug/cdn/shop/products/KD1926-WH_c742d8d3-7de8-4622-a934-ff6d3bff8cc6_189x.jpg?v=1756821975'],
    ['KD 1929-WH', 'Metal White LED Pendant Light', 306000, 0, 'https://tronic.ug/cdn/shop/products/KD1929-WH_189x.jpg?v=1756822449'],
    ['KD 1928-WH', 'Vintage Glass LED Ceiling Light', 233000, 10, 'https://tronic.ug/cdn/shop/products/KD1928-WH_189x.jpg?v=1756822449'],
    ['KD 1924-WH', 'Modern LED Changeable Ceiling Light', 163000, 0, 'https://tronic.ug/cdn/shop/products/KD1924-WH_189x.jpg?v=1756822450'],
    ['KD 1922-YL', 'Yellow Half-Moon LED Ceiling Light', 100000, 10, 'https://tronic.ug/cdn/shop/products/KD1922-YL_189x.jpg?v=1756822451'],
    ['KD 1922-WH', 'Decorative LED Changeable Ceiling Light', 114000, 0, 'https://tronic.ug/cdn/shop/products/KD1922-WH_189x.jpg?v=1756822452'],
    ['KD 1921-YL', 'Stylish LED Changeable Ceiling Light', 100000, 0, 'https://tronic.ug/cdn/shop/products/KD1921-YL_189x.jpg?v=1756822454'],
    ['KD 1911-WH', 'Patterned LED Changeable Ceiling Light', 104000, 0, 'https://tronic.ug/cdn/shop/products/KD1911-WH_189x.jpg?v=1756822456'],
    ['KD 1910-WH', 'Patterned White Glass LED Ceiling Light', 94000, 10, 'https://tronic.ug/cdn/shop/products/KD1910-WH_189x.jpg?v=1756822456'],
    ['KD 1837-WH', '3-Colour Ceiling Light w/ Bluetooth Speaker', 255000, 0, 'https://tronic.ug/cdn/shop/products/KD1837-WH_1_189x.jpg?v=1756822457'],
    ['KD 1832-BK', 'Black & Copper LED Ceiling Light', 104000, 0, 'https://tronic.ug/cdn/shop/products/KD1832-BK_189x.jpg?v=1756822458'],
    ['KD 1827-WH', 'Decorative LED Changeable Ceiling Light', 94000, 0, 'https://tronic.ug/cdn/shop/products/KD1827-WH_189x.jpg?v=1756822461'],
    ['KD 1819-WH', 'Modern Colour Changeable Ceiling Light', 156000, 0, 'https://tronic.ug/cdn/shop/products/KD_1819-WH__1_-removebg-preview_189x.png?v=1756822463'],
    ['KD 1817-GO', 'Simple Gold LED Changeable Ceiling Light', 98000, 0, 'https://tronic.ug/cdn/shop/products/KD1817-GO_189x.jpg?v=1756822464'],
    ['KD 1810-WH', 'Transparent Gold LED Ceiling Light', 120000, 0, 'https://tronic.ug/cdn/shop/products/KD1810-WH_189x.jpg?v=1756822465'],
    ['KD 1808-WH', 'Sparkling Round LED Ceiling Light', 99000, 10, 'https://tronic.ug/cdn/shop/products/KD1808-WH_189x.jpg?v=1756822466'],
    ['WH 2004-TC', 'Circle LED Ceiling Lamp Three-Colour', 135000, 10, 'https://tronic.ug/cdn/shop/products/WH2004-DL_c88c6aeb-990b-4d52-853c-d4108962c1be_189x.jpg?v=1756823030'],
  ];

  const CP_SRC = [
    ['MC 6K40', 'MCB 40A Single Pole', 7500, 10, 'https://tronic.ug/cdn/shop/products/MC-6K-1POLE_a7a2ad56-8547-47f9-b76a-fd71f7acca69_189x.jpg?v=1756821995'],
    ['MC 6K20', 'MCB 20A Single Pole', 6300, 10, 'https://tronic.ug/cdn/shop/products/MC-6K-1POLE_189x.jpg?v=1756821998'],
    ['MC 6K16', 'MCB 16A Single Pole', 6300, 10, 'https://tronic.ug/cdn/shop/products/MC-6K16_189x.jpg?v=1756821999'],
    ['MC 6K06', 'MCB 6A Single Pole', 6000, 10, 'https://tronic.ug/cdn/shop/products/MC-6K-1POLE_8ccb90ad-8e7c-4a35-81bf-34abdcd94688_189x.jpg?v=1756822000'],
    ['MC 6K10', 'MCB 10A Single Pole', 6000, 0, 'https://tronic.ug/cdn/shop/products/MC-6K10_189x.jpg?v=1756822070'],
    ['MC 6K63', 'MCB 63A Single Pole', 10001, 0, 'https://tronic.ug/cdn/shop/products/MC-6K-1POLE_7219fe33-d5ef-4a8b-a7fd-3e9cbc6f7065_189x.jpg?v=1756821994'],
    ['MC 6K32-03', 'MCB 32A Triple Pole', 24000, 10, 'https://tronic.ug/cdn/shop/products/MC-6K-3POLE_c183216f-ee71-4394-a1db-9193f725684e_189x.jpg?v=1756821989'],
    ['MC 6K06-02', 'MCB 6A Double Pole', 15000, 10, 'https://tronic.ug/cdn/shop/products/MC-6K-2POLE_a216cf0d-1562-49af-8f56-1a2f70ddffa7_189x.jpg?v=1756821993'],
    ['MC 10K100-03', 'MCB 100A Triple Pole', 66000, 10, 'https://tronic.ug/cdn/shop/products/MC10K100-03_189x.jpg?v=1756821969'],
    ['MC 6K20-04', 'MCB 20A Four Pole', 33000, 10, 'https://tronic.ug/cdn/shop/products/MC-6K-4POLE_189x.jpg?v=1756821971'],
    ['MC 6K50-03', 'MCB 50A Triple Pole', 28000, 10, 'https://tronic.ug/cdn/shop/products/MC-6K-3POLE_623c24eb-4209-4059-9cb4-f3ab82d064a9_189x.jpg?v=1756821987'],
    ['MC 6K40-03', 'MCB 40A Triple Pole', 26000, 10, 'https://tronic.ug/cdn/shop/products/MC-6K-3POLE_ac2dd6c1-3e19-4e1b-8f56-45fed102e053_189x.jpg?v=1756821988'],
    ['MC 6K20-03', 'MCB 20A Triple Pole', 24000, 10, 'https://tronic.ug/cdn/shop/products/MC-6K-3POLE_dfcb782c-52d0-416a-ab7e-3ae1b89eeebe_189x.jpg?v=1756821990'],
    ['MC 6K16-03', 'MCB 16A Triple Pole', 23001, 10, 'https://tronic.ug/cdn/shop/products/MC-6K-3POLE_ac97c5e5-d497-4e80-be4b-7dcfd7426d5d_189x.jpg?v=1756821991'],
    ['MC 6K10-03', 'MCB 10A Triple Pole', 23001, 10, 'https://tronic.ug/cdn/shop/products/MC-6K-3POLE_189x.jpg?v=1756821992'],
    ['MC 6K63-03', 'MCB 63A Triple Pole', 30000, 0, 'https://tronic.ug/cdn/shop/products/MC-6K-3POLE_a08746e5-2d9e-4bcd-a196-8db1453fc31b_189x.jpg?v=1756821993'],
    ['MC 6K32', 'MCB 32A Single Pole', 6300, 0, 'https://tronic.ug/cdn/shop/products/MC-6K32_189x.jpg?v=1756821996'],
    ['MC 6K25', 'MCB 25A Single Pole', 7200, 10, 'https://tronic.ug/cdn/shop/products/MC-6K25_189x.jpg?v=1756821997'],
    ['MC 3010-6K', 'MCB 10A Triple Pole (Cassette)', 19000, 10, 'https://tronic.ug/cdn/shop/products/MC3010-6K_189x.png?v=1756823412'],
    ['MC 3016-6K', 'MCB 16A Triple Pole (Cassette)', 19000, 10, 'https://tronic.ug/cdn/shop/products/MC3016-6K_1_189x.png?v=1756823415'],
    ['MC IS2P-40', 'Double Pole Isolator 40A', 15000, 10, 'https://tronic.ug/cdn/shop/products/MCIS2P_a1786120-3c4c-4398-bf5e-cf049349e36d_189x.jpg?v=1756822001'],
    ['MC IS4P-125', 'Four Pole Isolator 125A', 40000, 10, 'https://tronic.ug/cdn/shop/products/MCIS4P-125_189x.jpg?v=1756821966'],
    ['MC IS3P-125', 'Triple Pole Isolator 125A', 24999, 10, 'https://tronic.ug/cdn/shop/products/MCIS3P-125_189x.jpg?v=1756821967'],
    ['IS 4016', 'Surface Isolator 4-Pole 16A 415V', 46000, 10, 'https://tronic.ug/cdn/shop/products/IS4016_189x.jpg?v=1756821658'],
    ['IS 4020', 'Surface Isolator 4-Pole 20A 415V', 48000, 10, 'https://tronic.ug/cdn/shop/products/IS4020_3_189x.jpg?v=1756823310'],
    ['IS 4032', 'Surface Isolator 4-Pole 32A 415V', 57000, 10, 'https://tronic.ug/cdn/shop/products/IS4032_189x.jpg?v=1756823311'],
    ['IS 4032-KT', 'Surface Isolator 3-Pole 32A 415V', 81000, 10, 'https://tronic.ug/cdn/shop/products/IS4032-KT_189x.jpg?v=1756823312'],
    ['IS 4040', 'Surface Isolator 4-Pole 40A 415V', 83000, 10, 'https://tronic.ug/cdn/shop/products/IS4040_189x.jpg?v=1756823313'],
    ['IS 4063', 'Surface Isolator 4-Pole 63A 415V', 85000, 10, 'https://tronic.ug/cdn/shop/products/IS4063_189x.jpg?v=1756823314'],
    ['IS 4100', 'Surface Isolator 4-Pole 100A 415V', 203000, 10, 'https://tronic.ug/cdn/shop/products/IS4100_189x.jpg?v=1756823315'],
  ];

  const TRONIC_LIGHTING = LIGHTING_SRC.map(([sku, name, orig, stock, image], i) => {
    const mount = /wall/i.test(name) ? 'Wall' : /pendant/i.test(name) ? 'Pendant' : /fan/i.test(name) ? 'Ceiling + Fan' : 'Ceiling';
    return {
      id: 'lgt' + (i + 1), sku, brand: 'Tronic', icon: 'light', name, category: 'Lighting',
      regularPrice: _mk(orig), salePrice: null, stock, tags: [], featured: false, rating: 4.5, reviews: 0,
      specs: `Type: Indoor LED Light\nMount: ${mount}\nVoltage: 220–240V`,
      description: `${name} — indoor LED ${mount.toLowerCase()} fitting supplied by Pinnacle Power Systems.`,
      image,
    };
  });

  const TRONIC_CP = CP_SRC.map(([sku, name, orig, stock, image], i) => {
    const amps = (name.match(/(\d+)\s*A/) || [])[1] || '';
    const poles = _poles(name);
    const iso = /isolator/i.test(name);
    return {
      id: 'cp' + (i + 1), sku, brand: 'Tronic', icon: 'breaker', name, category: 'Circuit Protection',
      regularPrice: _mk(orig), salePrice: null, stock, tags: [], featured: false, rating: 4.5, reviews: 0,
      specs: iso
        ? `Rating: ${amps}A\nPoles: ${poles}\nType: Isolator / Disconnector\nVoltage: 415V`
        : `Rating: ${amps}A\nPoles: ${poles}\nBreaking: 6kA\nCurve: C`,
      description: iso
        ? `${name} — load-breaking isolator/disconnector for safe circuit isolation, supplied by Pinnacle Power Systems.`
        : `${name} — miniature circuit breaker for overload and short-circuit protection, supplied by Pinnacle Power Systems.`,
      image,
    };
  });

  const SEED_PRODUCTS_ALL = SEED_PRODUCTS.concat(TRONIC_LIGHTING, TRONIC_CP);

  const SEED_CLIENTS = [
    { id: 'c1', name: 'Brian Ssemwogerere', email: 'brian@kampalapanels.co.ug', phone: '+256 772 110 480', address: 'Plot 14, Ntinda Industrial Area, Kampala', registered: '2024-11-03', status: 'Active' },
    { id: 'c2', name: 'Aisha Nakato', email: 'aisha@jinjasteel.com', phone: '+256 701 884 220', address: 'Jinja Steel Works, Main St, Jinja', registered: '2025-01-18', status: 'Active' },
    { id: 'c3', name: 'David Okoth', email: 'david.okoth@gmail.com', phone: '+256 753 309 117', address: '22 Bombo Road, Kampala', registered: '2025-03-02', status: 'Active' },
    { id: 'c4', name: 'Grace Atim', email: 'grace@northgate-facilities.ug', phone: '+256 782 445 901', address: 'Gulu Business Park, Gulu', registered: '2025-04-21', status: 'Suspended' },
    { id: 'c5', name: 'Ronald Mugisha', email: 'ronald@mugishacontractors.co.ug', phone: '+256 700 712 334', address: 'Plot 7, Seeta, Mukono', registered: '2025-06-09', status: 'Active' },
  ];

  // Build orders with item lines; price captured at order time.
  const _p = (id) => SEED_PRODUCTS.find((x) => x.id === id);
  const line = (id, qty) => { const p = _p(id); const price = priceOf(p); return { productId: id, name: p.name, sku: p.sku, category: p.category, qty, price }; };
  const mkOrder = (id, clientId, date, items, status, payment) => {
    const client = SEED_CLIENTS.find((c) => c.id === clientId);
    const total = items.reduce((s, it) => s + it.price * it.qty, 0);
    return { id, clientId, clientName: client.name, address: client.address, date, items, total, status, payment };
  };
  const SEED_ORDERS = [
    mkOrder('#PPS-1042', 'c1', '2026-06-21', [line('p1', 2), line('p6', 1)], 'Pending', 'Mobile Money'),
    mkOrder('#PPS-1041', 'c2', '2026-06-19', [line('p3', 150), line('p12', 4)], 'Packed', 'Bank Transfer'),
    mkOrder('#PPS-1040', 'c3', '2026-06-18', [line('p15', 10), line('p16', 6)], 'Shipped', 'Card'),
    mkOrder('#PPS-1039', 'c1', '2026-06-16', [line('p10', 4)], 'Delivered', 'Mobile Money'),
    mkOrder('#PPS-1038', 'c4', '2026-06-14', [line('p5', 1), line('p14', 2)], 'Cancelled', 'Bank Transfer'),
    mkOrder('#PPS-1037', 'c5', '2026-06-12', [line('p7', 6)], 'Delivered', 'Card'),
    mkOrder('#PPS-1036', 'c2', '2026-06-10', [line('p13', 1)], 'Shipped', 'Bank Transfer'),
    mkOrder('#PPS-1035', 'c3', '2026-06-08', [line('p17', 1), line('p2', 3)], 'Pending', 'Mobile Money'),
    mkOrder('#PPS-1034', 'c5', '2026-06-04', [line('p18', 2), line('p1', 1)], 'Delivered', 'Cash on Delivery'),
    mkOrder('#PPS-1033', 'c1', '2026-05-30', [line('p4', 1)], 'Delivered', 'Bank Transfer'),
  ];

  const SEED_INQUIRIES = [
    { id: '#INQ-218', clientName: 'Aisha Nakato', email: 'aisha@jinjasteel.com', date: '2026-06-21', subject: 'Bulk pricing — 16mm² armoured cable', message: 'We need ~500m of SWA 4-core 16mm² for a factory extension. Can you quote bulk tiers and lead time to Jinja?', status: 'New' },
    { id: '#INQ-217', clientName: 'David Okoth', email: 'david.okoth@gmail.com', date: '2026-06-20', subject: 'Lead time on Siemens S7-1200', message: 'What is the lead time on 3× S7-1200 CPU 1212C? Project starts in 2 weeks.', status: 'New' },
    { id: '#INQ-216', clientName: 'Grace Atim', email: 'grace@northgate-facilities.ug', date: '2026-06-16', subject: 'Warranty claim — WEG 5.5kW motor', message: 'Motor supplied in April is tripping on overload. Need a warranty assessment.', status: 'In Progress' },
    { id: '#INQ-215', clientName: 'Ronald Mugisha', email: 'ronald@mugishacontractors.co.ug', date: '2026-06-11', subject: 'IP67 sockets for outdoor panel', message: 'Need 12× 32A IP67 industrial sockets. Are they in stock?', status: 'Resolved' },
    { id: '#INQ-214', clientName: 'Brian Ssemwogerere', email: 'brian@kampalapanels.co.ug', date: '2026-06-09', subject: 'Datasheet — NSX100 MCCB', message: 'Please send the full datasheet and trip curves for the NSX100F 100A.', status: 'Resolved' },
  ];

  const SEED_QUOTES = [
    { id: '#QT-2026-014', clientName: 'Aisha Nakato', date: '2026-06-21', fileName: 'QT-2026-014_JinjaSteel_Cable.pdf', status: 'Sent', orderId: '#PPS-1041' },
    { id: '#QT-2026-015', clientName: 'David Okoth', date: '2026-06-20', fileName: 'QT-2026-015_S7-1200_Project.pdf', status: 'Pending', orderId: '' },
    { id: '#QT-2026-011', clientName: 'Grace Atim', date: '2026-06-16', fileName: 'QT-2026-011_Gulu_Facilities.pdf', status: 'Sent', orderId: '' },
  ];

  // ── Persistence ─────────────────────────────────────────────────────────
  const KEYS = { products: 'pps_products', orders: 'pps_orders', clients: 'pps_clients', inquiries: 'pps_inquiries', quotes: 'pps_quotes', notifRead: 'pps_notifications' };
  const read = (k, fallback) => { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : fallback; } catch (e) { return fallback; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

  const SEED_VERSION = 'tronic-2026-06';
  function seedIfEmpty() {
    const curProducts = localStorage.getItem(KEYS.products);
    if (!curProducts) {
      write(KEYS.products, SEED_PRODUCTS_ALL);
    } else if (localStorage.getItem('pps_products_v') !== SEED_VERSION) {
      // Additive merge: append any seed items (by SKU) the stored catalogue is
      // missing — picks up the imported products without touching user edits.
      try {
        const list = JSON.parse(curProducts);
        const have = new Set(list.map((p) => p.sku));
        const add = SEED_PRODUCTS_ALL.filter((p) => !have.has(p.sku));
        if (add.length) write(KEYS.products, list.concat(add));
      } catch (e) {}
    }
    localStorage.setItem('pps_products_v', SEED_VERSION);
    // Migrate legacy category name: 'Automation' → 'Tech' on any stored product.
    try {
      const raw = localStorage.getItem(KEYS.products);
      if (raw) {
        const list = JSON.parse(raw);
        let changed = false;
        list.forEach((p) => { if (p.category === 'Automation') { p.category = 'Tech'; changed = true; } });
        if (changed) write(KEYS.products, list);
      }
    } catch (e) {}
    if (!localStorage.getItem(KEYS.orders)) write(KEYS.orders, SEED_ORDERS);
    if (!localStorage.getItem(KEYS.clients)) write(KEYS.clients, SEED_CLIENTS);
    if (!localStorage.getItem(KEYS.inquiries)) write(KEYS.inquiries, SEED_INQUIRIES);
    if (!localStorage.getItem(KEYS.quotes)) write(KEYS.quotes, SEED_QUOTES);
    if (!localStorage.getItem(KEYS.notifRead)) write(KEYS.notifRead, []);
  }

  // ── Reactive store ──────────────────────────────────────────────────────
  const DataStore = (() => {
    seedIfEmpty();
    let state = {
      products: read(KEYS.products, SEED_PRODUCTS_ALL),
      orders: read(KEYS.orders, SEED_ORDERS),
      clients: read(KEYS.clients, SEED_CLIENTS),
      inquiries: read(KEYS.inquiries, SEED_INQUIRIES),
      quotes: read(KEYS.quotes, SEED_QUOTES),
      notifRead: read(KEYS.notifRead, []),
    };
    const subs = new Set();
    const emit = () => { state = { ...state }; subs.forEach((f) => f(state)); };
    const persist = (key) => write(KEYS[key], state[key]);

    // Keep at most `maxCount` products carrying `tagName`. Tagged products are kept
    // in array order (newest first); any beyond the cap (the oldest) have the tag
    // stripped in place. Returns the number of products whose tag was removed.
    function enforceTagLimit(tagName, maxCount) {
      const tagged = [];
      state.products.forEach((p) => { if (Array.isArray(p.tags) && p.tags.includes(tagName)) tagged.push(p); });
      if (tagged.length <= maxCount) return 0;
      const excess = tagged.slice(maxCount); // oldest tagged products
      excess.forEach((p) => { p.tags = p.tags.filter((t) => t !== tagName); });
      try {
        if (window.ToastStore) window.ToastStore.push(
          `Only ${maxCount} products can be featured under “${tagName}”. The oldest ${excess.length} ${excess.length === 1 ? 'was' : 'were'} removed.`,
          { title: 'Featured limit reached', icon: 'check', tone: 'warn' });
      } catch (e) {}
      return excess.length;
    }

    return {
      get: () => state,
      sub: (f) => { subs.add(f); return () => subs.delete(f); },

      // Products
      saveProduct: (prod) => {
        const list = state.products.slice();
        const i = list.findIndex((x) => x.id === prod.id);
        if (i >= 0) list[i] = prod; else list.unshift(prod);
        state.products = list;
        // Enforce the "max 8 featured" rule for the two capped tags. The list is
        // newest-first (new items are unshifted), so tagged items at higher indices
        // are the oldest; we strip the tag from those beyond the first 8.
        enforceTagLimit('Flash Deals', 8);
        enforceTagLimit('Popular this week', 8);
        persist('products'); emit();
      },
      deleteProduct: (id) => { state.products = state.products.filter((p) => p.id !== id); persist('products'); emit(); },

      // Clients
      saveClient: (c) => {
        const list = state.clients.slice();
        const i = list.findIndex((x) => x.id === c.id);
        if (i >= 0) list[i] = c; else list.unshift(c);
        state.clients = list; persist('clients'); emit();
      },
      deleteClient: (id) => { state.clients = state.clients.filter((c) => c.id !== id); persist('clients'); emit(); },

      // Orders. On every status change we append the ACTUAL date/time of the
      // transition to the order's `timeline` (e.g. when an admin moves an order
      // to "Out for Delivery"). The storefront Track Order reads these stamps.
      setOrderStatus: (id, status) => {
        const STAGE_LABEL = { Pending: 'Order Placed', Packed: 'Order Packed', Shipped: 'In Transit', 'In Transit': 'In Transit', 'Out for Delivery': 'Out for Delivery', Delivered: 'Delivered', Cancelled: 'Cancelled' };
        const nowIso = new Date().toISOString();
        state.orders = state.orders.map((o) => {
          if (o.id !== id) return o;
          const timeline = Array.isArray(o.timeline) ? o.timeline.slice() : [];
          const stage = STAGE_LABEL[status] || status;
          const entry = { stage, status, date: nowIso };
          const at = timeline.findIndex((e) => e.stage === stage);
          if (at >= 0) timeline[at] = entry; else timeline.push(entry);
          return { ...o, status, timeline };
        });
        persist('orders'); emit();
      },
      deleteOrder: (id) => { state.orders = state.orders.filter((o) => o.id !== id); persist('orders'); emit(); },

      // Payment verification: storefront checkouts land with paymentStatus
      // 'Awaiting verification'; only an admin flips it to 'Verified' here.
      setOrderPayment: (id, paymentStatus) => {
        state.orders = state.orders.map((o) => (o.id === id
          ? { ...o, paymentStatus, paymentVerifiedAt: paymentStatus === 'Verified' ? new Date().toISOString() : o.paymentVerifiedAt }
          : o));
        persist('orders'); emit();
      },

      // Inquiries
      setInquiryStatus: (id, status) => {
        state.inquiries = state.inquiries.map((q) => (q.id === id ? { ...q, status } : q));
        persist('inquiries'); emit();
      },
      deleteInquiry: (id) => { state.inquiries = state.inquiries.filter((q) => q.id !== id); persist('inquiries'); emit(); },

      // Quotes
      addQuote: (q) => { state.quotes = [q, ...state.quotes]; persist('quotes'); emit(); },
      setQuoteStatus: (id, status) => { state.quotes = state.quotes.map((q) => (q.id === id ? { ...q, status } : q)); persist('quotes'); emit(); },

      // Notifications: derived from Pending orders + New inquiries, minus read ids.
      notifications: () => {
        const readSet = new Set(state.notifRead);
        const items = [];
        state.orders.filter((o) => o.status === 'Pending').forEach((o) =>
          items.push({ id: 'no_' + o.id, kind: 'order', refId: o.id, title: 'New order ' + o.id, who: o.clientName, date: o.date, read: readSet.has('no_' + o.id) }));
        state.inquiries.filter((q) => q.status === 'New').forEach((q) =>
          items.push({ id: 'ni_' + q.id, kind: 'inquiry', refId: q.id, title: 'New inquiry ' + q.id, who: q.clientName, date: q.date, read: readSet.has('ni_' + q.id) }));
        items.sort((a, b) => new Date(b.date) - new Date(a.date));
        return items;
      },
      markRead: (notifId) => {
        if (state.notifRead.includes(notifId)) return;
        state.notifRead = [...state.notifRead, notifId]; persist('notifRead'); emit();
      },
      markAllRead: () => {
        const all = DataStore.notifications().map((n) => n.id);
        state.notifRead = Array.from(new Set([...state.notifRead, ...all])); persist('notifRead'); emit();
      },
      resetAll: () => {
        Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
        seedIfEmpty();
        state = { products: read(KEYS.products), orders: read(KEYS.orders), clients: read(KEYS.clients), inquiries: read(KEYS.inquiries), quotes: read(KEYS.quotes), notifRead: read(KEYS.notifRead, []) };
        emit();
      },
    };
  })();

  function useData() {
    const [s, set] = React.useState(DataStore.get());
    React.useEffect(() => DataStore.sub(set), []);
    return s;
  }

  // ── Currency exchange rates (admin-owned) ────────────────────────────────
  // Stored as UGX per 1 unit of USD / EUR (base currency = UGX). The storefront
  // (home.html) reads pps_currency_rates and applies it to every price display.
  const CUR_KEY = 'pps_currency_rates';
  const DEFAULT_RATES = { usdToUgx: 3850, eurToUgx: 4150 };
  const CurrencyRates = (() => {
    const subs = new Set();
    let rates = (() => {
      try { const r = JSON.parse(localStorage.getItem(CUR_KEY)); if (r && Number(r.usdToUgx) > 0 && Number(r.eurToUgx) > 0) return { usdToUgx: Number(r.usdToUgx), eurToUgx: Number(r.eurToUgx) }; } catch (e) {}
      return { ...DEFAULT_RATES };
    })();
    return {
      get: () => rates,
      save: (r) => {
        rates = { usdToUgx: Number(r.usdToUgx), eurToUgx: Number(r.eurToUgx) };
        try { localStorage.setItem(CUR_KEY, JSON.stringify(rates)); } catch (e) {}
        subs.forEach((f) => f(rates));
      },
      reset: () => CurrencyRates.save({ ...DEFAULT_RATES }),
      sub: (f) => { subs.add(f); return () => subs.delete(f); },
    };
  })();
  function useCurrencyRates() { const [r, set] = React.useState(CurrencyRates.get()); React.useEffect(() => CurrencyRates.sub(set), []); return r; }

  // ── Homepage hero media (admin-owned) ──────────────────────────────────
  // Stored as pps_hero_media: [{ id, type: 'image'|'video', src, name }].
  // The storefront HeroSlideshow (screens/home-a.jsx) reads this key on load,
  // falling back to the built-in 1.jpg … 11.jpg when it's absent. With cloud
  // sync connected the list reaches every visitor's browser.
  const HERO_KEY = 'pps_hero_media';
  const DEFAULT_HERO_MEDIA = Array.from({ length: 11 }, (_, i) => ({
    id: 'default-' + (i + 1), type: 'image', src: (i + 1) + '.jpg', name: 'Photo ' + (i + 1) + ' (built-in)',
  }));
  const HeroMedia = (() => {
    const subs = new Set();
    let list = (() => {
      try { const r = JSON.parse(localStorage.getItem(HERO_KEY)); if (Array.isArray(r)) return r; } catch (e) {}
      return DEFAULT_HERO_MEDIA.map((m) => ({ ...m }));
    })();
    const emitH = () => { list = list.slice(); subs.forEach((f) => f(list)); };
    // Returns false when localStorage quota is exceeded (large data-URL media).
    const persistH = () => { try { localStorage.setItem(HERO_KEY, JSON.stringify(list)); return true; } catch (e) { return false; } };
    return {
      get: () => list,
      add: (item) => {
        list = [...list, { id: uid('hm_'), addedAt: new Date().toISOString(), ...item }];
        if (!persistH()) { list = list.slice(0, -1); return false; }
        emitH(); return true;
      },
      remove: (id) => { list = list.filter((m) => m.id !== id); persistH(); emitH(); },
      reset: () => { list = DEFAULT_HERO_MEDIA.map((m) => ({ ...m })); persistH(); emitH(); },
      sub: (f) => { subs.add(f); return () => subs.delete(f); },
    };
  })();
  function useHeroMedia() { const [l, set] = React.useState(HeroMedia.get()); React.useEffect(() => HeroMedia.sub(set), []); return l; }

  // ── Toast store ─────────────────────────────────────────────────────────
  const ToastStore = (() => {
    let list = []; let id = 0; const subs = new Set();
    const emit = () => { list = list.slice(); subs.forEach((f) => f(list)); };
    const dismiss = (tid) => { list = list.filter((t) => t.id !== tid); emit(); };
    const push = (msg, opts = {}) => {
      const t = { id: ++id, msg, title: opts.title, icon: opts.icon || 'check', tone: opts.tone || 'ok' };
      list = [...list, t]; emit(); setTimeout(() => dismiss(t.id), 3600);
    };
    return { push, dismiss, get: () => list, sub: (f) => { subs.add(f); return () => subs.delete(f); } };
  })();
  function useToasts() { const [l, set] = React.useState(ToastStore.get()); React.useEffect(() => ToastStore.sub(set), []); return l; }

  // ── Router store (active section) ───────────────────────────────────────
  const Router = (() => {
    let view = 'dashboard'; let payload = null; const subs = new Set();
    return {
      get: () => view, payload: () => payload,
      go: (v, p = null) => { view = v; payload = p; subs.forEach((f) => f(view)); },
      sub: (f) => { subs.add(f); return () => subs.delete(f); },
    };
  })();
  function useRouter() { const [v, set] = React.useState(Router.get()); React.useEffect(() => Router.sub(set), []); return [v, Router.go]; }

  Object.assign(window, {
    ADMIN_T: T, ADMIN_F: F, A_money: money, A_moneyK: moneyK, A_priceOf: priceOf,
    A_fmtDate: fmtDate, A_fmtDateShort: fmtDateShort, A_relTime: relTime, A_uid: uid,
    A_CATEGORIES: CATEGORIES, A_CAT_ICON: CAT_ICON, A_TAG_OPTIONS: TAG_OPTIONS,
    A_ORDER_STATUSES: ORDER_STATUSES, A_INQUIRY_STATUSES: INQUIRY_STATUSES, A_PAYMENTS: PAYMENTS,
    DataStore, useData, ToastStore, useToasts, Router, useRouter,
    CurrencyRates, useCurrencyRates, A_DEFAULT_RATES: DEFAULT_RATES,
    HeroMedia, useHeroMedia, A_DEFAULT_HERO_MEDIA: DEFAULT_HERO_MEDIA,
  });
})();
