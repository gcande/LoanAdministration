export interface AmortizationRow {
  numero_cuota: number;
  monto_cuota: number;
  monto_capital: number;
  monto_interes: number;
  saldo_pendiente: number;
  fecha_vencimiento: string;
}

const DEFAULT_CURRENCY = 'COP';
const CURRENCY_STORAGE_KEY = 'system_currency';
const ALLOWED_CURRENCIES = new Set(['COP', 'USD']);

export function getStoredCurrency(): string {
  if (typeof window === 'undefined') return DEFAULT_CURRENCY;
  try {
    const raw = localStorage.getItem(CURRENCY_STORAGE_KEY);
    if (!raw) return DEFAULT_CURRENCY;
    const normalized = raw.trim().toUpperCase();
    return ALLOWED_CURRENCIES.has(normalized) ? normalized : DEFAULT_CURRENCY;
  } catch {
    return DEFAULT_CURRENCY;
  }
}

export function setStoredCurrency(currency: string) {
  if (typeof window === 'undefined') return;
  try {
    const normalized = currency.trim().toUpperCase();
    const value = ALLOWED_CURRENCIES.has(normalized) ? normalized : DEFAULT_CURRENCY;
    localStorage.setItem(CURRENCY_STORAGE_KEY, value);
  } catch {
    // Ignore storage errors.
  }
}

function getCurrencyLocale(currency: string) {
  return currency === 'USD' ? 'en-US' : 'es-CO';
}

function getCurrencyFractionDigits(currency: string) {
  return currency === 'USD' ? 2 : 0;
}

export function calculateAmortization(
  monto: number,
  tasaAnual: number,
  numCuotas: number,
  frecuencia: 'semanal' | 'quincenal' | 'mensual',
  fechaInicio: string,
  sistema: 'frances' | 'flat' = 'frances'
): AmortizationRow[] {
  let tasaPeriodo = tasaAnual / 100;
  let diasPorPeriodo = 30;

  if (frecuencia === 'semanal') {
    tasaPeriodo = tasaPeriodo / 4;
    diasPorPeriodo = 7;
  } else if (frecuencia === 'quincenal') {
    tasaPeriodo = tasaPeriodo / 2;
    diasPorPeriodo = 15;
  }

  const schedule: AmortizationRow[] = [];
  const currentDate = new Date(fechaInicio);

  if (sistema === 'flat') {
    // Sistema Simple (Flat): Interés fijo sobre el monto inicial
    const interesTotal = monto * tasaAnual / 100;
    const montoTotal = monto + interesTotal;
    const cuotaTotal = montoTotal / numCuotas;
    const capitalPorCuota = monto / numCuotas;
    const interesPorCuota = interesTotal / numCuotas;
    
    let saldoRestante = monto;

    for (let i = 1; i <= numCuotas; i++) {
      saldoRestante -= capitalPorCuota;
      currentDate.setDate(currentDate.getDate() + diasPorPeriodo);

      schedule.push({
        numero_cuota: i,
        monto_cuota: Number(cuotaTotal.toFixed(2)),
        monto_capital: Number(capitalPorCuota.toFixed(2)),
        monto_interes: Number(interesPorCuota.toFixed(2)),
        saldo_pendiente: Number(Math.max(0, saldoRestante).toFixed(2)),
        fecha_vencimiento: currentDate.toISOString().split('T')[0]
      });
    }
  } else {
    // Sistema Francés: Interés sobre saldo pendiente
    const cuotaTotal = monto * (tasaPeriodo * Math.pow(1 + tasaPeriodo, numCuotas)) / (Math.pow(1 + tasaPeriodo, numCuotas) - 1);
    let saldoRestante = monto;

    for (let i = 1; i <= numCuotas; i++) {
      const interesPeriodo = saldoRestante * tasaPeriodo;
      const capitalPeriodo = cuotaTotal - interesPeriodo;
      saldoRestante -= capitalPeriodo;

      currentDate.setDate(currentDate.getDate() + diasPorPeriodo);

      schedule.push({
        numero_cuota: i,
        monto_cuota: Number(cuotaTotal.toFixed(2)),
        monto_capital: Number(capitalPeriodo.toFixed(2)),
        monto_interes: Number(interesPeriodo.toFixed(2)),
        saldo_pendiente: Number(Math.max(0, saldoRestante).toFixed(2)),
        fecha_vencimiento: currentDate.toISOString().split('T')[0]
      });
    }
  }

  return schedule;
}

export function formatCurrency(amount: number, currency?: string): string {
  const resolved = (currency ?? getStoredCurrency()).toUpperCase();
  const safeCurrency = ALLOWED_CURRENCIES.has(resolved) ? resolved : DEFAULT_CURRENCY;
  const fractionDigits = getCurrencyFractionDigits(safeCurrency);

  return new Intl.NumberFormat(getCurrencyLocale(safeCurrency), {
    style: 'currency',
    currency: safeCurrency,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits
  }).format(amount);
}
