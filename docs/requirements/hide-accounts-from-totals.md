# PRD: Ocultar Cuentas de los Totales y del Selector de Balance

## 1. Resumen Ejecutivo

### 1.1 Propósito
Agregar una opción en cada tarjeta de cuenta del tab **Cuentas** que permita excluir la cuenta del **total de saldos sumados** y del **dropdown de cuenta a mostrar** en modo track (selector de balance en la pantalla de inicio). La opción es un ícono de **ojo** que representa "ocultar la cuenta" sin eliminarla: la cuenta sigue existiendo y recibiendo transacciones, pero se excluye de los totales y del selector.

### 1.2 Change ID
`hide-accounts-from-totals`

### 1.3 Estado
**Draft** — Pendiente de fases de spec y design

---

## 2. Planteamiento del Problema

### 2.1 Estado Actual
- Cada cuenta tiene una tarjeta en el tab **Cuentas** (`components/accounts-list.tsx`) con acciones de editar (lápiz) y eliminar (basurero).
- En modo track, la pantalla de inicio muestra una tarjeta "Total Balance" (`components/daily-budget-status.tsx`) con:
  - Un total = suma de **todas** las cuentas: `accounts.reduce((sum, acc) => sum + acc.balance, 0)` (línea 91).
  - Un `<Select>` con la opción "Todas las cuentas" + una entrada por cada cuenta existente (líneas 107-112).
- No existe forma de excluir una cuenta (ej. ahorro, inversión) del total ni del selector sin borrarla.

### 2.2 Pain Points
1. **Totales inflados**: cuentas tipo ahorro/inversión que el usuario no quiere "contar" se suman al total del modo track.
2. **Selector ruidoso**: el dropdown lista todas las cuentas, aunque el usuario solo quiera ver un subconjunto.
3. **Falta de granularidad**: la única alternativa hoy es eliminar la cuenta (pierde su historial y balance).
4. **Sin persistencia**: no existe un flag por cuenta que recuerde qué cuentas ocultar entre sesiones.

### 2.3 Oportunidad
Un flag `hidden` (booleano) en el modelo `Account` resuelve ambos problemas (total + dropdown) con un único cambio, y ya persiste automáticamente porque `accounts` se serializa completo en localStorage (`use-budget.tsx`).

---

## 3. Historias de Usuario

### US-1: Ocultar cuenta de los totales
**Como** usuario de modo track
**Quiero** ocultar una cuenta con el ícono de ojo en su tarjeta
**Para que** su saldo deje de sumarse al total "Todas las cuentas"

**Criterios de aceptación:**
- [ ] Cada tarjeta de cuenta tiene un botón de ojo (`Eye` / `EyeOff`) junto a editar/eliminar.
- [ ] Al ocultar, la cuenta queda excluida del cálculo `reduce()` del total en `daily-budget-status.tsx`.
- [ ] La cuenta sigue visible en el tab Cuentas (estilo atenuado) para poder re-mostrarla.
- [ ] El estado oculto persiste al recargar (via localStorage).

### US-2: Ocultar cuenta del selector de balance
**Como** usuario de modo track
**Quiero** que las cuentas ocultas no aparezcan en el dropdown de "Mostrar balance de"
**Para que** el selector solo muestre cuentas relevantes

**Criterios de aceptación:**
- [ ] Las cuentas ocultas no se listan como `<SelectItem>` en el dropdown.
- [ ] La opción "Todas las cuentas" siempre permanece.
- [ ] Si la cuenta seleccionada se oculta, el selector cae a "Todas las cuentas" (sin romperse).

### US-3: Re-mostrar una cuenta oculta
**Como** usuario
**Quiero** tocar el ojo tachado para re-mostrar la cuenta
**Para que** pueda revertir la decisión sin recargar ni perder datos

**Criterios de aceptación:**
- [ ] El botón alterna entre `Eye` (visible) y `EyeOff` (oculta).
- [ ] Al re-mostrar, la cuenta vuelve al total y al dropdown de inmediato.
- [ ] La tarjeta oculta se distingue visualmente (opacidad reducida, ícono `EyeOff`).

