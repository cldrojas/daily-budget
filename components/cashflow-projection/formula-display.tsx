"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { CashflowDayResult } from "@/lib/cashflow";

interface FormulaDisplayProps {
  day: CashflowDayResult | undefined;
  previousBalance: number | undefined;
}

function formatCLP(value: number): string {
  return value.toLocaleString("es-CL");
}

/**
 * Muestra la fórmula de saldo diario con los valores reales sustituidos
 * para el día seleccionado:
 *   saldo(fecha) = saldo_anterior ± |netChange| = balance
 */
export function FormulaDisplay({ day, previousBalance }: FormulaDisplayProps) {
  if (!day) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            Selecciona un día en el gráfico para ver la fórmula aplicada.
          </p>
        </CardContent>
      </Card>
    );
  }

  const prev = previousBalance ?? 0;
  const operator = day.netChange >= 0 ? "+" : "-";

  return (
    <Card>
      <CardContent className="pt-6 space-y-2">
        <p className="text-sm text-muted-foreground">{day.date}</p>
        <p className="font-mono text-sm sm:text-base break-words">
          saldo({day.date}) = {formatCLP(prev)} {operator} {formatCLP(Math.abs(day.netChange))}
          {" = "}
          <strong className={day.balance < 0 ? "text-destructive" : ""}>
            ${formatCLP(day.balance)}
          </strong>
        </p>

        {day.movements.length > 0 && (
          <ul className="text-sm text-muted-foreground list-disc list-inside pt-2">
            {day.movements.map((m, i) => (
              <li key={i}>
                {m.label}: {m.amount >= 0 ? "+" : ""}
                {formatCLP(m.amount)}
              </li>
            ))}
          </ul>
        )}

        {day.balance < 0 && (
          <p className="text-sm text-destructive font-medium pt-2">
            ⚠️ Saldo negativo proyectado este día.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
