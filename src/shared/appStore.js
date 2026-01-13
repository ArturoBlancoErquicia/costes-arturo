// src/shared/appStore.js
import {
  getStockState,
  setStockState,
  stockMap as _stockMap,
  upsertItem as _upsertItem,
  addMovement as _addMovement,
  emptyDB as _emptyDB,
  exportStockJSON as _exportStockJSON,
  importStockJSON as _importStockJSON,
} from "../modules/stock/stockStore";

/**
 * Exporta TODO lo que haya en localStorage con un prefijo (por defecto "ab_")
 * y además incluye el stock.
 */
export function exportAll(prefix = "ab_") {
  const entries = {};

  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k) continue;
    if (k.startsWith(prefix) || k === "ab_stock_v1") {
      entries[k] = localStorage.getItem(k);
    }
  }

  // Asegura stock aunque no estuviera como string
  if (!entries["ab_stock_v1"]) {
    entries["ab_stock_v1"] = JSON.stringify(_exportStockJSON());
  }

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    entries,
  };
}

/**
 * Importa el payload generado por exportAll().
 */
export function importAll(payload, { overwrite = true } = {}) {
  const entries = payload?.entries && typeof payload.entries === "object" ? payload.entries : {};
  const written = [];

  for (const [k, v] of Object.entries(entries)) {
    if (!overwrite && localStorage.getItem(k) != null) continue;

    // v suele venir como string JSON ya preparado
    if (typeof v === "string") localStorage.setItem(k, v);
    else localStorage.setItem(k, JSON.stringify(v));

    written.push(k);
  }

  return written;
}

/**
 * Setter opcional para cargar "bloques" típicos de la app.
 */
export function setAppDB({ config, ingredientes, stock } = {}) {
  if (config) localStorage.setItem("ab_config", JSON.stringify(config));
  if (ingredientes) localStorage.setItem("ab_ingredientes", JSON.stringify(ingredientes));
  if (stock) _importStockJSON(stock);
  return true;
}

// Reexports que StockPage.jsx ya está intentando importar
export const stock_upsertItem = _upsertItem;
export const stock_addMovement = _addMovement;
export const stock_stockMap = _stockMap;

export const stock_getState = getStockState;
export const stock_setState = setStockState;

export const stock_emptyDB = _emptyDB;
