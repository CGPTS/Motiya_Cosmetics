"use strict";

/**
 * CalendarManager
 *  - Renders an interactive month view.
 *  - Computes available time slots per selected day based on
 *    single-slot occupancy from Firestore (exact time lock).
 *  - Caches per-month booking data to minimise Firestore reads.
 */
class CalendarManager {
  constructor() {
    const now = new Date();
    this.year = now.getFullYear();
    this.month = now.getMonth();
    this.today = (() => { const d = new Date(); d.setHours(0,0,0,0); return d; })();
    this.selectedDateKey = null;
    this.selectedTime = null;

    this._cache = new Map();
    this._CACHE_TTL_MS = 3 * 60 * 1000;

    this.onSelectionChange = null;

    this._initEvents();
  }

  _initEvents() {
    document.getElementById("prevMonth")?.addEventListener("click", () => this.changeMonth(-1));
    document.getElementById("nextMonth")?.addEventListener("click", () => this.changeMonth(1));
  }

  changeMonth(delta) {
    let m = this.month + delta;
    let y = this.year;
    if (m > 11) { m = 0; y += 1; }
    if (m < 0)  { m = 11; y -= 1; }
    this.month = m;
    this.year = y;
    this.load();
  }

  _cacheKey(year = this.year, month = this.month) {
    return `${year}-${String(month + 1).padStart(2, "0")}`;
  }

  _isCached(key) {
    if (!this._cache.has(key)) return false;
    const { fetchedAt } = this._cache.get(key);
    return Date.now() - fetchedAt < this._CACHE_TTL_MS;
  }

  async load() {
    const key = this._cacheKey();

    if (this._isCached(key)) {
      this._render(this._cache.get(key).bookings);
      return;
    }

    try {
      const bookings = await this._fetchMonth(this.year, this.month);
      this._cache.set(key, { bookings, fetchedAt: Date.now() });
      this._render(bookings);
    } catch (err) {
      console.error("CalendarManager.load failed", err);
      this._render({});
    }
  }

  invalidate() {
    this._cache.clear();
  }

  /**
   * Returns a map: { 'YYYY-MM-DD': [{startMin}] }
   */
  async _fetchMonth(year, month) {
    const startKey = this._dateKey(new Date(year, month, 1));
    const endKey   = this._dateKey(new Date(year, month + 1, 0));
    const result = {};

    if (typeof db === "undefined") return result;

    try {
      const snap = await db.collection("calendar_slots")
        .where("status", "in", ["pending", "approved"])
        .where("appointmentDate", ">=", startKey)
        .where("appointmentDate", "<=", endKey)
        .get();

      snap.forEach((doc) => {
        const d = doc.data();
        if (!d.appointmentDate || !d.appointmentTime) return;
        const startMin = this._parseTimeToMin(d.appointmentTime);
        if (startMin == null) return;
        if (!result[d.appointmentDate]) result[d.appointmentDate] = [];
        result[d.appointmentDate].push({ startMin });
      });
    } catch (err) {
      // Likely Firestore rules blocking reads. Render gracefully.
      console.warn("Calendar Firestore fetch blocked or failed", err);
    }

    return result;
  }

  _render(bookings) {
    const grid = document.getElementById("calendarGrid");
    const title = document.getElementById("monthTitle");
    if (!grid || !title) return;

    const monthName = new Date(this.year, this.month, 1)
      .toLocaleDateString("he-IL", { month: "long", year: "numeric" });
    title.textContent = monthName;

    grid.innerHTML = "";
    const fragment = document.createDocumentFragment();

    const firstWeekday = new Date(this.year, this.month, 1).getDay();
    const daysInMonth = new Date(this.year, this.month + 1, 0).getDate();

    for (let i = 0; i < firstWeekday; i += 1) {
      const cell = document.createElement("div");
      cell.className = "day-cell empty";
      fragment.appendChild(cell);
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(this.year, this.month, day);
      const dow = date.getDay();
      const dateKey = this._dateKey(date);
      const isPast = date < this.today;
      const isClosed = WORKING_HOURS[dow] === null;
      const dayBookings = bookings[dateKey] || [];
      const isFullyBooked = isClosed
        ? false
        : this._isDayFullyBooked(date, dayBookings);

      const cell = document.createElement("div");
      cell.className = "day-cell";
      cell.dataset.date = dateKey;

      const isSelected = this.selectedDateKey === dateKey;
      if (isSelected) cell.classList.add("selected");

      const isToday = date.getTime() === this.today.getTime();
      if (isToday) cell.classList.add("today");

      const disabled = isPast || isClosed || isFullyBooked;
      if (disabled) cell.classList.add("disabled");
      else if (dayBookings.length > 0) cell.classList.add("avail");
      else cell.classList.add("avail");

      cell.innerHTML = `
        <span class="day-num">${day}</span>
        <span class="day-status">${this._cellStatusText(isPast, isClosed, isFullyBooked)}</span>
      `;

      if (!disabled) {
        cell.addEventListener("click", () => this._onDayClick(dateKey, dayBookings));
      }

      fragment.appendChild(cell);
    }

    grid.appendChild(fragment);
  }

