import { describe, it, expect } from 'vitest';
import {
  calculatePunctuality,
  countLateInstallments,
  getLateCutoffDateIso,
  getTodayIsoDate,
} from '../loanMetrics';

describe('utils/loanMetrics', () => {
  describe('getTodayIsoDate', () => {
    it('returns YYYY-MM-DD format', () => {
      const today = getTodayIsoDate();
      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('getLateCutoffDateIso', () => {
    it('subtracts grace days from today', () => {
      const result = getLateCutoffDateIso('2026-07-08', 3);
      // 2026-07-08 minus 3 days = 2026-07-05
      expect(result).toBe('2026-07-05');
    });

    it('handles month boundary', () => {
      const result = getLateCutoffDateIso('2026-07-02', 5);
      // 2026-07-02 minus 5 days = 2026-06-27
      expect(result).toBe('2026-06-27');
    });

    it('returns same date when grace is 0', () => {
      const result = getLateCutoffDateIso('2026-07-08', 0);
      expect(result).toBe('2026-07-08');
    });
  });

  describe('countLateInstallments', () => {
    it('counts cuotas that are not paid and overdue', () => {
      const today = '2026-07-08';
      const grace = 3;
      // cutoff = getLateCutoffDateIso(today, grace) = '2026-07-05'

      const installments = [
        { fecha_vencimiento: '2026-07-01', estado: 'pendiente' }, // mora
        { fecha_vencimiento: '2026-07-04', estado: 'pendiente' }, // mora (justo en cutoff)
        { fecha_vencimiento: '2026-07-05', estado: 'pendiente' }, // no mora (después del cutoff)
        { fecha_vencimiento: '2026-07-01', estado: 'pagado' },    // pagada, no cuenta
      ];

      const count = countLateInstallments(installments as any, today, grace);
      expect(count).toBe(2);
    });

    it('returns 0 when no installments', () => {
      expect(countLateInstallments([], '2026-07-08', 3)).toBe(0);
    });
  });

  describe('calculatePunctuality', () => {
    it('returns 100 when all paid on time', () => {
      const installments = [
        { fecha_vencimiento: '2026-06-01', fecha_pago: '2026-05-30', estado: 'pagado' },
        { fecha_vencimiento: '2026-06-15', fecha_pago: '2026-06-14', estado: 'pagado' },
      ];

      expect(calculatePunctuality(installments as any)).toBe(100);
    });

    it('returns 100 by default when no paid installments (clean record)', () => {
      const installments = [
        { fecha_vencimiento: '2026-06-01', estado: 'pendiente' },
      ];

      // Sin historial de pagos = 100% puntualidad por convención
      expect(calculatePunctuality(installments as any)).toBe(100);
    });

    it('returns percentage of on-time payments', () => {
      const installments = [
        { fecha_vencimiento: '2026-06-01', fecha_pago: '2026-05-30', estado: 'pagado' },
        { fecha_vencimiento: '2026-06-15', fecha_pago: '2026-06-20', estado: 'pagado' },
        { fecha_vencimiento: '2026-07-01', fecha_pago: '2026-07-01', estado: 'pagado' },
        { fecha_vencimiento: '2026-07-15', fecha_pago: '2026-07-14', estado: 'pagado' },
      ];

      // 3/4 on time = 75
      expect(calculatePunctuality(installments as any)).toBe(75);
    });
  });
});