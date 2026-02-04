import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

/**
 * Fetch all invoices for the current client (or all for admin/staff)
 */
export function useInvoices() {
  const { client, isAdmin, isStaff } = useAuth();

  return useQuery({
    queryKey: ['invoices', isAdmin || isStaff ? 'all' : client?.id],
    queryFn: async () => {
      // Admin/staff sees all invoices with client info
      if (isAdmin || isStaff) {
        const { data, error } = await supabase
          .from('invoices')
          .select(`
            *,
            project:projects (
              id,
              name,
              client_id,
              client:clients (
                id,
                company_name,
                profile:profiles (
                  id,
                  full_name,
                  email
                )
              )
            ),
            offer:offers (
              id,
              number,
              status
            )
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
      }

      // Client sees only their invoices
      if (!client?.id) return [];

      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          project:projects!inner (
            id,
            name,
            client_id
          ),
          offer:offers (
            id,
            number,
            status
          )
        `)
        .eq('project.client_id', client.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
}

/**
 * Fetch invoices by offer ID
 */
export function useInvoicesByOffer(offerId) {
  return useQuery({
    queryKey: ['invoices', 'offer', offerId],
    queryFn: async () => {
      if (!offerId) return [];

      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          project:projects (
            id,
            name
          )
        `)
        .eq('offer_id', offerId)
        .order('milestone_order', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!offerId,
  });
}

/**
 * Fetch single invoice with details
 */
export function useInvoice(invoiceId) {
  return useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: async () => {
      if (!invoiceId) return null;

      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          project:projects (
            id,
            name,
            client_id,
            client:clients (
              id,
              company_name,
              profile:profiles (
                id,
                full_name,
                email
              )
            )
          ),
          offer:offers (
            id,
            number,
            status,
            specification:specifications (
              id,
              version,
              totals_json
            )
          )
        `)
        .eq('id', invoiceId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!invoiceId,
  });
}

/**
 * Upload payment proof (legacy - with file)
 */
export function useUploadPaymentProof() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ invoiceId, file, txHash }) => {
      // 1. Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${invoiceId}_${Date.now()}.${fileExt}`;
      const filePath = `proofs/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('proofs')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Get public URL
      const { data: urlData } = supabase.storage
        .from('proofs')
        .getPublicUrl(filePath);

      const proofUrl = urlData?.publicUrl;

      // 3. Update invoice with proof
      const { data, error } = await supabase
        .from('invoices')
        .update({
          payment_proof_url: proofUrl,
          tx_hash: txHash || null,
        })
        .eq('id', invoiceId)
        .select()
        .single();

      if (error) throw error;

      // 4. Log to audit
      await supabase.from('audit_logs').insert({
        action: 'payment_proof_uploaded',
        entity_type: 'invoice',
        entity_id: invoiceId,
        user_id: user.id,
        details: {
          proof_url: proofUrl,
          tx_hash: txHash,
        },
      });

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invoice', variables.invoiceId] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}

/**
 * Submit payment with tx hash only (no file)
 * Changes status to 'awaiting_confirmation'
 */
export function useSubmitPayment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ invoiceId, txHash }) => {
      const { data, error } = await supabase
        .from('invoices')
        .update({
          tx_hash: txHash.trim(),
          status: 'awaiting_confirmation',
        })
        .eq('id', invoiceId)
        .select()
        .single();

      if (error) throw error;

      // Log to audit (don't fail if audit fails)
      try {
        await supabase.from('audit_logs').insert({
          action: 'payment_submitted',
          entity_type: 'invoice',
          entity_id: invoiceId,
          user_id: user.id,
          details: {
            tx_hash: txHash.trim(),
          },
        });
      } catch (auditError) {
        console.warn('Audit log failed:', auditError);
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invoice', variables.invoiceId] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['offers'] });
      queryClient.invalidateQueries({ queryKey: ['offer'] });
    },
  });
}

/**
 * Get pending invoices count
 */
export function usePendingInvoicesCount() {
  const { client } = useAuth();

  return useQuery({
    queryKey: ['invoices', 'pending-count', client?.id],
    queryFn: async () => {
      if (!client?.id) return 0;

      const { count, error } = await supabase
        .from('invoices')
        .select('*, project:projects!inner(client_id)', { count: 'exact', head: true })
        .eq('project.client_id', client.id)
        .eq('status', 'pending');

      if (error) throw error;
      return count || 0;
    },
    enabled: !!client?.id,
  });
}

/**
 * Get total pending amount
 */
export function usePendingAmount() {
  const { client } = useAuth();

  return useQuery({
    queryKey: ['invoices', 'pending-amount', client?.id],
    queryFn: async () => {
      if (!client?.id) return 0;

      const { data, error } = await supabase
        .from('invoices')
        .select('amount_usd, project:projects!inner(client_id)')
        .eq('project.client_id', client.id)
        .eq('status', 'pending');

      if (error) throw error;

      return data?.reduce((sum, inv) => sum + Number(inv.amount_usd), 0) || 0;
    },
    enabled: !!client?.id,
  });
}

/**
 * Get count of invoices awaiting confirmation (for admin/AM)
 */
export function usePendingConfirmationsCount() {
  return useQuery({
    queryKey: ['invoices', 'awaiting-confirmation-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'awaiting_confirmation');

      if (error) throw error;
      return count || 0;
    },
  });
}

/**
 * Confirm payment (admin/AM only)
 */
export function useConfirmPayment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ invoiceId }) => {
      const { data, error } = await supabase
        .from('invoices')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          confirmed_by: user.id,
        })
        .eq('id', invoiceId)
        .eq('status', 'awaiting_confirmation')
        .select()
        .single();

      if (error) throw error;

      // Log to audit
      try {
        await supabase.from('audit_logs').insert({
          action: 'payment_confirmed',
          entity_type: 'invoice',
          entity_id: invoiceId,
          user_id: user.id,
          details: {
            confirmed_at: new Date().toISOString(),
          },
        });
      } catch (auditError) {
        console.warn('Audit log failed:', auditError);
      }

      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invoice', variables.invoiceId] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', data?.project_id] });
      queryClient.invalidateQueries({ queryKey: ['offers'] });
      queryClient.invalidateQueries({ queryKey: ['offer'] });
      // Инвалидируем project-offers (используется в TaskDetailModal)
      queryClient.invalidateQueries({ queryKey: ['project-offers'] });
      // Инвалидируем tasks и stages после подтверждения платежа (триггер создаёт их)
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['stages'] });
      if (data?.project_id) {
        queryClient.invalidateQueries({ queryKey: ['tasks', data.project_id] });
        queryClient.invalidateQueries({ queryKey: ['stages', data.project_id] });
      }
    },
  });
}

/**
 * Reject payment (admin/AM only)
 */
export function useRejectPayment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ invoiceId, reason }) => {
      if (!reason || !reason.trim()) {
        throw new Error('Rejection reason is required');
      }

      const { data, error } = await supabase
        .from('invoices')
        .update({
          status: 'pending',
          tx_hash: null,
          rejection_reason: reason.trim(),
        })
        .eq('id', invoiceId)
        .eq('status', 'awaiting_confirmation')
        .select()
        .single();

      if (error) throw error;

      // Log to audit
      try {
        await supabase.from('audit_logs').insert({
          action: 'payment_rejected_to_pending',
          entity_type: 'invoice',
          entity_id: invoiceId,
          user_id: user.id,
          details: {
            reason: reason.trim(),
            new_status: 'pending',
          },
        });
      } catch (auditError) {
        console.warn('Audit log failed:', auditError);
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invoice', variables.invoiceId] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['offers'] });
      queryClient.invalidateQueries({ queryKey: ['offer'] });
    },
  });
}
