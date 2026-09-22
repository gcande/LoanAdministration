import { supabase } from '../lib/supabase';
import type {
  Cliente,
  PaginatedResult,
  PaginationParams,
  ServiceResult,
} from './types';

/**
 * Obtiene clientes paginados con búsqueda opcional.
 * Excluye soft-deleted (deleted_at IS NULL).
 */
export async function fetchClientes(
  params: PaginationParams,
  searchTerm?: string
): Promise<PaginatedResult<Cliente>> {
  const { page, pageSize } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('clientes')
    .select('*', { count: 'exact' })
    .is('deleted_at', null);

  if (searchTerm) {
    query = query.or(
      `nombre.ilike.%${searchTerm}%,identificacion.ilike.%${searchTerm}%`
    );
  }

  const { data, error, count } = await query
    .order('nombre', { ascending: true })
    .range(from, to);

  if (error) {
    console.error('[clientes.fetchClientes]', error);
    return { data: [], count: 0 };
  }

  return { data: (data as Cliente[]) || [], count: count || 0 };
}

/**
 * Obtiene un cliente por ID junto con sus préstamos y cuotas (para stats).
 */
export async function fetchClienteDetalle(clienteId: string) {
  const { data: cliente, error } = await supabase
    .from('clientes')
    .select('*')
    .eq('id', clienteId)
    .is('deleted_at', null)
    .single();

  if (error || !cliente) {
    return { cliente: null, prestamos: [], cuotas: [] };
  }

  const { data: prestamos } = await supabase
    .from('prestamos')
    .select('*, planes_prestamo(nombre_plan)')
    .eq('cliente_id', clienteId)
    .order('created_at', { ascending: false });

  const prestamoIds = (prestamos || []).map((p) => p.id);
  let cuotas: any[] = [];
  if (prestamoIds.length > 0) {
    const { data } = await supabase
      .from('cuotas')
      .select('*')
      .in('prestamo_id', prestamoIds);
    cuotas = data || [];
  }

  return { cliente, prestamos: prestamos || [], cuotas };
}

/**
 * Lista mínima de clientes (id, nombre, identificación) para dropdowns.
 */
export async function fetchClientesForSelect(): Promise<
  Pick<Cliente, 'id' | 'nombre' | 'identificacion'>[]
> {
  const { data } = await supabase
    .from('clientes')
    .select('id, nombre, identificacion')
    .is('deleted_at', null)
    .order('nombre', { ascending: true });

  return (data as any[]) || [];
}

export async function createCliente(
  payload: Omit<Cliente, 'id' | 'estado' | 'deleted_at' | 'created_at'>
): Promise<ServiceResult<Cliente>> {
  const { data, error } = await supabase
    .from('clientes')
    .insert([payload])
    .select()
    .single();

  return { data: data as Cliente | null, error };
}

export async function updateCliente(
  id: string,
  payload: Partial<Cliente>
): Promise<ServiceResult<Cliente>> {
  const { data, error } = await supabase
    .from('clientes')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  return { data: data as Cliente | null, error };
}

/**
 * Soft delete: marca deleted_at con NOW().
 */
export async function softDeleteCliente(id: string) {
  const { error } = await supabase
    .from('clientes')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  return { error };
}