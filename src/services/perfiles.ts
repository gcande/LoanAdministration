import { createClient } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { PaginatedResult, PaginationParams, Perfil, Rol, ServiceResult } from './types';

/**
 * Lista perfiles paginados con búsqueda opcional.
 * Excluye soft-deleted (deleted_at IS NULL).
 */
export async function fetchPerfiles(
  params: PaginationParams,
  searchTerm?: string
): Promise<PaginatedResult<Perfil>> {
  const { page, pageSize } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('perfiles')
    .select('*', { count: 'exact' })
    .is('deleted_at', null);

  if (searchTerm) {
    query = query.ilike('email', `%${searchTerm}%`);
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    console.error('[perfiles.fetchPerfiles]', error);
    return { data: [], count: 0 };
  }

  return { data: (data as Perfil[]) || [], count: count || 0 };
}

/**
 * Crea un usuario nuevo con email/password usando un cliente admin temporal.
 * Este cliente NO persiste sesión — es seguro para crear usuarios sin deslogear al admin.
 */
export function createAdminClient() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

/**
 * Crea un usuario + perfil. Flujo:
 * 1. signUp con cliente admin (sin persistir sesión).
 * 2. Insert en tabla perfiles con el id devuelto.
 */
export async function createUsuario(args: {
  email: string;
  password: string;
  rol: Rol;
}) {
  const admin = createAdminClient();
  const { data: signUpData, error: signUpError } = await admin.auth.signUp({
    email: args.email,
    password: args.password,
  });

  if (signUpError || !signUpData.user) {
    return { user: null, error: signUpError };
  }

  const { data, error } = await supabase
    .from('perfiles')
    .insert([
      {
        id: signUpData.user.id,
        email: args.email,
        rol: args.rol,
      },
    ])
    .select()
    .single();

  return { user: data, error };
}

/**
 * Soft delete de un perfil.
 */
export async function softDeletePerfil(id: string) {
  const { error } = await supabase
    .from('perfiles')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  return { error };
}

/**
 * Cambia la contraseña de un usuario delegando a la Edge Function `change-password`.
 * La Edge Function usa service_role y verifica que el caller sea admin.
 *
 * Requiere haber desplegado:
 *   supabase functions deploy change-password --no-verify-jwt
 * Ver: supabase/functions/change-password/README.md
 */
export async function cambiarPasswordUsuario(args: {
  userId: string;
  newPassword: string;
}) {
  const { data, error } = await supabase.functions.invoke<{ ok: boolean; error?: string; detail?: string }>(
    'change-password',
    {
      body: { userId: args.userId, newPassword: args.newPassword },
    },
  );

  if (error) {
    console.error('[perfiles.cambiarPasswordUsuario]', error);
    return { error: new Error(error.message ?? 'Edge Function error') };
  }
  if (data && data.error) {
    return { error: new Error(data.detail ?? data.error) };
  }
  return { error: null };
}

/**
 * Inserta o actualiza un perfil de usuario.
 */
export async function upsertPerfil(payload: {
  id: string;
  email: string;
  rol: Rol;
}): Promise<ServiceResult<Perfil>> {
  const { data, error } = await supabase
    .from('perfiles')
    .upsert(payload)
    .select()
    .single();

  return { data: data as Perfil | null, error };
}

/**
 * Obtiene el rol de un usuario por su ID de autenticación.
 */
export async function fetchPerfilRol(
  userId: string
): Promise<ServiceResult<{ rol: Rol }>> {
  const { data, error } = await supabase
    .from('perfiles')
    .select('rol')
    .eq('id', userId)
    .single();

  return { data: data as { rol: Rol } | null, error };
}

/**
 * Actualiza el rol de un usuario.
 */
export async function updatePerfilRol(
  userId: string,
  newRole: Rol
): Promise<{ error: unknown }> {
  const { error } = await supabase
    .from('perfiles')
    .update({ rol: newRole })
    .eq('id', userId);

  return { error };
}
