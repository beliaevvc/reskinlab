import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

/**
 * Auto-detect service type from URL domain
 */
const DOMAIN_MAP = [
  { patterns: ['figma.com'], type: 'figma' },
  { patterns: ['github.com'], type: 'github' },
  { patterns: ['gitlab.com'], type: 'gitlab' },
  { patterns: ['dropbox.com'], type: 'dropbox' },
  { patterns: ['drive.google.com', 'docs.google.com', 'sheets.google.com', 'slides.google.com'], type: 'google_drive' },
  { patterns: ['notion.so', 'notion.site'], type: 'notion' },
  { patterns: ['miro.com'], type: 'miro' },
];

export function detectServiceType(url) {
  if (!url) return 'custom';
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    for (const entry of DOMAIN_MAP) {
      if (entry.patterns.some(p => hostname === p || hostname.endsWith('.' + p))) {
        return entry.type;
      }
    }
  } catch {
    // invalid URL
  }
  return 'custom';
}

/**
 * Service config: icons, labels, brand colors
 */
export const SERVICE_CONFIG = {
  figma: { label: 'Figma', color: '#A259FF' },
  github: { label: 'GitHub', color: '#24292F' },
  gitlab: { label: 'GitLab', color: '#FC6D26' },
  dropbox: { label: 'Dropbox', color: '#0061FF' },
  google_drive: { label: 'Google Drive', color: '#4285F4' },
  notion: { label: 'Notion', color: '#000000' },
  miro: { label: 'Miro', color: '#FFD02F' },
  custom: { label: 'Link', color: '#6B7280' },
};

/**
 * Fetch all links for a project, ordered by sort_order
 */
export function useProjectLinks(projectId) {
  return useQuery({
    queryKey: ['project-links', projectId],
    staleTime: 30 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_links')
        .select('*')
        .eq('project_id', projectId)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
  });
}

/**
 * Create a new project link
 */
export function useCreateProjectLink() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ projectId, type, title, url, description }) => {
      // Get current max sort_order for this project
      const { data: existing } = await supabase
        .from('project_links')
        .select('sort_order')
        .eq('project_id', projectId)
        .order('sort_order', { ascending: false })
        .limit(1);

      const maxOrder = existing?.[0]?.sort_order ?? -1000;

      const { data, error } = await supabase
        .from('project_links')
        .insert({
          project_id: projectId,
          type,
          title,
          url,
          description: description || null,
          sort_order: maxOrder + 1000,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['project-links', data.project_id] });
    },
  });
}

/**
 * Update an existing project link
 */
export function useUpdateProjectLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ linkId, updates }) => {
      const { data, error } = await supabase
        .from('project_links')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', linkId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['project-links', data.project_id] });
    },
  });
}

/**
 * Delete a project link
 */
export function useDeleteProjectLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ linkId, projectId }) => {
      const { error } = await supabase
        .from('project_links')
        .delete()
        .eq('id', linkId);

      if (error) throw error;
      return { linkId, projectId };
    },
    onSuccess: ({ projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['project-links', projectId] });
    },
  });
}

/**
 * Reorder project links (batch update sort_order)
 */
export function useReorderProjectLinks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, orderedIds }) => {
      // Update each link's sort_order based on position
      const updates = orderedIds.map((id, index) => ({
        id,
        sort_order: index * 1000,
        updated_at: new Date().toISOString(),
      }));

      // Batch update using individual calls (Supabase doesn't support bulk upsert well with RLS)
      for (const update of updates) {
        const { error } = await supabase
          .from('project_links')
          .update({ sort_order: update.sort_order, updated_at: update.updated_at })
          .eq('id', update.id);

        if (error) throw error;
      }

      return { projectId };
    },
    onSuccess: ({ projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['project-links', projectId] });
    },
  });
}
