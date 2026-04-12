import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
const firebaseConfig = {
    apiKey: "AIzaSyClcUTTtYxlct54ZJUEDiwmUT2uA8TB_hY",
    authDomain: "network-manage-558fd.firebaseapp.com",
    projectId: "network-manage-558fd",
    storageBucket: "network-manage-558fd.firebasestorage.app",
    messagingSenderId: "642738576075",
    appId: "1:642738576075:web:4154457b456bb48157594e",
    measurementId: "G-QVQLVFGVGE"
};
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);