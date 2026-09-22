# 💰 PrestaYa - Gestión Administrativa de Préstamos

**PrestaYa** es una solución móvil integral diseñada para la administración eficiente de microcréditos y préstamos personales. Ofrece una interfaz premium, intuitiva y potente para prestamistas y administradores financieros.

---

## 🚀 Características Principales

### 📊 Dashboard en Tiempo Real
- Visualización de indicadores clave: Cartera Total, Saldo Pendiente y Cobros del Día.
- Gráficos dinámicos de rendimiento semanal y distribución de estados de cuenta.
- Alertas inmediatas de clientes en mora.

### 👥 Gestión de Clientes
- Registro completo de información personal y contacto.
- Búsqueda optimizada por nombre o documento de identidad.
- Historial detallado de créditos por cada cliente.

### 📑 Planes de Préstamo Configurables
- Creación de portafolio de productos financieros (Ej: Microcréditos, Plan Oro).
- Tasas de interés, plazos y frecuencias de pago (semanal, quincenal, mensual) personalizables.

### 🧮 Sistema Financiero Avanzado
- **Cálculo de Amortización Francesa**: Generación automática de cuotas fijas con desglose de capital e interés.
- **Gestión de Pagos**: Registro de abonos con aplicación inteligente a mora, interés y capital.
- **Manejo de Mora**: Cálculo automático de penalizaciones por retraso.

### 📄 Reportes Profesionales
- Exportación de listados de cartera y extractos a formato **PDF**.
- Análisis de ingresos por periodos.

---

## 🛠️ Stack Tecnológico