---

## 4. Requerimientos Funcionales

### FR-1: Extensión del modelo `Account`
Agregar campo opcional `hidden` en `types/index.ts`:

```typescript
export type Account = {
  id: string
  name: string
  type: string
  balance: Int
  icon: string
  hidden?: boolean  // NUEVO: true = excluida de totales y del selector
}
```

- Default implícito: `undefined` o `false` = visible (compatibilidad con datos existentes en localStorage).
- Los objetos creados por `addAccount`, `setupBudget`, `updateConfig` y la cuenta `savings` reinjectada no necesitan setear el campo (se lee como falsy).

#### FR-1.1: Migración del modelo (OBLIGATORIO)
Todo cambio al modelo de datos `Account` (o cualquier tipo persistido en localStorage) **debe** registrar su migración, aunque la app no tenga base de datos. La migración se documenta como texto descriptivo en un archivo markdown:

- **Ruta**: `docs/migrations/<fecha>-<change-id>.md` (ej. `docs/migrations/2026-08-06-hide-accounts-from-totals.md`).
- **Contenido mínimo**: versión/estado previo del schema, estado nuevo, estrategia de datos (campos opcionales, defaults, transformación de datos existentes), y pasos de rollback.
- **Regla**: ninguna implementación de cambio de modelo se considera completa si no incluye su archivo de migración.
- **Ejemplo de plantilla**:

```markdown
# Migración: hide-accounts-from-totals
Fecha: 2026-08-06

## Cambio de schema
Account.hidden?: boolean (opcional, default undefined/false)

## Estrategia de datos
Los datos existentes en localStorage no tienen el campo → se leen como
`undefined` (falsy) = visible. No requiere transformación.

## Rollback
Eliminar el campo `hidden?` de `Account`. Los datos con `hidden: true`
se ignoran al re-leer el schema.
```

### FR-2: Toggle de ocultar en la tarjeta de cuenta
En `components/accounts-list.tsx`:
- Añadir botón `variant="ghost" size="icon"` con ícono `Eye` (visible) o `EyeOff` (oculta), adyacente a editar/eliminar.
- `title`/tooltip: `t('hideAccount')` / `t('showAccount')` según estado.
- Estado oculto: aplicar opacidad reducida al contenido de la tarjeta (ej. `opacity-50`).
- `onClick` → `onUpdateAccount({ ...account, hidden: !account.hidden })`.

### FR-3: Exclusión del total sumado
En `components/daily-budget-status.tsx` (bloque track):

```typescript
const visibleAccounts = accounts.filter(acc => !acc.hidden)

const displayedBalance =
  effectiveAccountId === TOTAL_ACCOUNTS_VALUE
    ? visibleAccounts.reduce((sum, acc) => sum + acc.balance, 0)
    : accounts.find(acc => acc.id === effectiveAccountId)?.balance ?? 0
```

### FR-4: Exclusión del dropdown de balance
En el mismo componente, iterar sobre `visibleAccounts` en lugar de `accounts`:

```tsx
{visibleAccounts.map(account => (
  <SelectItem key={account.id} value={account.id}>
    {account.name}
  </SelectItem>
))}
```

### FR-5: Manejo de selección inválida
Si la cuenta seleccionada fue ocultada (o no existe), el fallback existente (`selectedAccountExists`) ya redirige a `TOTAL_ACCOUNTS_VALUE` — verificar que cubra este caso y mantener el comportamiento.

### FR-6: Traducciones
Agregar claves i18n en `contexts/language-context.tsx` (en `en` y `es`):

| Key | en | es |
|-----|----|----|
| `hideAccount` | `Hide from totals` | `Ocultar de los totales` |
| `showAccount` | `Show in totals` | `Mostrar en los totales` |

---

## 5. Requerimientos No Funcionales

