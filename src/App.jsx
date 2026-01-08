import React, { useState, useEffect } from 'react';
import { CONFIG_INICIAL, INGREDIENTES_BASE } from './data';
import { Configuracion } from './components/Configuracion';
import { Calculadora } from './components/Calculadora';
import { ChefHat, Package, Settings } from 'lucide-react';

const Inventario = ({ ingredientes, setIngredientes }) => {
  const [nuevo, setNuevo] = useState({ nombre: '', precio: 0, esHarina: false });
  const agregar = () => {
    if(!nuevo.nombre) return;
    setIngredientes([...ingredientes, { ...nuevo, id: Date.now(), origen: 'usuario' }]);
    setNuevo({ nombre: '', precio: 0, esHarina: false });
  };
  return (
    <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-xl font-bold mb-4 text-slate-800">Gestión de Materias Primas</h2>
        <div className="flex flex-col md:flex-row gap-2 mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <input placeholder="Nombre de ingrediente" className="border border-slate-300 p-2 rounded flex-grow" value={nuevo.nombre} onChange={e=>setNuevo({...nuevo, nombre: e.target.value})}/>
            <div className="flex gap-2">
                <input type="number" placeholder="Precio" className="border border-slate-300 p-2 rounded w-24" value={nuevo.precio} onChange={e=>setNuevo({...nuevo, precio: parseFloat(e.target.value)})}/>
                <label className="flex items-center gap-1 text-sm text-slate-600 font-medium cursor-pointer">
                    <input type="checkbox" className="w-4 h-4" checked={nuevo.esHarina} onChange={e=>setNuevo({...nuevo, esHarina: e.target.checked})}/> Harina
                </label>
                <button onClick={agregar} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition">Añadir</button>
            </div>
        </div>
        <div className="grid gap-2">
            {ingredientes.map(ing => (
                <div key={ing.id} className="flex justify-between items-center p-3 border-b border-slate-100 hover:bg-slate-50 transition">
                    <div className="flex items-center gap-2">
                        <span className={ing.esHarina ? 'font-bold text-amber-700' : 'text-slate-700'}>{ing.nombre}</span>
                        {ing.esHarina && <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">Harina 🌾</span>}
                    </div>
                    <span className="font-mono font-bold text-slate-600">{ing.precio.toFixed(2)} € / kg</span>
                </div>
            ))}
        </div>
    </div>
  );
};

function App() {
  const [activeTab, setActiveTab] = useState('calculadora');
  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem('ab_config');
    return saved ? JSON.parse(saved) : CONFIG_INICIAL;
  });
  const [ingredientes, setIngredientes] = useState(() => {
    const saved = localStorage.getItem('ab_ingredientes');
    return saved ? JSON.parse(saved) : INGREDIENTES_BASE;
  });

  useEffect(() => localStorage.setItem('ab_config', JSON.stringify(config)), [config]);
  useEffect(() => localStorage.setItem('ab_ingredientes', JSON.stringify(ingredientes)), [ingredientes]);

  return (
    <div className="min-h-screen bg-slate-100 pb-20 font-sans">
      <header className="bg-slate-900 text-white p-4 shadow-xl border-b-4 border-blue-600 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
            <h1 className="text-xl md:text-2xl font-black tracking-tight uppercase">Arturo Blanco <span className="text-blue-400 font-light text-sm hidden md:inline ml-2">| Herramienta de Costes v2</span></h1>
        </div>
      </header>
      <nav className="max-w-5xl mx-auto mt-8 px-4 flex gap-2 md:gap-4 overflow-x-auto no-scrollbar">
        <button onClick={() => setActiveTab('calculadora')} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-sm ${activeTab==='calculadora' ? 'bg-blue-600 text-white scale-105' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200'}`}>
            <ChefHat size={20}/> Escandallo
        </button>
        <button onClick={() => setActiveTab('inventario')} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-sm ${activeTab==='inventario' ? 'bg-blue-600 text-white scale-105' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200'}`}>
            <Package size={20}/> Materias Primas
        </button>
        <button onClick={() => setActiveTab('config')} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-sm ${activeTab==='config' ? 'bg-blue-600 text-white scale-105' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200'}`}>
            <Settings size={20}/> Obrador
        </button>
      </nav>
      <main className="max-w-5xl mx-auto mt-8 px-4">
        {activeTab === 'calculadora' && <Calculadora config={config} ingredientesDisponibles={ingredientes} />}
        {activeTab === 'inventario' && <Inventario ingredientes={ingredientes} setIngredientes={setIngredientes} />}
        {activeTab === 'config' && <Configuracion config={config} setConfig={setConfig} />}
      </main>
    </div>
  );
}

export default App;