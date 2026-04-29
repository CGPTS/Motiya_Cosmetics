"use strict";

/* ============================================
   Gel Nails Booking — Application logic
   ============================================ */

const TOTAL_STEPS = 6;
const DEBUG_FLOW = true;

const AppState = {
  currentStep: 1,
  isSubmitting: false,
  firstName: "",
  lastName: "",
  phone: "",
  service: null,
  date: null,
  time: null,
  orderNumber: null
};

let calendar;

function debugLog(level, message, data) {
  if (!DEBUG_FLOW) return;
  const stamp = new Date().toISOString();
  const fn = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
  if (data !== undefined) fn(`[BOOKING][${stamp}] ${message}`, data);
  else fn(`[BOOKING][${stamp}] ${message}`);
}

document.addEventListener("DOMContentLoaded", () => {
  initMailer();
  renderServices();
  initCalendar();
  initStepNavigation();
  initSummaryConfirmation();
  initSuccessActions();
  initInputErrorClear();

  showStep(1);
});

function initMailer() {
  if (typeof WEB3FORMS_CONFIG === "undefined") {
    debugLog("warn", "WEB3FORMS_CONFIG is undefined");
    return;
  }
  if (!WEB3FORMS_CONFIG.accessKey || WEB3FORMS_CONFIG.accessKey.includes("PASTE_")) {
    debugLog("warn", "Web3Forms access key missing or placeholder");
    return;
  }
  debugLog("log", "Web3Forms ready", {
    ownerEmail: WEB3FORMS_CONFIG.ownerEmail
  });
}

/* ====== Step 1: Welcome — no logic ====== */

/* ====== Step 3: Service rendering & selection ====== */

function renderServices() {
  const list = document.getElementById("servicesList");
  if (!list) return;

  list.innerHTML = "";
  const fragment = document.createDocumentFragment();

  SERVICES.forEach((service) => {
    const card = document.createElement("article");
    card.className = "service-card";
    card.dataset.id = service.id;
    card.tabIndex = 0;
    card.role = "button";

    card.innerHTML = `
      <span class="icon">${service.icon}</span>
      <div class="name">${service.name}</div>
      <div class="desc">${service.description}</div>
      <div class="meta">
        <span class="duration">⏱ ${service.durationMin} דקות</span>
        <span class="price">${formatPrice(service.price)}</span>
      </div>
    `;

    card.addEventListener("click", () => selectService(service));
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectService(service);
      }
    });

    fragment.appendChild(card);
  });

  list.appendChild(fragment);
}

function selectService(service) {
  AppState.service = service;
  document.querySelectorAll(".service-card").forEach((card) => {
    card.classList.toggle("selected", card.dataset.id === service.id);
  });

  if (calendar) {
    calendar.setServiceDuration(service.durationMin);
  }
}

/* ====== Step 4: Calendar ====== */

function initCalendar() {
  calendar = new CalendarManager();
  calendar.serviceDuration = 60;
  calendar.onSelectionChange = (selection) => {
    if (selection) {
      AppState.date = selection.dateKey;
      AppState.time = selection.time;
    }
  };
  calendar.load();
}

/* ====== Steps navigation ====== */

function initStepNavigation() {
  document.addEventListener("click", (event) => {
    const next = event.target.closest("[data-next]");
    const prev = event.target.closest("[data-prev]");

    if (next) handleNext();
    else if (prev) handlePrev();
  });
}

function handleNext() {
  if (!validateStep(AppState.currentStep)) return;

  if (AppState.currentStep + 1 === 5) {
    renderSummary();
  }

  showStep(AppState.currentStep + 1);
}

function handlePrev() {
  showStep(AppState.currentStep - 1);
}

