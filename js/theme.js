"use strict";

const THEME_STORAGE_KEY = "gel-nails-theme";

function applyTheme(theme, persist) {
  const root = document.documentElement;
  root.setAttribute("data-theme", theme);

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", theme === "dark" ? "#1a0c14" : "#fff5fb");
  }

  const btn = document.getElementById("themeToggle");
  if (btn) {
    const isDark = theme === "dark";
    btn.setAttribute("aria-checked", isDark ? "true" : "false");
    btn.setAttribute(
      "aria-label",
      isDark ? "מצב כהה פעיל - לחצי למעבר לבהיר" : "מצב בהיר פעיל - לחצי למעבר לכהה"
    );
    btn.title = isDark ? "מצב כהה" : "מצב בהיר";
    const label = btn.querySelector(".theme-toggle__label");
    if (label) label.textContent = isDark ? "כהה" : "בהיר";
  }

  if (persist) {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (_) { /* private mode */ }
  }
}

function resolveInitialTheme() {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch (_) { /* */ }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function initThemeToggle() {
  applyTheme(resolveInitialTheme(), false);

  const btn = document.getElementById("themeToggle");
  if (btn) {
    btn.addEventListener("click", () => {
      const cur = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
      applyTheme(cur === "dark" ? "light" : "dark", true);
    });
  }

  window.matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", (event) => {
      try {
        if (localStorage.getItem(THEME_STORAGE_KEY)) return;
      } catch (_) { return; }
      applyTheme(event.matches ? "dark" : "light", false);
    });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initThemeToggle);
} else {
  initThemeToggle();
}
