import * as api from './api.js';
import { auth } from './firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { logoutUser } from './auth.js';
import { renderTree, renderStats, openForm, setSearchTerm, setLiveSnapshot, showToast } from './ui.js';

onAuthStateChanged(auth, (user) => {
    if (!user) {
        if (typeof stopInventorySubscription === 'function') {
            stopInventorySubscription();
            stopInventorySubscription = null;
        }
        window.location.href = 'login.html';
        return;
    }
    document.body.classList.add('auth-ready');
    initApp();
});

let initialized = false;
let stopInventorySubscription = null;

function initApp() {
    if (initialized) return;
    initialized = true;

    renderTree();
    renderStats();

    stopInventorySubscription = api.subscribeInventory(
        (snapshot) => setLiveSnapshot(snapshot),
        (error) => {
            console.error('Realtime inventory subscription error:', error);
            showToast('שגיאה בעדכון לייב. מנסה להתחבר מחדש...', 'warning');
        }
    );

    document.getElementById('add-site-btn').addEventListener('click', () => openForm('addSite'));
    document.getElementById('logout-btn').addEventListener('click', logoutUser);

    // Search
    const searchInput = document.getElementById('search-input');
    let debounce;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounce);
        debounce = setTimeout(() => setSearchTerm(e.target.value), 250);
    });

    // Ctrl+K focus search
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            searchInput.focus();
            searchInput.select();
        }
    });

    // Collapse all
    document.getElementById('collapse-all-btn').addEventListener('click', () => {
        document.querySelectorAll('.children-container').forEach(c => c.classList.add('hidden'));
        document.querySelectorAll('.node-chevron').forEach(c => c.classList.remove('expanded'));
    });

    // Expand already-loaded sections
    document.getElementById('expand-all-btn').addEventListener('click', () => {
        document.querySelectorAll('.children-container.hidden').forEach(c => {
            if (c.children.length > 0 && !c.querySelector('.loading-state')) {
                c.classList.remove('hidden');
            }
        });
        document.querySelectorAll('.children-container:not(.hidden)').forEach(c => {
            const node = c.closest('.tree-node');
            const chevron = node?.querySelector(':scope > .node-header .node-chevron');
            if (chevron) chevron.classList.add('expanded');
        });
    });

}
