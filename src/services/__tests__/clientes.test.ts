import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => {
  const mockFrom = vi.fn();
  const mockSelect = vi.fn();
  const mockIs = vi.fn();
  const mockOrder = vi.fn();
  const mockRange = vi.fn();
  const mockOr = vi.fn();
  const mockEq = vi.fn();
  const mockUpdate = vi.fn();
  const mockInsert = vi.fn();
  const mockSingle = vi.fn();
  const mockIlike = vi.fn();
  return {
    mockFrom, mockSelect, mockIs, mockOrder, mockRange, mockOr,
    mockEq, mockUpdate, mockInsert, mockSingle, mockIlike,
  };
});

vi.mock('../../lib/supabase', () => ({
  supabase: { from: mocks.mockFrom },
}));

import {
  fetchClientes,
  fetchClientesForSelect,
  createCliente,
  softDeleteCliente,
} from '../clientes';

const buildQueryChain = () => {
  const chain: any = {
    select: mocks.mockSelect,
    is: mocks.mockIs,
    order: mocks.mockOrder,
    range: mocks.mockRange,
    or: mocks.mockOr,
    eq: mocks.mockEq,
    update: mocks.mockUpdate,
    insert: mocks.mockInsert,
    ilike: mocks.mockIlike,
    single: mocks.mockSingle,
  };
  mocks.mockSelect.mockReturnValue(chain);
  mocks.mockIs.mockReturnValue(chain);
  mocks.mockOrder.mockReturnValue(chain);
  mocks.mockRange.mockResolvedValue({ data: [], count: 0, error: null });
  mocks.mockOr.mockReturnValue(chain);
  mocks.mockEq.mockReturnValue(chain);
  mocks.mockUpdate.mockReturnValue({ eq: mocks.mockEq });
  mocks.mockInsert.mockReturnValue({ select: () => ({ single: mocks.mockSingle }) });
  mocks.mockSingle.mockResolvedValue({ data: null, error: null });
  mocks.mockIlike.mockReturnValue(chain);
  return chain;
};

describe('services/clientes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    buildQueryChain();
    mocks.mockFrom.mockReturnValue({
      select: mocks.mockSelect,
      update: mocks.mockUpdate,
      insert: mocks.mockInsert,
    });
  });

  describe('fetchClientes', () => {
    it('returns paginated data with count', async () => {
      const clientes = [
        { id: '1', nombre: 'Juan', identificacion: '123' },
        { id: '2', nombre: 'Maria', identificacion: '456' },
      ];
      mocks.mockRange.mockResolvedValueOnce({
        data: clientes,
        count: 2,
        error: null,
      });

      const result = await fetchClientes({ page: 1, pageSize: 10 });

      expect(result.data).toEqual(clientes);
      expect(result.count).toBe(2);
      expect(mocks.mockFrom).toHaveBeenCalledWith('clientes');
      expect(mocks.mockIs).toHaveBeenCalledWith('deleted_at', null);
    });

    it('applies search filter on nombre and identificacion', async () => {
      await fetchClientes({ page: 1, pageSize: 10 }, 'juan');

      expect(mocks.mockOr).toHaveBeenCalledWith(
        'nombre.ilike.%juan%,identificacion.ilike.%juan%'
      );
    });

    it('returns empty array on error', async () => {
      mocks.mockRange.mockResolvedValueOnce({
        data: null,
        count: null,
        error: { message: 'DB error' },
      });

      const result = await fetchClientes({ page: 1, pageSize: 10 });

      expect(result.data).toEqual([]);
      expect(result.count).toBe(0);
    });

    it('calculates correct range for page 2', async () => {
      await fetchClientes({ page: 2, pageSize: 5 });

      expect(mocks.mockRange).toHaveBeenCalledWith(5, 9);
    });
  });

  describe('fetchClientesForSelect', () => {
    it('selects only id, nombre, identificacion', async () => {
      mocks.mockOrder.mockResolvedValueOnce({
        data: [{ id: '1', nombre: 'A', identificacion: 'X' }],
      });

      await fetchClientesForSelect();

      expect(mocks.mockSelect).toHaveBeenCalledWith('id, nombre, identificacion');
    });
  });

  describe('createCliente', () => {
    it('inserts and returns the new cliente', async () => {
      const nuevo = { nombre: 'Pedro', identificacion: '789', telefono: '555', email: 'p@x.com', direccion: '' };
      const inserted = { id: 'new-id', ...nuevo };
      mocks.mockSingle.mockResolvedValueOnce({ data: inserted, error: null });

      const { data, error } = await createCliente(nuevo as any);

      expect(data).toEqual(inserted);
      expect(error).toBeNull();
      expect(mocks.mockInsert).toHaveBeenCalledWith([nuevo]);
    });
  });

  describe('softDeleteCliente', () => {
    it('sets deleted_at to a valid ISO timestamp', async () => {
      const chain: any = { eq: vi.fn().mockResolvedValue({ error: null }) };
      mocks.mockUpdate.mockReturnValueOnce(chain);

      await softDeleteCliente('cli-123');

      expect(mocks.mockUpdate).toHaveBeenCalled();
      const callArgs = mocks.mockUpdate.mock.calls[0][0];
      expect(callArgs).toHaveProperty('deleted_at');
      expect(new Date(callArgs.deleted_at).toString()).not.toBe('Invalid Date');
    });
  });
});