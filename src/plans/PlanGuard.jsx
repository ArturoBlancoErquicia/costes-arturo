// src/plans/PlanGuard.jsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getPlan } from "./planStore";
import { hasFeature } from "./plans";

export function PlanGuard({ feature, children }) {
  const location = useLocation();
  const plan = getPlan();

  if (!hasFeature(plan, feature)) {
    return (
      <Navigate
        to="/upgrade"
        replace
        state={{ from: location.pathname, feature, plan }}
      />
    );
  }

  return children;
}
