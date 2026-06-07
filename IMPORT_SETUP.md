# Gmail Import — Manual Setup Guide

## 1. Google Cloud Console — Crear proyecto y credenciales OAuth

### 1.1 Crear proyecto
1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Crea un nuevo proyecto o selecciona uno existente
3. Anota el **Project ID** (lo necesitarás después)

### 1.2 Habilitar Gmail API
1. En la barra lateral → **APIs & Services** → **Library**
2. Busca **"Gmail API"**
3. Haz clic → **Enable**

### 1.3 Configurar pantalla de consentimiento OAuth
1. Ve a **APIs & Services** → **OAuth consent screen**
2. Elige **External** (aunque sea single-user)
3. Completa:
   - **App name**: `Saldo Cero`
   - **User support email**: tu email
   - **Developer contact**: tu email
4. En **Scopes**: haz clic en **Add or Remove Scopes** y agrega:
   ```
   https://www.googleapis.com/auth/gmail.readonly
   ```
   Esto es **solo lectura**. Nunca enviamos ni modificamos emails.
5. En **Test users**: agrega tu email (el mismo que usarás para conectar)
6. Guarda

### 1.4 Crear credenciales OAuth 2.0
1. Ve a **APIs & Services** → **Credentials**
2. Haz clic en **+ Create Credentials** → **OAuth client ID**
3. Application type: **Web application**
4. Name: `Saldo Cero Web`
5. **Authorized JavaScript origins**:
   ```
   http://localhost:3000
   ```
6. **Authorized redirect URIs** (MUY IMPORTANTE):
   ```
   http://localhost:3000/api/auth/gmail/callback
   ```
7. Haz clic en **Create**

### 1.5 Guardar credenciales
Se te mostrará un modal con **Client ID** y **Client Secret**.

**No cierres el modal sin copiar ambos valores — el Client Secret no se vuelve a mostrar.**

Si pierdes el secret, tienes que borrar la credencial y crear una nueva.

---

## 2. Configurar variables de entorno

### 2.1 Copiar el template
```bash
cp .env.local.example .env.local
```

### 2.2 Editar `.env.local`

```env
# ── Gmail OAuth ──────────────────────────────────────────
GMAIL_CLIENT_ID="227205276496-ce9rtrgvl1ll6jtju124pm3nejjs1ts8.apps.googleusercontent.com"
GMAIL_CLIENT_SECRET="GOCSPX-xxxxxxxxxxxxxxxxxxxx"

# ── Token Encryption ─────────────────────────────────────
# Clave AES-256-GCM de 32 bytes codificada en hex (64 caracteres)
# Genera una con: openssl rand -hex 32
TOKEN_ENCRYPTION_KEY="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# ── App URL (para desarrollo) ────────────────────────────
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 2.3 Generar TOKEN_ENCRYPTION_KEY
Esta clave se usa para encriptar el refresh token de Gmail en localStorage.

```bash
openssl rand -hex 32
# Ejemplo de output: a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1
```

**No compartas esta clave ni la subas a git. Sin ella, no se pueden desencriptar los tokens guardados.**

---

## 3. Verificar la configuración

### 3.1 Arrancar el servidor
```bash
pnpm dev
```

### 3.2 Probar la conexión OAuth
1. Abre `http://localhost:3000`
2. Configura tu presupuesto (si es primera vez)
3. Ve a la pestaña **Importar** (en la barra de navegación)
4. Haz clic en **"Connect Gmail"**
5. Serás redirigido a Google — selecciona tu cuenta y acepta los permisos
6. Serás redirigido de vuelta a la app

Si todo funciona, verás:
- Badge verde "Active"
- Botón **"Sync Now"**
- Ya no se ve la pantalla de "Connect Gmail"

### 3.3 Probar el sync
1. Asegúrate de tener al menos un email de BancoEstado, Mercado Pago, o STP en tu bandeja de entrada
2. Haz clic en **"Sync Now"**
3. Si hay emails coincidentes, verás las tarjetas de revisión

---

## 4. Estructura de archivos relevante

```
saldo-cero/
├── lib/import/
│   ├── gmail/client.ts          → Gmail API wrapper
│   ├── gmail/sync.ts            → Query + fetch + parse
│   ├── oauth.ts                 → PKCE OAuth flow + token encryption
│   ├── store.ts                 → localStorage CRUD
│   ├── utils.ts                 → normalizeAmount, normalizeDate, etc.
│   └── parsers/
│       ├── base.ts              → EmailParser interface
│       ├── bancoestado.ts       → BancoEstado (Chile)
│       ├── mercadopago.ts       → Mercado Pago
│       ├── stp.ts               → STP (México)
│       ├── generic.ts           → Generic fallback
│       └── registry.ts          → ParserRegistry + singleton
├── app/api/
│   ├── auth/gmail/route.ts      → Init OAuth
│   ├── auth/gmail/callback/route.ts → Handle callback
│   ├── gmail/sync/route.ts      → POST /api/gmail/sync
│   └── gmail/review/route.ts    → POST /api/gmail/review
├── hooks/use-gmail-import.tsx   → React hook
├── components/
│   ├── import-dashboard.tsx
│   ├── import-review-list.tsx
│   ├── import-review-card.tsx
│   └── modals/import-edit-modal.tsx
└── app/import/page.tsx          → Full import page
```

---

## 5. Troubleshooting

| Problema | Causa posible | Solución |
|----------|--------------|----------|
| "Invalid JWT" / "Token error" | `GMAIL_CLIENT_SECRET` incorrecto | Verifica que coincida exactamente con Google Console |
| "Redirect URI mismatch" | La URI no está registrada | Agrega `http://localhost:3000/api/auth/gmail/callback` en Google Console |
| "Invalid grant" / "Token expired" | Refresh token expiró | Haz clic en "Disconnect" y vuelve a conectar |
| "Cannot read properties of null" | `TOKEN_ENCRYPTION_KEY` no está seteada | Genera la key con `openssl rand -hex 32` |
| OAuth no redirige | `NEXT_PUBLIC_APP_URL` incorrecta | Debe coincidir con el origen JavaScript autorizado |
| No se encuentran emails | Query muy restrictiva | El sync busca emails de hasta 30 días atrás de bancos conocidos |

---

## 6. Producción (cuando la despliegues)

Cuando despliegues en Vercel o Railway:

1. Agrega las mismas 3 env vars en el dashboard del hosting
2. En Google Console, actualiza las URIs:
   ```diff
   - http://localhost:3000
   + https://tudominio.com
   
   - http://localhost:3000/api/auth/gmail/callback
   + https://tudominio.com/api/auth/gmail/callback
   ```
3. El Authorized JavaScript origins también debe incluir la URL de producción
4. Publica tu app para que Google pueda verificar el dominio (necesario para OAuth externo)

Si llegas a los 100 usuarios de prueba, puedes presentar la app para verificación de Google (solo necesario si la publicas con más de 100 usuarios).
