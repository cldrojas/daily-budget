# PRD: Fecha Tope y Cálculo de Budget como Opcional

**Fecha:** 2026-05-11
**Proyecto:** Saldo Cero
**Autor:** Product Owner
**Estado:** Draft

---

## 1. Problem Statement

### Contexto Actual
El flujo de "Saldo Cero" actualmente **obliga** al usuario a definir:
1. Un **monto inicial** (startAmount) — capital disponible
2. Una **fecha tope** (endDate) — cuándo termina el período

Esta fecha límite es usada para calcular:
- Los **días restantes** del período
- El **presupuesto diario** (`startAmount / días restantes`)
- El **contador regresivo** en la UI

### Problema Identificado
No todos los usuarios quieren un "período cerrado" con fecha límite. Algunos prefieren:

- **Modo registrador**: Usar Saldo Cero solo para registrar transacciones y ver balances por cuenta, sin límite temporal
- **Capital infinito**: Comenzar con un monto inicial y simplemente rastrear gastos, sin que el presupuesto se "agote"
- **Seguimiento abierto**: Preferir ver "cuánto tengo disponible" en vez de "cuánto me queda por día hasta X fecha"

La fecha límite agrega ansiedad innecesaria cuando el usuario solo quiere **organizar sus finanzas sin presión de tiempo**.

---

## 2. Objetivo

Permitir que el flujo de Saldo Cero funcione **sin fecha tope obligatoria**, manteniendo la funcionalidad existente para usuarios que sí la quieran.

**Modos de uso:**
| Modo | endDate | Comportamiento |
|------|---------|----------------|
| Prespuesto por días | Requerido | Calcula presupuesto diario, countdown, progreso |
| Registro infinito | Omitido/null | Suma/resta a capital, NO divide por días, NO countdown |

---

## 3. Alcance

### Funcionalidades a agregar/modificar

#### 3.1 UI — SetupForm (`components/setup-form.tsx`)
- Toggle o checkbox: "¿Quieres definir una fecha límite?"
  - Si NO → el campo de fecha se oculta/deshabilita
  - Si SÍ → muestra DatePicker obligatorio
- El botón "Iniciar" se habilita si:
  - `startAmount` es válido (> 0) Y
  - (`endDate` existe) O (el toggle de fecha límite está desactivado)

#### 3.2 UI — ConfigForm (`components/config-form.tsx`)
- Mismo toggle para modificar la configuración post-setup
- Validación actualizada (solo requiere endDate si el toggle está activo)
- Mostrar diferenciación visual: "Modo: Presupuesto por días" vs "Modo: Registro infinito"

#### 3.3 Tipos — Budget (`types/index.ts`)
```typescript
export type Budget = {
  startAmount: Int
  startDate: Date | undefined
  endDate: Date | undefined      // Ya es opcional: Date | undefined
  autoSave: boolean
  hasEndDate: boolean           // NUEVO: flag explícito para modo
}
```

#### 3.4 Lógica — useBudget (`hooks/use-budget.tsx`)
Modificar cálculos para manejar ambos casos:

```typescript
const isBudgetMode = budget.endDate !== undefined

// Si es modo presupuesto:
dailyAllowance = startAmount / daysRemaining

// Si es modo registro:
dailyAllowance = null  // No aplica, no hay "diario"
remaining = startAmount ± transactions
```

**Casos a cubrir:**
| Escenario | endDate | startDate | Comportamiento |
|-----------|---------|-----------|----------------|
| Nuevo usuario vacío | - | - | Muestra setup-form |
| Setup presupuesto | 2026-06-11 | - | Presupuesto con días |
| Setup registro | - | - | Registro infinito |
| Editar presupuesto → registro | null | existe | Convierte a registro |
| Editar registro → presupuesto | 2026-07-01 | existe | Convierte a presupuesto |

#### 3.5 Componentes de UI
- **DailyBudgetStatus**: Mostrar countdown solo si hay endDate. Si no hay, mostrar "Capital: $X"
- **CircularProgress**: Ajustar lógica — si no hay endDate, mostrar progreso contra $0 (nunca llena)
- **TransactionHistory**: Sin cambios, funciona igual

