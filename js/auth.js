import { auth } from './firebase.js';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

const loginForm = document.getElementById('login-form');

if (loginForm) {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            window.location.href = 'index.html';
        } else {
            document.body.classList.add('auth-ready');
        }
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const errorMsg = document.getElementById('error-msg');
        const submitBtn = loginForm.querySelector('button[type="submit"]');

        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> מתחבר...';
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            errorMsg.textContent = 'שגיאה בהתחברות. בדוק אימייל וסיסמה.';
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> התחברות';
        }
    });
}

export const logoutUser = async () => {
    try {
        await signOut(auth);
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Logout error', error);
    }
};
