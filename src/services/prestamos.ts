import { supabase } from '../lib/supabase';
import { getLateCutoffDateIso, getTodayIsoDate } from '../utils/loanMetrics';
import { fetchConfiguracion } from './configuracion';
import type { Cuota, EstadoPrestamo, PaginatedResult, PaginationParams, Prestamo } from './types';

/**
 * Estadísticas globales del dashboard.
 * - totalActiveLoans, portfolioValue, expectedToday, paymentsToday, delinquentCount
 * - roleAware: si se pasa cobradorId, filtra por cobrador.
 */
export async function fetchDashboardStats(cobradorId?: string) {
  let lQuery = supabase
    .from('prestamos')
    .select('count', { count: 'exact' })
    .eq('estado', 'activo');

  let pQuery = supabase.from('prestamos').select('saldo_pendiente');
  let cQuery = supabase
    .from('cuotas')
    .select('monto_cuota, prestamos!inner(cobrador_id)')
    .eq('fecha_vencimiento', getTodayIsoDate());
  let payQuery = supabase
    .from('cuotas')
    .select('fecha_pago, prestamos!inner(cobrador_id)');
  let dQuery = supabase
    .from('prestamos')
    .select('count', { count: 'exact' })
    .eq('estado', 'en_mora');

  if (cobradorId) {
    lQuery = lQuery.eq('cobrador_id', cobradorId);
    pQuery = pQuery.eq('cobrador_id', cobradorId);
    cQuery = cQuery.eq('prestamos.cobrador_id', cobradorId);
    payQuery = payQuery.eq('prestamos.cobrador_id', cobradorId);
    dQuery = dQuery.eq('cobrador_id', cobradorId);
  }

  const [{ data: loansActive }, { data: portfolio }, { data: todayCuotas }, { data: paymentsToday }, { data: delinquents }] =
    await Promise.all([lQuery, pQuery, cQuery, payQuery, dQuery]);

  const totalPortfolio =
    (portfolio as any[])?.reduce((acc, curr) => acc + Number(curr.saldo_pendiente), 0) || 0;
  const totalToday =
    (todayCuotas as any[])?.reduce((acc, curr) => acc + Number(curr.monto_cuota), 0) || 0;

  const hoyStr = getTodayIsoDate();
  const totalPaymentsToday =
    (paymentsToday as any[])?.reduce((acc, curr) => {
      if (!curr.fecha_pago) return acc;
      return curr.fecha_pago.split('T')[0] === hoyStr ? acc + 1 : acc;
    }, 0) || 0;

  return {
    totalActiveLoans: (loansActive as any)?.[0]?.count || 0,
    portfolioValue: totalPortfolio,
    expectedToday: totalToday,
    paymentsToday: totalPaymentsToday,
    delinquentCount: (delinquents as any)?.[0]?.count || 0,
  };
}

/**
 * Lista préstamos con sus cuotas para alertas del dashboard.
 */
export async function fetchLoanAlerts(limit = 200) {
  const { data } = await supabase
    .from('prestamos')
    .select(
      `
        id,
        estado,
        clientes (nombre),
        cuotas (fecha_vencimiento, estado)
      `
    )
    .in('estado', ['activo', 'en_mora'])
    .order('created_at', { ascending: false })
    .limit(limit);

  return data || [];
}

/**
 * IDs de préstamos con al menos una cuota vencida (no pagada y vencida).
 * Usa dias_gracia de la tabla configuracion.
 */
export async function fetchPrestamosEnMoraIds(): Promise<string[]> {
  const cfg = await fetchConfiguracion();
  const graceDays = Number(cfg.dias_gracia || 0);
  const hoy = getTodayIsoDate();

  const cutoff = getLateCutoffDateIso(hoy, graceDays);

  const { data } = await supabase
    .from('cuotas')
    .select('prestamo_id')
    .neq('estado', 'pagado')
    .lt('fecha_vencimiento', cutoff);

  return Array.from(new Set((data || []).map((x: any) => x.prestamo_id)));
}

/**
 * List paginado de préstamos con join a clientes y plan.
 * Aplica filtros por estado, cobrador y búsqueda por cliente.
 */
