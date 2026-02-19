export interface AmortizationRow {
  numero_cuota: number;
  monto_cuota: number;
  monto_capital: number;
  monto_interes: number;
  saldo_pendiente: number;
  fecha_vencimiento: string;
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
  let currentDate = new Date(fechaInicio);

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

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(amount);
}