#### 3.6 Translations (`contexts/language-context.tsx`)
Nuevas claves:
```
setupWithoutEndDate = "¿Quieres agregar fecha límite?"
setupWithoutEndDateDescription = "Si no agregas fecha, la app solo rastreará tus transacciones sin límite de tiempo."
modeBudget = "Modo presupuesto"
modeRegister = "Modo registro"
capitalAvailable = "Capital disponible"
```

---

## 4. User Stories

### US-1: Registro infinito
**Como** usuario que solo quiere rastrear sus gastos,
**Quiero** poder iniciar Saldo Cero sin fecha límite,
**Para** tener un registro de mis transacciones sin presión temporal.

**Criterios de aceptación:**
- [ ] Puedo completar setup sin ingresar fecha
- [ ] El campo de fecha se oculta cuando desactivo el toggle
- [ ] Mi capital se actualiza con cada transacción
- [ ] No veo countdown ni "días restantes"

### US-2: Cambiar de modo
**Como** usuario en modo registro,
**Quiero** poder agregar una fecha límite después,
**Para** convertir mi flujo en un presupuesto con límite de días.

**Criterios de aceptación:**
- [ ] Puedo editar la config para agregar fecha
- [ ] El sistema recalcula el presupuesto diario
- [ ] La UI muestra countdown correctamente

### US-3: Migración desde fecha a sin fecha
**Como** usuario con presupuesto activo,
**Quiero** poder desactivar la fecha límite,
**Para** que mi capital剩余 se mantenga sin dividirse por días.

**Criterios de aceptación:**
- [ ] Puedo editar config para quitar fecha
- [ ] El modo cambia a "registro infinito"
- [ ] El dailyAllowance desaparece de la UI

---

## 5. Consideraciones Técnicas

### 5.1 Migración de datos existentes
Los budgets actuales tienen `endDate` definido. Al migrar el código:
- Si `endDate` es `undefined` → modo registro
- Si `endDate` existe → modo presupuesto (comportamiento actual)
- **No se requiere migración de datos** — el cambio es retrocompatible

### 5.2 Persistencia
`localStorage` (o donde sea que se guarde el budget) no necesita cambios. Solo se respetará el nuevo flag `hasEndDate`.

### 5.3 Tests
Actualizar tests en:
- `tests/ui/config-form.spec.ts` — nuevos escenarios de toggle
- `tests/ui/test-data.ts` — fixtures para ambos modos
- `tests/unit/use-budget.test.tsx` — lógica de dailyAllowance en ambos modos

### 5.4 Edge cases
- `startAmount = 0, no endDate` → Mostrar "Agrega un monto inicial"
- `endDate < hoy` → Warning: "La fecha ya pasó. ¿Quieres removerla?"

---

## 6. MVP Scope

Para el MVP, implementar:

1. ✅ Toggle en SetupForm para fecha opcional
2. ✅ Toggle en ConfigForm para fecha opcional
3. ✅ Actualizar validación de formulario
4. ✅ Ajustar lógica de useBudget para calcular/ocultar dailyAllowance
5. ✅ Agregar traducciones necesarias
6. ✅ Tests básicos para ambos modos

**Postergar:**
- Animación de transición entre modos
- Mensaje contextual al cambiar de modo
- Persistencia de preferencia de modo (recordar última elección)

---

## 7. Métricas de Éxito

| Métrica | Cómo se mide |
|---------|-------------|
| Usuarios en modo registro | Analítica: % de setups sin endDate |
| Engagement | Transacciones por usuario en modo registro vs presupuesto |
| Conversión | Usuarios que después agregan fecha desde modo registro |

---

## 8. A/B Testing (futuro)

Considerar ofrecer el "modo registro" como opción默认 para nuevos usuarios en un test A/B:
- **A (control):** Fecha límite obligatoria
- **B (test):** Toggle con "sin fecha" como defaultunchecked

Medir: tasa de completado de setup, engagement a 30 días.