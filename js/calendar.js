// ============================================
// Calendar Manager - Moriya Nails
// ============================================

'use strict';

class CalendarManager {
  constructor() {
    const now = new Date();
    this.currentMonth = now.getMonth();
    this.currentYear  = now.getFullYear();
    this.selectedDate = null;
    this.selectedSlot = null;
    this._cache = new Map();
    this._CACHE_TTL_MS = 5 * 60 * 1000;
    this._init();
  }

  _init() {
    document.getElementById('prevMonth')
      ?.addEventListener('click', () => this.changeMonth(-1));
    document.getElementById('nextMonth')
      ?.addEventListener('click', () => this.changeMonth(1));
  }

  async loadBookedSlots() {
    const key = this._cacheKey();
    if (this._isCached(key)) {
      this._render(this._cache.get(key).slots);
      this._prefetchAdjacent();
      return;
    }

    this._setLoadingState(true);
    try {
      const slots = await this._fetchMonth(this.currentYear, this.currentMonth);
      this._cache.set(key, { slots, fetchedAt: Date.now() });
      this._render(slots);
      this._prefetchAdjacent();
    } catch (err) {
      console.error('CalendarManager.loadBookedSlots:', err);
      this._renderError();
      if (typeof Toast !== 'undefined') {
        Toast.error('לא הצלחנו לטעון את זמינות התורים - בדקי את החיבור ונסי שוב', 7000);
      }
    } finally {
      this._setLoadingState(false);
    }
  }

  async _fetchMonth(year, month) {
    const startKey = this._formatDateKey(new Date(year, month, 1));
    const endKey   = this._formatDateKey(new Date(year, month + 1, 0));

    const snapshot = await db.collection('booked_slots')
      .where('dateKey', '>=', startKey)
      .where('dateKey', '<=', endKey)
      .get();

    const slots = {};
    snapshot.forEach(doc => {
      const { dateKey, slot, startSlot, startMinutes, endMinutes, durationMinutes, orderNumber } = doc.data();
      if (!dateKey || !slot) return;
      if (!slots[dateKey]) slots[dateKey] = [];
      const start = Number.isInteger(startMinutes) ? startMinutes : slotToMinutes(startSlot || slot);
      const end = Number.isInteger(endMinutes) ? endMinutes : (start ?? 0) + 60;
      slots[dateKey].push({
        slot,
        startSlot: startSlot || slot,
        startMinutes: start,
        endMinutes: end,
        durationMinutes: durationMinutes || (end - start),
        orderNumber: orderNumber || '',
      });
    });
    return slots;
  }

  _renderError() {
    const grid = document.getElementById('calendarGrid');
    const monthTitle = document.getElementById('currentMonth');
    if (!grid) return;

    if (monthTitle) monthTitle.textContent = this._monthTitle();
    const headers = [...grid.querySelectorAll('.calendar-header-day')];
    grid.innerHTML = '';
    headers.forEach(h => grid.appendChild(h));

    const panel = document.createElement('div');
    panel.className = 'calendar-error';
    panel.innerHTML = `
      <div class="calendar-error-icon">!</div>
      <p><strong>לא הצלחנו לטעון את זמינות התורים</strong></p>
      <p>כדי למנוע בחירה של שעה תפוסה, נסי שוב בעוד רגע.</p>
    `;

    const retry = document.createElement('button');
    retry.type = 'button';
    retry.className = 'btn btn-next';
    retry.textContent = 'נסה שוב';
    retry.addEventListener('click', () => this.loadBookedSlots());
    panel.appendChild(retry);
    grid.appendChild(panel);
  }

  changeMonth(delta) {
    const { year, month } = this._adjacentMonth(delta);
    this.currentYear  = year;
    this.currentMonth = month;
    this.loadBookedSlots();
  }

