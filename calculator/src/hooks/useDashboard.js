import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

/**
 * Dashboard overview stats for admin
 */
export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      // Get user counts by role
      const { data: profiles } = await supabase
        .from('profiles')
        .select('role');

      const users = {
        total: profiles?.length || 0,
        admins: profiles?.filter(p => p.role === 'admin').length || 0,
        ams: profiles?.filter(p => p.role === 'am').length || 0,
        clients: profiles?.filter(p => p.role === 'client').length || 0,
      };

      // Get project stats
      const { data: projects } = await supabase
        .from('projects')
        .select('status, created_at');

      const projectStats = {
        total: projects?.length || 0,
        draft: projects?.filter(p => p.status === 'draft').length || 0,
        in_progress: projects?.filter(p => p.status === 'in_progress').length || 0,
        review: projects?.filter(p => p.status === 'review').length || 0,
        completed: projects?.filter(p => p.status === 'completed').length || 0,
      };

      // Get invoice/revenue stats
      const { data: invoices } = await supabase
        .from('invoices')
        .select('status, amount_usd, created_at, paid_at, updated_at');

      // Paid invoices: status is 'paid' (use paid_at if available, otherwise created_at/updated_at for date)
      const paidInvoices = invoices?.filter(i => i.status === 'paid') || [];
      const pendingInvoices = invoices?.filter(i => i.status === 'pending') || [];

      // Calculate monthly revenue based on paid_at date (when payment was actually received)
      // If paid_at is not available, use updated_at or created_at as fallback
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      const thisMonthRevenue = paidInvoices
        .filter(i => {
          const paymentDate = i.paid_at || i.updated_at || i.created_at;
          if (!paymentDate) return false;
          return new Date(paymentDate) >= thisMonth;
        })
        .reduce((sum, i) => sum + parseFloat(i.amount_usd || 0), 0);

      const lastMonthRevenue = paidInvoices
        .filter(i => {
          const paymentDate = i.paid_at || i.updated_at || i.created_at;
          if (!paymentDate) return false;
          const d = new Date(paymentDate);
          return d >= lastMonth && d < thisMonth;
        })
        .reduce((sum, i) => sum + parseFloat(i.amount_usd || 0), 0);

      const revenue = {
        total: paidInvoices.reduce((sum, i) => sum + parseFloat(i.amount_usd || 0), 0),
        thisMonth: thisMonthRevenue,
        lastMonth: lastMonthRevenue,
        pending: pendingInvoices.reduce((sum, i) => sum + parseFloat(i.amount_usd || 0), 0),
        change: lastMonthRevenue > 0 
          ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
          : 0,
      };

      // Get pending approvals
      const { count: pendingSpecs } = await supabase
        .from('specifications')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending');

      const { count: pendingOffers } = await supabase
        .from('offers')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending');

      const pendingApprovals = {
        specs: pendingSpecs || 0,
        offers: pendingOffers || 0,
        total: (pendingSpecs || 0) + (pendingOffers || 0),
      };

      return {
        users,
        projects: projectStats,
        revenue,
        pendingApprovals,
      };
    },
    refetchInterval: 60000, // Refresh every minute
  });
}

/**
 * Recent activity from audit logs
 */
export function useRecentActivity(limit = 10) {
  return useQuery({
    queryKey: ['recent-activity', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          *,
          user:profiles!user_id(id, email, full_name, avatar_url)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

/**
 * Revenue chart data (last 6 months)
 */
export function useRevenueChart() {
  return useQuery({
    queryKey: ['revenue-chart'],
    queryFn: async () => {
      const { data: invoices } = await supabase
        .from('invoices')
        .select('amount_usd, paid_at, status, updated_at, created_at')
        .eq('status', 'paid');

      // Group by month based on paid_at date (or updated_at/created_at as fallback)
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthName = date.toLocaleDateString('en', { month: 'short' });
        
        const monthInvoices = invoices?.filter(inv => {
          const paymentDate = inv.paid_at || inv.updated_at || inv.created_at;
          if (!paymentDate) return false;
          const invDate = new Date(paymentDate);
          return invDate.getFullYear() === date.getFullYear() && 
                 invDate.getMonth() === date.getMonth();
        }) || [];

        months.push({
          month: monthName,
          revenue: monthInvoices.reduce((sum, i) => sum + parseFloat(i.amount_usd || 0), 0),
          count: monthInvoices.length,
        });
      }

      return months;
    },
  });
}

/**
 * Projects chart data (last 6 months)
 */
export function useProjectsChart() {
  return useQuery({
    queryKey: ['projects-chart'],
    queryFn: async () => {
      const { data: projects } = await supabase
        .from('projects')
        .select('created_at, status')
        .gte('created_at', new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString());

      // Group by month
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthName = date.toLocaleDateString('en', { month: 'short' });
        
        const monthProjects = projects?.filter(p => {
          const pDate = new Date(p.created_at);
          return pDate.getFullYear() === date.getFullYear() && 
                 pDate.getMonth() === date.getMonth();
        }) || [];

        months.push({
          month: monthName,
          total: monthProjects.length,
          completed: monthProjects.filter(p => p.status === 'completed').length,
        });
      }

      return months;
    },
  });
}
