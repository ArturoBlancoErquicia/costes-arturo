import React, { useRef, useState } from "react";
import { Download, Upload, Trash2, RefreshCw } from "lucide-react";
import { clearAppDB, descargarJSON, leerFileJSON } from "../../shared/storage/storage";

function exportAllLocalStorage(prefix = "ab_") {
  const payload = {
    meta: { exportedAt: new Date().toISOString(), prefix },
    data: {},
  };

  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k || !k.startsWith(prefix)) continue;

    const raw = localStorage.getItem(k);
    // Guardamos como JSON si se puede, y si no, como string
    try {
      payload.data[k] = JSON.parse(raw);
    } catch {
      payload.data[k] = raw;
    }
  }

  return payload;
}

function importAllLocalStorage(payload) {
  if (!payload || typeof payload !== "object" || !payload.data || typeof payload.data !== "object") {
    throw new Error("Formato inválido: falta 'data'");
  }

  for (const [k, v] of Object.entries(payload.data)) {
    // Si es objeto/array -> stringify; si es string -> tal cual
    const value = typeof v === "string" ? v : JSON.stringify(v);
    localStorage.setItem(k, value);
  }
}

export default function SettingsPage() {
  const fileRef = useRef(null);
  const [msg, setMsg] = useState(null);

  const onExport = () => {
    try {
      const dump = exportAllLocalStorage("ab_");
      descargarJSON("costes-arturo-backup.json", dump);
      setMsg({ type: "ok", text: `✅ Exportado (${Object.keys(dump.data).length} claves)` });
    } catch (e) {
      setMsg({ type: "err", text: e?.message || "Error exportando" });
    }
  };

  const onPickImport = () => fileRef.current?.click();

  const onImport = async (e) => {
    try {
      const file = e.target.files?.[0];
      const json = await leerFileJSON(file);
      importAllLocalStorage(json);
      setMsg({ type: "ok", text: "✅ Importado. Recargando…" });
      setTimeout(() => window.location.reload(), 300);
    } catch (err) {
      setMsg({ type: "err", text: err?.message || "Error importando" });
    } finally {
      // Permite volver a importar el mismo archivo si hace falta
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const onClear = () => {
    try {
      const deleted = clearAppDB("ab_");
      setMsg({ type: "ok", text: `🧹 Borrado: ${deleted.length} claves. Recargando…` });
      setTimeout(() => window.location.reload(), 300);
    } catch (e) {
      setMsg({ type: "err", text: e?.message || "Error limpiando" });
    }
  };

  return (
    <div className="ab-card">
      <h2 className="text-xl font-black mb-2" style={{ color: "var(--text)" }}>
        Ajustes
      </h2>
      <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
        Exporta/importa una copia de seguridad del estado (localStorage) y limpia datos de la app.
      </p>

      <div className="flex flex-col md:flex-row gap-2">
        <button className="ab-btn primary" onClick={onExport}>
          <Download size={16} /> Exportar JSON
        </button>

        <button className="ab-btn" onClick={onPickImport}>
          <Upload size={16} /> Importar JSON
        </button>

        <button className="ab-btn danger" onClick={onClear}>
          <Trash2 size={16} /> Borrar datos (reset)
        </button>

        <button className="ab-btn" onClick={() => window.location.reload()}>
          <RefreshCw size={16} /> Recargar
        </button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={onImport}
      />

      {msg && (
        <div
          className="mt-4 p-3 rounded-lg text-sm"
          style={{
            background: msg.type === "ok" ? "rgba(34,197,94,.12)" : "rgba(239,68,68,.12)",
            border: "1px solid rgba(2,6,23,.08)",
            color: "var(--text)",
          }}
        >
          <div className="font-black">{msg.text}</div>
        </div>
      )}
    </div>
  );
}
