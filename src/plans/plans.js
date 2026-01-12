// src/plans/plans.js

export const PLANS = {
  DEMO: "demo",
  COSTES: "costes",
  STOCK: "stock",
  PRO: "pro", // pack costes+stock
};

// qué módulos habilita cada plan
export const PLAN_FEATURES = {
  [PLANS.DEMO]: { costes: true, stock: true }, // demo: todo abierto
  [PLANS.COSTES]: { costes: true, stock: false },
  [PLANS.STOCK]: { costes: false, stock: true },
  [PLANS.PRO]: { costes: true, stock: true },
};

export function hasFeature(plan, feature) {
  const f = PLAN_FEATURES[plan] ?? PLAN_FEATURES[PLANS.DEMO];
  return !!f[feature];
}
