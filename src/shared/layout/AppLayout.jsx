// src/shared/layout/AppLayout.jsx
import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { ChefHat, Package, LineChart, Settings } from "lucide-react";

function Tab({ to, icon: Icon, label, end = false }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        [
          "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition",
          isActive
            ? "bg-slate-900 text-white shadow"
            : "text-slate-700 hover:bg-slate-100",
        ].join(" ")
      }
    >
      <Icon size={16} />
      <span>{label}</span>
    </NavLink>
  );
}

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-5xl px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-lg font-semibold leading-tight">
                Arturo Blanco
              </div>
              <div className="text-xs text-slate-500">
                Suite Panadería · Costes · Stock · Previsión
              </div>
            </div>

            <nav className="flex items-center gap-2">
              <Tab to="/costes" icon={ChefHat} label="Costes" end />
              <Tab to="/stock" icon={Package} label="Existencias" />
              <Tab to="/forecast" icon={LineChart} label="Previsión" />
              <Tab to="/settings" icon={Settings} label="Ajustes" />
            </nav>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