export async function fetchPrestamos(
  params: PaginationParams,
  opts: {
    searchTerm?: string;
    filter?: 'todos' | EstadoPrestamo;
    cobradorId?: string;
    moraIds?: string[];
  } = {}
): Promise<PaginatedResult<any>> {
  const { page, pageSize } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { searchTerm, filter = 'todos', cobradorId, moraIds } = opts;

  let query = supabase
    .from('prestamos')
    .select(
      `
        *,
        clientes!inner (nombre, identificacion),
        planes_prestamo (nombre_plan)
      `,
      { count: 'exact' }
    );

  if (cobradorId) {
    query = query.eq('cobrador_id', cobradorId);
  }
  if (searchTerm) {
    query = query.or(
      `nombre.ilike.%${searchTerm}%,identificacion.ilike.%${searchTerm}%`,
      { foreignTable: 'clientes' }
    );
  }

  if (filter === 'activo') {
    query = query.eq('estado', 'activo');
    if (moraIds && moraIds.length > 0) {
      query = query.not('id', 'in', `(${moraIds.join(',')})`);
    }
  }
  if (filter === 'pagado') query = query.eq('estado', 'pagado');
  if (filter === 'en_mora') {
    if (moraIds && moraIds.length > 0) {
      query = query.in('id', moraIds);
    } else {
      query = query.eq('id', '00000000-0000-0000-0000-000000000000');
    }
  }

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    console.error('[prestamos.fetchPrestamos]', error);
    return { data: [], count: 0 };
  }

  // Añadimos estado_ui según mora calculada
  const moraSet = new Set(moraIds || []);
  const processed = (data || []).map((loan: any) => {
    let uiStatus = loan.estado || 'activo';
    if (loan.estado !== 'pagado' && moraSet.has(loan.id)) {
      uiStatus = 'en_mora';
    }
    return { ...loan, estado_ui: uiStatus };
  });

  return { data: processed, count: count || 0 };
}

/**
 * Conteos para tabs de LoansList (todos, activo, en_mora, pagado).
 */
export async function fetchPrestamosCounts(cobradorId?: string) {
  const moraIds = await fetchPrestamosEnMoraIds();

  let cQuery = supabase.from('prestamos').select('*', { count: 'exact', head: true });
  let pQuery = supabase
    .from('prestamos')
    .select('*', { count: 'exact', head: true })
    .eq('estado', 'pagado');
  let aQuery = supabase.from('prestamos').select('id').eq('estado', 'activo');

  if (cobradorId) {
    cQuery = cQuery.eq('cobrador_id', cobradorId);
    pQuery = pQuery.eq('cobrador_id', cobradorId);
    aQuery = aQuery.eq('cobrador_id', cobradorId);
  }

  const [{ count: cTodos }, { count: cPagado }, { data: prestamosActivos }] =
    await Promise.all([cQuery, pQuery, aQuery]);

  const activosIds = (prestamosActivos || []).map((p) => p.id);
  const enMoraEfectivos = moraIds.filter((id) => activosIds.includes(id));

  return {
    todos: cTodos || 0,
    activo: activosIds.length - enMoraEfectivos.length,
    en_mora: moraIds.length,
    pagado: cPagado || 0,
  };
}

export async function fetchPrestamoConCliente(prestamoId: string) {
  const { data, error } = await supabase
    .from('prestamos')
    .select('*, clientes(nombre, identificacion, telefono)')
    .eq('id', prestamoId)
    .single();

  return { data, error };
}

/**
 * Crea un préstamo + inserta todas sus cuotas en una sola transacción lógica.
 * Retorna { prestamo, error }.
 */
export async function createPrestamoConCuotas(args: {
  prestamo: Omit<Prestamo, 'id' | 'created_at'>;
  cuotas: Omit<Cuota, 'id' | 'prestamo_id'>[];
}) {
  const { prestamo, cuotas } = args;
  const { data: loan, error: loanError } = await supabase
    .from('prestamos')
    .insert([prestamo])
    .select()
    .single();

  if (loanError || !loan) return { prestamo: null, error: loanError };

  const cuotasToInsert = cuotas.map((c) => ({ ...c, prestamo_id: loan.id }));
  const { error: cuotasError } = await supabase.from('cuotas').insert(cuotasToInsert);

  if (cuotasError) return { prestamo: loan, error: cuotasError };
  return { prestamo: loan, error: null };
}

/**
 * Actualiza saldo pendiente y estado (pagado si saldo <= 0).
 */
export async function actualizarSaldoPrestamo(
  prestamoId: string,
  nuevoSaldo: number
) {
  const estado = nuevoSaldo <= 0 ? 'pagado' : 'activo';
  const { error } = await supabase
    .from('prestamos')
    .update({
      saldo_pendiente: Math.max(0, nuevoSaldo),
      estado,
    })
    .eq('id', prestamoId);

  return { error };
}

/**
 * Listado plano de préstamos con cliente (para reportes PDF, etc.).
 */
export async function fetchPrestamosConCliente() {
  const { data } = await supabase
    .from('prestamos')
    .select('*, clientes(nombre, identificacion)')
    .order('created_at', { ascending: false });

  return data || [];
}

