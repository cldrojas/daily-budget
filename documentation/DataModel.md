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
