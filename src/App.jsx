// src/App.jsx
import React from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";

import AppLayout from "./shared/layout/AppLayout.jsx";

import CostesPage from "./modules/costes/CostesPage.jsx";
import StockPage from "./modules/stock/StockPage.jsx";
import ForecastPage from "./modules/forecast/ForecastPage.jsx";
import SettingsPage from "./modules/settings/SettingsPage.jsx";

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/costes" replace />} />
          <Route path="/costes" element={<CostesPage />} />
          <Route path="/stock" element={<StockPage />} />
          <Route path="/forecast" element={<ForecastPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/costes" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
