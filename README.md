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

# Construir para producción
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

#### ✅ Configuración Flexible de Productos
*   Creación de múltiples **Planes de Préstamo** (Ej: Plan Emprende, Diario, Oro).
*   Personalización de tasas de interés, número de cuotas y frecuencias de pago (semanal, quincenal, mensual).

#### ✅ Motor Financiero Avanzado
*   **Amortización Automática**: Generación instantánea de cronogramas de pago bajo el **Sistema Francés** (cuotas fijas).
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


