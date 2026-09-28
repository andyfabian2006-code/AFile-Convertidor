import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registrarConversion } from '../../src/js/core/stats.js';
import { registrarConsentimiento } from '../../src/js/consent/consentLog.js';
import { supabase } from '../../src/js/core/supabase.js';
import contactHandler from '../../netlify/functions/contact.js';

// Mock de Supabase
vi.mock('../../src/js/core/supabase.js', () => {
  return {
    supabase: {
      rpc: vi.fn(),
      from: vi.fn(() => ({
        insert: vi.fn()
      }))
    }
  };
});

describe('Supabase Analytics & Consent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('registrarConversion llama al rpc de Supabase y maneja errores silenciosamente', async () => {
    supabase.rpc.mockResolvedValueOnce({ error: null });
    
    await registrarConversion('png-a-jpg');
    
    expect(supabase.rpc).toHaveBeenCalledWith('increment_conversion', { p_type: 'png-a-jpg' });
  });

  it('registrarConversion no lanza excepciones si rpc falla', async () => {
    supabase.rpc.mockRejectedValueOnce(new Error('Network error'));
    
    await expect(registrarConversion('png-a-jpg')).resolves.toBeUndefined();
  });

  it('registrarConsentimiento hace insert y maneja errores silenciosamente', async () => {
    const mockInsert = vi.fn().mockResolvedValueOnce({ error: null });
    supabase.from.mockReturnValueOnce({ insert: mockInsert });

    await registrarConsentimiento({ analytics: true, ads: false });

    expect(supabase.from).toHaveBeenCalledWith('consent_logs');
    expect(mockInsert).toHaveBeenCalledWith({
      policy_version: 'v1',
      consent_decision: { analytics: true, ads: false }
    });
  });

  it('registrarConsentimiento no lanza excepciones si insert falla', async () => {
    const mockInsert = vi.fn().mockRejectedValueOnce(new Error('Network error'));
    supabase.from.mockReturnValueOnce({ insert: mockInsert });

    await expect(registrarConsentimiento({ analytics: true, ads: false })).resolves.toBeUndefined();
  });
});

describe('Netlify Contact Function', () => {
  it('Debe rechazar métodos distintos a POST u OPTIONS', async () => {
    const req = { method: 'GET', headers: { get: () => null } };
    const res = await contactHandler(req);
    expect(res.status).toBe(405);
  });

  it('Debe devolver 400 si faltan datos en el POST', async () => {
    const req = { 
      method: 'POST', 
      headers: { get: () => null },
      json: async () => ({ name: 'Test' }) 
    };
    const res = await contactHandler(req);
    expect(res.status).toBe(400);
  });
});
