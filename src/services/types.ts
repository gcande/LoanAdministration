/**
 * Tipos compartidos por los servicios de Supabase.
 * Centralizamos los tipos de dominio aquí para evitar duplicación.
 */

export type FrecuenciaPago = 'semanal' | 'quincenal' | 'mensual';
export type SistemaAmortizacion = 'frances' | 'flat';
export type EstadoPrestamo = 'activo' | 'en_mora' | 'pagado' | 'al_dia' | 'cancelado';
export type EstadoCuota = 'pendiente' | 'pagado' | 'vencido' | 'parcial';
export type Rol = 'admin' | 'cobrador';

export interface Cliente {
  id: string;
  nombre: string;
  identificacion: string;
  telefono: string;
  email: string;
  direccion: string;
  estado: string;
  deleted_at: string | null;
  created_at: string;
  updated_at?: string;
}

export interface PlanPrestamo {
  id: string;
  nombre_plan: string;
  monto_minimo: number;
  monto_maximo: number;
  tasa_interes: number;
  num_cuotas: number;
  frecuencia_pago: FrecuenciaPago;
  activo: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Prestamo {
  id: string;
  cliente_id: string;
  plan_id: string;
  cobrador_id?: string;
  monto_prestado: number;
  tasa_interes: number;
  num_cuotas: number;
  fecha_inicio: string;
  fecha_fin: string;
  saldo_pendiente: number;
  estado: EstadoPrestamo;
  created_at: string;
}

export interface Cuota {
  id: string;
  prestamo_id: string;
  numero_cuota: number;
  monto_cuota: number;
  monto_capital: number;
  monto_interes: number;
  fecha_vencimiento: string;
  fecha_pago?: string | null;
  estado: EstadoCuota;
  mora_acumulada?: number;
}

export interface Configuracion {
  id: string;
  clave: string;
  valor: string;
  descripcion?: string;
  created_at: string;
  updated_at?: string;
}

export interface Pago {
  id: string;
  prestamo_id: string;
  cuota_id: string;
  monto_pagado: number;
  metodo_pago: string;
  aplicado_a_mora: number;
  aplicado_a_interes: number;
  aplicado_a_capital: number;
  created_at: string;
}

export interface Perfil {
  id: string;
  email: string;
  rol: Rol;
  deleted_at: string | null;
  created_at: string;
}

/**
 * Tipo de paginación estándar.
 */
export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  data: T[];
  count: number;
}

/**
 * Tipo de retorno uniforme para los servicios.
 * Mantiene el patrón de Supabase para no perder información.
 */
export interface ServiceResult<T> {
  data: T | null;
  error: unknown;
}