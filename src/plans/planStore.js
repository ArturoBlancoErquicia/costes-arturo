// src/plans/planStore.js
import { PLANS } from "./plans";

const KEY = "ab_plan";

export function getPlan() {
  try {
    return localStorage.getItem(KEY) || PLANS.DEMO;
  } catch {
    return PLANS.DEMO;
  }
}

export function setPlan(plan) {
  try {
    localStorage.setItem(KEY, plan);
  } catch {
    // ignore
  }
}

export function clearPlan() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
