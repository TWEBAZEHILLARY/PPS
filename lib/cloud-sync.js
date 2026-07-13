// cloud-sync.js — mirrors the admin-owned localStorage keys to Cloud Firestore
// so the admin's changes (hero media, products, currency rates) reach the home
// page on EVERY computer / IP address, and customer orders placed on any
// machine reach the admin console. Loaded by both home.html and admin.html
// AFTER firebase-app-compat + firebase-firestore-compat + lib/firebase-config.js.
//
// Design: each synced key gets one Firestore doc at pps_sync/{key} holding the
// raw JSON string. Local writes are pushed (debounced); remote snapshots are
// pulled into localStorage. Pages can list keys in window.PPS_SYNC_RELOAD_KEYS
// to force a reload when those keys are pulled (the storefront reads them once
// on load). Does NOTHING until the Firebase config is filled in — the site
// keeps its existing per-browser localStorage behaviour.
(function () {
  var SYNC_KEYS = [
    'pps_hero_media',      // homepage hero photos & videos (admin-managed)
    'pps_products',        // catalogue
    'pps_currency_rates',  // UGX/USD/EUR rates
    'pps_orders',          // customer orders → admin payment verification
    'pps_inquiries',
    'pps_clients',
    'pps_quotes'
  ];
  var cfg = window.PPS_FIREBASE_CONFIG;
  if (!window.firebase || !firebase.firestore || !cfg || !cfg.apiKey || cfg.apiKey === 'YOUR_API_KEY') return;

  try { if (!firebase.apps.length) firebase.initializeApp(cfg); } catch (e) { return; }
  var db;
  try { db = firebase.firestore(); } catch (e) { return; }

  window.PPS_CLOUD_SYNC = true;
  var applying = false;   // guard: don't re-push a value we just pulled
  var timers = {};

  // ── Pull: remote → localStorage ──
  SYNC_KEYS.forEach(function (k) {
    db.collection('pps_sync').doc(k).onSnapshot(function (snap) {
      var d = snap.data();
      if (!d || typeof d.json !== 'string') return;
      if (localStorage.getItem(k) === d.json) return;
      applying = true;
      try { localStorage.setItem(k, d.json); } catch (e) {}
      applying = false;
      var reloadKeys = window.PPS_SYNC_RELOAD_KEYS || [];
      if (reloadKeys.indexOf(k) >= 0) { location.reload(); return; }
      try { window.dispatchEvent(new CustomEvent('pps-sync', { detail: { key: k } })); } catch (e) {}
    }, function () { /* permission / network errors: stay local-only */ });
  });

  // ── Push: localStorage → remote (debounced) ──
  var origSet = Storage.prototype.setItem;
  Storage.prototype.setItem = function (k, v) {
    origSet.apply(this, arguments);
    if (this !== window.localStorage || applying || SYNC_KEYS.indexOf(k) < 0) return;
    clearTimeout(timers[k]);
    timers[k] = setTimeout(function () {
      db.collection('pps_sync').doc(k).set({ json: v, updatedAt: Date.now() }).catch(function () {});
    }, 400);
  };
})();
