import React, { useMemo, useState } from "react";
import { Plus, ArrowDownCircle, ArrowUpCircle, SlidersHorizontal, Download, Upload, Trash2 } from "lucide-react";
import {
  emptyDB,
  uid,
  upsertItem,
  deleteItem,
  addMovement,
  computeStockMap,
  exportStockJSON,
  importStockJSON,
  UNITS,
} from "./stockStore";


const n0 = (v) => {
  if (v === null || v === undefined) return 0;
  const s = String(v).trim().replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
};

const euro = (v, dec = 2) => n0(v).toLocaleString("es-ES", { minimumFractionDigits: dec, maximumFractionDigits: dec });

export default function StockPage() {
  const [refresh, setRefresh] = useState(0);

  const [q, setQ] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("todos"); // todos | ingrediente | producto
  const [soloBajoMinimo, setSoloBajoMinimo] = useState(false);

  const [nuevo, setNuevo] = useState({
    nombre: "",
    unidad: "kg",
    minimo: 0,
    precioUnitario: 0,
    tipo: "ingrediente",
    stockInicial: 0,
  });

  const [mov, setMov] = useState({ itemId: "", type: MOV_TYPES.IN, qty: "", note: "" });

  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState("");

  const db = useMemo(() => (refresh ? getDB() : getDB()), [refresh]);
  const items = useMemo(() => listItems(), [refresh]);
  const stockMap = useMemo(() => computeStockMap(db), [db]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return items.filter((it) => {
      if (tipoFiltro !== "todos" && it.tipo !== tipoFiltro) return false;
      if (qq && !it.nombre.toLowerCase().includes(qq)) return false;
      const stock = n0(stockMap.get(it.id) ?? 0);
      if (soloBajoMinimo && stock >= n0(it.minimo)) return false;
      return true;
    });
  }, [items, q, tipoFiltro, soloBajoMinimo, stockMap]);

  const onAddItem = () => {
    addItem(nuevo);
    setNuevo({ nombre: "", unidad: "kg", minimo: 0, precioUnitario: 0, tipo: "ingrediente", stockInicial: 0 });
    setRefresh((x) => x + 1);
  };

  const onDelete = (id) => {
    deleteItem(id);
    if (mov.itemId === id) setMov({ itemId: "", type: MOV_TYPES.IN, qty: "", note: "" });
    setRefresh((x) => x + 1);
  };

  const onAddMov = () => {
    if (!mov.itemId) return;
    addMovement({ ...mov, qty: mov.qty });
    setMov({ ...mov, qty: "", note: "" });
    setRefresh((x) => x + 1);
  };

  const onExport = () => {
    const json = exportStockJSON();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "arturo-stock.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const onImportApply = () => {
    try {
      setImportError("");
      importStockJSON(importText, { merge: true });
      setImportOpen(false);
      setImportText("");
      setRefresh((x) => x + 1);
    } catch (e) {
      setImportError(e?.message || "Error importando JSON");
    }
  };

  const movimientosRecientes = useMemo(() => listMovements().slice(0, 10), [refresh]);

  return (
    <div className="space-y-5">
      <div className="ab-card">
        <h2 className="text-xl font-black">Módulo Stock (simple)</h2>
        <p className="mt-1 text-sm" style={{ color: "var(--muted)", fontWeight: 700 }}>
          Catálogo · Movimientos · Mínimos · Export/Import.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={onExport} className="ab-tab">
            <Download size={18} /> Exportar JSON
          </button>
          <button onClick={() => setImportOpen(true)} className="ab-tab">
            <Upload size={18} /> Importar JSON
          </button>
        </div>
      </div>

      {importOpen && (
        <div className="ab-card">
          <h2 className="text-lg font-black">Importar stock (JSON)</h2>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            rows={8}
            className="ab-input ab-mono"
            placeholder="Pega aquí el JSON exportado…"
          />
          {importError && <div className="text-sm mt-2" style={{ color: "#b02a37", fontWeight: 800 }}>{importError}</div>}
          <div className="flex gap-2 mt-3">
            <button onClick={onImportApply} className="ab-btn primary">
              Importar (merge)
            </button>
            <button onClick={() => { setImportOpen(false); setImportText(""); setImportError(""); }} className="ab-btn">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Alta artículo */}
      <div className="ab-card">
        <h2 className="text-lg font-black flex items-center gap-2">
          <Plus size={18} /> Alta de artículo
        </h2>

        <div className="mt-4 grid md:grid-cols-6 gap-3">
          <input
            className="ab-input md:col-span-2"
            placeholder="Nombre"
            value={nuevo.nombre}
            onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })}
          />

          <select className="ab-input" value={nuevo.tipo} onChange={(e) => setNuevo({ ...nuevo, tipo: e.target.value })}>
            <option value="ingrediente">Ingrediente</option>
            <option value="producto">Producto</option>
          </select>

          <select className="ab-input" value={nuevo.unidad} onChange={(e) => setNuevo({ ...nuevo, unidad: e.target.value })}>
            {UNITS.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>

          <input
            className="ab-input"
            type="number"
            placeholder="Mínimo"
            value={nuevo.minimo}
            onChange={(e) => setNuevo({ ...nuevo, minimo: e.target.value })}
          />

          <input
            className="ab-input"
            type="number"
            placeholder="€/unidad"
            value={nuevo.precioUnitario}
            onChange={(e) => setNuevo({ ...nuevo, precioUnitario: e.target.value })}
          />

          <input
            className="ab-input"
            type="number"
            placeholder="Stock inicial"
            value={nuevo.stockInicial}
            onChange={(e) => setNuevo({ ...nuevo, stockInicial: e.target.value })}
          />

          <button onClick={onAddItem} className="ab-btn primary md:col-span-2">
            Guardar artículo
          </button>
        </div>
      </div>

      {/* Movimientos */}
      <div className="ab-card">
        <h2 className="text-lg font-black flex items-center gap-2">
          <SlidersHorizontal size={18} /> Movimientos
        </h2>

        <div className="mt-4 grid md:grid-cols-6 gap-3">
          <select className="ab-input md:col-span-2" value={mov.itemId} onChange={(e) => setMov({ ...mov, itemId: e.target.value })}>
            <option value="">Selecciona artículo…</option>
            {items.map((it) => (
              <option key={it.id} value={it.id}>
                {it.nombre} ({it.unidad})
              </option>
            ))}
          </select>

          <select className="ab-input" value={mov.type} onChange={(e) => setMov({ ...mov, type: e.target.value })}>
            <option value={MOV_TYPES.IN}>Entrada</option>
            <option value={MOV_TYPES.OUT}>Salida</option>
            <option value={MOV_TYPES.ADJUST}>Ajuste</option>
          </select>

          <input
            className="ab-input"
            type="number"
            placeholder={mov.type === MOV_TYPES.ADJUST ? "Nuevo stock" : "Cantidad"}
            value={mov.qty}
            onChange={(e) => setMov({ ...mov, qty: e.target.value })}
          />

          <input
            className="ab-input md:col-span-2"
            placeholder="Nota (opcional)"
            value={mov.note}
            onChange={(e) => setMov({ ...mov, note: e.target.value })}
          />

          <button onClick={onAddMov} className="ab-btn primary">
            {mov.type === MOV_TYPES.IN && <ArrowDownCircle size={18} />}
            {mov.type === MOV_TYPES.OUT && <ArrowUpCircle size={18} />}
            {mov.type === MOV_TYPES.ADJUST && <SlidersHorizontal size={18} />}
            Aplicar
          </button>
        </div>
      </div>

      {/* Filtros + listado */}
      <div className="ab-card">
        <h2 className="text-lg font-black">Inventario</h2>

        <div className="mt-4 grid md:grid-cols-4 gap-3">
          <input className="ab-input" placeholder="Buscar…" value={q} onChange={(e) => setQ(e.target.value)} />

          <select className="ab-input" value={tipoFiltro} onChange={(e) => setTipoFiltro(e.target.value)}>
            <option value="todos">Todos</option>
            <option value="ingrediente">Ingredientes</option>
            <option value="producto">Productos</option>
          </select>

          <label className="ab-card flex items-center gap-2" style={{ padding: 12, boxShadow: "none" }}>
            <input type="checkbox" checked={soloBajoMinimo} onChange={(e) => setSoloBajoMinimo(e.target.checked)} />
            <span style={{ fontWeight: 900, color: "var(--muted)" }}>Solo bajo mínimo</span>
          </label>

          <div className="ab-card" style={{ padding: 12, boxShadow: "none", background: "#f8fafc" }}>
            <div className="text-xs" style={{ color: "var(--muted)", fontWeight: 900 }}>Artículos</div>
            <div className="text-lg font-black">{filtered.length}</div>
          </div>
        </div>

        <div className="overflow-x-auto mt-4">
          <table className="w-full ab-table text-sm">
            <thead>
              <tr>
                <th className="p-3">Artículo</th>
                <th className="p-3">Tipo</th>
                <th className="p-3 text-right">Stock</th>
                <th className="p-3 text-right">Mínimo</th>
                <th className="p-3 text-right">€/unidad</th>
                <th className="p-3 text-right">Valor</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((it) => {
                const stock = n0(stockMap.get(it.id) ?? 0);
                const min = n0(it.minimo);
                const bajo = stock < min;
                const valor = stock * n0(it.precioUnitario);

                return (
                  <tr key={it.id} className="border-b" style={{ borderColor: "rgba(2,6,23,.06)", background: bajo ? "#fff5f5" : "transparent" }}>
                    <td className="p-3 font-black" style={{ color: "var(--text)" }}>
                      {it.nombre}
                      <div className="text-xs" style={{ color: "var(--muted)", fontWeight: 800 }}>
                        unidad: {it.unidad} {bajo ? " · ⚠️ bajo mínimo" : ""}
                      </div>
                    </td>
                    <td className="p-3 font-bold" style={{ color: "var(--muted)" }}>{it.tipo}</td>
                    <td className="p-3 text-right ab-mono" style={{ fontWeight: 900 }}>
                      {euro(stock, 2)} {it.unidad}
                    </td>
                    <td className="p-3 text-right ab-mono" style={{ fontWeight: 900, color: bajo ? "#b02a37" : "var(--muted)" }}>
                      {euro(min, 2)} {it.unidad}
                    </td>
                    <td className="p-3 text-right ab-mono" style={{ fontWeight: 900 }}>
                      {euro(it.precioUnitario, 2)} €
                    </td>
                    <td className="p-3 text-right ab-mono" style={{ fontWeight: 900 }}>
                      {euro(valor, 2)} €
                    </td>
                    <td className="p-3 text-right">
                      <button onClick={() => onDelete(it.id)} className="ab-tab" style={{ background: "#fff5f5" }}>
                        <Trash2 size={16} /> Borrar
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td className="p-4 text-sm" colSpan={7} style={{ color: "var(--muted)", fontWeight: 800 }}>
                    No hay artículos con esos filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Movimientos recientes */}
      <div className="ab-card">
        <h2 className="text-lg font-black">Movimientos recientes</h2>
        <div className="mt-3 grid gap-2">
          {movimientosRecientes.length === 0 && (
            <div className="text-sm" style={{ color: "var(--muted)", fontWeight: 800 }}>
              Aún no hay movimientos.
            </div>
          )}
          {movimientosRecientes.map((m) => (
            <div key={m.id} className="ab-card" style={{ padding: 14, boxShadow: "none", background: "#f8fafc" }}>
              <div className="flex justify-between gap-3">
                <div className="font-black" style={{ color: "var(--text)" }}>
                  {m.type === MOV_TYPES.IN && "Entrada"}
                  {m.type === MOV_TYPES.OUT && "Salida"}
                  {m.type === MOV_TYPES.ADJUST && "Ajuste"}
                  <span className="ml-2 ab-mono" style={{ color: "var(--muted)" }}>
                    {euro(m.qty, 2)}
                  </span>
                </div>
                <div className="text-xs" style={{ color: "var(--muted)", fontWeight: 900 }}>
                  {new Date(m.at).toLocaleString("es-ES")}
                </div>
              </div>
              {m.note && (
                <div className="text-sm mt-1" style={{ color: "var(--muted)", fontWeight: 800 }}>
                  {m.note}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
