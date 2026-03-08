export interface InstallmentLike {
  estado?: string | null;
  fecha_vencimiento?: string | null;
  fecha_pago?: string | null;
  prestamo_id?: string | null;
}

/**
 * Retorna la fecha actual en formato YYYY-MM-DD usando la zona local del cliente.
 * Se usa como referencia estable para comparaciones de vencimientos.
 */
export const getTodayIsoDate = (baseDate: Date = new Date()): string =>
  [
    baseDate.getFullYear(),
    String(baseDate.getMonth() + 1).padStart(2, '0'),
    String(baseDate.getDate()).padStart(2, '0')
  ].join('-');

const normalizeIsoDate = (value?: string | null): string | null => {
  if (!value) return null;
  return value.slice(0, 10);
};

const shiftIsoDateByDays = (isoDate: string, days: number): string => {
  const [year, month, day] = isoDate.split('-').map(Number);
  const dt = new Date(Date.UTC(year, month - 1, day));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
};

/**
 * Calcula la fecha límite (inclusive) para aplicar mora según días de gracia.
 * Ejemplo:
 * - hoy: 2026-03-05, gracia: 0 => cutoff 2026-03-05 (lógica clásica)
 * - hoy: 2026-03-05, gracia: 2 => cutoff 2026-03-03
 */
export const getLateCutoffDateIso = (
  todayIso: string = getTodayIsoDate(),
  graceDays: number = 0
): string => shiftIsoDateByDays(todayIso, -Math.max(0, Number(graceDays) || 0));

/**
 * Determina si una cuota está en mora:
 * - No está pagada
 * - Su vencimiento es anterior al cutoff de mora (hoy - días de gracia)
 */
export const isInstallmentLate = (
  installment: InstallmentLike,
  todayIso: string = getTodayIsoDate(),
  graceDays: number = 0
): boolean => {
  const dueDate = normalizeIsoDate(installment.fecha_vencimiento);
  if (!dueDate) return false;
  const cutoffIso = getLateCutoffDateIso(todayIso, graceDays);

  return installment.estado !== 'pagado' && dueDate < cutoffIso;
};

/**
 * Cuenta cuántas cuotas están en mora para una lista dada.
 * Reutiliza la misma regla de `isInstallmentLate` para evitar duplicidad de lógica.
 */
export const countLateInstallments = (
  installments: InstallmentLike[],
  todayIso: string = getTodayIsoDate(),
  graceDays: number = 0
): number =>
  installments.reduce((acc, installment) => (
    isInstallmentLate(installment, todayIso, graceDays) ? acc + 1 : acc
  ), 0);

/**
 * Calcula el porcentaje de puntualidad histórica:
 * - Toma únicamente cuotas pagadas
 * - Cuenta como puntual si `fecha_pago <= fecha_vencimiento`
 * - Si no hay cuotas pagadas retorna 100 por defecto
 */
export const calculatePunctuality = (installments: InstallmentLike[]): number => {
  const paidInstallments = installments.filter((i) => i.estado === 'pagado');
  if (paidInstallments.length === 0) return 100;

  const onTimeInstallments = paidInstallments.filter((i) => {
    const paidDate = normalizeIsoDate(i.fecha_pago);
    const dueDate = normalizeIsoDate(i.fecha_vencimiento);
    if (!paidDate || !dueDate) return false;
    return paidDate <= dueDate;
  });

  return Math.round((onTimeInstallments.length / paidInstallments.length) * 100);
};
