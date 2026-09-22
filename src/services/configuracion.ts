import { supabase } from '../lib/supabase';
import { setStoredCurrency } from '../utils/finance';
import type { Configuracion } from './types';

const DEFAULT_CURRENCY = 'COP';

/**
 * Devuelve la configuración completa como objeto { clave: valor }.
 * Para evitar múltiples queries por setting.
 */
export async function fetchConfiguracion(): Promise<Record<string, string>> {
  const { data } = await supabase.from('configuracion').select('*');
  return (data || []).reduce((acc: Record<string, string>, curr: any) => {
    acc[curr.clave] = curr.valor;
    return acc;
  }, {});
}

/**
 * Devuelve la lista cruda de configuraciones (para página Config).
 */
export async function fetchConfiguracionList(): Promise<Configuracion[]> {
  const { data } = await supabase
    .from('configuracion')
    .select('*')
    .order('clave');
  return (data as Configuracion[]) || [];
}

/**
 * Lee un setting por clave. Devuelve string vacío si no existe.
 */
export async function fetchConfigByClave(clave: string): Promise<string> {
  const { data } = await supabase
    .from('configuracion')
    .select('valor')
    .eq('clave', clave)
    .maybeSingle();

  return data?.valor || '';
}

/**
 * Asegura que exista el setting 'divisa'. Si no existe, lo crea con DEFAULT_CURRENCY.
 * También sincroniza localStorage para uso inmediato en la UI.
 */
export async function ensureCurrencySetting(current: Configuracion[]) {
  const existing = current.find((s) => s.clave === 'divisa');
  if (existing) {
    if (existing.valor) setStoredCurrency(existing.valor);
    return current;
  }

  const { data, error } = await supabase
    .from('configuracion')
    .insert([
      {
        clave: 'divisa',
        valor: DEFAULT_CURRENCY,
        descripcion: 'Divisa usada para el formato de montos del sistema',
      },
    ])
    .select()
    .single();

  if (error || !data) return current;
  setStoredCurrency(data.valor);
  return [...current, data].sort((a, b) => (a.clave || '').localeCompare(b.clave || ''));
}

export async function updateConfiguracion(id: string, valor: string) {
  const { error } = await supabase
    .from('configuracion')
    .update({ valor, updated_at: new Date().toISOString() })
    .eq('id', id);

  return { error };
}