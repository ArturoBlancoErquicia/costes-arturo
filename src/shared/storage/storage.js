// src/shared/storage/storage.js

export function descargarJSON(filename, data) {
  const json = typeof data === "string" ? data : JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename || "export.json";
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
}

export function leerFileJSON(file) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error("No file"));
    const reader = new FileReader();
    reader.onload = () => {
      try {
        resolve(JSON.parse(String(reader.result || "{}")));
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = () => reject(reader.error || new Error("Error leyendo archivo"));
    reader.readAsText(file);
  });
}

export function clearAppDB(prefix = "ab_") {
  const toDelete = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k) continue;
    if (k.startsWith(prefix) || k === "ab_stock_v1") toDelete.push(k);
  }
  toDelete.forEach((k) => localStorage.removeItem(k));
  return toDelete;
}
