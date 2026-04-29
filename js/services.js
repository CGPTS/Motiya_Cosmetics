"use strict";

/**
 * Service catalog — single source of truth for treatment options.
 * `durationMin` is used by the calendar to compute slot availability.
 */
const SERVICES = Object.freeze([
  {
    id: "gel_basic",
    name: "לק ג'ל בסיס",
    description: "מניקור + לק ג'ל יסודי",
    price: 120,
    durationMin: 60,
    icon: "💅"
  },
  {
    id: "gel_strong",
    name: "לק ג'ל + חיזוק",
    description: "לק ג'ל עם שכבת חיזוק לעמידות מקסימלית",
    price: 150,
    durationMin: 75,
    icon: "✨"
  },
  {
    id: "nail_build",
    name: "בניית ציפורניים",
    description: "בנייה מלאה בג'ל / אקריל לפי בחירה",
    price: 220,
    durationMin: 120,
    icon: "💎"
  },
  {
    id: "refill",
    name: "מילוי",
    description: "מילוי לציפורניים בנויות",
    price: 170,
    durationMin: 90,
    icon: "🔄"
  },
  {
    id: "removal",
    name: "הסרה וטיפול",
    description: "הסרת לק ג'ל / בנייה ושיקום",
    price: 70,
    durationMin: 30,
    icon: "🧴"
  },
  {
    id: "pedicure_gel",
    name: "פדיקור ג'ל",
    description: "טיפול מלא לרגליים עם לק ג'ל",
    price: 180,
    durationMin: 75,
    icon: "🦶"
  }
]);

/**
 * Studio working hours.
 * Times are in 24h format. Sunday = 0 ... Saturday = 6.
 */
const WORKING_HOURS = Object.freeze({
  // 0=Sun, 1=Mon ... 5=Fri, 6=Sat
  0: { start: "09:00", end: "19:00" },
  1: { start: "09:00", end: "19:00" },
  2: { start: "09:00", end: "19:00" },
  3: { start: "09:00", end: "19:00" },
  4: { start: "09:00", end: "19:00" },
  5: { start: "09:00", end: "13:00" },
  6: null
});

const SLOT_GRANULARITY_MIN = 30;

function getServiceById(id) {
  return SERVICES.find((s) => s.id === id) || null;
}

function formatPrice(amount) {
  return `₪${Number(amount).toLocaleString("he-IL")}`;
}
