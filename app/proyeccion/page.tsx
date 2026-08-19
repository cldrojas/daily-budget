"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CashflowProjection } from "@/components/cashflow-projection";

export default function ProyeccionPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/">
          <Button variant="ghost" size="icon" aria-label="Volver">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-xl font-semibold">Proyección de saldo</h1>
      </div>

      <p className="text-sm text-muted-foreground">
        Configura tus reglas de ingreso y egreso (monto, día de pago, frecuencia) y
        visualiza cómo evoluciona tu saldo a futuro. Haz click en cualquier punto
        del gráfico para ver la fórmula aplicada ese día.
      </p>

      <CashflowProjection />
    </main>
  );
}
