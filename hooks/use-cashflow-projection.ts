/**
 * hooks/use-cashflow-projection.ts
 *
 * Recalcula la proyección de saldo cada vez que cambia la configuración
 * (reglas, saldo inicial, horizonte). El componente solo necesita mutar
 * `config` con setState; el hook se encarga de recalcular vía useMemo.
 */

"use client";

import { useMemo } from "react";
import { projectCashflow, findLowestBalanceDay } from "@/lib/cashflow-projection";
import type { ProjectionConfig } from "@/types/cashflow-projection";

export function useCashflowProjection(config: ProjectionConfig) {
  const results = useMemo(() => projectCashflow(config), [config]);

  const lowestBalanceDay = useMemo(() => findLowestBalanceDay(results), [results]);

  const finalBalance = results.at(-1)?.balance ?? config.initialBalance;

  return { results, lowestBalanceDay, finalBalance };
}