function showStep(step) {
  const target = Math.min(Math.max(step, 1), TOTAL_STEPS);
  AppState.currentStep = target;

  document.querySelectorAll(".step").forEach((el) => {
    el.classList.toggle("active", Number(el.dataset.step) === target);
  });

  updateProgress();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function updateProgress() {
  const fill = document.getElementById("progressFill");
  if (fill) fill.style.width = `${(AppState.currentStep / TOTAL_STEPS) * 100}%`;

  document.querySelectorAll(".dot").forEach((dot) => {
    const n = Number(dot.dataset.step);
    dot.classList.toggle("active", n === AppState.currentStep);
    dot.classList.toggle("completed", n < AppState.currentStep);
  });
}

/* ====== Validation ====== */

function validateStep(step) {
  clearAllErrors();

  switch (step) {
    case 1: return true;

    case 2: {
      const first = document.getElementById("firstName").value.trim();
      const last = document.getElementById("lastName").value.trim();
      const phoneRaw = document.getElementById("phone").value.trim();
      const phone = phoneRaw.replace(/[\s-]/g, "");

      let valid = true;
      if (!first) { setFieldError("firstName", "שדה חובה"); valid = false; }
      if (!last)  { setFieldError("lastName",  "שדה חובה"); valid = false; }
      if (!phone) {
        setFieldError("phone", "שדה חובה");
        valid = false;
      } else if (!/^0\d{8,9}$/.test(phone)) {
        setFieldError("phone", "פורמט לא תקין — לדוגמה: 0501234567");
        valid = false;
      }
      if (!valid) {
        Toast.warning("יש לתקן את השדות המסומנים");
        return false;
      }
      AppState.firstName = first;
      AppState.lastName = last;
      AppState.phone = phone;
      return true;
    }

    case 3: {
      if (!AppState.service) {
        Toast.warning("יש לבחור טיפול לפני המשך");
        return false;
      }
      return true;
    }

    case 4: {
      if (!AppState.date || !AppState.time) {
        Toast.warning("יש לבחור תאריך ושעה");
        return false;
      }
      return true;
    }

    case 5: return true;
    default: return true;
  }
}

function setFieldError(fieldId, message) {
  const el = document.getElementById(fieldId);
  if (!el) return;
  el.style.borderColor = "var(--red)";
  el.style.boxShadow = "0 0 0 3px var(--red-dim)";
  let hint = el.parentElement.querySelector(".field-error");
  if (!hint) {
    hint = document.createElement("span");
    hint.className = "field-error";
    el.parentElement.appendChild(hint);
  }
  hint.textContent = message;
  el.focus();
}

function clearFieldError(fieldId) {
  const el = document.getElementById(fieldId);
  if (!el) return;
  el.style.borderColor = "";
  el.style.boxShadow = "";
  const hint = el.parentElement.querySelector(".field-error");
  if (hint) hint.remove();
}

function clearAllErrors() {
  document.querySelectorAll(".field-error").forEach((e) => e.remove());
  document.querySelectorAll("input, select").forEach((el) => {
    el.style.borderColor = "";
    el.style.boxShadow = "";
  });
}

function initInputErrorClear() {
  document.addEventListener("input", (event) => {
    if (event.target.id) clearFieldError(event.target.id);
  });
}

/* ====== Summary ====== */

function renderSummary() {
  const card = document.getElementById("summaryCard");
  if (!card) return;

  const service = AppState.service || { name: "—", price: 0, durationMin: 0 };
  const dateText = AppState.date
    ? new Date(AppState.date).toLocaleDateString("he-IL", {
        weekday: "long", day: "numeric", month: "long", year: "numeric"
      })
    : "—";

  card.innerHTML = `
    <div class="summary-row"><span class="summary-label">שם מלא</span><span class="summary-value">${AppState.firstName} ${AppState.lastName}</span></div>
    <div class="summary-row"><span class="summary-label">טלפון</span><span class="summary-value">${AppState.phone}</span></div>
    <div class="summary-row"><span class="summary-label">טיפול</span><span class="summary-value">${service.name}</span></div>
    <div class="summary-row"><span class="summary-label">משך זמן</span><span class="summary-value">${service.durationMin} דקות</span></div>
    <div class="summary-row"><span class="summary-label">תאריך</span><span class="summary-value">${dateText}</span></div>
    <div class="summary-row"><span class="summary-label">שעה</span><span class="summary-value">${AppState.time || "—"}</span></div>
    <div class="summary-row total"><span class="summary-label">סה"כ לתשלום</span><span class="summary-value">${formatPrice(service.price)}</span></div>
  `;
}

function initSummaryConfirmation() {
  const check = document.getElementById("confirmCheck");
  const submit = document.getElementById("submitBtn");
  if (!check || !submit) return;

  check.addEventListener("change", () => {
    submit.disabled = !check.checked;
  });

  submit.addEventListener("click", submitOrder);
}

/* ====== Submit ====== */

function generateOrderNumber() {
  const year = new Date().getFullYear();
  const rand = Date.now().toString(36).slice(-5).toUpperCase();
  return `GN-${year}-${rand}`;
}

function buildSlotId(dateKey, time) {
  return `${dateKey}_${time.replace(":", "-")}`;
}

async function submitOrder() {
  if (AppState.isSubmitting) {
    Toast.warning("ההזמנה כבר נשלחת...");
    return;
  }

  AppState.isSubmitting = true;
  Loading.show("שומרת תור...");
  debugLog("log", "Submit started");

  try {
    const orderNumber = generateOrderNumber();
    AppState.orderNumber = orderNumber;

    const payload = {
      orderNumber,
      firstName: AppState.firstName,
      lastName: AppState.lastName,
      fullName: `${AppState.firstName} ${AppState.lastName}`,
      phone: AppState.phone,
      serviceId: AppState.service.id,
      service: AppState.service.name,
      price: AppState.service.price,
      durationMin: AppState.service.durationMin,
      appointmentDate: AppState.date,
      appointmentTime: AppState.time,
      status: "pending",
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    debugLog("log", "Payload prepared", {
      orderNumber: payload.orderNumber,
      serviceId: payload.serviceId,
      appointmentDate: payload.appointmentDate,
      appointmentTime: payload.appointmentTime
    });

    const slotDocId = buildSlotId(AppState.date, AppState.time);
    const slotPayload = {
      appointmentDate: AppState.date,
      appointmentTime: AppState.time,
      durationMin: AppState.service.durationMin,
      serviceId: AppState.service.id,
      service: AppState.service.name,
      status: "pending",
      orderNumber,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    const bookingsRef = db.collection("bookings").doc();
    const slotRef = db.collection("calendar_slots").doc(slotDocId);
    debugLog("log", "Firestore transaction start", {
      bookingsDocId: bookingsRef.id,
      slotDocId
    });

    await db.runTransaction(async (tx) => {
      const slotDoc = await tx.get(slotRef);
      if (slotDoc.exists) {
        debugLog("warn", "Slot already taken", { slotDocId });
        throw new Error("slot_taken");
      }
      tx.set(bookingsRef, payload);
      tx.set(slotRef, slotPayload);
    });
    debugLog("log", "Firestore transaction success", {
      bookingsDocId: bookingsRef.id,
      slotDocId
    });

    const docId = bookingsRef.id;

    if (calendar) calendar.invalidate();

    try {
      const emailResult = await sendBookingEmail(payload);
      if (emailResult?.sent) {
        debugLog("log", "Mail send success", {
          orderNumber: payload.orderNumber,
          status: emailResult.status,
          text: emailResult.text
        });
      } else {
        debugLog("warn", "Mail skipped", emailResult);
      }
    } catch (mailError) {
      debugLog("error", "Mail send failed", {
        message: mailError?.message,
        text: mailError?.text,
        status: mailError?.status
      });
      const extra = mailError?.text || mailError?.message || "unknown_error";
      Toast.warning(`התור נשמר, אבל המייל לא נשלח (${extra}). בדקי הגדרות Web3Forms.`);
    }

    document.getElementById("orderIdLabel").textContent = orderNumber;
    downloadConfirmation(payload, docId);
    Loading.hide();
    Toast.success(`התור שוריין בהצלחה! מספר הזמנה: ${orderNumber}`);
    debugLog("log", "Submit flow completed", { orderNumber });
    showStep(6);
  } catch (error) {
    debugLog("error", "Submit failed", {
      message: error?.message,
      text: error?.text,
      status: error?.status
    });
    Loading.hide();
    if (String(error?.message || "").includes("slot_taken")) {
      Toast.warning("השעה נלקחה עכשיו. בחרי שעה אחרת.");
      if (calendar) {
        calendar.invalidate();
        await calendar.load();
      }
      showStep(4);
    } else {
      Toast.error("שגיאה בשליחת ההזמנה. נסי שוב בעוד רגע.");
    }
  } finally {
    AppState.isSubmitting = false;
    debugLog("log", "Submit finished (finally)");
  }
}

async function sendBookingEmail(payload) {
  if (typeof WEB3FORMS_CONFIG === "undefined") {
    return { sent: false, reason: "web3forms_config_missing" };
  }
  if (!WEB3FORMS_CONFIG.accessKey || WEB3FORMS_CONFIG.accessKey.includes("PASTE_")) {
    Toast.info("תזכורת: יש להזין Web3Forms Access Key כדי להפעיל שליחת מייל.");
    debugLog("warn", "Mail skipped: web3forms access key placeholder");
    return { sent: false, reason: "access_key_placeholder" };
  }

  const dateText = new Date(payload.appointmentDate).toLocaleDateString("he-IL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  const subject = `${WEB3FORMS_CONFIG.subjectPrefix} - ${payload.orderNumber}`;
  const messageLines = [
    "הזמנת תור חדשה",
    "------------------------",
    `מספר הזמנה: ${payload.orderNumber}`,
    `שם לקוחה: ${payload.fullName}`,
    `טלפון: ${payload.phone}`,
    `טיפול: ${payload.service}`,
    `תאריך: ${dateText}`,
    `שעה: ${payload.appointmentTime}`,
    `משך: ${payload.durationMin} דקות`,
    `מחיר: ${formatPrice(payload.price)}`
  ];
  // IMPORTANT: use real newline char (\n), not the literal string \\n.
  const cleanMessage = messageLines.join("\n");

  const requestBody = {
    access_key: WEB3FORMS_CONFIG.accessKey,
    subject,
    from_name: WEB3FORMS_CONFIG.fromName,
    to_email: WEB3FORMS_CONFIG.ownerEmail,
    replyto: WEB3FORMS_CONFIG.ownerEmail,
    message: cleanMessage
  };

  const res = await fetch("https://api.web3forms.com/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify(requestBody)
  });
  const response = await res.json();
  debugLog("log", "Web3Forms raw response", response);

  if (!res.ok || !response.success) {
    const reason = response?.message || `http_${res.status}`;
    throw new Error(reason);
  }

  return {
    sent: true,
    status: res.status,
    text: response?.message || "ok"
  };
}

/* ====== Success: download confirmation ====== */

function downloadConfirmation(payload, docId) {
  const html = buildConfirmationHTML(payload, docId);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `אישור_תור_${payload.orderNumber}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function buildConfirmationHTML(payload, docId) {
  const dateText = new Date(payload.appointmentDate).toLocaleDateString("he-IL", {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
  });
  const issued = new Date().toLocaleString("he-IL");

  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
<meta charset="UTF-8" />
<title>אישור תור — ${payload.orderNumber}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; background: #fff5fb; color: #3a0f25; padding: 30px; }
  .doc { max-width: 720px; margin: 0 auto; background: #fff; border-radius: 22px; padding: 36px 40px; box-shadow: 0 18px 50px rgba(196,17,107,0.12); }
  .head { text-align: center; padding-bottom: 22px; border-bottom: 2px solid #ffd1ea; margin-bottom: 26px; }
  .head h1 { font-size: 28px; color: #c4116b; margin-bottom: 6px; }
  .head h2 { font-size: 17px; color: #7a3f60; font-weight: 500; }
  .meta { color: #a07690; font-size: 13px; margin-top: 8px; }
  .order-id { display: inline-block; margin-top: 14px; padding: 10px 22px; background: rgba(245,53,141,0.10); border: 1.5px solid rgba(245,53,141,0.45); border-radius: 14px; font-weight: 700; }
  .order-id strong { color: #c4116b; margin-right: 6px; }
  .grid { display: grid; gap: 12px; margin-top: 18px; }
  .row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px dashed #ffd1ea; }
  .row:last-child { border-bottom: none; }
  .label { color: #7a3f60; font-weight: 600; }
  .value { color: #3a0f25; font-weight: 700; }
  .total { font-size: 20px; color: #c4116b; }
  .policy { margin-top: 22px; padding: 16px 18px; background: #fff0f6; border: 1.5px solid #f1a4c4; border-radius: 14px; color: #8f114c; font-weight: 600; line-height: 1.7; }
  .footer { margin-top: 22px; text-align: center; color: #a07690; font-size: 13px; }
  @media print { body { background: #fff; padding: 0; } .doc { box-shadow: none; } }
</style>
</head>
<body>
  <div class="doc">
    <div class="head">
      <h1>אישור תור</h1>
      <h2>סטודיו לק ג'ל</h2>
      <p class="meta">נוצר בתאריך ${issued}</p>
      <div class="order-id"><strong>מספר הזמנה:</strong> ${payload.orderNumber}</div>
    </div>

    <div class="grid">
      <div class="row"><span class="label">שם מלא</span><span class="value">${payload.fullName}</span></div>
      <div class="row"><span class="label">טלפון</span><span class="value">${payload.phone}</span></div>
      <div class="row"><span class="label">טיפול</span><span class="value">${payload.service}</span></div>
      <div class="row"><span class="label">משך זמן</span><span class="value">${payload.durationMin} דקות</span></div>
      <div class="row"><span class="label">תאריך</span><span class="value">${dateText}</span></div>
      <div class="row"><span class="label">שעה</span><span class="value">${payload.appointmentTime}</span></div>
      <div class="row"><span class="label total">סה"כ לתשלום</span><span class="value total">₪${Number(payload.price).toLocaleString("he-IL")}</span></div>
    </div>

    <div class="policy">
      <strong>מדיניות ביטולים:</strong>
      <br />
      ביטול עד 24 שעות מראש — ללא תשלום. ביטול בפחות מ-24 שעות מראש — דמי ביטול 50% מערך התור.
    </div>

    <div class="footer">תודה רבה! נשמח לראותך במועד שנקבע ✨</div>
  </div>
</body>
</html>`;
}

/* ====== Success actions ====== */

function initSuccessActions() {
  const newBtn = document.getElementById("newBookingBtn");
  const downloadBtn = document.getElementById("downloadAgainBtn");

  if (newBtn) {
    newBtn.addEventListener("click", () => {
      resetForm();
      showStep(1);
    });
  }

  if (downloadBtn) {
    downloadBtn.addEventListener("click", () => {
      if (!AppState.orderNumber) return;
      const payload = {
        orderNumber: AppState.orderNumber,
        fullName: `${AppState.firstName} ${AppState.lastName}`,
        phone: AppState.phone,
        service: AppState.service?.name,
        price: AppState.service?.price,
        durationMin: AppState.service?.durationMin,
        appointmentDate: AppState.date,
        appointmentTime: AppState.time
      };
      downloadConfirmation(payload, AppState.orderNumber);
    });
  }
}

function resetForm() {
  AppState.firstName = "";
  AppState.lastName = "";
  AppState.phone = "";
  AppState.service = null;
  AppState.date = null;
  AppState.time = null;
  AppState.orderNumber = null;

  document.getElementById("firstName").value = "";
  document.getElementById("lastName").value = "";
  document.getElementById("phone").value = "";

  document.querySelectorAll(".service-card").forEach((c) => c.classList.remove("selected"));

  if (calendar) {
    calendar.selectedDateKey = null;
    calendar.selectedTime = null;
    calendar.invalidate();
    calendar.load();
  }

  const slotsWrap = document.getElementById("timeSlotsWrap");
  if (slotsWrap) slotsWrap.hidden = true;

  const picked = document.getElementById("pickedSummary");
  if (picked) picked.hidden = true;

  const check = document.getElementById("confirmCheck");
  if (check) check.checked = false;

  const submitBtn = document.getElementById("submitBtn");
  if (submitBtn) submitBtn.disabled = true;
}
