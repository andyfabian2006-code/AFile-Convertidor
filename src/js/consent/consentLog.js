import { supabase } from '../core/supabase.js';

const POLICY_VERSION = 'v1';

export async function registrarConsentimiento({ analytics, ads }) {
  try {
    // Sin .select(): no hay política de lectura y daría error
    await supabase.from('consent_logs').insert({
      policy_version: POLICY_VERSION,
      consent_decision: { analytics: Boolean(analytics), ads: Boolean(ads) },
    });
  } catch (e) {
    // Silencioso: el banner debe funcionar aunque falle el registro
  }
}
