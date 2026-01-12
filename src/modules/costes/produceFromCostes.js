// src/modules/costes/produceFromCostes.js

import { addMovement, computeStockMap, uid, MOV_TYPES } from "../stock/stockStore";

const norm = (s) => String(s ?? "").trim().toLowerCase();

/**
 * Convierte un escandallo (líneas de costes) en movimientos OUT de stock.
 * - Solo descuenta si existe un item de stock con nombre equivalente (case-insensitive).
 * - Si el item está en "kg", convierte gramos -> kg.
 *
 * @param {Object} params
 * @param {Object} params.db    Stock DB {items, movements}
 * @param {Array}  params.lineas [{ nombre, cantidad }]
 * @param {number} params.unidades
 * @param {number} params.at
 */
export function produceLoteFromCostes({ db, lineas, unidades = 0, at = Date.now() }) {
  const items = (db?.items || []).slice();
  const movimientosCreados = [];
  const noEncontrados = [];

  for (const l of lineas || []) {
    const nombreLinea = norm(l?.nombre);
    if (!nombreLinea) continue;

    // match exacto por nombre (si luego quieres, añadimos mapeo/sinónimos)
    const item = items.find((it) => norm(it.nombre) === nombreLinea);

    if (!item) {
      noEncontrados.push(l?.nombre);
      continue;
    }

    const qtyGr = Number(l?.cantidad) || 0;
    if (qtyGr <= 0) continue;

    let qty = qtyGr;
    if (norm(item.unidad) === "kg") qty = qtyGr / 1000;

    movimientosCreados.push({
      id: uid("mv"),
      itemId: item.id,
      type: MOV_TYPES.OUT,
      qty,
      at,
      note: `Producción desde Costes (${unidades} uds)`,
    });
  }

  let newDb = db;
  for (const mv of movimientosCreados) newDb = addMovement(newDb, mv);

  return {
    db: newDb,
    stockMap: computeStockMap(newDb),
    movimientosCreados,
    noEncontrados,
  };
}
