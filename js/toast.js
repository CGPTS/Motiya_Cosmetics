"use strict";

/**
 * Lightweight Toast notification system — replaces alert/confirm.
 */
const Toast = (() => {
  let _container = null;

  function _ensureContainer() {
    if (_container) return _container;
    _container = document.createElement("div");
    _container.id = "toast-container";
    _container.setAttribute("role", "region");
    _container.setAttribute("aria-live", "polite");
    Object.assign(_container.style, {
      position: "fixed",
      top: "92px",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: "9999",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "10px",
      width: "min(440px, 92vw)",
      pointerEvents: "none",
      direction: "rtl"
    });
    document.body.appendChild(_container);
    _injectKeyframes();
    return _container;
  }

  function _injectKeyframes() {
    if (document.getElementById("toast-styles")) return;
    const style = document.createElement("style");
    style.id = "toast-styles";
    style.textContent = `
      @keyframes toastIn  { from { opacity: 0; transform: translateY(-12px) } to { opacity: 1; transform: none } }
      @keyframes toastOut { from { opacity: 1; transform: none } to { opacity: 0; transform: translateY(-8px) } }
    `;
    document.head.appendChild(style);
  }

  function show(message, type = "info", duration = 4000) {
    const container = _ensureContainer();
    const palette = {
      success: { bg: "rgba(22,163,115,0.12)",  border: "rgba(22,163,115,0.45)", text: "#16a373" },
      error:   { bg: "rgba(212,50,107,0.12)",  border: "rgba(212,50,107,0.5)",  text: "#d4326b" },
      warning: { bg: "rgba(212,163,115,0.14)", border: "rgba(212,163,115,0.5)", text: "#a87241" },
      info:    { bg: "rgba(245,53,141,0.10)",  border: "rgba(245,53,141,0.4)",  text: "#c4116b" }
    };
    const icons = { success: "✓", error: "✕", warning: "⚠", info: "ℹ" };
    const tone = palette[type] || palette.info;

    const toast = document.createElement("div");
    toast.setAttribute("role", "alert");
    Object.assign(toast.style, {
      pointerEvents: "auto",
      background: tone.bg,
      border: `1px solid ${tone.border}`,
      borderRadius: "14px",
      padding: "14px 18px",
      display: "flex",
      gap: "12px",
      alignItems: "flex-start",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      width: "100%",
      boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
      animation: "toastIn 0.3s cubic-bezier(0.4,0,0.2,1)"
    });

    toast.innerHTML = `
      <span style="font-size:18px;color:${tone.text};font-weight:700;flex-shrink:0">${icons[type]}</span>
      <span style="flex:1;font-family:inherit;font-size:14px;line-height:1.6;color:${tone.text};font-weight:600">${message}</span>
      <button style="background:none;border:none;cursor:pointer;color:${tone.text};opacity:.7;font-size:16px;padding:0;flex-shrink:0">✕</button>
    `;

    toast.querySelector("button").addEventListener("click", () => toast.remove());

    container.appendChild(toast);

    if (duration > 0) {
      setTimeout(() => {
        toast.style.animation = "toastOut 0.25s ease forwards";
        setTimeout(() => toast.remove(), 260);
      }, duration);
    }
  }

  return Object.freeze({
    success: (msg, ms) => show(msg, "success", ms),
    error:   (msg, ms) => show(msg, "error", ms ?? 6000),
    warning: (msg, ms) => show(msg, "warning", ms),
    info:    (msg, ms) => show(msg, "info", ms)
  });
})();

const Loading = (() => {
  const overlay = () => document.getElementById("loadingOverlay");
  const text = () => document.getElementById("loadingText");

  return Object.freeze({
    show(message = "מעבדת...") {
      const o = overlay();
      const t = text();
      if (t) t.textContent = message;
      if (o) o.hidden = false;
    },
    hide() {
      const o = overlay();
      if (o) o.hidden = true;
    }
  });
})();
