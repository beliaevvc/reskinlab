import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { logOfferEvent } from '../lib/auditLog';
import {
  generateOfferNumber,
  getLegalText,
  getOfferValidUntil,
} from '../lib/offerUtils';
import {
  generateInvoiceNumber,
  calculatePaymentMilestones,
  getInvoiceDueDate,
} from '../lib/invoiceUtils';

/**
 * Fetch all offers for the current client
 */
export function useOffers() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['offers', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('offers')
        .select(`
          *,
          specification:specifications (
            id,
            version,
            totals_json,
            project:projects (
              id,
              name,
              client:clients (
                id,
                company_name,
                profile:profiles (
                  id,
                  full_name
                )
              )
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });
}

/**
 * Fetch all offers for admin/AM (no client filtering)
 */
export function useAllOffers() {
  return useQuery({
    queryKey: ['offers', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('offers')
        .select(`
          *,
          specification:specifications (
            id,
            version,
            totals_json,
            project:projects (
              id,
              name,
              client:clients (
                id,
                company_name,
                profile:profiles (
                  id,
                  full_name
                )
              )
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
}

/**
 * Fetch single offer with details
 */
export function useOffer(offerId) {
  return useQuery({
    queryKey: ['offer', offerId],
    queryFn: async () => {
      if (!offerId) return null;

      const { data, error } = await supabase
        .from('offers')
        .select(`
          *,
          specification:specifications (
            id,
            version,
            status,
            state_json,
            totals_json,
            project:projects (
              id,
              name,
              client_id
            )
          ),
          invoices (
            id,
            number,
            milestone_id,
            milestone_name,
            milestone_order,
            amount_usd,
            currency,
            status,
            due_date,
            paid_at
          )
        `)
        .eq('id', offerId)
        .single();

      if (error) throw error;
      
      if (data?.invoices) {
        data.invoices.sort((a, b) => a.milestone_order - b.milestone_order);
      }
      
      return data;
    },
    enabled: !!offerId,
  });
}

/**
 * Fetch offer by specification ID
 */
export function useOfferBySpecification(specificationId) {
  return useQuery({
    queryKey: ['offer', 'spec', specificationId],
    queryFn: async () => {
      if (!specificationId) return null;

      const { data, error } = await supabase
        .from('offers')
        .select('*')
        .eq('specification_id', specificationId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!specificationId,
  });
}

/**
 * Create a new offer from a finalized specification
 */
export function useCreateOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (specificationId) => {
      // 1. Fetch specification details
      const { data: spec, error: specError } = await supabase
        .from('specifications')
        .select(`
          *,
          project:projects (
            id,
            name,
            client_id
          )
        `)
        .eq('id', specificationId)
        .single();

      if (specError) throw specError;

      // 2. Verify specification is finalized
      if (spec.status !== 'finalized') {
        throw new Error('Specification must be finalized before creating an offer');
      }

      // 3. Check if offer already exists
      const { data: existingOffer } = await supabase
        .from('offers')
        .select('*')
        .eq('specification_id', specificationId)
        .single();

      if (existingOffer) {
        return existingOffer;
      }

      // 4. Generate offer number with retry on collision
      let offer = null;
      let retries = 3;
      
      while (retries > 0) {
        const offerNumber = await generateOfferNumber();

        const { data: newOffer, error: offerError } = await supabase
          .from('offers')
          .insert({
            specification_id: specificationId,
            number: offerNumber,
            status: 'pending',
            legal_text: getLegalText(spec),
            terms_version: '1.0',
            valid_until: getOfferValidUntil(),
          })
          .select()
          .single();

        if (!offerError) {
          offer = newOffer;
          break;
        }

        if (offerError.code === '23505') {
          retries--;
          if (retries === 0) {
            throw new Error('Failed to generate unique offer number after multiple attempts');
          }
          continue;
        }

        throw offerError;
      }

      // 5. Generate invoices based on payment milestones
      const milestones = calculatePaymentMilestones(spec);

      for (const milestone of milestones) {
        const invoiceNumber = await generateInvoiceNumber();

        await supabase
          .from('invoices')
          .insert({
            offer_id: offer.id,
            project_id: spec.project_id,
            number: invoiceNumber,
            milestone_id: milestone.id,
            milestone_name: milestone.name,
            milestone_order: milestone.order,
            amount_usd: milestone.amount,
            currency: 'USDT',
            status: 'pending',
            due_date: getInvoiceDueDate(milestone.order),
            // wallet_address and network are selected by client from active wallets
          });
      }

      // 6. Update project status
      await supabase
        .from('projects')
        .update({ status: 'offer_pending' })
        .eq('id', spec.project_id);

      // Log audit event
      try {
        await logOfferEvent('create_offer', offer.id, {
          offer_number: offer.number,
          specification_id: specificationId,
          total: spec.totals_json?.grandTotal || 0,
          milestones_count: milestones.length,
        });
      } catch (e) {
        console.warn('Failed to log audit event:', e);
      }

      return offer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offers'] });
      queryClient.invalidateQueries({ queryKey: ['offer'] });
      queryClient.invalidateQueries({ queryKey: ['specifications'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ 
        predicate: (query) => query.queryKey[0] === 'projects'
      });
    },
  });
}

/**
 * Accept an offer (with legal logging)
 */
export function useAcceptOffer() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ offerId, userAgent }) => {
      // 1. Fetch current offer with full details
      const { data: offer, error: fetchError } = await supabase
        .from('offers')
        .select(`
          *,
          specification:specifications (
            *,
            project:projects (*)
          )
        `)
        .eq('id', offerId)
        .single();

      if (fetchError) throw fetchError;

      if (offer.status !== 'pending') {
        throw new Error('Offer is not in pending status');
      }

      if (new Date(offer.valid_until) < new Date()) {
        throw new Error('Offer has expired');
      }

      // 2. Log acceptance with full snapshot
      const { error: logError } = await supabase
        .from('offer_acceptance_logs')
        .insert({
          offer_id: offerId,
          user_id: user.id,
          action: 'accepted',
          user_agent: userAgent || navigator.userAgent,
          offer_snapshot: {
            offer,
            accepted_at: new Date().toISOString(),
          },
        });

      if (logError) throw logError;

      // 3. Update offer status
      const { data: updatedOffer, error: updateError } = await supabase
        .from('offers')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
          accepted_by: user.id,
        })
        .eq('id', offerId)
        .select()
        .single();

      if (updateError) throw updateError;

      // 4. Update project status
      await supabase
        .from('projects')
        .update({ status: 'pending_payment' })
        .eq('id', offer.specification.project_id);

      // Log audit event
      try {
        await logOfferEvent('accept_offer', offerId, {
          offer_number: offer.number,
          project_id: offer.specification.project_id,
        });
      } catch (e) {
        console.warn('Failed to log audit event:', e);
      }

      return updatedOffer;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['offer', variables.offerId] });
      queryClient.invalidateQueries({ queryKey: ['offers'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

/**
 * Log offer view (for audit purposes)
 */
export function useLogOfferView() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (offerId) => {
      const { error } = await supabase
        .from('offer_acceptance_logs')
        .insert({
          offer_id: offerId,
          user_id: user.id,
          action: 'viewed',
          user_agent: navigator.userAgent,
        });

      if (error) throw error;
    },
  });
}
