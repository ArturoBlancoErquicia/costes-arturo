// src/modules/stock/stockStore.js

const KEY = "ab_stock_v1";

export function uid() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function defaultState() {
  return {
    items: [], // { id, nombre, unidad: "kg", qty, updatedAt }
    movements: [], // { id, ts, nombre, delta, unidad, reason }
  };
}

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return {
      items: Array.isArray(parsed.items) ? parsed.items : [],
      movements: Array.isArray(parsed.movements) ? parsed.movements : [],
    };
  } catch {
    return defaultState();
  }
}

function write(state) {
  localStorage.setItem(KEY, JSON.stringify(state));
  return state;
}

export function getStockState() {
  return read();
}

export function setStockState(state) {
  return write(state);
}

export function emptyDB() {
  write(defaultState());
  return true;
}

export function exportStockJSON() {
  return read();
}

export function importStockJSON(payload) {
  const state = {
    items: Array.isArray(payload?.items) ? payload.items : [],
    movements: Array.isArray(payload?.movements) ? payload.movements : [],
  };
  write(state);
  return state;
}

export function stockMap() {
  const s = read();
  const map = new Map();
  for (const it of s.items) {
    if (!it?.nombre) continue;
    map.set(String(it.nombre).trim().toLowerCase(), it);
  }
  return map;
}

export function upsertItem({ nombre, unidad = "kg", qty = 0 }) {
  const s = read();
  const key = String(nombre || "").trim();
  if (!key) throw new Error("Nombre obligatorio");

  const k = key.toLowerCase();
  const idx = s.items.findIndex((x) => String(x.nombre).trim().toLowerCase() === k);

  const now = Date.now();
  if (idx >= 0) {
    const updated = {
      ...s.items[idx],
      nombre: key,
      unidad,
      qty: Number(qty) || 0,
      updatedAt: now,
    };
    s.items[idx] = updated;
    write(s);
    return updated;
  }

  const created = { id: uid(), nombre: key, unidad, qty: Number(qty) || 0, updatedAt: now };
  s.items.push(created);
  write(s);
  return created;
}

export function addMovement({ nombre, delta, unidad = "kg", reason = "" }) {
  const s = read();
  const key = String(nombre || "").trim();
  if (!key) throw new Error("Nombre obligatorio");

  const k = key.toLowerCase();
  const idx = s.items.findIndex((x) => String(x.nombre).trim().toLowerCase() === k);
  if (idx < 0) {
    // si no existe, lo creamos a 0 y aplicamos delta
    s.items.push({ id: uid(), nombre: key, unidad, qty: 0, updatedAt: Date.now() });
  }

  const idx2 = s.items.findIndex((x) => String(x.nombre).trim().toLowerCase() === k);
  const cur = Number(s.items[idx2].qty) || 0;
  const d = Number(delta) || 0;
  const next = cur + d;

  s.items[idx2] = {
    ...s.items[idx2],
    unidad,
    qty: next,
    updatedAt: Date.now(),
  };

  s.movements.unshift({
    id: uid(),
    ts: Date.now(),
    nombre: key,
    delta: d,
    unidad,
    reason,
  });

  write(s);
  return s.items[idx2];
}

// Consume ingredientes por nombre (devuelve consumidos/omitidos)
export function consumeByName(list, { reason = "consumo" } = {}) {
  const s = read();
  const map = new Map();
  s.items.forEach((it, i) => map.set(String(it.nombre).trim().toLowerCase(), i));

  const consumed = [];
  const skipped = [];

  for (const row of list || []) {
    const nombre = String(row?.nombre || "").trim();
    const unidad = row?.unidad || "kg";
    const qty = Number(row?.qty) || 0;

    if (!nombre || qty <= 0) continue;

    const idx = map.get(nombre.toLowerCase());
    if (idx == null) {
      skipped.push({ nombre, motivo: "No existe en stock" });
      continue;
    }

    const cur = Number(s.items[idx].qty) || 0;
    if (cur < qty) {
      skipped.push({ nombre, motivo: `Stock insuficiente (${cur} < ${qty})` });
      continue;
    }

    s.items[idx] = { ...s.items[idx], qty: cur - qty, updatedAt: Date.now() };
    s.movements.unshift({
      id: uid(),
      ts: Date.now(),
      nombre,
      delta: -qty,
      unidad,
      reason,
    });
    consumed.push({ nombre, qty, unidad });
  }

  write(s);
  return { consumed, skipped };
}
