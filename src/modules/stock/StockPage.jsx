// src/modules/stock/StockPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Plus, Minus, Download, Upload, Trash2 } from "lucide-react";
import {
  getStockState,
  upsertItem,
  addMovement,
  exportStockJSON,
  importStockJSON,
  emptyDB,
} from "./stockStore";
import { descargarJSON, leerFileJSON } from "../../shared/storage/storage";

const UNITS = ["kg", "g", "l", "ml", "ud"];

export default function StockPage() {
  const [state, setState] = useState(() => getStockState());
  const [nuevo, setNuevo] = useState({ nombre: "", unidad: "kg", qty: 0 });
  const [mov, setMov] = useState({ nombre: "", delta: 0, unidad: "kg", reason: "" });

  const itemsSorted = useMemo(() => {
    return [...(state.items || [])].sort((a, b) =>
      String(a.nombre).localeCompare(String(b.nombre), "es", { sensitivity: "base" })
    );
  }, [state.items]);

  const refresh = () => setState(getStockState());

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div className="space-y-6">
      <div className="ab-card">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <h2 className="text-xl font-black" style={{ color: "var(--text)" }}>
            Existencias (Stock)
          </h2>

          <div className="flex flex-wrap gap-2">
            <button
              className="ab-btn"
              onClick={() => {
                descargarJSON("stock.json", exportStockJSON());
              }}
            >
              <Download size={16} /> Exportar
            </button>

            <label className="ab-btn cursor-pointer">
              <Upload size={16} /> Importar
              <input
                type="file"
                accept="application/json"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const payload = await leerFileJSON(file);
                  importStockJSON(payload);
                  refresh();
                  e.target.value = "";
                }}
              />
            </label>

            <button
              className="ab-btn danger"
              onClick={() => {
                if (!confirm("¿Borrar TODO el stock?")) return;
                emptyDB();
                refresh();
              }}
            >
              <Trash2 size={16} /> Vaciar
            </button>
          </div>
        </div>
      </div>

      {/* Alta/edición simple */}
      <div className="ab-card">
        <h3 className="text-lg font-black mb-3" style={{ color: "var(--text)" }}>
          Añadir / Actualizar ingrediente
        </h3>

        <div className="flex flex-col md:flex-row gap-2">
          <input
            className="ab-input flex-1"
            placeholder="Nombre (ej: Harina fuerza)"
            value={nuevo.nombre}
            onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })}
          />

          <select
            className="ab-input"
            value={nuevo.unidad}
            onChange={(e) => setNuevo({ ...nuevo, unidad: e.target.value })}
            style={{ width: 120 }}
          >
            {UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>

          <input
            className="ab-input"
            type="number"
            value={nuevo.qty}
            onChange={(e) => setNuevo({ ...nuevo, qty: Number(e.target.value) || 0 })}
            style={{ width: 140 }}
            placeholder="Cantidad"
          />

          <button
            className="ab-btn primary"
            onClick={() => {
              upsertItem(nuevo);
              setNuevo({ nombre: "", unidad: "kg", qty: 0 });
              refresh();
            }}
          >
            Guardar
          </button>
        </div>
      </div>

      {/* Movimientos */}
      <div className="ab-card">
        <h3 className="text-lg font-black mb-3" style={{ color: "var(--text)" }}>
          Movimiento rápido (entrada / salida)
        </h3>

        <div className="flex flex-col md:flex-row gap-2">
          <input
            className="ab-input flex-1"
            placeholder="Nombre exacto (mejor autocompletar mirando la lista)"
            value={mov.nombre}
            onChange={(e) => setMov({ ...mov, nombre: e.target.value })}
          />

          <select
            className="ab-input"
            value={mov.unidad}
            onChange={(e) => setMov({ ...mov, unidad: e.target.value })}
            style={{ width: 120 }}
          >
            {UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>

          <input
            className="ab-input"
            type="number"
            value={mov.delta}
            onChange={(e) => setMov({ ...mov, delta: Number(e.target.value) || 0 })}
            style={{ width: 140 }}
            placeholder="± Cantidad"
          />

          <input
            className="ab-input"
            value={mov.reason}
            onChange={(e) => setMov({ ...mov, reason: e.target.value })}
            style={{ width: 220 }}
            placeholder="Motivo (opcional)"
          />

          <button
            className="ab-btn"
            onClick={() => {
              addMovement({ ...mov });
              setMov({ nombre: "", delta: 0, unidad: "kg", reason: "" });
              refresh();
            }}
          >
            <Plus size={16} /> Aplicar
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="ab-card">
        <h3 className="text-lg font-black mb-3" style={{ color: "var(--text)" }}>
          Stock actual
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ color: "var(--muted)" }}>
                <th className="text-left p-2">Ingrediente</th>
                <th className="text-left p-2">Unidad</th>
                <th className="text-right p-2">Cantidad</th>
              </tr>
            </thead>
            <tbody>
              {itemsSorted.map((it) => (
                <tr key={it.id} className="border-b" style={{ borderColor: "rgba(2,6,23,.06)" }}>
                  <td className="p-2 font-bold" style={{ color: "var(--text)" }}>
                    {it.nombre}
                  </td>
                  <td className="p-2" style={{ color: "var(--muted)" }}>
                    {it.unidad}
                  </td>
                  <td className="p-2 text-right ab-mono" style={{ fontWeight: 900 }}>
                    {Number(it.qty || 0).toFixed(3)}
                  </td>
                </tr>
              ))}
              {itemsSorted.length === 0 && (
                <tr>
                  <td className="p-3" colSpan={3} style={{ color: "var(--muted)" }}>
                    No hay stock todavía. Añade ingredientes arriba.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Movimientos recientes */}
        <div className="mt-5">
          <h4 className="font-black mb-2" style={{ color: "var(--text)" }}>
            Movimientos recientes
          </h4>
          <div className="grid gap-2">
            {(state.movements || []).slice(0, 10).map((m) => (
              <div
                key={m.id}
                className="flex justify-between items-center p-2 rounded"
                style={{ background: "#f8fafc", border: "1px solid var(--border)" }}
              >
                <div className="font-bold">
                  {m.nombre}{" "}
                  <span style={{ color: "var(--muted)" }}>
                    ({m.delta > 0 ? "+" : ""}
                    {m.delta} {m.unidad})
                  </span>
                </div>
                <div style={{ color: "var(--muted)", fontSize: 12 }}>
                  {m.reason ? m.reason : "—"} · {new Date(m.ts).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* actualizar state visible */}
      <div style={{ display: "none" }}>
        {JSON.stringify(state) && null}
      </div>
    </div>
  );
}
