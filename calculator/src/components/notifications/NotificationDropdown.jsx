import { useState, memo } from 'react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { useNotifications, useMarkAllNotificationsRead, useNotificationNavigation, NOTIFICATION_CATEGORIES } from '../../hooks/useNotifications';
import { useAuth } from '../../contexts/AuthContext';
import { NotificationItem } from './NotificationItem';

// ─── Category keys (translated in component) ────────────────────────────────────────────────
const CATEGORY_KEYS = ['all', 'comments', 'tasks', 'payments', 'projects', 'users'];

/**
 * Dropdown panel showing the notification list with tabs and category filters.
 * Rendered absolutely below the bell icon.
 */
function NotificationDropdownRaw({ onClose }) {
  const { t } = useTranslation('notifications');
  const { isAdmin } = useAuth();

  // ─── State ──────────────────────────────────────────────────────
  const [readFilter, setReadFilter] = useState('all'); // 'all' | 'unread'
  const [category, setCategory] = useState('all');

  // ─── Data ───────────────────────────────────────────────────────
  const { data: notifications = [], isLoading } = useNotifications({
    limit: 50,
    category,
    readFilter,
  });

  const markAllRead = useMarkAllNotificationsRead();
  const { handleNotificationClick } = useNotificationNavigation();

  // ─── Available categories (hide "users" for non-admins) ─────────
  const availableCategories = CATEGORY_KEYS.filter(
    (cat) => cat === 'all' || (cat !== 'users' || isAdmin)
  );

  // ─── Handlers ───────────────────────────────────────────────────
  const handleItemClick = (notification) => {
    handleNotificationClick(notification);
    onClose?.();
  };

  const handleMarkAllRead = () => {
    markAllRead.mutate();
  };

  return (
    <div className="absolute right-0 top-full mt-2 w-[400px] max-h-[520px] bg-white rounded-xl shadow-xl border border-neutral-200 flex flex-col z-50 overflow-hidden">
      {/* ─── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
        <h3 className="text-sm font-semibold text-neutral-900">{t('title')}</h3>
        <button
          type="button"
          onClick={handleMarkAllRead}
          disabled={markAllRead.isPending}
          className="text-xs text-emerald-600 hover:text-emerald-700 font-medium transition-colors disabled:opacity-50"
        >
          {t('markAllRead')}
        </button>
      </div>

      {/* ─── Read filter tabs ───────────────────────────────────── */}
      <div className="flex gap-1 px-4 pt-3 pb-2">
        {['all', 'unread'].map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setReadFilter(tab)}
            className={clsx(
              'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
              readFilter === tab
                ? 'bg-emerald-50 text-emerald-700'
                : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700'
            )}
          >
            {tab === 'all' ? t('all') : t('unread')}
          </button>
        ))}
      </div>

      {/* ─── Separator ───────────────────────────────────────────── */}
      <div className="border-t border-neutral-100 mx-4" />

      {/* ─── Category chips ─────────────────────────────────────── */}
      <div className="flex flex-wrap gap-1.5 px-4 pt-2 pb-2">
        {availableCategories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat)}
            className={clsx(
              'px-2.5 py-1 text-[11px] font-medium rounded-full transition-colors',
              category === cat
                ? 'bg-neutral-900 text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            )}
          >
            {t(`categories.${cat}`)}
          </button>
        ))}
      </div>

      {/* ─── Divider ────────────────────────────────────────────── */}
      <div className="border-t border-neutral-100" />

      {/* ─── Notifications list ─────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto overscroll-contain p-3">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
          </div>
        )}

        {!isLoading && notifications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
              </svg>
            </div>
            <p className="text-sm font-medium text-neutral-600">{t('noNotifications')}</p>
            <p className="text-xs text-neutral-400 mt-1">
              {readFilter === 'unread'
                ? t('allCaughtUp')
                : t('nothingYet')}
            </p>
          </div>
        )}

        {!isLoading && notifications.length > 0 && (
          <div className="space-y-2">
            {notifications.map((n) => (
              <NotificationItem
                key={n.id}
                notification={n}
                onClick={handleItemClick}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export const NotificationDropdown = memo(NotificationDropdownRaw);
export default NotificationDropdown;
