// ============================================
// Firebase Configuration - Moriya Nails
// ============================================

const firebaseConfig = {
  apiKey: "AIzaSyClcUTTtYxlct54ZJUEDiwmUT2uA8TB_hY",
  authDomain: "network-manage-558fd.firebaseapp.com",
  projectId: "network-manage-558fd",
  storageBucket: "network-manage-558fd.firebasestorage.app",
  messagingSenderId: "642738576075",
  appId: "1:642738576075:web:4154457b456bb48157594e",
  measurementId: "G-QVQLVFGVGE"
};

firebase.initializeApp(firebaseConfig);

// Optional App Check. Put the reCAPTCHA v3 site key here only after registering this app in Firebase App Check.
const APP_CHECK_SITE_KEY = "";
if (APP_CHECK_SITE_KEY && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
  firebase.appCheck().activate(APP_CHECK_SITE_KEY, true);
}

const db = firebase.firestore();
console.log("🔥 Moriya Nails Firebase initialized");
