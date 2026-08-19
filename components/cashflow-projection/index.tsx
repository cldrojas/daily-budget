"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RuleEditor } from "./rule-editor";
import { ProjectionChart } from "./projection-chart";
import { FormulaDisplay } from "./formula-display";
import { useCashflowProjection } from "@/hooks/use-cashflow-projection";
import type { ProjectionConfig } from "@/types/cashflow-projection";

const DEFAULT_CONFIG: ProjectionConfig = {
  initialBalance: 30000,
  startDate: new Date().toISOString().slice(0, 10),
  horizonDays: 30,
  rules: [],
};

interface CashflowProjectionProps {
  initialConfig?: ProjectionConfig;
}

/**
 * Componente raíz de la proyección de saldo. El usuario configura:
 * - saldo inicial
 * - fecha de inicio
 * - horizonte de proyección ("a x tiempo")
 * - reglas de ingreso/egreso (día de pago, monto, frecuencia)
 *
 * Y ve en tiempo real cómo cambia el saldo proyectado, incluyendo el
 * punto más ajustado del período y la fórmula aplicada día a día.
 */
export function CashflowProjection({ initialConfig = DEFAULT_CONFIG }: CashflowProjectionProps) {
  const [config, setConfig] = useState<ProjectionConfig>(initialConfig);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const { results, lowestBalanceDay, finalBalance } = useCashflowProjection(config);

  const selectedIndex = results.findIndex((r) => r.date === selectedDate);
  const selectedDay = selectedIndex >= 0 ? results[selectedIndex] : undefined;
  const previousBalance =
    selectedIndex > 0 ? results[selectedIndex - 1].balance : config.initialBalance;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Configuración de la proyección</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="initial-balance">Saldo inicial</Label>
            <Input
              id="initial-balance"
              type="number"
              value={config.initialBalance}
              onChange={(e) =>
                setConfig({ ...config, initialBalance: Number(e.target.value) })
              }
            />
          </div>
          <div>
            <Label htmlFor="start-date">Fecha de inicio</Label>
            <Input
              id="start-date"
              type="date"
              value={config.startDate}
              onChange={(e) => setConfig({ ...config, startDate: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="horizon">Días a proyectar</Label>
            <Input
              id="horizon"
              type="number"
              min={1}
              max={730}
              value={config.horizonDays}
              onChange={(e) =>
                setConfig({ ...config, horizonDays: Number(e.target.value) })
              }
            />
          </div>
        </CardContent>
      </Card>

      <RuleEditor rules={config.rules} onChange={(rules) => setConfig({ ...config, rules })} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Proyección de saldo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Saldo final proyectado</p>
              <p className="text-lg font-semibold">${finalBalance.toLocaleString("es-CL")}</p>
            </div>
            {lowestBalanceDay && (
              <div>
                <p className="text-muted-foreground">Punto más ajustado</p>
                <p
                  className={`text-lg font-semibold ${
                    lowestBalanceDay.balance < 0 ? "text-destructive" : ""
                  }`}
                >
                  ${lowestBalanceDay.balance.toLocaleString("es-CL")}
                  <span className="text-sm text-muted-foreground font-normal ml-2">
                    ({lowestBalanceDay.date})
                  </span>
                </p>
              </div>
            )}
          </div>

          <ProjectionChart
            results={results}
            selectedDate={selectedDate}
            onSelectDay={setSelectedDate}
          />
        </CardContent>
      </Card>

      <FormulaDisplay day={selectedDay} previousBalance={previousBalance} />
    </div>
  );
}
