import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

/**
 * Fetch recent activity for the current client
 * Combines projects, specifications, offers, and invoices into a timeline
 */
export function useClientActivity(limit = 10) {
  const { client } = useAuth();

  return useQuery({
    queryKey: ['client-activity', client?.id, limit],
    queryFn: async () => {
      if (!client?.id) return [];

      const activities = [];

      // Get recent projects
      const { data: projects } = await supabase
        .from('projects')
        .select('id, name, status, created_at, updated_at')
        .eq('client_id', client.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (projects) {
        projects.forEach(project => {
          activities.push({
            id: `project-${project.id}`,
            type: 'project',
            title: `Project "${project.name}" created`,
            description: `Status: ${project.status}`,
            created_at: project.created_at,
            link: `/projects/${project.id}`,
          });
        });
      }

      // Get recent specifications
      const { data: specs } = await supabase
        .from('specifications')
        .select(`
          id, version, status, created_at, finalized_at,
          project:projects!inner(id, name, client_id)
        `)
        .eq('project.client_id', client.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (specs) {
        specs.forEach(spec => {
          if (spec.status === 'finalized' && spec.finalized_at) {
            activities.push({
              id: `spec-finalized-${spec.id}`,
              type: 'specification',
              title: `Specification ${spec.version} finalized`,
              description: spec.project?.name,
              created_at: spec.finalized_at,
              link: `/specifications/${spec.id}`,
            });
          }
          activities.push({
            id: `spec-${spec.id}`,
            type: 'specification',
            title: `Specification ${spec.version} created`,
            description: spec.project?.name,
            created_at: spec.created_at,
            link: `/specifications/${spec.id}`,
          });
        });
      }

      // Get recent offers
      const { data: offers } = await supabase
        .from('offers')
        .select(`
          id, number, status, created_at, accepted_at,
          specification:specifications!inner(
            project:projects!inner(id, name, client_id)
          )
        `)
        .eq('specification.project.client_id', client.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (offers) {
        offers.forEach(offer => {
          if (offer.status === 'accepted' && offer.accepted_at) {
            activities.push({
              id: `offer-accepted-${offer.id}`,
              type: 'offer',
              title: `Offer ${offer.number} accepted`,
              description: offer.specification?.project?.name,
              created_at: offer.accepted_at,
              link: `/offers/${offer.id}`,
            });
          }
          activities.push({
            id: `offer-${offer.id}`,
            type: 'offer',
            title: `New offer ${offer.number} received`,
            description: offer.specification?.project?.name,
            created_at: offer.created_at,
            link: `/offers/${offer.id}`,
          });
        });
      }

      // Get recent invoices
      const { data: invoices } = await supabase
        .from('invoices')
        .select(`
          id, number, status, milestone_name, created_at, paid_at, amount_usd,
          project:projects!inner(id, name, client_id)
        `)
        .eq('project.client_id', client.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (invoices) {
        invoices.forEach(invoice => {
          if (invoice.status === 'paid' && invoice.paid_at) {
            activities.push({
              id: `invoice-paid-${invoice.id}`,
              type: 'invoice',
              title: `Invoice ${invoice.number} paid`,
              description: `${invoice.milestone_name} - $${parseFloat(invoice.amount_usd || 0).toFixed(2)}`,
              created_at: invoice.paid_at,
              link: `/invoices/${invoice.id}`,
            });
          }
          activities.push({
            id: `invoice-${invoice.id}`,
            type: 'invoice',
            title: `Invoice ${invoice.number} issued`,
            description: `${invoice.milestone_name} - $${parseFloat(invoice.amount_usd || 0).toFixed(2)}`,
            created_at: invoice.created_at,
            link: `/invoices/${invoice.id}`,
          });
        });
      }

      // Sort by date and limit
      activities.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      return activities.slice(0, limit);
    },
    enabled: !!client?.id,
    refetchInterval: 60000, // Refresh every minute
  });
}

export default useClientActivity;
