const firebaseConfig = {
  apiKey: "AIzaSyClcUTTtYxlct54ZJUEDiwmUT2uA8TB_hY",
  authDomain: "network-manage-558fd.firebaseapp.com",
  projectId: "network-manage-558fd",
  storageBucket: "network-manage-558fd.firebasestorage.app",
  messagingSenderId: "642738576075",
  appId: "1:642738576075:web:4154457b456bb48157594e",
  measurementId: "G-QVQLVFGVGE"
};

const FB_DEBUG = true;

function fbLog(level, message, data) {
  if (!FB_DEBUG) return;
  const prefix = "[FIREBASE]";
  const fn = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
  if (data !== undefined) fn(`${prefix} ${message}`, data);
  else fn(`${prefix} ${message}`);
}

try {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    fbLog("log", "Firebase initialized", {
      projectId: firebaseConfig.projectId,
      authDomain: firebaseConfig.authDomain
    });
  } else {
    fbLog("log", "Firebase already initialized, reusing existing app");
  }
} catch (err) {
  fbLog("error", "Firebase init failed", err);
}

const db = firebase.firestore();
fbLog("log", "Firestore instance ready");
