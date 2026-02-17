export interface AmortizationRow {
  numero_cuota: number;
  monto_cuota: number;
  monto_capital: number;
  monto_interes: number;
  saldo_pendiente: number;
  fecha_vencimiento: string;
}

export function calculateAmortizationFrench(
  monto: number,
  tasaAnual: number,
  numCuotas: number,
  frecuencia: 'semanal' | 'quincenal' | 'mensual',
  fechaInicio: string
): AmortizationRow[] {
  // Ajustar tasa de interés según frecuencia
  let tasaPeriodo = tasaAnual / 100;
  let diasPorPeriodo = 30;

  if (frecuencia === 'semanal') {
    tasaPeriodo = tasaPeriodo / 4; // Asumiendo mes de 4 semanas
    diasPorPeriodo = 7;
  } else if (frecuencia === 'quincenal') {
    tasaPeriodo = tasaPeriodo / 2;
    diasPorPeriodo = 15;
  }
  // Para mensual se queda igual la tasa si es tasa mensual la que se ingresa.
  // El usuario pidió "establecer tasa de interés configurable por plan".
  // Normalmente en estos negocios la tasa es mensual.

  const cuotaTotal = monto * (tasaPeriodo * Math.pow(1 + tasaPeriodo, numCuotas)) / (Math.pow(1 + tasaPeriodo, numCuotas) - 1);
  
  const schedule: AmortizationRow[] = [];
  let saldoRestante = monto;
  let currentDate = new Date(fechaInicio);

  for (let i = 1; i <= numCuotas; i++) {
    const interesPeriodo = saldoRestante * tasaPeriodo;
    const capitalPeriodo = cuotaTotal - interesPeriodo;
    saldoRestante -= capitalPeriodo;

    // Ajustar fecha
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

  return schedule;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(amount);
}
