import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { formatCurrency, calculateAmortization, getStoredCurrency, setStoredCurrency } from '../finance';

describe('utils/finance - formatCurrency', () => {
  it('formats COP without decimals by default', () => {
    const result = formatCurrency(1500000);
    expect(result).toContain('1.500.000');
    expect(result).not.toContain(','); // uses dots as thousand separator in es-CO
  });

  it('formats USD with 2 decimals', () => {
    const result = formatCurrency(1234.5, 'USD');
    expect(result).toMatch(/1,234\.50/);
  });

  it('handles zero value', () => {
    const result = formatCurrency(0);
    expect(result).toMatch(/0/);
  });
});

describe('utils/finance - currency storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('defaults to COP when storage is empty', () => {
    expect(getStoredCurrency()).toBe('COP');
  });

  it('persists USD when set', () => {
    setStoredCurrency('USD');
    expect(getStoredCurrency()).toBe('USD');
  });

  it('normalizes lowercase input to uppercase', () => {
    setStoredCurrency('usd');
    expect(getStoredCurrency()).toBe('USD');
  });

  it('rejects invalid currency and falls back to COP', () => {
    setStoredCurrency('EUR');
    expect(getStoredCurrency()).toBe('COP');
  });
});

describe('utils/finance - calculateAmortization (frances)', () => {
  it('generates N rows for N cuotas', () => {
    const schedule = calculateAmortization(
      1000000,    // monto
      12,         // tasa anual %
      12,         // num cuotas
      'mensual',  // frecuencia
      '2026-01-01',
      'frances'
    );

    expect(schedule).toHaveLength(12);
  });

  it('each row has a positive monto_cuota and saldo', () => {
    const schedule = calculateAmortization(
      500000, 10, 6, 'mensual', '2026-01-01', 'frances'
    );

    for (const row of schedule) {
      expect(row.monto_cuota).toBeGreaterThan(0);
      expect(row.saldo_pendiente).toBeGreaterThanOrEqual(0);
    }
  });

  it('interest is greater than zero in french system', () => {
    const schedule = calculateAmortization(
      1000000, 12, 12, 'mensual', '2026-01-01', 'frances'
    );

    const firstRow = schedule[0];
    expect(firstRow.monto_interes).toBeGreaterThan(0);
    expect(firstRow.monto_capital).toBeGreaterThan(0);
  });

  it('last row saldo is zero or near zero', () => {
    const schedule = calculateAmortization(
      1000000, 12, 12, 'mensual', '2026-01-01', 'frances'
    );

    const lastRow = schedule[schedule.length - 1];
    expect(lastRow.saldo_pendiente).toBeLessThan(1); // tolerance for floating point
  });

  it('dates increment by 30 days for monthly frequency', () => {
    const schedule = calculateAmortization(
      100000, 5, 3, 'mensual', '2026-01-15', 'frances'
    );

    expect(schedule[0].fecha_vencimiento).toBe('2026-02-14');
    expect(schedule[1].fecha_vencimiento).toBe('2026-03-16');
  });
});

describe('utils/finance - calculateAmortization (flat)', () => {
  it('generates equal interest on every cuota', () => {
    const schedule = calculateAmortization(
      1200000,    // monto
      12,         // 12% anual sobre capital inicial
      12,         // 12 cuotas
      'mensual',
      '2026-01-01',
      'flat'
    );

    const firstInterest = schedule[0].monto_interes;
    const lastInterest = schedule[schedule.length - 1].monto_interes;

    expect(firstInterest).toBe(lastInterest); // flat: mismo interés
  });

  it('capital portion is the same every cuota in flat system', () => {
    const schedule = calculateAmortization(
      1200000, 12, 12, 'mensual', '2026-01-01', 'flat'
    );

    const firstCapital = schedule[0].monto_capital;
    const lastCapital = schedule[schedule.length - 1].monto_capital;

    expect(firstCapital).toBe(lastCapital);
    expect(firstCapital).toBe(100000); // 1.200.000 / 12
  });
});