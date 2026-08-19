# 📈 Proyección de saldo (cashflow-projection)

Componente y motor de proyección de saldo a futuro, configurable por el
usuario: define reglas de ingreso/egreso recurrentes (día de pago, monto,
frecuencia) y visualiza cómo evoluciona el saldo a lo largo del tiempo,
incluyendo el punto más ajustado del período.

Construido sobre la utilidad base [`lib/cashflow.ts`](./cashflow.md) — no
la reemplaza, la extiende.

## Diferencia con `lib/cashflow.ts`

| | `lib/cashflow.ts` | `lib/cashflow-projection.ts` |
|---|---|---|
| Entrada | Lista fija de días con movimientos ya definidos | Reglas recurrentes + horizonte de tiempo |
| Uso típico | Un mes ya conocido, con montos y fechas específicas | Proyección configurable, horizonte variable, editable en UI |
| Relación | Motor de cálculo base | Genera el input para `calculateDailyBalance` |

## Estructura de archivos

```
types/cashflow-projection.ts       # RecurringRule, ProjectionConfig
lib/cashflow-projection.ts         # expandRulesToDays, projectCashflow
hooks/use-cashflow-projection.ts   # useCashflowProjection (memoización)
components/cashflow-projection/
  index.tsx                        # componente raíz, arma todo
  rule-editor.tsx                  # form para agregar/editar reglas
  projection-chart.tsx             # gráfico de saldo (recharts)
  formula-display.tsx              # fórmula con valores reales del día
```

## Modelo de datos

Una `RecurringRule` representa un ingreso o egreso que se repite:

```ts
{
  id: "uuid",
  label: "Arriendo",
  amount: -20000,        // negativo = egreso, positivo = ingreso
  frequency: "monthly",
  config: { dayOfMonth: 20 }
}
```

Frecuencias soportadas: `daily-weekday` (lu-vi), `weekly` (día fijo de
semana), `monthly` (día fijo del mes), `every-n-days` (cada N días desde
`startDate`).

## Cómo se calcula

1. `expandRulesToDays(config)` recorre cada día del horizonte y evalúa qué
   reglas aplican ese día (`ruleAppliesOnDate`), generando un
   `CashflowDayInput[]`.
2. Ese resultado se pasa a `calculateDailyBalance` (de `lib/cashflow.ts`),
   que aplica la fórmula ya documentada:
   ```
   saldo(día n) = saldo(día n-1) + ingresos(día n) - egresos(día n)
   ```
3. `projectCashflow(config)` encadena ambos pasos — es el único punto de
   entrada que necesitan los componentes.

## Uso

```tsx
import { CashflowProjection } from "@/components/cashflow-projection";

<CashflowProjection
  initialConfig={{
    initialBalance: 30000,
    startDate: "2026-08-01",
    horizonDays: 90,
    rules: [
      { id: "1", label: "Ingreso diario", amount: 10000, frequency: "daily-weekday", config: {} },
      { id: "2", label: "Transporte", amount: -10000, frequency: "weekly", config: { dayOfWeek: 0 } },
      { id: "3", label: "Arriendo", amount: -20000, frequency: "monthly", config: { dayOfMonth: 20 } },
    ],
  }}
/>
```

El usuario puede modificar cualquier condición (monto, día de pago,
frecuencia, saldo inicial, horizonte) desde la UI — el gráfico y la
fórmula se recalculan automáticamente vía `useMemo` en
`useCashflowProjection`, sin necesidad de sincronización manual de estado.

## Visualización de la fórmula

Al hacer click en cualquier punto del gráfico, `FormulaDisplay` muestra la
fórmula de saldo con los valores reales sustituidos para ese día
específico, no una fórmula abstracta:

```
saldo(2026-08-12) = 30.300 - 20.000 = $20.300 ⚠️ Punto ajustado
```

## Dependencias

Usa librerías ya presentes en el proyecto — no se agregó nada nuevo:
`recharts` (gráfico), `uuid` (ids de reglas), componentes de
`components/ui/*` (Radix UI ya instalado).

## Changelog

- **2026-08-12** — Se agrega el motor de proyección completo: tipos, motor
  de expansión de reglas, hook de memoización y los cuatro componentes de
  UI (`RuleEditor`, `ProjectionChart`, `FormulaDisplay`,
  `CashflowProjection`).
