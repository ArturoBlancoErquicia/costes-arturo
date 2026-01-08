import React from 'react';
import { Settings, Save } from 'lucide-react';

export const Configuracion = ({ config, setConfig }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setConfig({ ...config, [name]: parseFloat(value) || 0 });
  };

  const handleChangeTexto = (e) => {
    setConfig({ ...config, [e.target.name]: e.target.value });
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 animate-fade-in">
      <div className="flex items-center gap-3 mb-6 border-b pb-4">
        <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
          <Settings size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">Configuración del Obrador</h2>
          <p className="text-sm text-gray-500">Estos datos se usarán para calcular tus costes fijos.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Nombre del Negocio</label>
          <input type="text" name="nombreObrador" value={config.nombreObrador} onChange={handleChangeTexto} className="w-full border p-2 rounded" />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Coste Personal (€/hora)</label>
          <input type="number" name="costeHoraPersonal" value={config.costeHoraPersonal} onChange={handleChange} className="w-full border p-2 rounded" />
          <p className="text-xs text-gray-400 mt-1">Incluye seguridad social</p>
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Coste Energía Horno (€/hora)</label>
          <input type="number" name="costeHoraHorno" value={config.costeHoraHorno} onChange={handleChange} className="w-full border p-2 rounded" />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Gastos Fijos Mensuales (€)</label>
          <input type="number" name="gastosFijosMensuales" value={config.gastosFijosMensuales} onChange={handleChange} className="w-full border p-2 rounded" />
          <p className="text-xs text-gray-400 mt-1">Alquiler, gestoría, agua, seguros...</p>
        </div>
      </div>
    </div>
  );
};