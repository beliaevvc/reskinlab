import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { getIpHash } from '../lib/ipHash';

/**
 * Save a shared calculator session (anonymous).
 * Creates a shareable code that can be used to load the session later.
 *
 * Usage:
 *   const saveSession = useSaveSharedSession();
 *   const result = await saveSession.mutateAsync({ stateJson, totalsJson });
 *   // result = { short_code: 'ABCD1234', session_id: '...', expires_at: '...' }
 */
export function useSaveSharedSession() {
  return useMutation({
    mutationFn: async ({ stateJson, totalsJson }) => {
      // Get IP hash for rate limiting (non-blocking, nullable)
      const ipHash = await getIpHash();

      const { data, error } = await supabase.rpc('save_shared_session', {
        p_state_json: stateJson,
        p_totals_json: totalsJson,
        p_ip_hash: ipHash,
        p_metadata: {
          user_agent: navigator.userAgent,
          referrer: document.referrer || null,
          timestamp: new Date().toISOString(),
        },
      });

      if (error) {
        // Parse specific error codes
        if (error.message?.includes('Rate limit exceeded')) {
          throw new Error('Too many requests. Please wait before creating another code.');
        }
        if (error.message?.includes('state_json cannot be empty')) {
          throw new Error('Calculator is empty. Add items before generating a code.');
        }
        throw error;
      }

      return data;
    },
  });
}

/**
 * Load a shared calculator session by code.
 * Works for both anonymous and authenticated users.
 *
 * Usage:
 *   const { data, isLoading, error } = useLoadSharedSession('ABCD1234');
 *   // data = { state_json: {...}, totals_json: {...}, created_at: '...', expires_at: '...' }
 */
export function useLoadSharedSession(code) {
  return useQuery({
    queryKey: ['shared-session', code],
    queryFn: async () => {
      if (!code) return null;

      const { data, error } = await supabase.rpc('load_shared_session', {
        p_short_code: code.toUpperCase().trim(),
      });

      if (error) {
        if (error.message?.includes('Session not found')) {
          throw new Error('Code not found. Please check and try again.');
        }
        if (error.message?.includes('already been used')) {
          throw new Error('This code has already been claimed.');
        }
        if (error.message?.includes('expired')) {
          throw new Error('This code has expired.');
        }
        throw error;
      }

      return data;
    },
    enabled: !!code,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Claim a shared session into the authenticated user's account.
 * Creates a project + specification draft from the shared session.
 *
 * Usage:
 *   const claimSession = useClaimSharedSession();
 *   const result = await claimSession.mutateAsync('ABCD1234');
 *   // result = { project_id: '...', specification_id: '...', spec_number: 'SPEC-2026-00001' }
 */
export function useClaimSharedSession() {
  return useMutation({
    mutationFn: async (code) => {
      const { data, error } = await supabase.rpc('claim_shared_session', {
        p_short_code: code.toUpperCase().trim(),
      });

      if (error) {
        if (error.message?.includes('Authentication required')) {
          throw new Error('You must be logged in to claim a selection.');
        }
        if (error.message?.includes('not found, already claimed, or expired')) {
          throw new Error('This code is invalid, has already been used, or has expired.');
        }
        throw error;
      }

      return data;
    },
  });
}
