"use client";

import { v4 as uuidv4 } from "uuid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Plus } from "lucide-react";
import type { RecurringRule, RuleFrequency } from "@/types/cashflow-projection";

interface RuleEditorProps {
  rules: RecurringRule[];
  onChange: (rules: RecurringRule[]) => void;
}

const FREQUENCY_LABELS: Record<RuleFrequency, string> = {
  "daily-weekday": "Diario (lu-vi)",
  weekly: "Semanal",
  monthly: "Mensual",
  "every-n-days": "Cada N días",
};

const WEEKDAYS = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
];

function emptyRule(): RecurringRule {
  return {
    id: uuidv4(),
    label: "",
    amount: 0,
    frequency: "monthly",
    config: { dayOfMonth: 1 },
    enabled: true,
  };
}

export function RuleEditor({ rules, onChange }: RuleEditorProps) {
  const updateRule = (id: string, patch: Partial<RecurringRule>) => {
    onChange(rules.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const updateRuleConfig = (id: string, configPatch: RecurringRule["config"]) => {
    onChange(
      rules.map((r) => (r.id === id ? { ...r, config: { ...r.config, ...configPatch } } : r))
    );
  };

  const addRule = () => onChange([...rules, emptyRule()]);
  const removeRule = (id: string) => onChange(rules.filter((r) => r.id !== id));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Condiciones de ingreso y egreso</CardTitle>
        <Button size="sm" variant="outline" onClick={addRule}>
          <Plus className="h-4 w-4 mr-1" />
          Agregar
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {rules.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Sin reglas todavía. Agrega ingresos y egresos recurrentes para proyectar tu saldo.
          </p>
        )}

        {rules.map((rule) => (
          <div
            key={rule.id}
            className="grid grid-cols-2 sm:grid-cols-12 gap-3 sm:items-end border-b pb-4"
          >
            <div className="col-span-2 sm:col-span-3">
              <Label htmlFor={`label-${rule.id}`}>Concepto</Label>
              <Input
                id={`label-${rule.id}`}
                value={rule.label}
                placeholder="Arriendo, ingreso, etc."
                onChange={(e) => updateRule(rule.id, { label: e.target.value })}
              />
            </div>

            <div className="col-span-1 sm:col-span-2">
              <Label htmlFor={`amount-${rule.id}`}>Monto</Label>
              <Input
                id={`amount-${rule.id}`}
                type="number"
                value={rule.amount}
                onChange={(e) => updateRule(rule.id, { amount: Number(e.target.value) })}
              />
              <p className="text-xs text-muted-foreground mt-1">+ ingreso / - egreso</p>
            </div>

            <div className="col-span-1 sm:col-span-3">
              <Label htmlFor={`freq-${rule.id}`}>Frecuencia</Label>
              <Select
                value={rule.frequency}
                onValueChange={(value: RuleFrequency) =>
                  updateRule(rule.id, {
                    frequency: value,
                    config:
                      value === "weekly"
                        ? { dayOfWeek: 0 }
                        : value === "monthly"
                          ? { dayOfMonth: 1 }
                          : value === "every-n-days"
                            ? { interval: 30 }
                            : {},
                  })
                }
              >
                <SelectTrigger id={`freq-${rule.id}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(FREQUENCY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 sm:col-span-3">
              {rule.frequency === "weekly" && (
                <>
                  <Label htmlFor={`dow-${rule.id}`}>Día de la semana</Label>
                  <Select
                    value={String(rule.config.dayOfWeek ?? 0)}
                    onValueChange={(value) =>
                      updateRuleConfig(rule.id, { dayOfWeek: Number(value) })
                    }
                  >
                    <SelectTrigger id={`dow-${rule.id}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {WEEKDAYS.map((d) => (
                        <SelectItem key={d.value} value={String(d.value)}>
                          {d.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              )}

              {rule.frequency === "monthly" && (
                <>
                  <Label htmlFor={`dom-${rule.id}`}>Día del mes</Label>
                  <Input
                    id={`dom-${rule.id}`}
                    type="number"
                    min={1}
                    max={31}
                    value={rule.config.dayOfMonth ?? 1}
                    onChange={(e) =>
                      updateRuleConfig(rule.id, { dayOfMonth: Number(e.target.value) })
                    }
                  />
                </>
              )}

              {rule.frequency === "every-n-days" && (
                <>
                  <Label htmlFor={`interval-${rule.id}`}>Cada cuántos días</Label>
                  <Input
                    id={`interval-${rule.id}`}
                    type="number"
                    min={1}
                    value={rule.config.interval ?? 1}
                    onChange={(e) =>
                      updateRuleConfig(rule.id, { interval: Number(e.target.value) })
                    }
                  />
                </>
              )}

              {rule.frequency === "daily-weekday" && (
                <p className="text-xs text-muted-foreground sm:pt-6">Se aplica lunes a viernes</p>
              )}
            </div>

            <div className="col-span-2 sm:col-span-1 flex justify-end">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => removeRule(rule.id)}
                aria-label="Eliminar regla"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
