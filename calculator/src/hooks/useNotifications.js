import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { logAuditEvent } from '../lib/auditLog';

// ─── Notification category → type mapping ───────────────────────────
export const NOTIFICATION_CATEGORIES = {
  comments: ['comment'],
  tasks: ['task_status_change'],
  payments: [
    'offer_created', 'offer_accepted', 'offer_cancelled',
    'invoice_created', 'payment_received', 'payment_confirmed',
  ],
  projects: [
    'project_created', 'project_status_change', 'stage_change',
    'spec_finalized', 'file_uploaded',
  ],
  users: ['new_client', 'am_action'],
};

/**
 * All known notification types (flat list)
 */
export const ALL_NOTIFICATION_TYPES = Object.values(NOTIFICATION_CATEGORIES).flat();

// ─── Hooks ──────────────────────────────────────────────────────────

/**
 * Fetch notifications for current user with optional filters.
 * Supports polling every 15 seconds.
 *
 * @param {Object} options
 * @param {number}  options.limit       - Max notifications to fetch (default 50)
 * @param {string}  options.category    - Category filter: 'all' | 'comments' | 'tasks' | 'payments' | 'projects' | 'users'
 * @param {string}  options.readFilter  - Read state filter: 'all' | 'unread'
 */
export function useNotifications({ limit = 50, category = 'all', readFilter = 'all' } = {}) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['notifications', user?.id, category, readFilter, limit],
    queryFn: async () => {
      if (!user?.id) return [];

      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      // Category filter
      if (category !== 'all' && NOTIFICATION_CATEGORIES[category]) {
        query = query.in('type', NOTIFICATION_CATEGORIES[category]);
      }

      // Read state filter
      if (readFilter === 'unread') {
        query = query.is('read_at', null);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
  });
}

/**
 * Get unread notifications count (polls every 15s)
 */
export function useUnreadNotificationsCount() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['notifications', 'unread-count', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;

      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .is('read_at', null);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!user?.id,
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
  });
}

/**
 * Mark notification as read
 */
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId) => {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: (_, notificationId) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      logAuditEvent({ action: 'mark_notification_read', entity_type: 'notification', entity_id: notificationId });
    },
  });
}

/**
 * Mark all notifications as read
 */
export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .is('read_at', null);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      logAuditEvent({ action: 'mark_all_notifications_read', entity_type: 'notification', entity_id: null });
    },
  });
}

// ─── Navigation helper ──────────────────────────────────────────────

/**
 * Returns a function that navigates to the entity linked by a notification
 * and marks it as read.
 */
export function useNotificationNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const markRead = useMarkNotificationRead();

  const getPrefix = useCallback(() => {
    if (location.pathname.startsWith('/admin')) return '/admin';
    if (location.pathname.startsWith('/am')) return '/am';
    return '';
  }, [location.pathname]);

  /**
   * Build the URL for a notification's entity, including deep-link params
   * for tasks and comments (e.g. ?task=uuid&comment=uuid)
   */
  const getEntityUrl = useCallback((notification) => {
    const prefix = getPrefix();
    const { type, entity_type, entity_id, project_id, metadata } = notification;
    const m = metadata || {};

    // Helper: build project URL with optional task/comment query params
    const projectUrl = (pid, taskId, commentId) => {
      let url = `${prefix}/projects/${pid}`;
      const params = new URLSearchParams();
      if (taskId) params.set('task', taskId);
      if (commentId) params.set('comment', commentId);
      const qs = params.toString();
      return qs ? `${url}?${qs}` : url;
    };

    // Helper: build project URL with arbitrary query params
    const projectUrlWithParams = (pid, params = {}) => {
      let url = `${prefix}/projects/${pid}`;
      const sp = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => { if (v) sp.set(k, v); });
      const qs = sp.toString();
      return qs ? `${url}?${qs}` : url;
    };

    switch (entity_type) {
      case 'project':
        return `${prefix}/projects/${entity_id}`;
      case 'offer':
        // Open offer modal inside the project page
        return project_id
          ? projectUrlWithParams(project_id, { offer: entity_id })
          : `${prefix}/offers/${entity_id}`;
      case 'invoice':
        // Open invoice modal inside the project page
        return project_id
          ? projectUrlWithParams(project_id, { invoice: entity_id })
          : `${prefix}/invoices/${entity_id}`;
      case 'specification':
        // Open spec modal inside the project page
        return project_id
          ? projectUrlWithParams(project_id, { spec: entity_id })
          : `${prefix}/specifications/${entity_id}`;
      case 'task':
        // Deep-link into project → open task card → highlight comment
        if (project_id) {
          const taskId = m.task_id || entity_id;
          const commentId = type === 'comment' ? m.comment_id : undefined;
          return projectUrl(project_id, taskId, commentId);
        }
        return null;
      case 'workflow_stage':
        return project_id
          ? `${prefix}/projects/${project_id}`
          : null;
      case 'profile':
        return prefix === '/admin' ? '/admin/users' : null;
      default:
        // Fallback: if there's a task_id in metadata, deep-link to it
        if (project_id && m.task_id) {
          return projectUrl(project_id, m.task_id);
        }
        return project_id
          ? `${prefix}/projects/${project_id}`
          : null;
    }
  }, [getPrefix]);

  /**
   * Handle notification click: mark as read + navigate
   */
  const handleNotificationClick = useCallback((notification) => {
    // Mark as read (fire and forget)
    if (!notification.read_at) {
      markRead.mutate(notification.id);
    }

    const url = getEntityUrl(notification);
    if (url) {
      navigate(url);
    }
  }, [markRead, getEntityUrl, navigate]);

  return { getEntityUrl, handleNotificationClick };
}
