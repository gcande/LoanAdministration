import { supabase } from '../lib/supabase';
import type { Pago } from './types';

/**
 * Registra un pago aplicando el monto a: mora → interés → capital.
 */
export async function registrarPago(args: {
  prestamoId: string;
  cuotaId: string;
  montoRecibido: number;
  aplicadoMora: number;
  aplicadoInteres: number;
  aplicadoCapital: number;
  metodoPago?: string;
}) {
  const payload = {
    prestamo_id: args.prestamoId,
    cuota_id: args.cuotaId,
    monto_pagado: args.montoRecibido,
    metodo_pago: args.metodoPago || 'Efectivo',
    aplicado_a_mora: args.aplicadoMora,
    aplicado_a_interes: args.aplicadoInteres,
    aplicado_a_capital: args.aplicadoCapital,
  };

  const { data, error } = await supabase.from('pagos').insert([payload]).select().single();
  return { data: data as Pago | null, error };
}

/**
 * Suma de pagos realizados en un rango (semana actual), filtrado por cobrador.
 * Usado en la métrica "Recaudado esta semana" del Dashboard.
 */
export async function fetchWeeklyCollected(
  cobradorId: string,
  startIso: string,
  endIso: string
): Promise<number> {
  const { data } = await supabase
    .from('pagos')
    .select('monto_pagado, prestamos!inner(cobrador_id)')
    .eq('prestamos.cobrador_id', cobradorId)
    .gte('fecha_pago', startIso)
    .lte('fecha_pago', endIso);

  return (data || []).reduce(
    (acc: number, p: any) => acc + Number(p.monto_pagado),
    0
  );
}