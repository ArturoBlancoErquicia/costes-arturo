import { describe, it, expect } from "vitest";
import { computeCosting } from "./costing";

describe("computeCosting", () => {
  it("no rompe con unidades 0 y NO cuenta masa madre como harina", () => {
    const r = computeCosting({
      lineas: [
        { nombre: "Harina", cantidad: 1000, precio: 1.0, esHarina: true },
        { nombre: "Agua", cantidad: 600, precio: 0.01, esHarina: false },
        { nombre: "Masa Madre (Prefermento)", cantidad: 200, precio: 0.5, esHarina: false }
      ],
      unidades: 0,
      tiempos: { amasado: 15, velocidadFormado: 300, fermentacion: 120, coccion: 45 },
      config: { costeHoraPersonal: 14.5, costeHoraHorno: 8, gastosFijosMensuales: 1200, horasTrabajoMensuales: 160 },
      margen: 25,
      iva: 4,
      pvpManual: 1.0
    });

    expect(r.unidadesSafe).toBe(1);
    expect(Number.isFinite(r.costeTotalLote)).toBe(true);
    expect(Number.isFinite(r.costeUnitario)).toBe(true);
    expect(r.totalHarina).toBe(1000);
  });

  it("evita división por cero en velocidadFormado", () => {
    const r = computeCosting({
      lineas: [{ nombre: "Harina", cantidad: 1000, precio: 1.0, esHarina: true }],
      unidades: 50,
      tiempos: { amasado: 10, velocidadFormado: 0, fermentacion: 0, coccion: 30 },
      config: { costeHoraPersonal: 10, costeHoraHorno: 10, gastosFijosMensuales: 0, horasTrabajoMensuales: 160 },
      margen: 20,
      iva: 4,
      pvpManual: 1.0
    });

    expect(Number.isFinite(r.costeFormado)).toBe(true);
  });
});
