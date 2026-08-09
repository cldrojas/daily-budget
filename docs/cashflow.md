# 📊 Cashflow — cálculo de saldo diario

Utilidad en `lib/cashflow.ts` para calcular el saldo día a día a partir de
un saldo inicial y una lista de movimientos (ingresos/egresos) por fecha.

## Fórmula

```
saldo(día n) = saldo(día n-1) + ingresos(día n) - egresos(día n)
```

Cada día acumula el saldo del día anterior más su neto de movimientos.

## Interfaces

| Interface | Uso |
|---|---|
| `DailyMovement` | Un ingreso o egreso individual dentro de un día (`{ label, amount }`) |
| `CashflowDayInput` | Un día antes de calcular (`{ date, movements }`) |
| `CashflowDayResult` | Un día ya calculado — extiende `CashflowDayInput` agregando `netChange` y `balance` |

`amount` en `DailyMovement` es positivo para ingresos, negativo para egresos.

## Función

```ts
calculateDailyBalance(initialBalance: number, days: CashflowDayInput[]): CashflowDayResult[]
```

Recorre los días en orden, acumula el saldo y devuelve la lista completa con
`netChange` (neto del día) y `balance` (saldo acumulado al cierre de ese día).

## Ejemplo de uso

```ts
import { calculateDailyBalance, flujoAgosto2026 } from "@/lib/cashflow";

const resultado = calculateDailyBalance(30000, flujoAgosto2026);

console.log(resultado.at(-1)?.balance); // saldo al cierre del último día
```

`flujoAgosto2026` es un dataset de ejemplo incluido en el mismo archivo,
con datos reales de un caso de uso (colchón financiero personal, agosto 2026).

## Notas

- Sin dependencias externas — función pura, fácil de testear.
- Pensada para escenarios de ingreso variable/diario donde interesa ver el
  punto más ajustado del mes antes de que ocurra, no solo el balance final.

## Changelog

- **2026-08-06** — Se agrega `lib/cashflow.ts`: interfaces (`DailyMovement`,
  `CashflowDayInput`, `CashflowDayResult`) y función `calculateDailyBalance`.
