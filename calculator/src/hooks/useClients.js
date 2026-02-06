import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { logClientEvent } from '../lib/auditLog';

/**
 * Fetch all clients with aggregated stats - admin only
 */
export function useClients(filters = {}) {
  const { search } = filters;

  return useQuery({
    queryKey: ['clients', filters],
    queryFn: async () => {
      let query = supabase
        .from('clients')
        .select(`
          *,
          user:profiles!user_id(id, email, full_name, avatar_url),
          projects:projects(id, status)
        `)
        .order('created_at', { ascending: false });

      if (search) {
        query = query.or(
          `company_name.ilike.%${search}%,user.email.ilike.%${search}%,user.full_name.ilike.%${search}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;

      // Calculate stats for each client
      return data.map(client => ({
        ...client,
        contact_email: client.user?.email || null,
        phone: client.contact_phone || null,
        contact_person: client.contact_name || null,
        projectCount: client.projects?.length || 0,
        activeProjects: client.projects?.filter(p => p.status === 'active' || p.status === 'in_progress').length || 0,
      }));
    },
  });
}

/**
 * Fetch single client with full details
 */
export function useClientDetails(clientId) {
  return useQuery({
    queryKey: ['client', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select(`
          *,
          user:profiles!user_id(id, email, full_name, avatar_url, role),
          projects:projects(
            id, 
            name, 
            status, 
            created_at,
            specifications(id, status, totals_json)
          )
        `)
        .eq('id', clientId)
        .single();

      if (error) throw error;

      // Calculate total revenue from accepted offers
      let totalRevenue = 0;
      data.projects?.forEach(project => {
        project.specifications?.forEach(spec => {
          if (spec.status === 'finalized' || spec.status === 'accepted') {
            totalRevenue += spec.totals_json?.grandTotal || 0;
          }
        });
      });

      return {
        ...data,
        totalRevenue,
        projectCount: data.projects?.length || 0,
      };
    },
    enabled: !!clientId,
  });
}

/**
 * Create a new client
 */
export function useCreateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ companyName, contactEmail, contactPerson, phone, telegram, userId }) => {
      const { data, error } = await supabase
        .from('clients')
        .insert({
          company_name: companyName,
          contact_name: contactPerson,
          contact_phone: phone,
          user_id: userId || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      logClientEvent('create_client', data.id, { company_name: data.company_name });
    },
  });
}

/**
 * Update client
 */
export function useUpdateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ clientId, updates }) => {
      const { data, error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', clientId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['client', data.id] });
      logClientEvent('update_client', data.id, { company_name: data.company_name });
    },
  });
}

/**
 * Client stats for admin dashboard
 */
export function useClientStats() {
  return useQuery({
    queryKey: ['client-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select(`
          id,
          projects:projects(id, status)
        `);

      if (error) throw error;

      const total = data.length;
      const withActiveProjects = data.filter(c => 
        c.projects?.some(p => p.status === 'active' || p.status === 'in_progress')
      ).length;

      return {
        total,
        withActiveProjects,
        inactive: total - withActiveProjects,
      };
    },
  });
}
