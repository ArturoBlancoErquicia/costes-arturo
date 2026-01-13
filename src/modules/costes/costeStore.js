// src/modules/stock/stockStore.js

// Unidades y tipos de movimiento
export const UNITS = ["kg", "g", "l", "u"];
export const MOV_TYPES = { IN: "IN", OUT: "OUT", ADJUST: "ADJUST" };

// Helpers
export function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

export function emptyDB() {
  return { items: [], movements: [] };
}

function norm(s) {
  return String(s ?? "").trim().toLowerCase();
}

// CRUD items
export function upsertItem(db, item) {
  const items = Array.isArray(db?.items) ? db.items : [];
  const next = [...items];
  const idx = next.findIndex((x) => x.id === item.id);

  if (idx >= 0) next[idx] = { ...next[idx], ...item };
  else next.push({ ...item });

  return { ...db, items: next };
}

export function addItem(db, item) {
  const it = { ...item, id: item.id || uid("it") };
  return upsertItem(db, it);
}

export function deleteItem(db, itemId) {
  const items = (db.items || []).filter((it) => it.id !== itemId);
  const movements = (db.movements || []).filter((mv) => mv.itemId !== itemId);
  return { ...db, items, movements };
}

export function listItems(db) {
  return db?.items || [];
}

export function listMovements(db) {
  return db?.movements || [];
}

// Movimientos
export function addMovement(db, mv) {
  const movements = Array.isArray(db?.movements) ? db.movements : [];
  const next = [...movements, { ...mv, id: mv.id || uid("mv") }];
  // Orden por fecha asc (estable para cálculos y UI)
  next.sort((a, b) => (Number(a.at) || 0) - (Number(b.at) || 0));
  return { ...db, movements: next };
}

// Stock map: devuelve Map(itemId -> stock)
export function computeStockMap(db) {
  const map = new Map();
  for (const it of db.items || []) map.set(it.id, 0);

  for (const mv of db.movements || []) {
    const cur = map.get(mv.itemId) ?? 0;
    const qty = Number(mv.qty) || 0;

    if (mv.type === MOV_TYPES.IN) map.set(mv.itemId, cur + qty);
    else if (mv.type === MOV_TYPES.OUT) map.set(mv.itemId, cur - qty);
    else if (mv.type === MOV_TYPES.ADJUST) map.set(mv.itemId, qty);
  }

  return map;
}

// Export/Import (objeto)
export function exportDB(db) {
  return JSON.stringify({
    items: db.items || [],
    movements: db.movements || [],
  });
}

export function importDB(json) {
  try {
    const obj = typeof json === "string" ? JSON.parse(json) : json;
    return {
      items: Array.isArray(obj?.items) ? obj.items : [],
      movements: Array.isArray(obj?.movements) ? obj.movements : [],
    };
  } catch {
    return emptyDB();
  }
}

// Export/Import (JSON para UI)
export function exportStockJSON(db) {
  return exportDB(db);
}

export function importStockJSON(json) {
  return importDB(json);
}
