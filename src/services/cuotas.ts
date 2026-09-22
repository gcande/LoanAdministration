import { supabase } from '../lib/supabase';
import type { Cuota, EstadoCuota } from './types';

/**
 * Lista cuotas de un préstamo, ordenadas por número.
 */
export async function fetchCuotasByPrestamo(prestamoId: string): Promise<Cuota[]> {
  const { data } = await supabase
    .from('cuotas')
    .select('*')
    .eq('prestamo_id', prestamoId)
    .order('numero_cuota', { ascending: true });

  return (data as Cuota[]) || [];
}

/**
 * Lista cuotas por múltiples préstamos (usado en detalle de cliente).
 */
export async function fetchCuotasByPrestamos(prestamoIds: string[]): Promise<Cuota[]> {
  if (prestamoIds.length === 0) return [];
  const { data } = await supabase
    .from('cuotas')
    .select('*')
    .in('prestamo_id', prestamoIds);

  return (data as Cuota[]) || [];
}

/**
 * Marca una cuota como pagada.
 */
export async function marcarCuotaPagada(
  cuotaId: string,
  moraAcumulada: number
) {
  const { error } = await supabase
    .from('cuotas')
    .update({
      estado: 'pagado' as EstadoCuota,
      fecha_pago: new Date().toISOString(),
      mora_acumulada: moraAcumulada,
    })
    .eq('id', cuotaId);

  return { error };
}