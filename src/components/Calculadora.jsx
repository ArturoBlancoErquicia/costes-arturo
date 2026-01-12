import React, { useState, useEffect } from "react";
import { Trash2, PieChart, Timer, DollarSign, Users, Flame } from "lucide-react";
import { produceLoteFromCostes } from "../modules/costes/produceFromCostes";

export const Calculadora = ({ config, ingredientesDisponibles }) => {
  // --- ESTADOS DE LA RECETA ---
  const [nombreReceta, setNombreReceta] = useState("Nueva Receta");
  const [lineas, setLineas] = useState([]);
  const [unidades, setUnidades] = useState(50);

  // Tiempos
  const [tiempos, setTiempos] = useState({
    amasado: 15,
    velocidadFormado: 300, // uds/hora
    fermentacion: 120,
    coccion: 45,
  });

  // Precios
  const [margen, setMargen] = useState(25);
  const [iva, setIva] = useState(4);
  const [pvpManual, setPvpManual] = useState(0);

  // --- BUSCADOR ---
  const [busqueda, setBusqueda] = useState("");

  // --- PRODUCCIÓN (Stock) ---
  const [produccionMsg, setProduccionMsg] = useState(null);

  const agregarIngrediente = (ing) => {
    setLineas([...lineas, { ...ing, uid: Date.now(), cantidad: 0 }]);
    setBusqueda("");
  };

  const actualizarLinea = (uid, campo, valor) => {
    setLineas(
      lineas.map((l) => (l.uid === uid ? { ...l, [campo]: parseFloat(valor) || 0 } : l))
    );
  };

  const eliminarLinea = (uid) => setLineas(lineas.filter((l) => l.uid !== uid));

  // --- CÁLCULOS MATEMÁTICOS (CORE) ---
  const totalMasa = lineas.reduce((acc, l) => acc + (Number(l.cantidad) || 0), 0);
  const totalHarina = lineas.reduce(
    (acc, l) => (l.esHarina ? acc + (Number(l.cantidad) || 0) : acc),
    0
  );
  const costeMP = lineas.reduce(
    (acc, l) => acc + ((Number(l.cantidad) || 0) / 1000) * (Number(l.precio) || 0),
    0
  );

  // Costes Proceso
  const costeAmasado = (Number(tiempos.amasado || 0) / 60) * (Number(config.costeHoraPersonal) || 0);

  const unidadesSafe = Number(unidades) > 0 ? Number(unidades) : 1;
  const velocidadSafe = Number(tiempos.velocidadFormado) > 0 ? Number(tiempos.velocidadFormado) : 1;

  const horasFormado = unidadesSafe / velocidadSafe;
  const costeFormado = horasFormado * (Number(config.costeHoraPersonal) || 0);

  const costeCoccion = (Number(tiempos.coccion || 0) / 60) * (Number(config.costeHoraHorno) || 0);

  // Gastos Generales (Imputación por tiempo total de ocupación de obrador por lote)
  const tiempoTotalCiclo =
    Number(tiempos.amasado || 0) + horasFormado * 60 + Number(tiempos.fermentacion || 0) + Number(tiempos.coccion || 0);

  const horasMensualesSafe = Number(config.horasTrabajoMensuales) > 0 ? Number(config.horasTrabajoMensuales) : 1;
  const gastoGeneralMinuto = (Number(config.gastosFijosMensuales) || 0) / (horasMensualesSafe * 60);

  const costeGG = tiempoTotalCiclo * gastoGeneralMinuto;

  const costeTotalLote = costeMP + costeAmasado + costeFormado + costeCoccion + costeGG;
  const costeUnitario = costeTotalLote / unidadesSafe;

  // Precio Sugerido
  const margenSafe = Math.max(0, Math.min(80, Number(margen) || 0));
  const ivaSafe = Math.max(0, Math.min(40, Number(iva) || 0));

  const precioNetoSugerido = costeUnitario / (1 - margenSafe / 100);
  const pvpSugerido = precioNetoSugerido * (1 + ivaSafe / 100);

  // Análisis Beneficio Manual
  const pvpManualNum = Number(pvpManual) || 0;
  const precioNetoManual = pvpManualNum / (1 + ivaSafe / 100);

  const margenReal =
    precioNetoManual > 0 ? ((precioNetoManual - costeUnitario) / precioNetoManual) * 100 : 0;

  const beneficioDia = (precioNetoManual - costeUnitario) * unidadesSafe;

  // Actualizar PVP Manual sugerido inicial
  useEffect(() => {
    if ((Number(pvpManual) || 0) === 0 && pvpSugerido > 0) setPvpManual(parseFloat(pvpSugerido.toFixed(2)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [costeUnitario]);

  // Filtrado ingredientes
  const resultadosBusqueda = ingredientesDisponibles.filter((i) =>
    i.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 1. CABECERA RECETA */}
      <div className="bg-white p-6 rounded-xl shadow border border-gray-200 grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <label className="text-sm font-bold text-gray-700">Nombre Receta</label>
          <input
            type="text"
            value={nombreReceta}
            onChange={(e) => setNombreReceta(e.target.value)}
            className="w-full text-xl font-bold border-b-2 border-blue-500 focus:outline-none py-2"
          />
        </div>
        <div>
          <label className="text-sm font-bold text-gray-700">Unidades a Producir</label>
          <input
            type="number"
            value={unidades}
            onChange={(e) => setUnidades(parseFloat(e.target.value) || 1)}
            className="w-full text-xl font-bold border rounded p-2 text-center"
          />
        </div>
      </div>

      {/* 2. INGREDIENTES Y BUSCADOR */}
      <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <PieChart className="text-blue-600" /> Materias Primas
        </h3>

        {/* Buscador */}
        <div className="relative mb-6">
          <input
            type="text"
            placeholder="🔍 Buscar ingrediente para añadir..."
            className="w-full p-3 border rounded-lg shadow-inner bg-gray-50 focus:bg-white transition"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          {busqueda.length > 1 && (
            <div className="absolute z-10 w-full bg-white border shadow-xl rounded-lg mt-1 max-h-60 overflow-y-auto">
              {resultadosBusqueda.map((ing) => (
                <div
                  key={ing.id}
                  onClick={() => agregarIngrediente(ing)}
                  className="p-3 hover:bg-blue-50 cursor-pointer border-b flex justify-between"
                >
                  <span>{ing.nombre}</span>
                  <span className="font-bold">{Number(ing.precio).toFixed(2)} €/{ing.unidad || "kg"}</span>
                </div>
              ))}
              {resultadosBusqueda.length === 0 && (
                <div className="p-3 text-gray-500">No encontrado. Ve a "Inventario" para crearlo.</div>
              )}
            </div>
          )}
        </div>

        {/* Tabla Escandallo */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100 text-gray-600 uppercase">
              <tr>
                <th className="p-3">Ingrediente</th>
                <th className="p-3 text-center">Gramos</th>
                <th className="p-3 text-center">¿Es Harina?</th>
                <th className="p-3 text-right">Coste</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {lineas.map((linea) => (
                <tr key={linea.uid} className="border-b">
                  <td className="p-3 font-medium">{linea.nombre}</td>
                  <td className="p-3 text-center">
                    <input
                      type="number"
                      value={linea.cantidad}
                      onChange={(e) => actualizarLinea(linea.uid, "cantidad", e.target.value)}
                      className="w-24 text-center border rounded font-bold"
                    />
                  </td>
                  <td className="p-3 text-center">{linea.esHarina ? "🌾" : "-"}</td>
                  <td className="p-3 text-right">
                    {(((Number(linea.cantidad) || 0) / 1000) * (Number(linea.precio) || 0)).toFixed(3)} €
                  </td>
                  <td className="p-3 text-center">
                    <button onClick={() => eliminarLinea(linea.uid)} className="text-red-400 hover:text-red-600">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-blue-50 font-bold">
              <tr>
                <td className="p-3 text-right">TOTALES:</td>
                <td className="p-3 text-center text-blue-800">{totalMasa} g</td>
                <td className="p-3 text-center text-amber-700">{totalHarina} g Harina</td>
                <td className="p-3 text-right text-blue-800">{costeMP.toFixed(2)} €</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* 3. PROCESOS Y TIEMPOS */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white p-4 rounded-xl shadow border-l-4 border-blue-500">
          <div className="flex items-center gap-2 mb-2 font-bold text-gray-700">
            <Users size={18} /> Amasado
          </div>
          <label className="text-xs text-gray-500">Minutos totales</label>
          <input
            type="number"
            value={tiempos.amasado}
            onChange={(e) => setTiempos({ ...tiempos, amasado: parseFloat(e.target.value) || 0 })}
            className="w-full border rounded p-1"
          />
          <p className="text-right text-xs mt-1 font-bold">{costeAmasado.toFixed(2)} €</p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow border-l-4 border-green-500">
          <div className="flex items-center gap-2 mb-2 font-bold text-gray-700">
            <Timer size={18} /> Formado
          </div>
          <label className="text-xs text-gray-500">Velocidad (Uds/Hora)</label>
          <input
            type="number"
            value={tiempos.velocidadFormado}
            onChange={(e) =>
              setTiempos({ ...tiempos, velocidadFormado: parseFloat(e.target.value) || 0 })
            }
            className="w-full border rounded p-1"
          />
          <p className="text-right text-xs mt-1 font-bold">{costeFormado.toFixed(2)} €</p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow border-l-4 border-orange-500">
          <div className="flex items-center gap-2 mb-2 font-bold text-gray-700">
            <Flame size={18} /> Cocción
          </div>
          <label className="text-xs text-gray-500">Minutos Horno</label>
          <input
            type="number"
            value={tiempos.coccion}
            onChange={(e) => setTiempos({ ...tiempos, coccion: parseFloat(e.target.value) || 0 })}
            className="w-full border rounded p-1"
          />
          <p className="text-right text-xs mt-1 font-bold">{costeCoccion.toFixed(2)} €</p>
        </div>
      </div>

      {/* 4. DASHBOARD FINAL (RESULTADOS) */}
      <div className="bg-gray-900 text-white p-6 rounded-xl shadow-2xl">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
          <DollarSign className="text-yellow-400" /> Análisis Económico y Precio
        </h3>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Izquierda: Costes */}
          <div className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-gray-700 pb-1">
              <span>Materia Prima:</span> <span>{costeMP.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between border-b border-gray-700 pb-1">
              <span>Mano de Obra:</span> <span>{(costeAmasado + costeFormado).toFixed(2)} €</span>
            </div>
            <div className="flex justify-between border-b border-gray-700 pb-1">
              <span>Energía Horno:</span> <span>{costeCoccion.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between border-b border-gray-700 pb-1">
              <span>Gastos Generales:</span> <span>{costeGG.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-yellow-400 pt-2">
              <span>COSTE TOTAL LOTE:</span> <span>{costeTotalLote.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between font-bold text-gray-300">
              <span>Coste x Unidad:</span> <span>{costeUnitario.toFixed(3)} €</span>
            </div>
          </div>

          {/* Derecha: Precios */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="mb-4">
              <label className="text-xs text-gray-400 uppercase">Margen Deseado ({margenSafe}%)</label>
              <input
                type="range"
                min="0"
                max="80"
                value={margenSafe}
                onChange={(e) => setMargen(e.target.value)}
                className="w-full accent-blue-500"
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>
                  PVP Sugerido: <strong>{pvpSugerido.toFixed(2)} €</strong>
                </span>
                <span>IVA: {ivaSafe}%</span>
              </div>
            </div>

            <div className="border-t border-gray-600 pt-4">
              <label className="block text-sm font-bold text-green-400 mb-1">MI PRECIO FINAL (€ con IVA)</label>
              <input
                type="number"
                step="0.05"
                value={pvpManual}
                onChange={(e) => setPvpManual(e.target.value)}
                className="w-full bg-gray-700 text-white text-3xl font-bold p-2 rounded text-right border border-gray-600 focus:border-green-500"
              />
            </div>

            <div
              className={`mt-4 p-3 rounded text-center ${
                margenReal < 15 ? "bg-red-900/50 text-red-200" : "bg-green-900/50 text-green-200"
              }`}
            >
              <div className="text-xs uppercase font-bold mb-1">Resultado del Día</div>
              <div className="text-2xl font-black">+{beneficioDia.toFixed(2)} €</div>
              <div className="text-xs">Margen Real: {margenReal.toFixed(1)}%</div>
            </div>

            {/* ✅ PRODUCIR LOTE: integración con Stock */}
            <div className="mt-4">
              <button
                className="w-full bg-blue-600 hover:bg-blue-700 transition text-white font-black py-3 rounded-lg"
                onClick={() => {
                  try {
                    const res = produceLoteFromCostes({
                      nombreReceta,
                      unidades,
                      lineas,
                    });

                    setProduccionMsg({
                      type: "ok",
                      text: `✅ Stock actualizado. Consumidos: ${res.consumed.length}. Omitidos: ${res.skipped.length}.`,
                      detail: res,
                    });
                  } catch (e) {
                    setProduccionMsg({
                      type: "err",
                      text: e?.message || "Error al producir lote",
                    });
                  }
                }}
              >
                Producir lote (descontar stock)
              </button>

              {produccionMsg && (
                <div
                  className="mt-3 p-3 rounded-lg text-sm"
                  style={{
                    background: produccionMsg.type === "ok" ? "rgba(34,197,94,.12)" : "rgba(239,68,68,.12)",
                    border: "1px solid rgba(255,255,255,.08)",
                  }}
                >
                  <div className="font-black">{produccionMsg.text}</div>

                  {produccionMsg.detail?.skipped?.length > 0 && (
                    <div className="mt-2 text-gray-300">
                      <div className="font-bold">Omitidos:</div>
                      <ul className="list-disc pl-5 mt-1">
                        {produccionMsg.detail.skipped.map((x, i) => (
                          <li key={i}>
                            {x.nombre} — {x.motivo}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
