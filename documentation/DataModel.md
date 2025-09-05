# Documentación del modelo de datos

Esta documentación describe las entidades encontradas en el esquema de datos (fuente: `database/schema.json`). Incluye descripción de campos, relaciones y un diagrama en formato Mermaid con indicación de PK y FK.

## Contrato (resumen)
- Origen: `database/schema.json` (modelo inferido para almacenamiento en localStorage bajo la clave `daily-budget-data`).
- Entidades principales: `budget`, `account`, `transaction`.
- Salida: este archivo `documentation/DataModel.md` contiene campos, descripciones, relaciones y diagrama mermaid.

---

## Entidades y campos

### Budget (singleton)
- Propósito: almacena los parámetros del presupuesto global.
- Campos:
  - `startAmount` (number, requerido): monto inicial del presupuesto.
  - `startDate` (`Date` | null): fecha de inicio (usar tipo `Date` en memoria; persistir como ISO-string si se guarda en JSON).
  - `endDate` (`Date` | null): fecha de fin (usar tipo `Date` en memoria; persistir como ISO-string si se guarda en JSON).

Notas: `budget` se representa como un objeto único dentro del `root` del JSON; no tiene una clave primaria individual porque está pensado como configuración global.

### Account
- Propósito: representa una cuenta o fuente de fondos.
- Campos:
  - `id` (string, PK): identificador único de la cuenta.
  - `name` (string): nombre legible de la cuenta.
  - `balance` (number): monto/balance de la cuenta.
  - `parentId` (string | null, FK -> `account.id`): referencia opcional a otra cuenta que actúa como padre; permite estructurar cuentas en jerarquías.
  - `icon` (string, opcional): icono asociado.
  - `type` (string, opcional): tipo de cuenta (ej. `savings`, `investment`, `expense`).

Requeridos por esquema: `id`, `name`, `balance`.

PK: `account.id`


### Transaction
- Propósito: registro de movimientos (gastos, transferencias, ingresos).
- Campos:
  - `id` (string, PK): identificador único de la transacción.
  - `type` (string, enum: `"expense" | "transfer" | "income"`): tipo de la transacción.
  - `date` (`Date`): fecha cuando ocurrió la transacción. Usar `Date` en memoria; persistir como ISO-string en JSON.
  - `amount` (number): monto de la transacción. (positivo para ingresos, negativo/positivo según convención de la app)
  - `description` (string): descripción o nota de la transacción.
  - `account` (string, FK -> `account.id`): referencia a la cuenta relacionada (por ejemplo, la cuenta desde la cual se carga un gasto o a la que se abona un ingreso).

Requeridos por esquema: `id`, `type`, `date`, `amount`, `account`.

PK: `transaction.id`
FK: `transaction.account` → `account.id`

---

## Relaciones

- Una `Account` puede tener cero o muchas `Transaction` asociadas.
  - Cardinalidad: Account 1 --- * Transaction
  - Implementación en el JSON: las transacciones almacenan el `account` como string que referencia `account.id`.

- Una `Account` puede ser hija de otra `Account` mediante `parentId` (recursiva/jerárquica).
  - Cardinalidad: Account 0..1 --- 0..* Account (parentId -> children)

- `Budget` es un objeto de configuración global que no referencia ni es referenciado por PK/FK en este esquema.

---

## Estructura raíz (root)
El `root` del JSON contiene la composición principal de la aplicación:

- `budget`: objeto `budget`.
- `accounts`: arreglo de objetos `account`.
- `transactions`: arreglo de objetos `transaction`.
- `dailyAllowance`: number (cálculo interno de la app).
- `remainingToday`: number (resumen/calculado).
- `progress`: number (porcentaje/completitud del periodo).
- `lastCheckedDay`: string|null (fecha ISO del último chequeo diario).
- `isSetup`: boolean (indica si la configuración inicial se completó).

Requeridos en el root: `accounts`, `transactions`, `isSetup`.

---

## Diagrama (Mermaid)

El siguiente diagrama muestra entidades, tipos de campo y relaciones PK/FK.

```mermaid
erDiagram

  ACCOUNT {
    string id PK "Identificador único"
    string name
    number balance
    string parentId FK? "Referencia opcional a account.id"
    string icon
    string type
  }

  TRANSACTION {
    string id PK "Identificador único"
    string type "expense|transfer|income"
    Date date
    number amount
    string description
    string account FK "Referencia a account.id"
  }

  BUDGET {
    number startAmount
    Date? startDate
    Date? endDate
  }

    %% Relaciones
    ACCOUNT ||--o{ TRANSACTION : "tiene"

    %% Notas:
  %% - TRANSACTION.account es FK hacia ACCOUNT.id
  %% - ACCOUNT.parentId es FK opcional hacia ACCOUNT.id (jerarquía)
  %% - BUDGET es un objeto singleton dentro del root (no PK/FK)
```

---

## Observaciones y recomendaciones

- El esquema actual es simple y almacena referencias por ID (string). Si en el futuro se migra a una base de datos relacional o a Prisma, se recomienda:
  - Normalizar tipos de fecha a `DateTime`/ISO y validar al escribir/leer.
  - Establecer constraints de FK para `transaction.account` hacia `account.id`.
  - Considerar índices sobre `transaction.date` y `transaction.account` para consultas rápidas.

- Si se genera una versión `schema.prisma`, mapear `account.id` y `transaction.id` a `String @id` y `transaction.account` a una relación utilizando `@relation` con `references: [id]`.

---

Archivo generado automáticamente a partir de `database/schema.json`.
# Modelo de Datos — Saldo Cero

