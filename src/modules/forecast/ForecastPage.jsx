import React from "react";

export default function ForecastPage() {
  return (
    <div className="ab-card">
      <h2 className="text-xl font-black">Módulo Previsión</h2>
      <p className="mt-2" style={{ color: "var(--muted)", fontWeight: 700 }}>
        Siguiente paso: carga de histórico (CSV/Excel), ajustes manuales y variables (festivos/tiempo) más adelante.
      </p>

      <div className="mt-4 ab-card" style={{ background: "#f8fafc" }}>
        <div className="text-sm font-bold" style={{ color: "var(--muted)" }}>
          Estado
        </div>
        <div className="text-lg font-black" style={{ color: "var(--text)" }}>
          Preparado para implementar
        </div>
      </div>
    </div>
  );
}