  _render(bookedSlots) {
    const grid = document.getElementById('calendarGrid');
    const monthTitle = document.getElementById('currentMonth');
    if (!grid || !monthTitle) return;

    monthTitle.textContent = this._monthTitle();

    const headers = [...grid.querySelectorAll('.calendar-header-day')];
    grid.innerHTML = '';
    const fragment = document.createDocumentFragment();
    headers.forEach(h => fragment.appendChild(h));

    const firstDayOfWeek = new Date(this.currentYear, this.currentMonth, 1).getDay();
    const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < firstDayOfWeek; i++) {
      const empty = document.createElement('div');
      empty.className = 'calendar-day empty';
      fragment.appendChild(empty);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(this.currentYear, this.currentMonth, day);
      const dateKey = this._formatDateKey(date);
      const dow = date.getDay();
      const booked = bookedSlots[dateKey] ?? [];
      const isPast = date < today;
      const isSelected = this.selectedDate && dateKey === this._formatDateKey(this.selectedDate);
      fragment.appendChild(this._buildDayCell({ day, date, dow, isPast, booked, isSelected }));
    }

    grid.appendChild(fragment);
  }

  _buildDayCell({ day, date, dow, isPast, booked, isSelected }) {
    const isBookable = this._isBookableDow(dow);
    const freeCount = this._availableSlots(date, dow, booked).length;
    const cell = document.createElement('div');
    const classes = ['calendar-day'];
    if (isPast) classes.push('past');
    if (!isBookable) classes.push('closed');
    if (isBookable && !isPast && freeCount === 0) classes.push('fully-booked');
    if (isSelected) classes.push('selected');
    cell.className = classes.join(' ');

    cell.innerHTML = `
      <div class="greg-date">${day}</div>
      <div class="heb-date">${HebrewDateConverter.getHebrewDateShort(date)}</div>
      <div class="day-slots">${this._buildSlotsHTML(date, dow, booked)}</div>
    `;

    if (!isPast && isBookable && freeCount > 0) {
      cell.addEventListener('click', () => this._onDayClick(date, dow, booked));
      cell.setAttribute('role', 'button');
      cell.tabIndex = 0;
      cell.setAttribute('aria-label', this._dayAriaLabel(date, dow, booked));
    }

    return cell;
  }

  _buildSlotsHTML(date, dow, booked) {
    if (!this._isBookableDow(dow)) {
      return '<span class="slot-indicator closed">סגור</span>';
    }

    const duration = this._selectedDuration();
    if (!duration) return '<span class="slot-indicator subtle">בחרי טיפול</span>';

    const total = this._slotKeys(dow, duration).length;
    const free = this._availableSlots(date, dow, booked).length;
    if (free === 0) return '<span class="slot-indicator booked">מלא</span>';

    return `
      <span class="slot-indicator available">${free}/${total} שעות</span>
      <span class="slot-indicator subtle">${workingHoursForDow(dow)?.label || ''}</span>
    `;
  }

  _onDayClick(date, dow, booked) {
    const modal = document.getElementById('slotModal');
    const modalDate = document.getElementById('slotModalDate');
    const slotOptions = document.getElementById('slotOptions');
    if (!modal || !modalDate || !slotOptions) return;

    const greg = this._formatDisplayDate(date);
    const heb = HebrewDateConverter.getHebrewDate(date);
    const dayName = HebrewDateConverter.getHebrewDayOfWeek(dow);

    modalDate.textContent = `יום ${dayName} | ${greg} | ${heb}`;
    slotOptions.innerHTML = '';

    const availableSlots = this._availableSlots(date, dow, booked);
    if (!this._isBookableDow(dow) || availableSlots.length === 0) {
      this._showCoordinationMessage(slotOptions, date, dow);
    } else {
      const helper = document.createElement('p');
      helper.className = 'slot-modal-helper';
      helper.textContent = `בחרי שעת התחלה. יוצגו רק שעות שיש אחריהן רצף פנוי של ${formatDuration(this._selectedDuration())}.`;
      slotOptions.appendChild(helper);

      const grid = document.createElement('div');
      grid.className = 'hour-slot-grid';
      availableSlots.forEach(slot => {
        const meta = buildSlotMeta(slotToMinutes(slot), this._selectedDuration());
        this._addSlotButton(
          grid,
          `${meta.text} (${meta.hours})`,
          () => this._selectSlot(date, slot)
        );
      });
      slotOptions.appendChild(grid);
    }

    modal.style.display = 'flex';
  }

  _addSlotButton(container, label, onClick, disabled = false) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = disabled ? 'slot-btn disabled' : 'slot-btn';
    btn.textContent = disabled ? `${label} - תפוס` : label;
    btn.disabled = disabled;
    if (!disabled) btn.addEventListener('click', onClick);
    container.appendChild(btn);
  }

  _showCoordinationMessage(container, date, dow) {
    const greg = this._formatDisplayDate(date);
    const status = this._isBookableDow(dow)
      ? 'כל השעות ביום הזה תפוסות'
      : 'הסטודיו סגור ביום הזה';

    const div = document.createElement('div');
    div.className = 'coordination-message';
    div.innerHTML = `
      <div class="coordination-content">
        <div class="date-header"></div>
        <h4></h4>
        <p class="status-message"></p>
        <p class="available-options"></p>
      </div>
    `;

    div.querySelector('.date-header').textContent = greg;
    div.querySelector('h4').textContent = this._isBookableDow(dow) ? 'התאריך מלא' : 'הסטודיו סגור ביום הזה';
    div.querySelector('.status-message').textContent = status;
    div.querySelector('.available-options').textContent = this._isBookableDow(dow)
      ? 'אפשר לבחור יום אחר, או ליצור קשר עם מוריה כדי לבדוק רשימת המתנה.'
      : 'אפשר לבחור יום פעילות אחר. בימים ראשון עד חמישי הפעילות 08:00-15:00, וביום שישי 08:00-12:00.';

    const waBtn = document.createElement('button');
    waBtn.type = 'button';
    waBtn.className = 'whatsapp-coordination-btn';
    waBtn.innerHTML = '<span class="whatsapp-icon">📱</span><strong>לתיאום מול מוריה</strong>';
    waBtn.addEventListener('click', () => openCoordinationWhatsApp(greg, status));
    div.querySelector('.coordination-content').appendChild(waBtn);
    container.appendChild(div);
  }

  _selectSlot(date, slot) {
    this.selectedDate = date;
    this.selectedSlot = slot;
    closeSlotModal();

    const startMinutes = slotToMinutes(slot);
    const duration = this._selectedDuration();
    const meta = buildSlotMeta(startMinutes, duration);
    const greg = this._formatDisplayDate(date);
    const heb = HebrewDateConverter.getHebrewDate(date);
    const dayName = HebrewDateConverter.getHebrewDayOfWeek(date.getDay());

    const display = document.getElementById('selectedDateDisplay');
    if (display) {
      display.innerHTML = `
        ✅ נבחר: <strong>יום ${dayName} | ${greg} | ${heb}</strong><br>
        📋 שעה ${meta.text} | ⏰ ${meta.hours} | ${formatDuration(duration)}
      `;
      display.style.display = 'block';
    }

    this._render(this._cache.get(this._cacheKey())?.slots ?? {});
    if (typeof saveDraft === 'function') saveDraft();
  }

  getSelectedInfo() {
    if (!this.selectedDate || !this.selectedSlot) return null;
    const date = this.selectedDate;
    const duration = this._selectedDuration();
    const startMinutes = slotToMinutes(this.selectedSlot);
    const meta = buildSlotMeta(startMinutes, duration);
    const greg = this._formatDisplayDate(date);
    const heb = HebrewDateConverter.getHebrewDate(date);
    const dayName = HebrewDateConverter.getHebrewDayOfWeek(date.getDay());

    return {
      date,
      dateKey: this._formatDateKey(date),
      slot: this.selectedSlot,
      slotText: meta.text,
      hoursText: meta.hours,
      startMinutes: meta.startMinutes,
      endMinutes: meta.endMinutes,
      durationMinutes: duration,
      endTimeText: minutesToTime(meta.endMinutes),
      gregDate: greg,
      hebrewDate: heb,
      dayName,
      displayText: `יום ${dayName} | ${greg} | ${heb} | ${meta.text} (${meta.hours})`,
    };
  }

  invalidateCache() {
    this._cache.clear();
  }

  clearSelection() {
    this.selectedDate = null;
    this.selectedSlot = null;
    const display = document.getElementById('selectedDateDisplay');
    if (display) {
      display.style.display = 'none';
      display.innerHTML = '';
    }
    if (this._cache.has(this._cacheKey())) {
      this._render(this._cache.get(this._cacheKey()).slots);
    }
  }

  _dayAriaLabel(date, dow, booked) {
    const dayName = HebrewDateConverter.getHebrewDayOfWeek(dow);
    const heb = HebrewDateConverter.getHebrewDate(date);
    const free = this._availableSlots(date, dow, booked).length;
    return `יום ${dayName}, ${heb} - ${free} שעות פנויות`;
  }

  _slotKeys(dow, duration = this._selectedDuration()) {
    const hours = workingHoursForDow(dow);
    if (!hours || !duration) return [];
    const slots = [];
    for (let minutes = hours.start; minutes + duration <= hours.end; minutes += SLOT_STEP_MINUTES) {
      slots.push(minutesToSlot(minutes));
    }
    return slots;
  }

  _availableSlots(date, dow, booked = []) {
    const duration = this._selectedDuration();
    return this._slotKeys(dow, duration).filter(slot => {
      const start = slotToMinutes(slot);
      return !this._rangeOverlaps(start, start + duration, booked);
    });
  }

  _rangeOverlaps(start, end, locks = []) {
    return locks.some(lock => {
      const lockStart = Number.isInteger(lock.startMinutes) ? lock.startMinutes : slotToMinutes(lock.startSlot || lock.slot);
      const lockEnd = Number.isInteger(lock.endMinutes) ? lock.endMinutes : (lockStart ?? 0) + 60;
      return lockStart < end && lockEnd > start;
    });
  }

  _selectedDuration() {
    return serviceTotals(getSelectedServiceIds()).duration;
  }

  _isBookableDow(dow) {
    return isBookableDow(dow);
  }

  _cacheKey(year = this.currentYear, month = this.currentMonth) {
    return `${year}-${String(month + 1).padStart(2, '0')}`;
  }

  _isCached(key) {
    if (!this._cache.has(key)) return false;
    const { fetchedAt } = this._cache.get(key);
    return Date.now() - fetchedAt < this._CACHE_TTL_MS;
  }

  _prefetchAdjacent() {
    [this._adjacentMonth(-1), this._adjacentMonth(1)].forEach(({ year, month }) => {
      const key = this._cacheKey(year, month);
      if (this._isCached(key)) return;
      this._fetchMonth(year, month)
        .then(slots => this._cache.set(key, { slots, fetchedAt: Date.now() }))
        .catch(() => {});
    });
  }

  _adjacentMonth(delta) {
    let month = this.currentMonth + delta;
    let year = this.currentYear;
    if (month > 11) { month = 0; year++; }
    if (month < 0) { month = 11; year--; }
    return { year, month };
  }

  _monthTitle() {
    const pivot = new Date(this.currentYear, this.currentMonth, 15);
    const hebrewMon = HebrewDateConverter.getHebrewDate(pivot);
    const gregMon = HebrewDateConverter.getHebrewMonthName(this.currentMonth);
    return `${gregMon} ${this.currentYear} | ${hebrewMon}`;
  }

  _formatDisplayDate(date) {
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  }

  _formatDateKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  _setLoadingState(loading) {
    const grid = document.getElementById('calendarGrid');
    if (!grid) return;
    grid.style.opacity = loading ? '0.45' : '1';
    grid.style.pointerEvents = loading ? 'none' : '';
  }
}
