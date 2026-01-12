// src/modules/costes/produceFromCostes.test.js
import { describe, it, expect } from "vitest";
import { emptyDB, upsertItem, addMovement, uid, computeStockMap } from "../stock/stockStore";
import { produceLoteFromCostes } from "./produceFromCostes";

describe("produceLoteFromCostes", () => {
  it("descuenta en kg si el artículo existe", () => {
    // DB con harina en kg y stock inicial 10kg (lo modelamos como ADJUST 10)
    let db = emptyDB();

    const harina = { id: uid("it"), nombre: "Harina", unidad: "kg", stockMin: 0 };
    db = upsertItem(db, harina);
    db = addMovement(db, { id: uid("mv"), itemId: harina.id, type: "ADJUST", qty: 10, at: 1, note: "Inicial" });

    const res = produceLoteFromCostes({
      db,
      unidades: 50,
      lineas: [
        { nombre: "Harina", cantidad: 2000 }, // 2000 g => 2 kg
      ],
      at: 2,
    });

    const map = computeStockMap(res.db);
    expect(map.get(harina.id)).toBe(8); // 10 - 2
  });
});
