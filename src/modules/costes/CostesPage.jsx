import React, { useEffect, useState } from "react";
import { CONFIG_INICIAL, INGREDIENTES_BASE } from "../../data";
import { Configuracion } from "../../components/Configuracion";
import { Calculadora } from "../../components/Calculadora";
import { ChefHat, Package, Settings } from "lucide-react";

import { produceLoteFromCostes } from "./produceFromCostes";
import { emptyDB, exportStockJSON, importStockJSON } from "../stock/stockStore";

const Inventario = ({ ingredientes, setIngredientes }) => {
  const [nuevo, setNuevo] = useState({ nombre: "", precio: 0, esHarina: false });

  const agregar = () => {
    if (!nuevo.nombre) return;
    setIngredientes([...ingredientes, { ...nuevo, id: Date.now(), origen: "usuario" }]);
    setNuevo({ nombre: "", precio: 0, esHarina: false });
  };

  return (
    <div className="ab-card">
      <h2 className="text-xl font-black mb-4" style={{ color: "var(--text)" }}>
        Gestión de Materias Primas
      </h2>

      <div
        className="flex flex-col md:flex-row gap-2 mb-6 p-4 rounded-lg"
        style={{ background: "#f8fafc", border: "1px solid var(--border)" }}
      >
        <input
          placeholder="Nombre de ingrediente"
          className="ab-input flex-grow"
          value={nuevo.nombre}
          onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })}
        />

        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Precio €/kg"
            className="ab-input"
            style={{ width: 140 }}
            value={nuevo.precio}
            onChange={(e) => setNuevo({ ...nuevo, precio: parseFloat(e.target.value) || 0 })}
          />

          <label className="flex items-center gap-2 text-sm font-bold" style={{ color: "var(--muted)" }}>
            <input
              type="checkbox"
              className="w-4 h-4"
              checked={nuevo.esHarina}
              onChange={(e) => setNuevo({ ...nuevo, esHarina: e.target.checked })}
            />
            Harina
          </label>

          <button onClick={agregar} className="ab-btn primary">
            Añadir
          </button>
        </div>
      </div>

      <div className="grid gap-2">
        {ingredientes.map((ing) => (
          <div key={ing.id} className="flex justify-between items-center p-3 border-b" style={{ borderColor: "rgba(2,6,23,.06)" }}>
            <div className="flex items-center gap-2">
              <span className={ing.esHarina ? "font-black" : "font-bold"} style={{ color: ing.esHarina ? "#8a5a00" : "var(--text)" }}>
                {ing.nombre}
              </span>
              {ing.esHarina && (
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#fff3cd", color: "#8a5a00", fontWeight: 900 }}>
                  Harina 🌾
                </span>
              )}
            </div>
            <span className="ab-mono" style={{ fontWeight: 900, color: "var(--muted)" }}>
              {Number(ing.precio).toFixed(2)} € / kg
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function CostesPage() {
  const [activeTab, setActiveTab] = useState("calculadora");

  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem("ab_config");
    return saved ? JSON.parse(saved) : CONFIG_INICIAL;
  });

  const [ingredientes, setIngredientes] = useState(() => {
    const saved = localStorage.getItem("ab_ingredientes");
    return saved ? JSON.parse(saved) : INGREDIENTES_BASE;
  });

  useEffect(() => localStorage.setItem("ab_config", JSON.stringify(config)), [config]);
  useEffect(() => localStorage.setItem("ab_ingredientes", JSON.stringify(ingredientes)), [ingredientes]);

  // ✅ Esta función solo sirve si Calculadora te devuelve lineas/unidades al pulsar.
  const onProducir = ({ lineas, unidades }) => {
    const stockDump = localStorage.getItem("ab_stock_db");
    const stockDb = stockDump ? importStockJSON(stockDump) : emptyDB();

    const res = produceLoteFromCostes({
      db: stockDb,
      lineas,
      unidades: Number(unidades) || 0,
      at: Date.now(),
    });

    localStorage.setItem("ab_stock_db", exportStockJSON(res.db));

    if (res.noEncontrados?.length) {
      alert(`Producción OK. No encontrados en stock: ${res.noEncontrados.join(", ")}`);
    } else {
      alert("Producción OK. Stock descontado.");
    }
  };

  return (
    <div className="space-y-5">
      <div className="ab-card">
        <h2 className="text-xl font-black">Módulo Costes</h2>
        <div className="mt-4 flex gap-2 overflow-x-auto">
          <button onClick={() => setActiveTab("calculadora")} className={`ab-tab ${activeTab === "calculadora" ? "active" : ""}`}>
            <ChefHat size={18} /> Escandallo
          </button>
          <button onClick={() => setActiveTab("inventario")} className={`ab-tab ${activeTab === "inventario" ? "active" : ""}`}>
            <Package size={18} /> Materias primas
          </button>
          <button onClick={() => setActiveTab("config")} className={`ab-tab ${activeTab === "config" ? "active" : ""}`}>
            <Settings size={18} /> Obrador
          </button>
        </div>
      </div>

      {activeTab === "calculadora" && (
        <Calculadora
          config={config}
          ingredientesDisponibles={ingredientes}
          // 👇 si decides usar esta opción, Calculadora debe llamar onProducir({lineas, unidades})
          onProducir={onProducir}
        />
      )}

      {activeTab === "inventario" && <Inventario ingredientes={ingredientes} setIngredientes={setIngredientes} />}
      {activeTab === "config" && <Configuracion config={config} setConfig={setConfig} />}
    </div>
  );
}
