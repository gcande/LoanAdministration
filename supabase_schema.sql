-- Tablas principales para PrestaYa

-- 1. Clientes
CREATE TABLE IF NOT EXISTS clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    identificacion TEXT UNIQUE NOT NULL,
    telefono TEXT,
    email TEXT,
    direccion TEXT,
    foto_url TEXT,
    fecha_registro TIMESTAMPTZ DEFAULT now(),
    estado TEXT DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo', 'bloqueado')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Planes de Préstamo
CREATE TABLE IF NOT EXISTS planes_prestamo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_plan TEXT NOT NULL,
    monto_minimo DECIMAL(15, 2) NOT NULL,
    monto_maximo DECIMAL(15, 2) NOT NULL,
    tasa_interes DECIMAL(5, 2) NOT NULL, -- Porcentaje (ej: 5.00)
    num_cuotas INTEGER NOT NULL,
    frecuencia_pago TEXT NOT NULL CHECK (frecuencia_pago IN ('semanal', 'quincenal', 'mensual')),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Préstamos
CREATE TABLE IF NOT EXISTS prestamos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES planes_prestamo(id),
    monto_prestado DECIMAL(15, 2) NOT NULL,
    tasa_interes DECIMAL(5, 2) NOT NULL,
    num_cuotas INTEGER NOT NULL,
    fecha_inicio DATE DEFAULT CURRENT_DATE,
    fecha_fin DATE,
    estado TEXT DEFAULT 'activo' CHECK (estado IN ('activo', 'al_dia', 'en_mora', 'pagado', 'cancelado')),
    saldo_pendiente DECIMAL(15, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Cuotas
CREATE TABLE IF NOT EXISTS cuotas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prestamo_id UUID REFERENCES prestamos(id) ON DELETE CASCADE,
    numero_cuota INTEGER NOT NULL,
    monto_cuota DECIMAL(15, 2) NOT NULL,
    monto_capital DECIMAL(15, 2) NOT NULL,
    monto_interes DECIMAL(15, 2) NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    fecha_pago TIMESTAMPTZ,
    estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'pagado', 'parcial', 'vencido')),
    mora_acumulada DECIMAL(15, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Pagos
CREATE TABLE IF NOT EXISTS pagos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prestamo_id UUID REFERENCES prestamos(id) ON DELETE CASCADE,
    cuota_id UUID REFERENCES cuotas(id),
    monto_pagado DECIMAL(15, 2) NOT NULL,
    fecha_pago TIMESTAMPTZ DEFAULT now(),
    metodo_pago TEXT NOT NULL,
    comprobante TEXT,
    aplicado_a_mora DECIMAL(15, 2) DEFAULT 0,
    aplicado_a_interes DECIMAL(15, 2) DEFAULT 0,
    aplicado_a_capital DECIMAL(15, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Penalizaciones
CREATE TABLE IF NOT EXISTS penalizaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prestamo_id UUID REFERENCES prestamos(id) ON DELETE CASCADE,
    cuota_id UUID REFERENCES cuotas(id),
    dias_retraso INTEGER NOT NULL,
    porcentaje_mora DECIMAL(5, 2) NOT NULL,
    monto_mora DECIMAL(15, 2) NOT NULL,
    fecha_aplicacion TIMESTAMPTZ DEFAULT now()
);

-- 7. Configuración Global
CREATE TABLE IF NOT EXISTS configuracion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clave TEXT UNIQUE NOT NULL,
    valor TEXT NOT NULL,
    descripcion TEXT,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Usuarios / Perfiles
CREATE TABLE public.perfiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  rol TEXT CHECK (rol IN ('admin', 'cobrador')) DEFAULT 'cobrador',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Seguridad RLS
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE planes_prestamo ENABLE ROW LEVEL SECURITY;
ALTER TABLE prestamos ENABLE ROW LEVEL SECURITY;
ALTER TABLE cuotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE penalizaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;

-- Políticas para perfiles
CREATE POLICY "Usuarios ven su propio perfil" ON perfiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins ven todos los perfiles" ON perfiles FOR ALL USING (
  EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'admin')
);

-- Para simplificar el ejercicio, habilitaremos acceso total a usuarios autenticados
-- En producción, esto debería ser más restrictivo según el ROL.
CREATE POLICY "Permitir todo a autenticados en clientes" ON clientes FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir todo a autenticados en planes_prestamo" ON planes_prestamo FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir todo a autenticados en prestamos" ON prestamos FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir todo a autenticados en cuotas" ON cuotas FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir todo a autenticados en pagos" ON pagos FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir todo a autenticados en penalizaciones" ON penalizaciones FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir todo a autenticados en configuracion" ON configuracion FOR ALL USING (auth.role() = 'authenticated');

-- Función para calcular moras automáticamente (Trigger)
-- Esto se puede ejecutar periódicamente o al intentar pagar.
-- Por ahora, insertaremos la configuración inicial.
-- Semilla de datos iniciales
INSERT INTO planes_prestamo (nombre_plan, monto_minimo, monto_maximo, tasa_interes, num_cuotas, frecuencia_pago) VALUES 
('Plan Emprende', 100000, 2000000, 5.0, 12, 'mensual'),
('Microcrédito Rápido', 50000, 500000, 8.0, 4, 'semanal'),
('Plan Oro', 2000000, 10000000, 3.5, 24, 'mensual');

-- Configuración inicial
INSERT INTO configuracion (clave, valor, descripcion) VALUES 
('tasa_mora_diaria', '1.5', 'Porcentaje de mora por día de retraso'),
('dias_gracia', '3', 'Días de gracia antes de aplicar mora'),
('nombre_empresa', 'PrestaYa Finanzas', 'Nombre de la aplicación'),
('sistema_amortizacion', 'frances', 'Basa el cálculo en el saldo pendiente (frances) o en el monto total (flat)')
ON CONFLICT (clave) DO NOTHING;

-- 9. Trigger para creación automática de perfil
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.perfiles (id, email, rol)
  VALUES (new.id, new.email, 'cobrador');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