/**
 * Préstamos asignados a un cobrador, con sus cuotas (no pagados).
 * Usado en la tabla del Dashboard para rol=cobrador.
 */
export async function fetchAssignedLoansForCollector(cobradorId: string) {
  const { data } = await supabase
    .from('prestamos')
    .select(
      `
        id,
        monto_prestado,
        saldo_pendiente,
        estado,
        clientes (nombre, identificacion, telefono),
        cuotas (monto_cuota, fecha_vencimiento, estado)
      `
    )
    .eq('cobrador_id', cobradorId)
    .neq('estado', 'pagado')
    .order('created_at', { ascending: false });

  return data || [];
}

/**
 * Suma de monto_cuota de las cuotas que vencen en un rango (semana actual).
 * Filtra por cobrador a través del join con prestamos.
 */
export async function fetchWeeklyGoal(
  cobradorId: string,
  startIso: string,
  endIso: string
): Promise<number> {
  const { data } = await supabase
    .from('cuotas')
    .select('monto_cuota, prestamos!inner(cobrador_id)')
    .eq('prestamos.cobrador_id', cobradorId)
    .gte('fecha_vencimiento', startIso)
    .lte('fecha_vencimiento', endIso);

  return (data || []).reduce(
    (acc: number, c: any) => acc + Number(c.monto_cuota),
    0
  );
}

/**
 * Obtiene los préstamos pendientes o activos disponibles para asignar a un cobrador.
 */
export async function fetchPrestamosParaAsignar() {
  const { data, error } = await supabase
    .from('prestamos')
    .select(`
      id,
      monto_prestado,
      saldo_pendiente,
      cobrador_id,
      clientes (nombre, identificacion)
    `)
    .neq('estado', 'pagado')
    .order('created_at', { ascending: false });

  return { data: data || [], error };
}

/**
 * Asigna o desasigna un cobrador a un préstamo.
 */
export async function asignarPrestamoCobrador(
  loanId: string,
  cobradorId: string | null
): Promise<{ error: unknown }> {
  const { error } = await supabase
    .from('prestamos')
    .update({ cobrador_id: cobradorId })
    .eq('id', loanId);

  return { error };
}

export interface CollectorStats {
  totalLoans: number;
  totalCartera: number;
  totalRecaudado: number;
  totalCobros: number;
  recaudoHoy: number;
  cuotasPendientesHoy: number;
  moraCount: number;
}

/**
 * Obtiene las métricas y estadísticas consolidadas de un cobrador.
 */
export async function fetchCollectorStats(
  cobradorId: string
): Promise<{ data: CollectorStats; error: unknown }> {
  const { data: assignedLoans, error: loansError } = await supabase
    .from('prestamos')
    .select('id, saldo_pendiente, monto_prestado, estado')
    .eq('cobrador_id', cobradorId);

  const loans = assignedLoans || [];
  const loanIds = loans.map((l) => l.id);

  const totalCartera = loans.reduce(
    (acc, curr) => acc + Number(curr.saldo_pendiente),
    0
  );
  const moraCount = loans.filter((l) => l.estado === 'en_mora').length;

  let totalRecaudado = 0;
  let totalCobros = 0;
  let recaudoHoy = 0;

  const hoyStart = new Date();
  hoyStart.setHours(0, 0, 0, 0);
  const hoyEnd = new Date();
  hoyEnd.setHours(23, 59, 59, 999);

  if (loanIds.length > 0) {
    const { data: allPayments } = await supabase
      .from('pagos')
      .select('monto_pagado, fecha_pago')
      .in('prestamo_id', loanIds);

    const payments = allPayments || [];
    totalRecaudado = payments.reduce(
      (acc, curr) => acc + Number(curr.monto_pagado),
      0
    );
    totalCobros = payments.length;

    recaudoHoy = payments
      .filter((p) => {
        const fecha = new Date(p.fecha_pago);
        return fecha >= hoyStart && fecha <= hoyEnd;
      })
      .reduce((acc, curr) => acc + Number(curr.monto_pagado), 0);
  }

  let cuotasPendientesHoy = 0;
  if (loanIds.length > 0) {
    const { count } = await supabase
      .from('cuotas')
      .select('*', { count: 'exact', head: true })
      .in('prestamo_id', loanIds)
      .eq('estado', 'pendiente')
      .eq('fecha_vencimiento', new Date().toISOString().split('T')[0]);

    cuotasPendientesHoy = count || 0;
  }

  return {
    data: {
      totalLoans: loans.length,
      totalCartera,
      totalRecaudado,
      totalCobros,
      recaudoHoy,
      cuotasPendientesHoy,
      moraCount,
    },
    error: loansError,
  };
}