# Copilot Instructions — PrestaYa

> Contexto persistente para que cada sesión arranque sabiendo cómo está hecho este proyecto.
> Edita este archivo cuando cambien las convenciones.

---

## 🎯 Resumen del proyecto

**PrestaYa** — App móvil-first para gestión de microcréditos y préstamos personales.
Dominio en **español**: tablas (`clientes`, `planes_prestamo`), UI (es-CO), moneda principal COP.

- **Usuarios**: admin (CRUD total) y operador (CRUD préstamos/clientes).
- **Core**: cálculo de amortización francesa/flat, gestión de pagos con aplicación a mora/interés/capital, reportes PDF (jsPDF + autoTable), dashboard con Chart.js.
- **Estética**: premium, mobile-first. Paleta: azul `#1e3a8a`, verde `#10b981`, rojo `#ef4444`.

---

## 🧱 Stack (versiones activas)

| Capa | Tecnología |
|---|---|
| UI | React 19 + TypeScript 5.9 + Vite 7 |
| Routing | react-router-dom v7 |
| Backend | Supabase (Postgres + Auth + RLS) |
| Estado | React local (`useState`) + Context (`AuthContext`) |
| Estilos | CSS3 con variables, mobile-first (sin Tailwind) |
| Iconos | `lucide-react` |
| Charts | `chart.js` + `react-chartjs-2` |
| PDF | `jspdf` + `jspdf-autotable` |
| Fechas | `date-fns` |
| Linter | ESLint 9 (flat config) |

---

## 📁 Mapa de carpetas

```
src/
├── components/      # Compartidos: Layout, Modal, Pagination, ProtectedRoute
├── contexts/        # Solo AuthContext.tsx (estado global de sesión)
├── hooks/           # Hooks reutilizables (useBusinessName, useSystemCurrency)
├── lib/             # Clientes externos: supabase.ts (singleton)
├── pages/           # Vistas = rutas (Dashboard, Clients, LoansList, ...)
├── types/           # Tipos globales (global.d.ts)
└── utils/           # Lógica pura: finance.ts, loanMetrics.ts
```

---

## ✍️ Convenciones de código

### Componentes
- **Función flecha** por defecto (`const Clients = () => {...}`).
- `React.FC<Props>` solo si tiene props tipadas extensas (ver `Layout.tsx`).
- Nombres de archivo **PascalCase** (`NewLoan.tsx`).
- Cada página va envuelta en `<Layout>` con `title` y opcional `subtitle`.

### TypeScript
- `interface` para props/tipos de dominio (`AmortizationRow`).
- `type` para uniones (`'frances' | 'flat'`, `'semanal' | 'quincenal' | 'mensual'`).
- `any` está **permitido** por eslint, pero intenta tipar cuando el dominio lo permita.
- Variables no usadas se permite prefijar con `_` para silenciar el warning.

### Imports (orden mental)
1. React y librerías externas
2. Componentes (`../components/...`)
3. Hooks (`../hooks/...`)
4. Contexto (`../contexts/...`)
5. Utilidades (`../utils/...`)
6. Tipos con `import type` cuando solo se usan en tipos

### Estilos
- **Sin Tailwind** — solo CSS clásico con variables (`--sidebar-width`).
- Clases semánticas BEM-ish: `app-shell`, `app-header__left`, `sidebar-backdrop.visible`.
- Breakpoints y mobile-first definidos en `index.css`.
- Estilos por componente se importan desde el `.css` correspondiente (si existe) o se añaden a `index.css`.

---

## 🗄️ Supabase — reglas de uso

### Cliente
- **Singleton** desde `src/lib/supabase.ts`. Nunca crear otro cliente.
- Variables de entorno: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.

### Consultas
```ts
// ✅ Bien — destructuring directo
const { data: clientes } = await supabase
  .from('clientes')
  .select('id, nombre, identificacion')
  .eq('activo', true);

// ❌ Evitar — queries sin seleccionar columnas
const { data } = await supabase.from('clientes').select('*');
```

- **Tablas en snake_case español** del schema (`supabase_schema.sql`).
- Filtros comunes: `.eq('activo', true)`, `.eq('user_id', user.id)`.
- Paginación cuando se espere >100 registros.

### Auth
- Usar `useAuth()` en vez de tocar `supabase.auth` directamente.
- Rutas protegidas con `<ProtectedRoute>`; rutas admin con `<ProtectedRoute requiredRole="admin">`.
- Roles: `'admin' | 'operador'` (definidos en `profiles.role`).

### Seguridad
- **No filtrar** `auth.users` ni escribir en `auth.*` directamente desde frontend.
- El esquema tiene RLS habilitado — no bypass con `service_role` key en frontend.

---

## 💰 Dominio financiero

- **Moneda**: por defecto COP (sin decimales), USD (con 2). Configurable vía `useSystemCurrency` (localStorage key: `system_currency`).
- **Formateo**: usar `formatCurrency(value, currency?)` de `utils/finance.ts`. Nunca `Intl.NumberFormat` directo.
- **Amortización**:
  - Francesa (default): cuota fija, interés decreciente.
  - Flat: interés constante sobre capital inicial.
- **Cálculos puros** van en `utils/finance.ts`, nunca dentro de componentes.

---

## 🚫 No hacer

- ❌ No usar `localStorage` directo para moneda — ya hay `setStoredCurrency()`.
- ❌ No crear componentes nuevos sin registrar la ruta en `App.tsx`.
- ❌ No añadir Tailwind ni otra lib de estilos.
- ❌ No usar `console.log` para errores que el usuario verá — usar `alert()` o UI inline.
- ❌ No commitear `.env` ni claves Supabase al repositorio.
- ❌ No usar `any` cuando el tipo se pueda inferir o esté en `types/global.d.ts`.

---

## ✅ Hacer

- ✅ Tipar props de páginas aunque sean pocos campos.
- ✅ Calcular la tabla de amortización con `calculateAmortization()` (ya soporta flat/frances).
- ✅ Validar formularios antes de llamar a Supabase.
- ✅ Proteger rutas sensibles con `requiredRole`.
- ✅ Usar `lucide-react` para iconos (ya está instalado).
- ✅ Nombrar archivos en PascalCase, hooks en `useCamelCase.ts`, utils en camelCase.

---

## 🧪 Comandos útiles

```bash
npm run dev        # Desarrollo
npm run build      # Build + type-check (tsc -b)
npm run lint       # ESLint
npm run changelog  # Actualiza CHANGELOG.md
npm run release:patch   # bump patch + changelog
npm run release:minor   # bump minor + changelog
npm run release:major   # bump major + changelog
```

---

## 🌐 Idioma y tono de respuestas

- Código y comentarios en **inglés cuando sean técnicos** (nombres de variables, funciones).
- Mensajes al usuario y UI en **español neutro/es-CO**.
- Cuando respondas preguntas del autor del repo, responde en español salvo que pida inglés.
- Sé **conciso**: este autor prefiere párrafos cortos, listas con bullets y tablas comparativas antes que bloques de prosa largos.

---

## 📌 Notas de arquitectura conocidas

- No hay service layer para Supabase todavía — las queries viven dentro de páginas. Si una query se repite en 3+ páginas, considerar extraer a un módulo `src/services/`.
- Fechas: se manejan como `string` ISO desde Supabase, se convierten a `Date` en cliente. Considerar `date-fns` para manipulaciones.
- Reportes PDF: el helper vive en `Reports.tsx`; si crece, mover a `utils/pdf.ts`.

