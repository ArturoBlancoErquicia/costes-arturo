// src/domain/recipeStore.js

const KEY = "ab_recipes_v1";

const safeParse = (raw, fallback) => {
  try {
    const v = JSON.parse(raw);
    return v ?? fallback;
  } catch {
    return fallback;
  }
};

const safeSave = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // sin romper la app si storage falla
  }
};

const safeLoad = (key, fallback) => {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  return safeParse(raw, fallback);
};

const makeId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
};

const n0 = (v) => {
  if (v === null || v === undefined) return 0;
  const s = String(v).trim().replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
};

const normalizeLinea = (l) => ({
  id: l?.id ?? makeId(),
  nombre: String(l?.nombre ?? "").trim(),
  precio: n0(l?.precio),
  esHarina: Boolean(l?.esHarina),
  origen: l?.origen ?? "usuario",
  cantidad: n0(l?.cantidad), // gramos
});

const normalizeRecipe = (r) => ({
  id: r?.id ?? makeId(),
  nombre: String(r?.nombre ?? "Nueva Receta").trim() || "Nueva Receta",
  unidades: Math.max(1, Math.floor(n0(r?.unidades) || 1)),
  tiempos: {
    amasado: n0(r?.tiempos?.amasado),
    velocidadFormado: Math.max(1, n0(r?.tiempos?.velocidadFormado) || 1),
    fermentacion: n0(r?.tiempos?.fermentacion),
    coccion: n0(r?.tiempos?.coccion),
  },
  margen: n0(r?.margen),
  iva: n0(r?.iva),
  lineas: Array.isArray(r?.lineas) ? r.lineas.map(normalizeLinea).filter((x) => x.nombre) : [],
  updatedAt: r?.updatedAt ?? Date.now(),
});

export function listRecipes() {
  const db = safeLoad(KEY, { version: 1, items: [] });
  const items = Array.isArray(db.items) ? db.items : [];
  return items.map(normalizeRecipe).sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
}

export function saveRecipe(recipe) {
  const db = safeLoad(KEY, { version: 1, items: [] });
  const items = Array.isArray(db.items) ? db.items : [];

  const r = normalizeRecipe({ ...recipe, updatedAt: Date.now() });

  const idx = items.findIndex((x) => x.id === r.id);
  const next = idx >= 0 ? items.map((x, i) => (i === idx ? r : x)) : [r, ...items];

  safeSave(KEY, { version: 1, items: next });
  return r;
}

export function deleteRecipe(id) {
  const db = safeLoad(KEY, { version: 1, items: [] });
  const items = Array.isArray(db.items) ? db.items : [];
  safeSave(KEY, { version: 1, items: items.filter((x) => x.id !== id) });
}

export function exportRecipesJSON() {
  const db = safeLoad(KEY, { version: 1, items: [] });
  return JSON.stringify(db, null, 2);
}

export function importRecipesJSON(jsonText, { merge = true } = {}) {
  const incoming = safeParse(jsonText, null);
  if (!incoming || !Array.isArray(incoming.items)) throw new Error("JSON inválido (no contiene items).");

  const normalizedIncoming = incoming.items.map(normalizeRecipe);

  if (!merge) {
    safeSave(KEY, { version: 1, items: normalizedIncoming });
    return listRecipes();
  }

  const current = listRecipes();
  const map = new Map(current.map((r) => [r.id, r]));
  for (const r of normalizedIncoming) map.set(r.id, r);

  safeSave(KEY, { version: 1, items: Array.from(map.values()) });
  return listRecipes();
}