### NFR-1: Persistencia
- `hidden` se persiste automáticamente: `accounts` se serializa completo en el efecto de guardado de `use-budget.tsx` (líneas 86-111).
- La migración del modelo se documenta de forma obligatoria en `docs/migrations/` (texto descriptivo markdown) aunque la app use localStorage — ver **FR-1.1**.
- Datos existentes sin `hidden` se tratan como visibles (campo opcional).

### NFR-2: Compatibilidad hacia atrás
- El campo es opcional (`hidden?`), no rompe datos previos de localStorage.
- Ningún otro consumidor de `Account` (modales, transferencias, historial) cambia de comportamiento por defecto.

### NFR-3: Alcance del ocultamiento
- **Solo afecta**: total del modo track + selector "Mostrar balance de".
- **No afecta** (fuera de alcance v1): dropdowns de transacción/transferencia, listado del tab Cuentas (la cuenta sigue visible para poder re-mostrarla).

### NFR-4: Testeo
- Test unitario del cálculo de total excluyendo cuentas ocultas.
- Test del dropdown excluyendo cuentas ocultas y del fallback ante selección oculta.
- Todos los tests existentes deben pasar (sin regresión).

---

## 6. Restricciones de Diseño Técnico

### 6.1 Fuente de verdad
El flag `hidden` vive **en el objeto `Account`** (persistido en localStorage), no en un store aparte, para que sobreviva recargas sin lógica extra.

### 6.2 Ubicación de los cambios
| Archivo | Cambio |
|---------|--------|
| `types/index.ts` | Campo `hidden?: boolean` en `Account` |
| `components/accounts-list.tsx` | Botón ojo + estilo de tarjeta oculta |
| `components/daily-budget-status.tsx` | Filtro `visibleAccounts` en total y dropdown |
| `contexts/language-context.tsx` | Claves `hideAccount` / `showAccount` (en + es) |
| `docs/migrations/2026-08-06-hide-accounts-from-totals.md` | Migración descriptiva del modelo (OBLIGATORIA, ver FR-1.1) |
| `hooks/use-budget.tsx` | Sin cambios (persistencia ya cubierta) |

### 6.3 Flujo de datos

```
Tarjeta de cuenta (tab Cuentas)
   │  click ícono Eye/EyeOff
   ▼
onUpdateAccount({ ...account, hidden: !account.hidden })
   ▼
use-budget.updateAccount() → setAccounts(...) → localStorage (auto)
   ▼
daily-budget-status.tsx
   ├─ visibleAccounts = accounts.filter(a => !a.hidden)
   ├─ total = visibleAccounts.reduce(...)
   └─ dropdown = visibleAccounts.map(SelectItem)
```

---

## 7. Fuera de Alcance

| Ítem | Razón | Trabajo futuro |
|------|-------|----------------|
| Ocultar cuenta en dropdowns de transacción/transferencia | El usuario pidió solo el "dropdown de cuenta a mostrar" | PRD separado |
| Ocultar la tarjeta por completo del tab Cuentas | Debe quedar visible para poder re-mostrarla | — |
| Ocultar en modo daily | El modo daily ya no suma todas las cuentas (usa cuenta `daily`) | — |
| Agrupación/orden de cuentas | Independiente de este flag | PRD separado |
| Porcentaje del total visible | Independiente | PRD separado |

---

## 8. Resumen de Criterios de Aceptación

### Must Have (MVP)
- [ ] Campo `hidden?: boolean` en `Account`
- [ ] Botón de ojo (`Eye`/`EyeOff`) en cada tarjeta del tab Cuentas
- [ ] La cuenta oculta queda excluida del total "Todas las cuentas"
- [ ] La cuenta oculta no aparece en el dropdown "Mostrar balance de"
- [ ] Toggle reversible (re-mostrar) sin recarga
- [ ] Persistencia vía localStorage (sin migración de datos)
- [ ] Migración del modelo documentada en `docs/migrations/` (OBLIGATORIO)
- [ ] Claves i18n en `en` y `es`
- [ ] Tests nuevos + sin regresión en los existentes

