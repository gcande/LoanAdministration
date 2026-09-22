import { supabase } from '../lib/supabase';
import type { PlanPrestamo, ServiceResult } from './types';

/**
 * Lista todos los planes, ordenados por fecha de creación.
 */
export async function fetchPlanes(): Promise<PlanPrestamo[]> {
  const { data } = await supabase
    .from('planes_prestamo')
    .select('*')
    .order('created_at', { ascending: false });

  return (data as PlanPrestamo[]) || [];
}

/**
 * Lista solo los planes activos — usado en selects y NewLoan.
 */
export async function fetchPlanesActivos(): Promise<PlanPrestamo[]> {
  const { data } = await supabase
    .from('planes_prestamo')
    .select('*')
    .eq('activo', true)
    .order('nombre_plan', { ascending: true });

  return (data as PlanPrestamo[]) || [];
}

export async function createPlan(
  payload: Omit<PlanPrestamo, 'id' | 'created_at'>
): Promise<ServiceResult<PlanPrestamo>> {
  const { data, error } = await supabase
    .from('planes_prestamo')
    .insert([payload])
    .select()
    .single();

  return { data: data as PlanPrestamo | null, error };
}

export async function updatePlan(
  id: string,
  payload: Partial<PlanPrestamo>
): Promise<ServiceResult<PlanPrestamo>> {
  const { data, error } = await supabase
    .from('planes_prestamo')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  return { data: data as PlanPrestamo | null, error };
}

export async function deletePlan(id: string) {
  const { error } = await supabase.from('planes_prestamo').delete().eq('id', id);
  return { error };
}