## Descripción General
El modelo de datos de Saldo Cero está diseñado para gestionar presupuestos diarios, cuentas, transacciones y la configuración del usuario. Los datos se almacenan en localStorage bajo la clave `daily-budget-data` y pueden ser fácilmente adaptados a una base de datos relacional.

---

## Entidades y Campos

### 1. Budget (Presupuesto)
- **startAmount** (`number`): Monto inicial del presupuesto.
- **startDate** (`Date`): Fecha de inicio del presupuesto.
- **endDate** (`Date`): Fecha de fin del presupuesto.

### 2. Account (Cuenta)
- **id** (`string`, PK): Identificador único de la cuenta.
- **name** (`string`): Nombre de la cuenta.
- **type** (`string`): Tipo de cuenta (`daily`, `savings`, `investment`, etc.).
- **balance** (`number`): Saldo actual de la cuenta.
- **icon** (`string`): Icono asociado a la cuenta.

### 3. Transaction (Transacción)
- **id** (`string`, PK): Identificador único de la transacción.
- **type** (`string`): Tipo de transacción (`income`, `expense`, `transfer`).
- **date** (`Date`): Fecha de la transacción.
- **amount** (`number`): Monto de la transacción (negativo para gastos).
- **description** (`string`): Descripción de la transacción.
- **account** (`string`, FK → Account.id): Cuenta asociada a la transacción.

### 4. Otros campos de configuración
- **dailyAllowance** (`number`): Monto diario calculado para gastar.
- **remainingToday** (`number`): Monto restante para gastar hoy.
- **progress** (`number`): Porcentaje de progreso del presupuesto diario.
- **lastCheckedDay** (`Date`): Última fecha en la que se actualizó el presupuesto.
- **isSetup** (`boolean`): Indica si el presupuesto inicial ya fue configurado.

---

## Relaciones
- **Account** (1) ← (N) **Transaction**: Cada transacción está asociada a una cuenta mediante el campo `account` (FK).
- **Budget** (1) ← (N) **Account**: El presupuesto define el monto inicial y las fechas, y las cuentas se inicializan en base a este presupuesto.

---

## Diagrama Excalidraw

```excalidraw
{"type":"excalidraw","version":2,"source":"copilot","elements":[{"type":"rectangle","id":"budget","x":0,"y":0,"width":220,"height":90,"angle":0,"strokeColor":"#1a1a1a","backgroundColor":"#fff","fillStyle":"solid","strokeWidth":1,"strokeStyle":"solid","roundness":null,"seed":1,"version":1,"versionNonce":1,"isDeleted":false,"groupIds":[],"boundElements":[],"updated":1,"link":null,"locked":false,"text":"Budget\n- startAmount: number\n- startDate: Date\n- endDate: Date","fontSize":16,"fontFamily":1,"textAlign":"left","verticalAlign":"top"},{"type":"rectangle","id":"account","x":300,"y":0,"width":240,"height":120,"angle":0,"strokeColor":"#1a1a1a","backgroundColor":"#fff","fillStyle":"solid","strokeWidth":1,"strokeStyle":"solid","roundness":null,"seed":2,"version":1,"versionNonce":2,"isDeleted":false,"groupIds":[],"boundElements":[],"updated":1,"link":null,"locked":false,"text":"Account\n- id: string (PK)\n- name: string\n- type: string\n- balance: number\n- icon: string","fontSize":16,"fontFamily":1,"textAlign":"left","verticalAlign":"top"},{"type":"rectangle","id":"transaction","x":600,"y":0,"width":260,"height":140,"angle":0,"strokeColor":"#1a1a1a","backgroundColor":"#fff","fillStyle":"solid","strokeWidth":1,"strokeStyle":"solid","roundness":null,"seed":3,"version":1,"versionNonce":3,"isDeleted":false,"groupIds":[],"boundElements":[],"updated":1,"link":null,"locked":false,"text":"Transaction\n- id: string (PK)\n- type: string\n- date: Date\n- amount: number\n- description: string\n- account: string (FK)","fontSize":16,"fontFamily":1,"textAlign":"left","verticalAlign":"top"},{"type":"arrow","id":"arrow1","x":220,"y":45,"width":80,"height":0,"angle":0,"strokeColor":"#1a1a1a","backgroundColor":"#fff","fillStyle":"solid","strokeWidth":2,"strokeStyle":"solid","roundness":null,"seed":4,"version":1,"versionNonce":4,"isDeleted":false,"groupIds":[],"boundElements":[],"updated":1,"link":null,"locked":false,"startArrowhead":"none","endArrowhead":"arrow","points":[{"x":0,"y":0},{"x":80,"y":0}]},{"type":"arrow","id":"arrow2","x":540,"y":60,"width":60,"height":0,"angle":0,"strokeColor":"#1a1a1a","backgroundColor":"#fff","fillStyle":"solid","strokeWidth":2,"strokeStyle":"solid","roundness":null,"seed":5,"version":1,"versionNonce":5,"isDeleted":false,"groupIds":[],"boundElements":[],"updated":1,"link":null,"locked":false,"startArrowhead":"none","endArrowhead":"arrow","points":[{"x":0,"y":0},{"x":60,"y":0}]}],"appState":{"viewBackgroundColor":"#ffffff","currentItemStrokeColor":"#1a1a1a","currentItemBackgroundColor":"#fff","currentItemFillStyle":"solid","currentItemStrokeWidth":1,"currentItemStrokeStyle":"solid","currentItemFontFamily":1,"currentItemFontSize":16,"currentItemTextAlign":"left","currentItemVerticalAlign":"top"}}
```

---

> **Nota:** Este modelo es fácilmente adaptable a una base de datos relacional como PostgreSQL o MySQL. Los campos de configuración pueden almacenarse en una tabla de usuario o como parte de la sesión.
