import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => {
  const mockFrom = vi.fn();
  const mockSelect = vi.fn();
  const mockIn = vi.fn();
  const mockEq = vi.fn();
  const mockNeq = vi.fn();
  const mockOrder = vi.fn();
  const mockLimit = vi.fn();
  const mockLt = vi.fn();
  const mockGte = vi.fn();
  const mockLte = vi.fn();
  return {
    mockFrom, mockSelect, mockIn, mockEq, mockNeq,
    mockOrder, mockLimit, mockLt, mockGte, mockLte,
  };
});

vi.mock('../../lib/supabase', () => ({
  supabase: { from: mocks.mockFrom },
}));

vi.mock('../configuracion', () => ({
  fetchConfiguracion: vi.fn().mockResolvedValue({ dias_gracia: '3' }),
}));

import {
  fetchPrestamosEnMoraIds,
  fetchLoanAlerts,
} from '../prestamos';

describe('services/prestamos', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    const chain: any = {
      select: mocks.mockSelect,
      in: mocks.mockIn,
      eq: mocks.mockEq,
      neq: mocks.mockNeq,
      order: mocks.mockOrder,
      limit: mocks.mockLimit,
      lt: mocks.mockLt,
      gte: mocks.mockGte,
      lte: mocks.mockLte,
    };
    mocks.mockSelect.mockReturnValue(chain);
    mocks.mockIn.mockReturnValue(chain);
    mocks.mockEq.mockReturnValue(chain);
    mocks.mockNeq.mockReturnValue(chain);
    mocks.mockOrder.mockReturnValue(chain);
    mocks.mockLimit.mockResolvedValue({ data: [], error: null });
    mocks.mockLt.mockReturnValue(chain);
    mocks.mockGte.mockReturnValue(chain);
    mocks.mockLte.mockReturnValue(chain);

    mocks.mockFrom.mockReturnValue({ select: mocks.mockSelect });
  });

  describe('fetchPrestamosEnMoraIds', () => {
    it('queries cuotas filtered by non-paid and late date', async () => {
      mocks.mockLt.mockResolvedValueOnce({
        data: [
          { prestamo_id: 'a' },
          { prestamo_id: 'b' },
          { prestamo_id: 'a' }, // duplicate
        ],
        error: null,
      });

      const result = await fetchPrestamosEnMoraIds();

      expect(result).toEqual(['a', 'b']); // deduplicated
      expect(mocks.mockFrom).toHaveBeenCalledWith('cuotas');
      expect(mocks.mockNeq).toHaveBeenCalledWith('estado', 'pagado');
      expect(mocks.mockLt).toHaveBeenCalled();
    });

    it('returns empty array when no mora data', async () => {
      mocks.mockLt.mockResolvedValueOnce({ data: [], error: null });

      const result = await fetchPrestamosEnMoraIds();

      expect(result).toEqual([]);
    });

    it('handles null data gracefully', async () => {
      mocks.mockLt.mockResolvedValueOnce({ data: null, error: null });

      const result = await fetchPrestamosEnMoraIds();

      expect(result).toEqual([]);
    });
  });

  describe('fetchLoanAlerts', () => {
    it('queries prestamos with nested cuotas join', async () => {
      mocks.mockLimit.mockResolvedValueOnce({ data: [], error: null });

      await fetchLoanAlerts(50);

      expect(mocks.mockFrom).toHaveBeenCalledWith('prestamos');
      expect(mocks.mockIn).toHaveBeenCalledWith('estado', ['activo', 'en_mora']);
      expect(mocks.mockLimit).toHaveBeenCalledWith(50);
    });

    it('returns empty array when no alerts', async () => {
      mocks.mockLimit.mockResolvedValueOnce({ data: null, error: null });

      const result = await fetchLoanAlerts();

      expect(result).toEqual([]);
    });

    it('uses default limit when not specified', async () => {
      mocks.mockLimit.mockResolvedValueOnce({ data: [], error: null });

      await fetchLoanAlerts();

      expect(mocks.mockLimit).toHaveBeenCalledWith(200);
    });
  });
});