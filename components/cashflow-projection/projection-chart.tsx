"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import type { CashflowDayResult } from "@/lib/cashflow";

interface ProjectionChartProps {
  results: CashflowDayResult[];
  selectedDate: string | null;
  onSelectDay: (date: string) => void;
}

export function ProjectionChart({ results, selectedDate, onSelectDay }: ProjectionChartProps) {
  const data = results.map((r) => ({
    date: r.date,
    saldo: r.balance,
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          onClick={(e) => {
            const label = e?.activeLabel;
            if (typeof label === "string") onSelectDay(label);
          }}
        >
          <defs>
            <linearGradient id="saldoFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="currentColor" stopOpacity={0.3} />
              <stop offset="95%" stopColor="currentColor" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis
            dataKey="date"
            tickFormatter={(d: string) => d.slice(8, 10)}
            fontSize={12}
          />
          <YAxis
            tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
            fontSize={12}
            width={50}
          />
          <ReferenceLine y={0} stroke="hsl(var(--destructive))" strokeDasharray="4 4" />
          <Tooltip
            formatter={(value: number) => [`$${value.toLocaleString("es-CL")}`, "Saldo"]}
            labelFormatter={(label: string) => label}
          />
          <Area
            type="monotone"
            dataKey="saldo"
            stroke="currentColor"
            fill="url(#saldoFill)"
            strokeWidth={2}
            className="text-primary"
            dot={(props) => {
              const isSelected = props.payload.date === selectedDate;
              return (
                <circle
                  key={props.payload.date}
                  cx={props.cx}
                  cy={props.cy}
                  r={isSelected ? 5 : 2}
                  fill={isSelected ? "hsl(var(--primary))" : "currentColor"}
                  className="cursor-pointer text-primary"
                />
              );
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
      <p className="text-xs text-muted-foreground text-center mt-1">
        Click en cualquier punto del gráfico para ver la fórmula de ese día
      </p>
    </div>
  );
}