- **Frontend**: React 18 + TypeScript + Vite.
- **Estilos**: CSS3 con Variables y Diseño Mobile-First.
- **Base de Datos & Auth**: [Supabase](https://supabase.com/).
- **Iconografía**: Lucide React.
- **Gráficos**: Chart.js + React-Chartjs-2.
- **Generación PDF**: jsPDF + autoTable.

---

## ⚙️ Configuración del Proyecto

### 1. Requisitos Previos
- Node.js (v18 o superior)
- Una cuenta en Supabase

### 2. Configuración de Supabase
Para que la aplicación funcione correctamente, debes preparar la base de datos:
1. Crea un nuevo proyecto en el dashboard de Supabase.
2. Ve a la sección **SQL Editor**.
3. Copia y pega el contenido del archivo `supabase_schema.sql` que se encuentra en la raíz de este proyecto.
4. Ejecuta el SQL. Esto creará:
   - Las tablas necesarias (clientes, prestamos, cuotas, pagos, etc.).
   - Políticas de Seguridad de Nivel de Fila (RLS).
   - Datos iniciales de configuración y planes de prueba.
   - **Nota sobre Usuarios**: El script incluye una tabla `profiles` que se vincula con `auth.users`. Deberás habilitar el proveedor de Email en Supabase Auth.

---

## 🔐 Seguridad y Permisos
- **RLS (Row Level Security)**: Habilitado en todas las tablas críticas. Por defecto, el script permite acceso completo a usuarios autenticados para agilizar la prueba, pero debe ajustarse según el rol (`admin`, `operador`, `visualizador`).
- **Triggers**: Se recomienda implementar triggers en PostgreSQL para el cálculo automático de moras diarías basado en la tabla `configuracion`.

---

### 3. Variables de Entorno
Crea un archivo `.env` en la raíz del proyecto basándote en `.env.example`:

```env
VITE_SUPABASE_URL=tu_url_de_proyecto_supabase
VITE_SUPABASE_ANON_KEY=tu_clave_anon_de_supabase
contraSupabase=Y0cuGtHvT1791jYb
```

```
admin@prestaya.com
Admin123
```

### 4. Instalación y Ejecución

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Construir para producción o para verificar antes de hacer un deploy
npm run build
```

---

## 📂 Estructura del Proyecto

- `/src/components`: Componentes reutilizables (Layout, etc.).
- `/src/lib/supabase.ts`: Cliente de conexión a Supabase.
- `/src/services`: **Service layer** — lógica de acceso a datos (ver abajo).
- `/src/pages`: Vistas principales de la aplicación.
- `/src/utils`: Utilidades financieras y formateadores.
- `supabase_schema.sql`: Script de inicialización de base de datos.

---

## 🧩 Service Layer (`src/services/`)

> Toda la lógica de acceso a Supabase está centralizada aquí. **Las páginas no deben importar `supabase` directamente** — siempre deben pasar por los servicios.

### 📐 Convenciones

1. **Singleton**: el cliente `supabase` vive en `src/lib/supabase.ts`. Los servicios lo consumen.
2. **Tipos compartidos**: `services/types.ts` define `Cliente`, `Prestamo`, `Cuota`, `Pago`, `Configuracion`, `Perfil`, `PaginationParams`, `PaginatedResult<T>`, `ServiceResult<T>`.
3. **Importar desde el barrel**:
   ```ts
   import { fetchClientes, fetchPrestamos, createCliente } from '../services';
   ```
4. **Errores uniformes**: las funciones devuelven `{ data, error }` (patrón Supabase) o datos normalizados (`{ data, count }` en listados).
5. **Snake_case en español** para columnas y tablas (`clientes`, `planes_prestamo`, `cobrador_id`).

### 📦 Módulos disponibles

#### `clientes.ts`
| Función | Descripción |
|---|---|
| `fetchClientes({ page, pageSize }, searchTerm?)` | List paginado, busca por nombre o identificación |
| `fetchClientesForSelect()` | List mínimo (`id, nombre, identificacion`) para dropdowns |
| `fetchClienteDetalle(id)` | Cliente + préstamos + cuotas en una sola llamada |
| `createCliente(payload)` | Inserta un cliente |
| `updateCliente(id, payload)` | Actualiza por id |
| `softDeleteCliente(id)` | Soft delete (`deleted_at = NOW()`) |

#### `planes.ts`
| Función | Descripción |
|---|---|
| `fetchPlanes()` | Lista completa |
| `fetchPlanesActivos()` | Solo `activo = true` (para selects y NewLoan) |
| `createPlan(payload)` | Crea plan |
| `updatePlan(id, payload)` | Actualiza |
| `deletePlan(id)` | Elimina |

#### `prestamos.ts`
| Función | Descripción |
|---|---|
| `fetchDashboardStats(cobradorId?)` | Stats globales con filtro opcional por cobrador |
| `fetchLoanAlerts(limit?)` | Préstamos con cuotas próximas a vencer o en mora |
| `fetchPrestamosEnMoraIds()` | IDs de préstamos con mora activa (lee `dias_gracia` de config) |
| `fetchPrestamosCounts(cobradorId?)` | Conteos para tabs (todos, activo, en_mora, pagado) |
| `fetchPrestamos({ page, pageSize }, { searchTerm, filter, cobradorId, moraIds })` | List paginado con joins y filtros |
| `fetchPrestamoConCliente(id)` | Préstamo + cliente (para detail / payments) |
| `fetchPrestamosConCliente()` | Listado plano (PDF reports) |
| `fetchAssignedLoansForCollector(cobradorId)` | Préstamos asignados a un cobrador, con cuotas |
| `fetchWeeklyGoal(cobradorId, start, end)` | Suma de cuotas que vencen en el rango |
| `createPrestamoConCuotas({ prestamo, cuotas })` | Crea préstamo + inserta todas sus cuotas |
| `actualizarSaldoPrestamo(id, nuevoSaldo)` | Update saldo y estado (pagado si ≤ 0) |
| `fetchPrestamosParaAsignar()` | Préstamos pendientes/activos listos para asignar a cobrador |
| `asignarPrestamoCobrador(loanId, cobradorId)` | Asigna o remueve cobrador de un préstamo |
| `fetchCollectorStats(cobradorId)` | Métricas de cobrador (cartera, recaudos, cuotas del día, mora) |

#### `cuotas.ts`
| Función | Descripción |
|---|---|
| `fetchCuotasByPrestamo(prestamoId)` | Cuotas de un préstamo, ordenadas |
| `fetchCuotasByPrestamos(prestamoIds)` | Cuotas de varios préstamos (para detalle de cliente) |
| `marcarCuotaPagada(cuotaId, moraAcumulada)` | Marca como pagada |

#### `configuracion.ts`
| Función | Descripción |
|---|---|
| `fetchConfiguracion()` | Devuelve `{ clave: valor }` |
| `fetchConfiguracionList()` | Lista cruda (para la página Config) |
| `fetchConfigByClave(clave)` | Lee un setting por clave |
| `ensureCurrencySetting(current)` | Asegura que exista `divisa` y sincroniza localStorage |
| `updateConfiguracion(id, valor)` | Update de un setting |

#### `pagos.ts`
| Función | Descripción |
|---|---|
| `registrarPago({ prestamoId, cuotaId, montoRecibido, aplicadoMora, aplicadoInteres, aplicadoCapital, metodoPago? })` | Registra un pago aplicando el monto a mora → interés → capital |
| `fetchWeeklyCollected(cobradorId, start, end)` | Suma de pagos en un rango (semana actual) |

#### `perfiles.ts`
| Función | Descripción |
|---|---|
| `fetchPerfiles({ page, pageSize }, searchTerm?)` | List paginado |
| `createAdminClient()` | Crea un cliente Supabase temporal (sin persistir sesión) |
| `createUsuario({ email, password, rol })` | signUp + insert en `perfiles` |
| `upsertPerfil({ id, email, rol })` | Inserta o actualiza perfil de usuario |
| `fetchPerfilRol(userId)` | Lee el rol del usuario autenticado |
| `updatePerfilRol(userId, newRole)` | Actualiza el rol de un usuario existente |
| `softDeletePerfil(id)` | Soft delete |
| `cambiarPasswordUsuario({ userId, newPassword })` | Llama a la Edge Function `change-password` |

#### `auth.ts`
| Función | Descripción |
|---|---|
| `loginWithPassword({ email, password })` | Autenticación con correo y contraseña |
| `logout()` | Cierra la sesión activa en Supabase |
| `getCurrentSession()` | Consulta la sesión actual persistida |
| `subscribeToAuthChanges(callback)` | Suscripción reactiva a eventos de auth (login, logout, refresh) |


### 🧪 Cómo añadir un nuevo servicio

1. Crear archivo `src/services/<tabla>.ts`.
2. Tipar entrada y salida usando los tipos de `services/types.ts`.
3. Exportar desde `services/index.ts`.
4. Usar desde la página:
   ```ts
   import { nuevaFuncion } from '../services';
   const { data, error } = await nuevaFuncion(args);
   ```
5. **Nunca** importar `supabase` desde una página.

---

## 🎨 Diseño y UI
La aplicación utiliza una paleta de colores profesional adecuada para el sector financiero:
- **Azul Corporativo** (`#1e3a8a`): Profesionalismo y confianza.
- **Verde Éxito** (`#10b981`): Flujos de caja positivos y pagos realizados.
- **Rojo Alerta** (`#ef4444`): Gestión de mora y estados críticos.

---

---

## 📄 Propuesta Técnica y Comercial

### 1. Descripción General
**PrestaYa** es una plataforma administrativa de última generación diseñada para digitalizar y optimizar el ciclo de vida completo de un préstamo. Desde la captación del cliente hasta el recaudo final, el sistema garantiza precisión financiera y control total sobre la cartera.

### 2. Ficha Técnica (Stack Tecnológico)
El aplicativo utiliza las tecnologías más modernas de la industria, asegurando rapidez y escalabilidad:

*   **Tecnología Web**: Desarrollado con **React 18** y **TypeScript**. Es una aplicación web responsiva con enfoque **Mobile-First**, lo que permite a los cobradores usarla desde su celular en campo con la misma fluidez que en una computadora de oficina.
*   **Base de Datos**: Utiliza **PostgreSQL** a través de **Supabase**. Es una base de datos relacional de grado empresarial que garantiza la integridad de los datos financieros.
*   **Seguridad**: Implementa **RLS (Row Level Security)**, lo que significa que cada dato está protegido a nivel de servidor, asegurando que solo personal autorizado pueda ver o editar la información sensible.
*   **Infraestructura Cloud**: Funciona en la nube, eliminando la necesidad de servidores locales y permitiendo acceso 24/7 desde cualquier lugar del mundo.

### 3. Funcionalidades Core (Lo que el sistema hace)

#### ✅ Gestión de Clientes (CRM)
*   Perfilamiento detallado de clientes con historial crediticio interno.
*   Búsqueda inteligente por documento o nombre.

#### ✅ Vista de Perfil Detallado y Análisis Crediticio (Nuevo)
El sistema ahora incluye una vista avanzada de 360° por cliente que permite realizar análisis de riesgo antes de otorgar nuevos créditos:
*   **Métricas de Desempeño**: Visualización de la puntualidad del cliente basada en su historial de pagos.
*   **Gestión de Mora**: Conteo exacto de cuotas vencidas y comportamiento frente a penalizaciones.
*   **Análisis Predictivo de Riesgo**: Clasificación automática (Bajo, Medio, Alto) basada en algoritmos de puntualidad.
*   **Monto Máximo Sugerido**: El sistema calcula cuánto capital se recomienda prestar al cliente en su próxima solicitud, premiando la lealtad y el buen comportamiento de pago.
*   **Historial Consolidado**: Línea de tiempo de todos los préstamos otorgados, permitiendo ver la evolución del cliente en el tiempo.

#### ✅ Configuración Flexible de Productos
*   Creación de múltiples **Planes de Préstamo** (Ej: Plan Emprende, Diario, Oro).
*   Personalización de tasas de interés, número de cuotas y frecuencias de pago (semanal, quincenal, mensual).

#### ✅ Motor Financiero Flexible
*   **Amortización Configurable**: El sistema soporta dos métodos de cálculo ajustables globalmente:
    *   **Sistema Francés (Saldos)**: El interés se calcula sobre el capital que queda debiendo. Las cuotas son fijas pero el interés disminuye con el tiempo (más rentable para el cliente).
    *   **Sistema Flat (Interés Simple)**: El interés se calcula sobre el monto inicial del préstamo. Se mantiene fijo en todas las cuotas (ideal para microcréditos y mayor rentabilidad).
*   **Cálculo de Mora Inteligente**: El sistema detecta automáticamente retrasos y calcula penalizaciones diarias basadas en la configuración del administrador.
*   **Gestión de Recaudos**: Registro de pagos con distribución automática (Capital / Interés / Mora).

#### ✅ Dashboard de Control (Business Intelligence)
*   Panel visual con indicadores clave: Valor de Cartera, Cantidad de Préstamos Activos, Cobros Pendientes para Hoy y Alertas de Mora.

### 4. Módulo de Informes y Reportes
El sistema genera información estratégica para la toma de decisiones:

*   **Estado de Cartera**: Informe detallado de saldos pendientes y capital colocado.
*   **Reporte de Recaudos**: Análisis de ingresos diarios y mensuales.
*   **Relación de Morosos**: Listado de clientes con pagos vencidos y días de retraso.
*   **Exportación Profesional**: Capacidad de generar y descargar reportes en **formato PDF** con un solo clic.

---

Desarrollado con ❤️ para la gestión financiera moderna.



---

## Actualizacion: Analisis de Riesgo y Puntualidad en Clientes (2026-03-07)

En el modal **Perfil del Cliente** (`src/pages/Clients.tsx`) se mejoro la lectura de riesgo y cumplimiento:

### Puntualidad (mas explicita)
- Se muestra `N/A` cuando no hay historial de cuotas pagadas (en lugar de asumir 100%).
- Se muestra el contexto operativo junto al porcentaje:
  - `X/Y cuotas pagadas a tiempo`.
- Se agregan indicadores de atraso:
  - `atraso promedio` y `atraso maximo` en dias.

### Nivel de riesgo (score compuesto)
- El riesgo ya no depende solo de puntualidad.
- Se calcula un `riskScore` de `0 a 100` usando:
  - puntualidad historica,
  - cuotas en mora activa,
  - atraso promedio y maximo,
  - relacion `saldo activo / total prestado`,
  - volumen de historial (numero de prestamos).
- Clasificacion:
  - `Bajo`: score >= 75
  - `Medio`: score entre 50 y 74
  - `Alto`: score < 50
- Se muestran factores explicativos en texto para justificar el nivel calculado.

### Monto maximo sugerido (ajustado por riesgo)
- Se calcula sobre el promedio historico por prestamo.
- Usa multiplicadores por:
  - nivel de riesgo,
  - puntualidad,
  - mora activa.
- Incluye limites minimo y maximo para evitar recomendaciones extremas.

### Notas tecnicas
- Archivos impactados:
  - `src/pages/Clients.tsx`
  - `src/index.css`
- El cambio fue validado con `npm run build` sin errores de compilacion.

---

## Versionamiento y Releases

Este proyecto tiene una base de versionamiento con:
- `VERSIONING.md`: politica de ramas, semver y convencion de commits.
- `CHANGELOG.md`: historial de cambios por version.
- `scripts/release.mjs`: flujo automatizado de release local.
- `scripts/update-changelog.mjs`: actualizacion automatica del changelog.

Comandos:

```bash
npm run release:patch
npm run release:minor
npm run release:major
```

Cada comando:
1. ejecuta `npm run build`
2. aumenta version en `package.json` y `package-lock.json`
3. actualiza `CHANGELOG.md`
4. crea commit `chore(release): vX.Y.Z`
5. crea tag `vX.Y.Z`

Para publicar:

```bash
git push
git push --tags
```
