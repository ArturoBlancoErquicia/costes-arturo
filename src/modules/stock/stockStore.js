// src/modules/stock/stockStore.js

const KEY = "ab_stock_v1";

export const UNITS = ["kg", "g", "l", "ud"];

// Lo piden tus módulos (produceFromCostes) y es buena práctica
export const MOV_TYPES = Object.freeze({
  IN: "IN",
  OUT: "OUT",
  ADJUST: "ADJUST",
});

let _uidCounter = 0;
export function uid(prefix = "id") {
  _uidCounter += 1;
  return `${prefix}_${Date.now()}_${_uidCounter}_${Math.random().toString(16).slice(2)}`;
}

export function emptyDB() {
  return { items: [], movements: [] };
}

function safeParse(raw, fallback) {
  try {
    const v = JSON.parse(raw);
    return v ?? fallback;
  } catch {
    return fallback;
  }
}

function normalizeDB(db) {
  const base = db && typeof db === "object" ? db : emptyDB();
  return {
    items: Array.isArray(base.items) ? base.items : [],
    movements: Array.isArray(base.movements) ? base.movements : [],
  };
}

// ---------- Persistencia (UI) ----------
export function loadDB() {
  try {
    const raw = localStorage.getItem(KEY);
    return normalizeDB(safeParse(raw, emptyDB()));
  } catch {
    return emptyDB();
  }
}

export function saveDB(db) {
  try {
    localStorage.setItem(KEY, exportDB(db));
  } catch {
    // ignore
  }
  return normalizeDB(db);
}

export function getDB() {
  return loadDB();
}

export function setDB(db) {
  return saveDB(db);
}

// ---------- CRUD puro (tests y lógica) ----------
export function upsertItem(db, item) {
  const d = normalizeDB(db);
  const it = { ...item };
  if (!it.id) it.id = uid("it");

  const idx = d.items.findIndex((x) => x.id === it.id);
  const items =
    idx === -1
      ? [...d.items, it]
      : d.items.map((x, i) => (i === idx ? { ...x, ...it } : x));

  return { ...d, items };
}

// UI antigua: addItem (devuelve {db, item})
export function addItem(db, { nombre, unidad = "ud", stockInicial = 0, stockMin = 0 }) {
  const item = { id: uid("it"), nombre, unidad, stockMin };
  let next = upsertItem(db, item);

  const si = Number(stockInicial) || 0;
  if (si !== 0) {
    next = addMovement(next, {
      id: uid("mv"),
      itemId: item.id,
      type: MOV_TYPES.ADJUST,
      qty: si,
      at: Date.now(),
      note: "Stock inicial",
    });
  }

  return { db: next, item };
}

export function deleteItem(db, itemId) {
  const d = normalizeDB(db);
  const items = d.items.filter((x) => x.id !== itemId);
  const movements = d.movements.filter((m) => m.itemId !== itemId);
  return { ...d, items, movements };
}

export function listItems(db) {
  return normalizeDB(db).items;
}

export function listMovements(db) {
  return normalizeDB(db).movements;
}

// addMovement tiene que ser PURA (tests)
export function addMovement(db, mv) {
  const d = normalizeDB(db);
  const m = { ...mv };
  if (!m.id) m.id = uid("mv");
  if (!m.at) m.at = Date.now();
  return { ...d, movements: [...d.movements, m] };
}

// IMPORTANTE: tests esperan Map con .get()
export function computeStockMap(db) {
  const d = normalizeDB(db);

  const map = new Map();
  for (const it of d.items) map.set(it.id, 0);

  // orden por tiempo
  const moves = [...d.movements].sort((a, b) => (a.at || 0) - (b.at || 0));

  for (const mv of moves) {
    const cur = map.get(mv.itemId) ?? 0;
    const qty = Number(mv.qty) || 0;

    if (mv.type === MOV_TYPES.IN) map.set(mv.itemId, cur + qty);
    else if (mv.type === MOV_TYPES.OUT) map.set(mv.itemId, cur - qty);
    else if (mv.type === MOV_TYPES.ADJUST) map.set(mv.itemId, qty);
  }

  return map;
}

// Tests piden exportDB/importDB
export function exportDB(db) {
  return JSON.stringify(normalizeDB(db));
}

export function importDB(raw) {
  return normalizeDB(safeParse(raw, emptyDB()));
}

// Compat UI: nombres anteriores (por si los usas en algún sitio)
export function exportStockJSON(db) {
  return JSON.stringify(normalizeDB(db), null, 2);
}

export function importStockJSON(raw) {
  return importDB(raw);
}
