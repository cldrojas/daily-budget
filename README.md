# 💸 Saldo Cero

**Libera tu mente del estrés financiero.**

Saldo Cero es una app minimalista de finanzas personales diseñada para ayudarte a tomar decisiones con claridad. No necesitas conectar cuentas bancarias ni entender contabilidad: solo anota lo esencial y nosotros hacemos el resto.

---

## ✨ ¿Qué es Saldo Cero?

Una herramienta simple y directa para:

- 📌 **Saber cuánto dinero tienes realmente**
- 📅 **Organizar tus pagos y cobros**
- 🚨 **Evitar olvidos y gastos fantasmas**
- 📈 **Tomar decisiones financieras sin ansiedad**

Sin curvas de aprendizaje. Sin publicidad. Sin humo.

---

## 🧠 Filosofía

- **Menos fricción, más claridad**
- **Privacidad por defecto** (tus datos son tuyos)
- **Cero estrés, cero deudas, cero enredos**

Pensada para personas que:
- Se estresan al ver su cuenta
- Quieren ahorrar pero no logran hacerlo
- Sienten que su plata "se va sola"
- Necesitan control, pero sin Excel ni apps bancarias confusas

---

## 🧑‍💻 ¿Quién está detrás?

Proyecto personal de **Daniel**, ingeniero informático con hambre de claridad financiera y diseño funcional.

*Inspirado por el caos, construido con cariño.*

---

## 📁 Estructura del Proyecto

```
/app            # Next.js app directory (App Router)
|-- layout.tsx
|-- page.tsx    # Componente principal

/components     # Componentes UI y funcionalidades
|-- modals/     # Componentes de modales
|-- ui/         # Primitivas UI (botones, diálogos, etc.)

/contexts       # React Context providers (idioma, moneda)
/hooks          # Custom React hooks (presupuesto, transacciones)
/lib            # Funciones utilitarias
/public         # Assets estáticos (íconos)
/styles         # Estilos globales
/types          # Definiciones TypeScript
/tests          # Tests unitarios y de UI
```

---

## 🛠️ Stack Tecnológico

### Frontend
- **Framework:** Next.js 15 (App Router, React Server Components)
- **UI:** React 19, TypeScript
- **Estilos:** Tailwind CSS, PostCSS
- **Componentes:** Radix UI Primitives, shadcn/ui
- **Íconos:** Lucide React

### Bibliotecas Adicionales
- **Formularios:** React Hook Form + Zod
- **Validación:** @hookform/resolvers
- **UI Enhancements:** Sonner (toasts), cmdk (comandos), Embla Carousel
- **Fechas:** date-fns, react-day-picker
- **Gráficos:** Recharts
- **Temas:** next-themes (dark/light mode)

### Gestión de Estado
- React Context (Language, Currency)
- Custom Hooks (useBudget para lógica de presupuesto)

### Testing
- **Unitarios:** Vitest + React Testing Library
- **UI/E2E:** Playwright
- **Configuración:** GitHub Actions CI pipeline

### Infraestructura (Planificado)
- Cloudflare Workers + Cloudflare D1 (SQLite serverless)
- Opción para PostgreSQL u otras bases de datos

---

## 🏗️ Arquitectura

- **Frontend:** Next.js con App Router para optimal rendimiento y escalabilidad
- **Componentes:** UI modular y hooks para mantenibilidad y reusabilidad
- **Estado:** Gestionado via React Context y custom hooks para presupuesto, idioma y moneda
- **Backend:** Diseñado para serverless (Cloudflare Workers), adaptable a cualquier API REST/GraphQL
- **Base de datos:** Cloudflare D1 (SQLite-compatible, serverless) con opción de swapping
- **Seguridad:** No se vende ni comparte datos del usuario; la privacidad es un valor central

---

## 🚀 Inicio Rápido

### Requisitos Previos
- Node.js 18+
- pnpm (o npm/yarn)

### 1. Clonar el Repositorio
```sh
git clone https://github.com/cldrojas/saldo-cero.git
cd saldo-cero
```

### 2. Instalar Dependencias
```sh
pnpm install
```

### 3. Ejecutar en Desarrollo
```sh
pnpm dev
```

La aplicación estará disponible en `http://localhost:3000`

### 4. Ejecutar Tests

```sh
# Tests unitarios
pnpm test

# Tests con coverage
pnpm test:coverage

# Tests de UI (abre servidor automáticamente)
pnpm test:ui

# Tests de UI con navegador visible
pnpm test:ui:headed
```

---

## 📝 Notas

- La implementación actual es frontend-focused con estado en localStorage
- Backend y base de datos están diseñados para ser pluggable y serverless-friendly
- Para producción, considerar desplegar en Vercel o Cloudflare
