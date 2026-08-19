/**
 * types/cashflow-projection.ts
 *
 * Tipos para el motor de proyección de saldo: en vez de guardar días fijos
 * (como en lib/cashflow.ts), se guardan reglas recurrentes que se expanden
 * dinámicamente sobre un horizonte de tiempo configurable.
 */

/** Frecuencia con la que se aplica una regla recurrente */
export type RuleFrequency =
  | "daily-weekday" // lunes a viernes
  | "weekly" // un día fijo de la semana
  | "monthly" // un día fijo del mes
  | "every-n-days"; // cada N días desde la fecha de inicio

/** Configuración específica según el tipo de frecuencia */
export interface RuleFrequencyConfig {
  /** Día de la semana (0 = domingo ... 6 = sábado), usado con "weekly" */
  dayOfWeek?: number;
  /** Día del mes (1-31), usado con "monthly" */
  dayOfMonth?: number;
  /** Intervalo en días, usado con "every-n-days" */
  interval?: number;
}

/**
 * Una regla recurrente configurable por el usuario: representa un ingreso
 * o egreso que se repite según una frecuencia (ej. "arriendo, $20.000,
 * mensual, día 20").
 */
export interface RecurringRule {
  id: string;
  label: string;
  /** Monto: positivo = ingreso, negativo = egreso */
  amount: number;
  frequency: RuleFrequency;
  config: RuleFrequencyConfig;
  /** Si es false, la regla se ignora al proyectar (sin borrarla) */
  enabled?: boolean;
}

/** Configuración completa de una proyección de saldo */
export interface ProjectionConfig {
  /** Saldo con el que se parte */
  initialBalance: number;
  /** Fecha de inicio de la proyección, formato ISO (YYYY-MM-DD) */
  startDate: string;
  /** Cuántos días hacia adelante proyectar ("a x tiempo") */
  horizonDays: number;
  /** Reglas recurrentes que generan los movimientos día a día */
  rules: RecurringRule[];
}
