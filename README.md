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
- `/src/pages`: Vistas principales de la aplicación.
- `/src/utils`: Utilidades financieras y formateadores.
- `supabase_schema.sql`: Script de inicialización de base de datos.

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
