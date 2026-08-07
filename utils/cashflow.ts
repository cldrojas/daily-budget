/**
 * cashflow.ts
 *
 * Replica la fórmula de saldo diario usada en el Excel/Sheets del colchón
 * financiero: saldo(día n) = saldo(día n-1) + ingresos(día n) - egresos(día n)
 */

/** Un movimiento (ingreso o egreso) dentro de un día específico */
export interface DailyMovement {
  /** Etiqueta del movimiento, ej. "transporte", "telefono", "ingreso" */
  label: string;
  /** Monto positivo (ingreso) o negativo (egreso), en CLP */
  amount: number;
}

/** Un día del flujo de caja, antes de calcular el saldo */
export interface CashflowDayInput {
  /** Fecha en formato ISO (YYYY-MM-DD) o etiqueta libre, ej. "2026-08-05" */
  date: string;
  /** Lista de movimientos de ese día (puede estar vacía) */
  movements: DailyMovement[];
}

/** Un día del flujo de caja, ya con el saldo acumulado calculado */
export interface CashflowDayResult extends CashflowDayInput {
  /** Suma neta de movimientos de ese día (ingresos - egresos) */
  netChange: number;
  /** Saldo acumulado al cierre de ese día */
  balance: number;
}

/**
 * Calcula el saldo diario acumulado a partir de un saldo inicial
 * y una lista ordenada de días con sus movimientos.
 *
 * Fórmula aplicada por día:
 *   netChange = sum(movements[i].amount)
 *   balance   = balance(día anterior) + netChange
 *
 * @param initialBalance Saldo con el que se parte (ej. 30000)
 * @param days Lista de días ordenada cronológicamente
 * @returns Lista de días con netChange y balance calculados
 */
export function calculateDailyBalance(
  initialBalance: number,
  days: CashflowDayInput[]
): CashflowDayResult[] {
  let runningBalance = initialBalance;

  return days.map((day) => {
    const netChange = day.movements.reduce((sum, m) => sum + m.amount, 0);
    runningBalance += netChange;

    return {
      ...day,
      netChange,
      balance: runningBalance,
    };
  });
}

/**
 * Ejemplo de uso: datos reales del flujo de agosto 2026
 * (misma tabla que la del Google Sheet "Flujo agosto - colchón financiero")
 */
export const flujoAgosto2026: CashflowDayInput[] = [
  { date: "2026-08-01", movements: [] }, // Sáb 1 - saldo inicial
  { date: "2026-08-02", movements: [{ label: "transporte", amount: -10000 }] },
  { date: "2026-08-03", movements: [{ label: "ingreso", amount: 10000 }] },
  { date: "2026-08-04", movements: [{ label: "ingreso", amount: 10000 }] },
  {
    date: "2026-08-05",
    movements: [
      { label: "ingreso", amount: 10000 },
      { label: "telefono", amount: -20000 },
      { label: "coopeuch", amount: -6700 },
    ],
  },
  {
    date: "2026-08-06",
    movements: [
      { label: "ingreso", amount: 10000 },
      { label: "spotify", amount: -7000 },
    ],
  },
  { date: "2026-08-07", movements: [{ label: "ingreso", amount: 10000 }] },
  { date: "2026-08-08", movements: [] },
  { date: "2026-08-09", movements: [{ label: "transporte", amount: -10000 }] },
  {
    date: "2026-08-10",
    movements: [
      { label: "ingreso", amount: 10000 },
      { label: "vacuna triple felina", amount: -16000 },
    ],
  },
  { date: "2026-08-11", movements: [{ label: "ingreso", amount: 10000 }] },
  {
    date: "2026-08-12",
    movements: [
      { label: "ingreso", amount: 10000 },
      { label: "arena (tu mitad)", amount: -20000 },
    ],
  },
  { date: "2026-08-13", movements: [{ label: "ingreso", amount: 10000 }] },
  { date: "2026-08-14", movements: [{ label: "ingreso", amount: 10000 }] },
  { date: "2026-08-15", movements: [] },
  { date: "2026-08-16", movements: [{ label: "transporte", amount: -10000 }] },
  {
    date: "2026-08-17",
    movements: [
      { label: "ingreso", amount: 10000 },
      { label: "pipetas", amount: -16000 },
    ],
  },
  { date: "2026-08-18", movements: [{ label: "ingreso", amount: 10000 }] },
  { date: "2026-08-19", movements: [{ label: "ingreso", amount: 10000 }] },
  {
    date: "2026-08-20",
    movements: [
      { label: "ingreso", amount: 10000 },
      { label: "arriendo mama", amount: -20000 },
    ],
  },
  { date: "2026-08-21", movements: [{ label: "ingreso", amount: 10000 }] },
  { date: "2026-08-22", movements: [] },
  { date: "2026-08-23", movements: [{ label: "transporte", amount: -10000 }] },
  { date: "2026-08-24", movements: [{ label: "ingreso", amount: 10000 }] },
  { date: "2026-08-25", movements: [{ label: "ingreso", amount: 10000 }] },
  { date: "2026-08-26", movements: [{ label: "ingreso", amount: 10000 }] },
  { date: "2026-08-27", movements: [{ label: "ingreso", amount: 10000 }] },
  { date: "2026-08-28", movements: [{ label: "ingreso", amount: 10000 }] },
  { date: "2026-08-29", movements: [] },
  { date: "2026-08-30", movements: [{ label: "transporte", amount: -10000 }] },
  { date: "2026-08-31", movements: [{ label: "ingreso", amount: 10000 }] },
];