  _cellStatusText(isPast, isClosed, isFull) {
    if (isPast) return "עבר";
    if (isClosed) return "סגור";
    if (isFull) return "מלא";
    return "פנוי";
  }

  _isDayFullyBooked(date, dayBookings) {
    const slots = this._buildSlotsForDate(date, dayBookings);
    return slots.length > 0 && slots.every((s) => !s.available);
  }

  _onDayClick(dateKey, dayBookings) {
    this.selectedDateKey = dateKey;
    this.selectedTime = null;
    this._render(this._cache.get(this._cacheKey())?.bookings || {});

    const date = this._parseDateKey(dateKey);
    this._renderTimeSlots(date, dayBookings);

    this._notifyChange();
  }

  _renderTimeSlots(date, dayBookings) {
    const wrap = document.getElementById("timeSlotsWrap");
    const grid = document.getElementById("timeSlotsGrid");
    const title = document.getElementById("timeSlotsTitle");
    if (!wrap || !grid || !title) return;

    const formatted = date.toLocaleDateString("he-IL", {
      weekday: "long", day: "numeric", month: "long", year: "numeric"
    });
    title.textContent = `שעות זמינות בתאריך ${formatted}`;

    grid.innerHTML = "";
    const slots = this._buildSlotsForDate(date, dayBookings);

    if (slots.length === 0) {
      grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:var(--text-muted)">אין שעות פעילות ביום זה.</p>';
    } else {
      slots.forEach(({ time, available }) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "slot-btn";
        btn.textContent = time;
        btn.disabled = !available;
        if (this.selectedTime === time) btn.classList.add("selected");
        btn.addEventListener("click", () => this._selectTime(time));
        grid.appendChild(btn);
      });
    }

    wrap.hidden = false;
    this._updatePickedSummary();
  }

  _selectTime(time) {
    this.selectedTime = time;
    document.querySelectorAll("#timeSlotsGrid .slot-btn").forEach((b) => {
      b.classList.toggle("selected", b.textContent === time);
    });
    this._updatePickedSummary();
    this._notifyChange();
  }

  _updatePickedSummary() {
    const el = document.getElementById("pickedSummary");
    if (!el) return;
    if (!this.selectedDateKey || !this.selectedTime) {
      el.hidden = true;
      return;
    }
    const date = this._parseDateKey(this.selectedDateKey);
    const formatted = date.toLocaleDateString("he-IL", {
      weekday: "long", day: "numeric", month: "long", year: "numeric"
    });
    el.innerHTML = `<strong>נבחר:</strong> ${formatted} בשעה <strong>${this.selectedTime}</strong>`;
    el.hidden = false;
  }

  _notifyChange() {
    if (typeof this.onSelectionChange === "function") {
      this.onSelectionChange(this.getSelection());
    }
  }

  setServiceDuration(durationMin) {
    this.serviceDuration = Number(durationMin) || 60;
    if (this.selectedDateKey) {
      const dayBookings = (this._cache.get(this._cacheKey())?.bookings || {})[this.selectedDateKey] || [];
      const date = this._parseDateKey(this.selectedDateKey);
      this.selectedTime = null;
      this._renderTimeSlots(date, dayBookings);
    }
    this._render(this._cache.get(this._cacheKey())?.bookings || {});
  }

  getSelection() {
    if (!this.selectedDateKey || !this.selectedTime) return null;
    const date = this._parseDateKey(this.selectedDateKey);
    return {
      dateKey: this.selectedDateKey,
      time: this.selectedTime,
      formatted: date.toLocaleDateString("he-IL", {
        weekday: "long", day: "numeric", month: "long", year: "numeric"
      }),
      dow: date.getDay()
    };
  }

  _buildSlotsForDate(date, dayBookings) {
    const dow = date.getDay();
    const work = WORKING_HOURS[dow];
    if (!work) return [];

    const duration = Number(this.serviceDuration) || 60;
    const startMin = this._parseTimeToMin(work.start);
    const endMin = this._parseTimeToMin(work.end);
    const slots = [];

    const todayKey = this._dateKey(this.today);
    const dayKey = this._dateKey(date);
    const isToday = todayKey === dayKey;
    const nowMin = isToday
      ? new Date().getHours() * 60 + new Date().getMinutes()
      : -1;

    for (let t = startMin; t + duration <= endMin; t += SLOT_GRANULARITY_MIN) {
      // Single-slot lock policy: only the exact start time is blocked.
      const isTaken = dayBookings.some((b) => b.startMin === t);
      const available = !isTaken && t > nowMin;
      slots.push({ time: this._minToTimeStr(t), startMin: t, available });
    }

    return slots;
  }

  _dateKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  _parseDateKey(key) {
    const [y, m, d] = key.split("-").map(Number);
    return new Date(y, m - 1, d);
  }

  _parseTimeToMin(t) {
    if (!t || typeof t !== "string") return null;
    const [h, m] = t.split(":").map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return null;
    return h * 60 + m;
  }

  _minToTimeStr(min) {
    const h = String(Math.floor(min / 60)).padStart(2, "0");
    const m = String(min % 60).padStart(2, "0");
    return `${h}:${m}`;
  }
}
