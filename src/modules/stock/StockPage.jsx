import React, { useEffect, useMemo, useRef, useState } from "react";
import { Download, Upload, Trash2, RefreshCw } from "lucide-react";

import {
  addMovement,
  emptyDB,
  exportStockJSON,
  getStockState,
  importStockJSON,
  upsertItem,
} from "./stockStore";

import { descargarJSON, leerFileJSON } from "../../shared/storage/storage";

const UNITS = ["kg", "g", "l", "ml", "ud"];

// ---------- Helpers ----------
const parseNum = (v) => {
  if (v == null) return 0;
  const s = String(v).replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
};

function formatQty(q) {
  const n = Number(q) || 0;
  return n.toFixed(3).replace(/\.?0+$/, "");
}

// ---------- Autocomplete Input ----------
function AutoCompleteInput({
  value,
  onChange,
  options,
  placeholder,
  className = "",
  onPick,
  renderOption,
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const wrapRef = useRef(null);

  const normalized = (value || "").toLowerCase().trim();

  const filtered = useMemo(() => {
    if (!normalized) return options.slice(0, 12);
    const f = options.filter((x) =>
      String(x?.label || "").toLowerCase().includes(normalized)
    );
    return f.slice(0, 12);
  }, [options, normalized]);

  useEffect(() => {
    const onDoc = (e) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const pick = (opt) => {
    onChange(opt.label);
    setOpen(false);
    setActive(0);
    onPick?.(opt);
  };

  return (
    <div ref={wrapRef} className="relative">
      <input
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActive(0);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
            setOpen(true);
            return;
          }

          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((p) => Math.min(p + 1, filtered.length - 1));
          }
          if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((p) => Math.max(p - 1, 0));
          }
          if (e.key === "Enter") {
            if (open && filtered[active]) {
              e.preventDefault();
              pick(filtered[active]);
            }
          }
          if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
      />

      {open && filtered.length > 0 && (
        <div className="absolute z-20 mt-1 w-full max-h-60 overflow-auto rounded-lg border bg-white shadow-xl">
          {filtered.map((opt, idx) => (
            <button
              key={`${opt.type}:${opt.key}`}
              type="button"
              onClick={() => pick(opt)}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 ${
                idx === active ? "bg-blue-50" : ""
              }`}
            >
              {renderOption ? renderOption(opt) : opt.label}
            </button>
          ))}
        </div>
      )}

      {open && filtered.length === 0 && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border bg-white shadow-xl px-3 py-2 text-sm text-gray-500">
          No hay coincidencias. Puedes crear el ingrediente escribiendo el nombre y pulsando Guardar.
        </div>
      )}
    </div>
  );
}

export default function StockPage({ ingredientesDisponibles = [] }) {
  const [state, setState] = useState(() => getStockState());

  // Buscador principal
  const [filter, setFilter] = useState("");

  // Form: añadir/actualizar
  const [nombre, setNombre] = useState("");
  const [unidad, setUnidad] = useState("kg");
  const [qty, setQty] = useState("");

  // Form: movimiento rápido
  const [movNombre, setMovNombre] = useState("");
  const [movUnidad, setMovUnidad] = useState("kg");
  const [movQty, setMovQty] = useState("");
  const [movSign, setMovSign] = useState("+");
  const [motivo, setMotivo] = useState("");

  const [msg, setMsg] = useState(null);

  const refresh = () => setState(getStockState());

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const itemsSorted = useMemo(() => {
    const items = Array.isArray(state?.items) ? [...state.items] : [];
    items.sort((a, b) => String(a.nombre || "").localeCompare(String(b.nombre || "")));
    return items;
  }, [state]);

  // mapa rápido por nombre
  const stockByName = useMemo(() => {
    const m = new Map();
    for (const it of itemsSorted) {
      const k = String(it?.nombre || "").trim().toLowerCase();
      if (k) m.set(k, it);
    }
    return m;
  }, [itemsSorted]);

  // catálogo de ingredientes (materias primas)
  const catalogo = useMemo(() => {
    const arr = Array.isArray(ingredientesDisponibles) ? ingredientesDisponibles : [];
    return arr
      .map((x) => ({
        id: x.id,
        nombre: String(x.nombre || "").trim(),
        unidad: x.unidad || "kg",
      }))
      .filter((x) => x.nombre);
  }, [ingredientesDisponibles]);

  // ---------- Opciones combinadas ----------
  // type: "stock" o "catalog"
  const options = useMemo(() => {
    const out = [];

    // stock primero
    for (const it of itemsSorted) {
      const n = String(it?.nombre || "").trim();
      if (!n) continue;
      out.push({
        type: "stock",
        key: n.toLowerCase(),
        label: n,
        unidad: it.unidad || "kg",
      });
    }

    // catálogo: solo los que no estén ya en stock
    for (const c of catalogo) {
      const k = c.nombre.toLowerCase();
      if (stockByName.has(k)) continue;
      out.push({
        type: "catalog",
        key: k,
        label: c.nombre,
        unidad: c.unidad || "kg",
      });
    }

    return out;
  }, [itemsSorted, catalogo, stockByName]);

  const filteredItems = useMemo(() => {
    const q = String(filter || "").toLowerCase().trim();
    if (!q) return itemsSorted;
    return itemsSorted.filter((it) => String(it.nombre || "").toLowerCase().includes(q));
  }, [itemsSorted, filter]);

  const movements = useMemo(() => {
    const m = Array.isArray(state?.movements) ? state.movements : [];
    return m.slice(0, 30);
  }, [state]);

  const flash = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3500);
  };

  // Crea ingrediente si viene del catálogo
  const ensureExistsIfCatalog = (opt) => {
    if (!opt || opt.type !== "catalog") return;

    const n = String(opt.label || "").trim();
    if (!n) return;

    // crea con qty=0 si no existe
    const exists = stockByName.has(n.toLowerCase());
    if (!exists) {
      upsertItem({ nombre: n, unidad: opt.unidad || "kg", qty: 0 });
      refresh();
      flash("ok", `✅ Creado en stock: ${n} (0 ${opt.unidad || "kg"})`);
    }
  };

  const pickIntoForms = (optOrName) => {
    const isObj = typeof optOrName === "object" && optOrName !== null;
    const label = isObj ? optOrName.label : String(optOrName || "");
    const u = isObj ? optOrName.unidad : null;

    const n = String(label || "").trim();
    if (!n) return;

    // si es catálogo y no existe -> crear
    if (isObj) ensureExistsIfCatalog(optOrName);

    setNombre(n);
    setMovNombre(n);
    setFilter(n);

    // unidad: primero la del stock si existe, si no la del catálogo
    const it = stockByName.get(n.toLowerCase());
    const finalUnit = it?.unidad || u || "kg";
    setUnidad(finalUnit);
    setMovUnidad(finalUnit);
  };

  const handleGuardarIngrediente = () => {
    try {
      const n = String(nombre || "").trim();
      if (!n) throw new Error("Pon un nombre de ingrediente");

      const q = parseNum(qty);
      upsertItem({ nombre: n, unidad, qty: q });

      refresh();
      flash("ok", `✅ Guardado: ${n} (${formatQty(q)} ${unidad})`);
    } catch (e) {
      flash("err", e?.message || "Error guardando ingrediente");
    }
  };

  const handleAplicarMovimiento = () => {
    try {
      const n = String(movNombre || "").trim();
      if (!n) throw new Error("Pon un nombre de ingrediente");

      const q = parseNum(movQty);
      if (q === 0) throw new Error("Cantidad debe ser distinta de 0");

      const sign = movSign === "-" ? -1 : 1;
      const delta = sign * q;

      addMovement({
        nombre: n,
        delta,
        unidad: movUnidad,
        reason: String(motivo || "").trim(),
      });

      refresh();
      flash(
        "ok",
        `✅ Movimiento aplicado: ${n} (${delta > 0 ? "+" : ""}${formatQty(delta)} ${movUnidad})`
      );
    } catch (e) {
      flash("err", e?.message || "Error aplicando movimiento");
    }
  };

  const handleExport = () => {
    try {
      const payload = exportStockJSON();
      descargarJSON(payload, "stock_ab.json");
      flash("ok", "✅ Stock exportado");
    } catch (e) {
      flash("err", e?.message || "Error exportando");
    }
  };

  const handleImport = async (file) => {
    try {
      if (!file) return;
      const payload = await leerFileJSON(file);
      importStockJSON(payload);
      refresh();
      flash("ok", "✅ Stock importado");
    } catch (e) {
      flash("err", e?.message || "Error importando JSON");
    }
  };

  const handleVaciar = () => {
    if (!confirm("¿Seguro que quieres vaciar el stock y movimientos?")) return;
    emptyDB();
    refresh();
    flash("ok", "✅ Stock vaciado");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-black">Existencias (Stock)</h2>

        <div className="flex items-center gap-2">
          <button
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border bg-white hover:bg-gray-50"
            onClick={handleExport}
            type="button"
          >
            <Download size={16} /> Exportar
          </button>

          <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border bg-white hover:bg-gray-50 cursor-pointer">
            <Upload size={16} /> Importar
            <input
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => handleImport(e.target.files?.[0])}
            />
          </label>

          <button
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border bg-white hover:bg-gray-50"
            onClick={refresh}
            type="button"
          >
            <RefreshCw size={16} /> Refrescar
          </button>

          <button
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-red-600 bg-white hover:bg-red-50"
            onClick={handleVaciar}
            type="button"
          >
            <Trash2 size={16} /> Vaciar
          </button>
        </div>
      </div>

      {/* Mensajes */}
      {msg && (
        <div
          className={`p-3 rounded-lg text-sm border ${
            msg.type === "ok"
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <div className="font-bold">{msg.text}</div>
        </div>
      )}

      {/* BUSCADOR global (stock + catálogo) */}
      <div className="bg-white p-4 rounded-xl border shadow-sm">
        <label className="text-sm font-bold text-gray-700">Buscar ingrediente</label>
        <div className="mt-2">
          <AutoCompleteInput
            value={filter}
            onChange={setFilter}
            options={options}
            placeholder="🔍 Escribe (sugiere stock y catálogo)..."
            onPick={(opt) => pickIntoForms(opt)}
            renderOption={(opt) => (
              <div className="flex items-center justify-between">
                <span>{opt.label}</span>
                <span className="text-xs text-gray-500">
                  {opt.type === "stock" ? "En stock" : "Catálogo (se creará)"}
                </span>
              </div>
            )}
            className="w-full p-3 border rounded-lg bg-gray-50 focus:bg-white"
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Si eliges “Catálogo (se creará)”, se crea automáticamente el ingrediente en stock con cantidad 0.
        </p>
      </div>

      {/* Formulario: añadir / actualizar */}
      <div className="bg-white p-4 rounded-xl border shadow-sm">
        <h3 className="font-bold mb-3">Añadir / Actualizar ingrediente</h3>

        <div className="grid md:grid-cols-4 gap-3 items-end">
          <div className="md:col-span-2">
            <label className="text-xs text-gray-500">Nombre (autocompletar)</label>
            <AutoCompleteInput
              value={nombre}
              onChange={setNombre}
              options={options}
              placeholder='Nombre (ej: "Harina fuerza")'
              onPick={(opt) => pickIntoForms(opt)}
              className="w-full p-2 border rounded"
              renderOption={(opt) => (
                <div className="flex items-center justify-between">
                  <span>{opt.label}</span>
                  <span className="text-xs text-gray-500">
                    {opt.type === "stock" ? "En stock" : "Catálogo"}
                  </span>
                </div>
              )}
            />
          </div>

          <div>
            <label className="text-xs text-gray-500">Unidad</label>
            <select
              value={unidad}
              onChange={(e) => setUnidad(e.target.value)}
              className="w-full p-2 border rounded"
            >
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-500">Cantidad</label>
            <input
              type="text"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              placeholder="0"
              className="w-full p-2 border rounded"
            />
          </div>
        </div>

        <div className="mt-3">
          <button
            className="px-4 py-2 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700"
            onClick={handleGuardarIngrediente}
            type="button"
          >
            Guardar
          </button>
        </div>
      </div>

      {/* Formulario: movimiento rápido */}
      <div className="bg-white p-4 rounded-xl border shadow-sm">
        <h3 className="font-bold mb-3">Movimiento rápido (entrada / salida)</h3>

        <div className="grid md:grid-cols-6 gap-3 items-end">
          <div className="md:col-span-2">
            <label className="text-xs text-gray-500">Ingrediente (autocompletar)</label>
            <AutoCompleteInput
              value={movNombre}
              onChange={setMovNombre}
              options={options}
              placeholder="Escribe o elige..."
              onPick={(opt) => pickIntoForms(opt)}
              className="w-full p-2 border rounded"
              renderOption={(opt) => (
                <div className="flex items-center justify-between">
                  <span>{opt.label}</span>
                  <span className="text-xs text-gray-500">
                    {opt.type === "stock" ? "En stock" : "Catálogo"}
                  </span>
                </div>
              )}
            />
          </div>

          <div>
            <label className="text-xs text-gray-500">Unidad</label>
            <select
              value={movUnidad}
              onChange={(e) => setMovUnidad(e.target.value)}
              className="w-full p-2 border rounded"
            >
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-500">Cantidad</label>
            <input
              type="text"
              value={movQty}
              onChange={(e) => setMovQty(e.target.value)}
              placeholder="0"
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500">+ / -</label>
            <select
              value={movSign}
              onChange={(e) => setMovSign(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="+">+</option>
              <option value="-">-</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-500">Motivo (opcional)</label>
            <input
              type="text"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej: ajuste inventario"
              className="w-full p-2 border rounded"
            />
          </div>
        </div>

        <div className="mt-3">
          <button
            className="px-4 py-2 rounded-lg bg-gray-900 text-white font-bold hover:bg-black"
            onClick={handleAplicarMovimiento}
            type="button"
          >
            Aplicar
          </button>
        </div>
      </div>

      {/* Tabla stock */}
      <div className="bg-white p-4 rounded-xl border shadow-sm">
        <h3 className="font-bold mb-3">Stock actual</h3>

        {filteredItems.length === 0 ? (
          <div className="text-sm text-gray-500">No hay stock todavía. Añade ingredientes arriba.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 text-gray-600">
                <tr>
                  <th className="p-2 text-left">Ingrediente</th>
                  <th className="p-2 text-left">Unidad</th>
                  <th className="p-2 text-right">Cantidad</th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((it) => (
                  <tr key={it.id} className="border-b">
                    <td className="p-2 font-medium">{it.nombre}</td>
                    <td className="p-2">{it.unidad}</td>
                    <td className="p-2 text-right">{formatQty(it.qty)}</td>
                    <td className="p-2 text-right">
                      <button
                        type="button"
                        className="text-xs px-2 py-1 rounded border hover:bg-gray-50"
                        onClick={() =>
                          pickIntoForms({ type: "stock", key: it.nombre.toLowerCase(), label: it.nombre, unidad: it.unidad })
                        }
                      >
                        Usar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Movimientos */}
      <div className="bg-white p-4 rounded-xl border shadow-sm">
        <h3 className="font-bold mb-3">Movimientos recientes</h3>

        {movements.length === 0 ? (
          <div className="text-sm text-gray-500">Sin movimientos todavía.</div>
        ) : (
          <div className="space-y-2">
            {movements.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between gap-3 p-2 rounded border bg-gray-50"
              >
                <div className="text-sm">
                  <div className="font-bold">
                    {m.nombre}{" "}
                    <span className={`${m.delta < 0 ? "text-red-600" : "text-green-700"}`}>
                      ({m.delta < 0 ? "" : "+"}
                      {formatQty(m.delta)} {m.unidad})
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {m.reason ? m.reason : "—"} · {new Date(m.ts).toLocaleString()}
                  </div>
                </div>

                <button
                  type="button"
                  className="text-xs px-2 py-1 rounded border hover:bg-white"
                  onClick={() =>
                    pickIntoForms({
                      type: "stock",
                      key: String(m.nombre || "").toLowerCase(),
                      label: String(m.nombre || ""),
                      unidad: m.unidad || "kg",
                    })
                  }
                >
                  Repetir
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