### Should Have
- [ ] Estilo visual de tarjeta oculta (opacidad/atenuado)
- [ ] Fallback a "Todas las cuentas" si la seleccionada se oculta

### Nice to Have
- [ ] Indicador de "N cuentas ocultas" en el tab Cuentas
- [ ] Confirmación al ocultar una cuenta con saldo distinto de cero

---

## 9. Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Usuario oculta cuenta con saldo relevante y pierde de vista el dinero | Media | Baja | La tarjeta sigue visible con `EyeOff`; se puede re-mostrar |
| Confusión entre "ocultar" y "eliminar" | Media | Baja | Tooltips claros (`hideAccount`/`showAccount`) y estilo atenuado |
| Selección actual apunta a cuenta ocultada | Baja | Media | Fallback existente a `TOTAL_ACCOUNTS_VALUE` (FR-5) |
| Datos viejos sin `hidden` | Baja | Ninguna | Campo opcional, falsy = visible |
| Cambio rompe tests existentes | Baja | Media | Cambios aislados en 2 componentes; correr suite completa |

---

## 10. Plan de Rollback

1. Revertir `components/daily-budget-status.tsx` a `accounts` (sin filtro).
2. Quitar el botón de ojo y el estilo atenuado de `components/accounts-list.tsx`.
3. Eliminar `hidden?` de `types/index.ts`.
4. Remover claves i18n de `contexts/language-context.tsx`.
5. Borrar tests nuevos y correr suite completa.

---

## 11. Dependencias

| Dependencia | Fuente | Propósito |
|-------------|--------|-----------|
| `lucide-react` (`Eye`, `EyeOff`) | `package.json` (ya instalado) | Íconos del toggle |
| `useUpdateAccount` | `hooks/use-budget.tsx` | Persistir el flag |
| `useLanguage.t()` | `contexts/language-context.tsx` | Traducciones |
| Vitest | `vitest.config.ts` | Tests unitarios |
| Convención `docs/migrations/*.md` | Regla interna del repo | Migración descriptiva del modelo (ver FR-1.1) |

---

## 12. Métricas de Éxito

| Métrica | Objetivo | Medición |
|---------|----------|----------|
| Regresión de tests | 100% pass | `pnpm test` |
| Tiempo de toggle | < 50ms (instantáneo) | Percepción / devtools |
| Adopción | > 1 cuenta oculta por usuario activo de modo track | Analítica futura |
| Persistencia | 100% de recargas conservan el estado oculto | Test manual + e2e |

---

## 13. Fases de Implementación

| Fase | Entregables | Esfuerzo est. |
|------|-------------|---------------|
| **1. Modelo** | Campo `hidden` en `Account` + migración en `docs/migrations/` | < 1 día |
| **2. UI toggle** | Botón ojo + estilo en `accounts-list.tsx` | 0.5 día |
| **3. Totales & dropdown** | Filtro `visibleAccounts` en `daily-budget-status.tsx` | 0.5 día |
| **4. i18n** | Claves en `en` y `es` | < 1 día |
| **5. Tests + verificación** | Tests unitarios, e2e manual | 0.5 día |

**Total: ~2-3 días**

---

## 14. Documentos Relacionados

- **Exploración**: pendiente (siguiente fase `/sdd-explore`)
- **Proposal**: Engram `sdd/hide-accounts-from-totals/proposal`
- **Specs**: TBD (siguiente fase: `/sdd-spec`)
- **Design**: TBD (siguiente fase: `/sdd-design`)

---

## 15. Aprobación

| Rol | Nombre | Estado | Fecha |
|-----|--------|--------|-------|
| Product Owner | — | Pendiente | — |
| Tech Lead | — | Pendiente | — |
| QA Lead | — | Pendiente | — |

---

*Documento generado como parte del flujo SDD para el change `hide-accounts-from-totals`*
