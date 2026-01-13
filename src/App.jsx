import React from "react";
import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import AppLayout from "./shared/layout/AppLayout";

import CostesPage from "./modules/costes/CostesPage";
import StockPage from "./modules/stock/StockPage";
import ForecastPage from "./modules/forecast/ForecastPage";
import SettingsPage from "./modules/settings/SettingsPage";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<AppLayout />}>
          {/* ✅ root -> costes */}
          <Route path="/" element={<Navigate to="/costes" replace />} />

          <Route path="/costes" element={<CostesPage />} />
          <Route path="/stock" element={<StockPage />} />
          <Route path="/forecast" element={<ForecastPage />} />
          <Route path="/settings" element={<SettingsPage />} />

          {/* ✅ fallback */}
          <Route path="*" element={<Navigate to="/costes" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}
