import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => {
  const mockFrom = vi.fn();
  const mockSelect = vi.fn();
  const mockInsert = vi.fn();
  const mockUpdate = vi.fn();
  const mockEq = vi.fn();
  const mockIs = vi.fn();
  const mockOrder = vi.fn();
  const mockRange = vi.fn();
  const mockIlike = vi.fn();
  const mockSingle = vi.fn();
  const mockFunctionsInvoke = vi.fn();
  return {
    mockFrom, mockSelect, mockInsert, mockUpdate, mockEq, mockIs,
    mockOrder, mockRange, mockIlike, mockSingle, mockFunctionsInvoke,
  };
});

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: mocks.mockFrom,
    functions: { invoke: mocks.mockFunctionsInvoke },
  },
}));

import { cambiarPasswordUsuario } from '../perfiles';

describe('services/perfiles - cambiarPasswordUsuario', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('invokes the change-password edge function with the correct body', async () => {
    mocks.mockFunctionsInvoke.mockResolvedValueOnce({
      data: { ok: true },
      error: null,
    });

    await cambiarPasswordUsuario({
      userId: 'abc-123-def-456',
      newPassword: 'nueva-clave-segura-123',
    });

    expect(mocks.mockFunctionsInvoke).toHaveBeenCalledWith('change-password', {
      body: { userId: 'abc-123-def-456', newPassword: 'nueva-clave-segura-123' },
    });
  });

  it('returns null error on success', async () => {
    mocks.mockFunctionsInvoke.mockResolvedValueOnce({
      data: { ok: true },
      error: null,
    });

    const { error } = await cambiarPasswordUsuario({
      userId: 'abc-123-def-456',
      newPassword: 'nueva-clave-segura-123',
    });

    expect(error).toBeNull();
  });

  it('returns an error when the edge function returns an error response', async () => {
    mocks.mockFunctionsInvoke.mockResolvedValueOnce({
      data: { ok: false, error: 'forbidden', detail: 'Caller no es admin' },
      error: null,
    });

    const { error } = await cambiarPasswordUsuario({
      userId: 'abc-123-def-456',
      newPassword: 'short',
    });

    expect(error).toBeInstanceOf(Error);
    expect(error?.message).toBe('Caller no es admin');
  });

  it('falls back to error code when detail is missing', async () => {
    mocks.mockFunctionsInvoke.mockResolvedValueOnce({
      data: { ok: false, error: 'weak_password' },
      error: null,
    });

    const { error } = await cambiarPasswordUsuario({
      userId: 'abc-123-def-456',
      newPassword: '123',
    });

    expect(error?.message).toBe('weak_password');
  });

  it('returns an error when supabase.functions.invoke itself fails', async () => {
    mocks.mockFunctionsInvoke.mockResolvedValueOnce({
      data: null,
      error: { message: 'Network error' },
    });

    const { error } = await cambiarPasswordUsuario({
      userId: 'abc-123-def-456',
      newPassword: 'nueva-clave-segura-123',
    });

    expect(error).toBeInstanceOf(Error);
    expect(error?.message).toBe('Network error');
  });

  it('falls back to a generic message when invoke error has no message', async () => {
    mocks.mockFunctionsInvoke.mockResolvedValueOnce({
      data: null,
      error: {},
    });

    const { error } = await cambiarPasswordUsuario({
      userId: 'abc-123-def-456',
      newPassword: 'nueva-clave-segura-123',
    });

    expect(error?.message).toBe('Edge Function error');
  });
});