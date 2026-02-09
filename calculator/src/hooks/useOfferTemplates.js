import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { logOfferTemplateEvent } from '../lib/auditLog';

// ============================================
// OFFER TEMPLATES
// ============================================

/**
 * Fetch all offer templates (list view)
 */
export function useOfferTemplates() {
  return useQuery({
    queryKey: ['offer-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('offer_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
}

/**
 * Fetch single offer template (with content)
 */
export function useOfferTemplate(id) {
  return useQuery({
    queryKey: ['offer-template', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('offer_templates')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      // Backward compat: if content is empty, try to migrate from legacy blocks
      const hasContent = data?.content?.text && data.content.text.trim().length > 0;
      if (!hasContent) {
        const migratedContent = await migrateBlocksToContent(id);
        if (migratedContent) {
          data.content = migratedContent;
        }
      }

      return data;
    },
    enabled: !!id,
  });
}

/**
 * One-time migration helper: reads legacy blocks and merges them
 * into a single content field, then saves it back to the template.
 */
async function migrateBlocksToContent(templateId) {
  try {
    const { data: blocks } = await supabase
      .from('offer_template_blocks')
      .select('content, sort_order')
      .eq('template_id', templateId)
      .order('sort_order');

    if (!blocks?.length) return null;

    const text = blocks
      .map((b) => b.content?.text || '')
      .filter(Boolean)
      .join('\n\n');

    if (!text) return null;

    const content = { text };

    // Save back so this migration only happens once
    await supabase
      .from('offer_templates')
      .update({ content })
      .eq('id', templateId);

    return content;
  } catch (e) {
    console.warn('Failed to migrate blocks to content:', e);
    return null;
  }
}

/**
 * Fetch the currently active template
 */
export function useActiveOfferTemplate() {
  return useQuery({
    queryKey: ['offer-template', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('offer_templates')
        .select('*')
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });
}

/**
 * Create a new offer template
 */
export function useCreateOfferTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, description }) => {
      const { data, error } = await supabase
        .from('offer_templates')
        .insert({
          name,
          description: description || null,
          is_active: false,
          content: { text: '' },
          content_ru: { text: '' },
          content_en: { text: '' },
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['offer-templates'] });
      logOfferTemplateEvent('create_offer_template', data.id, { name: data.name });
    },
  });
}

/**
 * Update offer template (metadata + content)
 */
export function useUpdateOfferTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }) => {
      const { data, error } = await supabase
        .from('offer_templates')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['offer-templates'] });
      queryClient.invalidateQueries({ queryKey: ['offer-template', data.id] });
      logOfferTemplateEvent('update_offer_template', data.id, { name: data.name });
    },
  });
}

/**
 * Delete an offer template
 */
export function useDeleteOfferTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      // Fetch template name before deletion for audit log
      const { data: templateData } = await supabase
        .from('offer_templates')
        .select('name')
        .eq('id', id)
        .single();

      const { error } = await supabase
        .from('offer_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { id, name: templateData?.name };
    },
    onSuccess: ({ id, name }) => {
      queryClient.invalidateQueries({ queryKey: ['offer-templates'] });
      logOfferTemplateEvent('delete_offer_template', id, { name });
    },
  });
}

/**
 * Set a template as the active one (deactivates all others)
 */
export function useSetActiveTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      // Deactivate all templates first
      const { error: deactivateError } = await supabase
        .from('offer_templates')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .neq('id', id);

      if (deactivateError) throw deactivateError;

      // Activate the selected template
      const { data, error } = await supabase
        .from('offer_templates')
        .update({ is_active: true, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['offer-templates'] });
      queryClient.invalidateQueries({ queryKey: ['offer-template'] });
      logOfferTemplateEvent('set_active_template', data.id, { name: data.name });
    },
  });
}

/**
 * Duplicate an offer template
 */
export function useDuplicateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sourceId) => {
      // Fetch source template
      const { data: source, error: fetchError } = await supabase
        .from('offer_templates')
        .select('*')
        .eq('id', sourceId)
        .single();

      if (fetchError) throw fetchError;

      // Create new template with same content
      const { data: newTemplate, error: createError } = await supabase
        .from('offer_templates')
        .insert({
          name: `${source.name} (копия)`,
          description: source.description,
          is_active: false,
          terms_version: source.terms_version,
          validity_days: source.validity_days,
          content: source.content || { text: '' },
          content_ru: source.content_ru || { text: '' },
          content_en: source.content_en || { text: '' },
        })
        .select()
        .single();

      if (createError) throw createError;
      return newTemplate;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['offer-templates'] });
      logOfferTemplateEvent('duplicate_template', data.id, { name: data.name });
    },
  });
}

// ============================================
// OFFER VARIABLES
// ============================================

/**
 * Fetch all defined variables
 */
export function useOfferVariables() {
  return useQuery({
    queryKey: ['offer-variables'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('offer_variables')
        .select('*')
        .order('data_source')
        .order('label');

      if (error) throw error;
      return data || [];
    },
  });
}

// ============================================
// CLIENT OFFER ASSIGNMENTS
// ============================================

/**
 * Fetch assignments for a specific template
 */
export function useTemplateAssignments(templateId) {
  return useQuery({
    queryKey: ['template-assignments', templateId],
    queryFn: async () => {
      if (!templateId) return [];

      const { data, error } = await supabase
        .from('client_offer_assignments')
        .select(`
          *,
          client:profiles!client_id (id, full_name, email, avatar_url, role)
        `)
        .eq('template_id', templateId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!templateId,
  });
}

/**
 * Fetch all client offer assignments (with template + client info)
 */
export function useClientOfferAssignments() {
  return useQuery({
    queryKey: ['client-offer-assignments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_offer_assignments')
        .select(`
          *,
          client:profiles!client_id (id, full_name, email, avatar_url, role),
          template:offer_templates (id, name, is_active)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
}

/**
 * Assign offer template to a client
 */
export function useAssignOfferToClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ client_id, template_id }) => {
      const { data, error } = await supabase
        .from('client_offer_assignments')
        .upsert(
          {
            client_id,
            project_id: null,
            template_id,
          },
          { onConflict: 'client_id,project_id' }
        )
        .select(`
          *,
          client:profiles!client_id (id, full_name, email, avatar_url, role)
        `)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['template-assignments', variables.template_id] });
      queryClient.invalidateQueries({ queryKey: ['client-offer-assignments'] });
      logOfferTemplateEvent('assign_offer_to_client', variables.template_id, { client_id: variables.client_id });
    },
  });
}

/**
 * Remove client offer assignment
 */
export function useRemoveOfferAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, templateId }) => {
      const { error } = await supabase
        .from('client_offer_assignments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { id, templateId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['template-assignments', data.templateId] });
      queryClient.invalidateQueries({ queryKey: ['client-offer-assignments'] });
      logOfferTemplateEvent('remove_offer_assignment', data.templateId, { assignment_id: data.id });
    },
  });
}

// ============================================
// PROFILE SEARCH (for audience picker)
// ============================================

/**
 * Fetch all active profiles (cached, for dropdown list)
 */
export function useAllProfiles() {
  return useQuery({
    queryKey: ['all-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url, role')
        .eq('is_active', true)
        .order('full_name');

      if (error) throw error;
      return data || [];
    },
    staleTime: 60_000,
  });
}
