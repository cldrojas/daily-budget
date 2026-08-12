/**
 * lib/cashflow-projection.ts
 *
 * Motor de proyección: expande reglas recurrentes (RecurringRule) en una
 * lista de días (CashflowDayInput) para un horizonte de tiempo dado, y
 * reutiliza calculateDailyBalance de lib/cashflow.ts para el cálculo real
 * de saldo. No duplica esa lógica, solo la alimenta con datos generados.
 */

import { calculateDailyBalance, type CashflowDayInput, type CashflowDayResult } from "./cashflow";
import type { ProjectionConfig, RecurringRule } from "@/types/cashflow-projection";

/** Determina si una regla aplica en una fecha específica */
export function ruleAppliesOnDate(rule: RecurringRule, date: Date, startDate: Date): boolean {
  if (rule.enabled === false) return false;

  switch (rule.frequency) {
    case "daily-weekday": {
      const day = date.getDay();
      return day >= 1 && day <= 5; // lunes(1) a viernes(5)
    }
    case "weekly": {
      return date.getDay() === rule.config.dayOfWeek;
    }
    case "monthly": {
      return date.getDate() === rule.config.dayOfMonth;
    }
    case "every-n-days": {
      const interval = rule.config.interval ?? 1;
      const diffDays = Math.round(
        (date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      return diffDays >= 0 && diffDays % interval === 0;
    }
    default:
      return false;
  }
}

/**
 * Expande las reglas recurrentes de una configuración en una lista de días
 * con sus movimientos correspondientes, lista para pasarle a
 * calculateDailyBalance.
 */
export function expandRulesToDays(config: ProjectionConfig): CashflowDayInput[] {
  const start = new Date(`${config.startDate}T00:00:00`);
  const days: CashflowDayInput[] = [];

  for (let i = 0; i < config.horizonDays; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);

    const movements = config.rules
      .filter((rule) => ruleAppliesOnDate(rule, date, start))
      .map((rule) => ({ label: rule.label, amount: rule.amount }));

    days.push({ date: date.toISOString().slice(0, 10), movements });
  }

  return days;
}

/**
 * Corre la proyección completa: expande las reglas y calcula el saldo
 * acumulado día a día. Punto de entrada único para los componentes/hooks.
 */
export function projectCashflow(config: ProjectionConfig): CashflowDayResult[] {
  const days = expandRulesToDays(config);
  return calculateDailyBalance(config.initialBalance, days);
}

/** Encuentra el día con el saldo más bajo de una proyección (el "punto crítico") */
export function findLowestBalanceDay(results: CashflowDayResult[]): CashflowDayResult | undefined {
  if (results.length === 0) return undefined;
  return results.reduce((lowest, current) => (current.balance < lowest.balance ? current : lowest));
}
