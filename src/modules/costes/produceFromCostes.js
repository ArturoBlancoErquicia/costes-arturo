// src/modules/costes/produceFromCostes.js
import { consumeByName } from "../stock/stockStore";

// lineas: [{ nombre, cantidad (gramos), ... }]
export function produceLoteFromCostes({ nombreReceta, unidades, lineas }) {
  const safeLineas = Array.isArray(lineas) ? lineas : [];

  // Convertimos gramos -> kg (asumimos stock en kg)
  const consumos = safeLineas
    .filter((l) => l && l.nombre && (Number(l.cantidad) || 0) > 0)
    .map((l) => ({
      nombre: String(l.nombre).trim(),
      unidad: "kg",
      qty: (Number(l.cantidad) || 0) / 1000,
    }));

  const reason = `Producción: ${nombreReceta || "Receta"} (${Number(unidades) || 0} uds)`;

  const res = consumeByName(consumos, { reason });

  // ✅ Garantía de forma
  return {
    consumed: Array.isArray(res?.consumed) ? res.consumed : [],
    skipped: Array.isArray(res?.skipped) ? res.skipped : [],
  };
}
