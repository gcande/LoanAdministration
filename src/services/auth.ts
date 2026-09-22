import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { ServiceResult } from './types';

export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Inicia sesión con email y contraseña.
 */
export async function loginWithPassword(
  credentials: LoginCredentials
): Promise<ServiceResult<{ user: User | null; session: Session | null }>> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  });

  return {
    data: data ? { user: data.user, session: data.session } : null,
    error,
  };
}

/**
 * Cierra la sesión activa.
 */
export async function logout(): Promise<{ error: unknown }> {
  const { error } = await supabase.auth.signOut();
  return { error };
}

/**
 * Obtiene la sesión actual del usuario.
 */
export async function getCurrentSession(): Promise<{
  session: Session | null;
  error: unknown;
}> {
  const { data, error } = await supabase.auth.getSession();
  return {
    session: data.session,
    error,
  };
}

/**
 * Escucha cambios en el estado de autenticación (login, logout, token refresh).
 */
export function subscribeToAuthChanges(
  callback: (event: AuthChangeEvent, session: Session | null) => void
) {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(callback);

  return subscription;
}

export type { AuthChangeEvent, Session, User };
