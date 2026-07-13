// firebase-config.js — ONE place to paste your Firebase project config.
// Used by BOTH the storefront (home.html) and the admin console (admin.html):
//   · social sign-in on the storefront
//   · cloud sync (lib/cloud-sync.js) so the admin controls what every visitor
//     sees — hero photos/videos, catalogue, rates — on ANY computer/IP.
// SETUP: create a free Firebase project → enable Cloud Firestore → paste the
// config below. Until then everything still works per-browser via localStorage.
window.PPS_FIREBASE_CONFIG = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
