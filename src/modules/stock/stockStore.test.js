// src/modules/stock/stockStore.test.js
import { describe, it, expect, beforeEach } from "vitest";
import {
  emptyDB,
  upsertItem,
  addMovement,
  computeStockMap,
  uid,
  exportDB,
  importDB,
} from "./stockStore";

describe("stockStore", () => {
  let db;

  beforeEach(() => {
    db = emptyDB();
  });

  it("calcula stock con IN/OUT/ADJUST", () => {
    const it1 = { id: uid("it"), nombre: "Harina", unidad: "kg", stockMin: 5 };
    db = upsertItem(db, it1);

    // IN 10 -> 10
    db = addMovement(db, { id: uid("mv"), itemId: it1.id, type: "IN", qty: 10, at: 1, note: "" });
    // OUT 3 -> 7
    db = addMovement(db, { id: uid("mv"), itemId: it1.id, type: "OUT", qty: 3, at: 2, note: "" });
    // ADJUST 20 -> 20 (fija stock exacto)
    db = addMovement(db, { id: uid("mv"), itemId: it1.id, type: "ADJUST", qty: 20, at: 3, note: "" });
    // OUT 2 -> 18
    db = addMovement(db, { id: uid("mv"), itemId: it1.id, type: "OUT", qty: 2, at: 4, note: "" });

    const map = computeStockMap(db);
    expect(map.get(it1.id)).toBe(18);
  });

  it("export/import mantiene datos", () => {
    const it1 = { id: uid("it"), nombre: "Agua", unidad: "l", stockMin: 0 };
    db = upsertItem(db, it1);
    db = addMovement(db, { id: uid("mv"), itemId: it1.id, type: "IN", qty: 100, at: Date.now(), note: "" });

    const dump = exportDB(db);
    const restored = importDB(dump);

    expect(restored.items.length).toBe(1);
    expect(restored.movements.length).toBe(1);
  });
});
