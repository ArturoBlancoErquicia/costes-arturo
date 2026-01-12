export const INGREDIENTES_BASE = [
  { id: "ab_1", nombre: "Harina Trigo T80 (Arturo)", precio: 0.95, esHarina: true, origen: "arturo" },
  { id: "ab_2", nombre: "Harina Fuerza W300", precio: 1.10, esHarina: true, origen: "arturo" },
  { id: "ab_3", nombre: "Harina Centeno Integral", precio: 1.25, esHarina: true, origen: "arturo" },

  // Agua actualizado
  { id: "ab_4", nombre: "Agua", precio: 0.01, esHarina: false, origen: "arturo" },

  { id: "ab_5", nombre: "Sal Marina", precio: 0.30, esHarina: false, origen: "arturo" },
  { id: "ab_6", nombre: "Levadura Fresca", precio: 2.50, esHarina: false, origen: "arturo" },

  // Masa madre como prefermento (ingrediente normal, NO harina)
  { id: "ab_7", nombre: "Masa Madre (Prefermento)", precio: 0.50, esHarina: false, origen: "arturo" },

  { id: "ab_8", nombre: "Mejorante Panario", precio: 4.50, esHarina: false, origen: "arturo" },
];

export const CONFIG_INICIAL = {
  nombreObrador: "Mi Obrador",
  costeHoraPersonal: 14.5, // €/hora coste empresa
  costeHoraHorno: 8.0, // €/hora energía
  gastosFijosMensuales: 1200,
  horasTrabajoMensuales: 160,
  ivaDefecto: 4,
};
