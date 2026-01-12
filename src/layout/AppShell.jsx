// src/layout/AppShell.jsx
import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { ChefHat, Package, LayoutDashboard, BadgeEuro, Settings } from "lucide-react";
import { PLANS } from "../plans/plans";
import { getPlan, setPlan } from "../plans/planStore";

const linkBase =
  "flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition border";
const linkActive = "bg-blue-600 text-white border-blue-600";
const linkIdle = "bg-white text-slate-600 border-slate-200 hover:bg-slate-50";

export default function AppShell() {
  const [plan, setPlanState] = React.useState(getPlan());

  const onChangePlan = (e) => {
    const p = e.target.value;
    setPlan(p);
    setPlanState(p);
    // recarga suave para re-evaluar guards sin complicarnos
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-slate-900 text-white p-4 shadow-xl border-b-4 border-blue-600 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <LayoutDashboard />
            <div className="leading-tight">
              <div className="text-lg font-black tracking-tight uppercase">
                Arturo Blanco
              </div>
              <div className="text-xs text-slate-300">
                Suite Panadería — Costes + Stock (modo {plan})
              </div>
            </div>
          </div>

          {/* Selector de plan (DEMO para vender por módulos sin pagos aún) */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-300 hidden sm:inline">Plan:</span>
            <select
              value={plan}
              onChange={onChangePlan}
              className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2"
              title="Simulador de plan (luego lo conectamos a suscripción real)"
            >
              <option value={PLANS.DEMO}>DEMO (todo)</option>
              <option value={PLANS.COSTES}>Solo Costes</option>
              <option value={PLANS.STOCK}>Solo Stock</option>
              <option value={PLANS.PRO}>PRO (Costes+Stock)</option>
            </select>
          </div>
        </div>
      </header>

      <nav className="max-w-6xl mx-auto mt-6 px-4 flex gap-2 overflow-x-auto">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `${linkBase} ${isActive ? linkActive : linkIdle}`
          }
          end
        >
          <LayoutDashboard size={18} /> Inicio
        </NavLink>

        <NavLink
          to="/costes"
          className={({ isActive }) =>
            `${linkBase} ${isActive ? linkActive : linkIdle}`
          }
        >
          <ChefHat size={18} /> Costes
        </NavLink>

        <NavLink
          to="/stock"
          className={({ isActive }) =>
            `${linkBase} ${isActive ? linkActive : linkIdle}`
          }
        >
          <Package size={18} /> Stock
        </NavLink>

        <NavLink
          to="/upgrade"
          className={({ isActive }) =>
            `${linkBase} ${isActive ? linkActive : linkIdle}`
          }
        >
          <BadgeEuro size={18} /> Planes
        </NavLink>

        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `${linkBase} ${isActive ? linkActive : linkIdle}`
          }
        >
          <Settings size={18} /> Ajustes
        </NavLink>
      </nav>

      <main className="max-w-6xl mx-auto mt-6 px-4 pb-16">
        <Outlet />
      </main>
    </div>
  );
}
