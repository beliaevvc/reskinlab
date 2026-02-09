import { AccountSwitcher } from '../admin';
import { NotificationBell } from '../notifications';

export function AppHeader({ onMenuClick }) {
  return (
    <header className="sticky top-0 z-40 h-16 bg-white border-b border-neutral-200 px-4 md:px-6 flex items-center justify-between">
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 -ml-2 rounded text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
        aria-label="Open menu"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {/* Spacer for desktop */}
      <div className="hidden lg:block" />

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Notification center */}
        <NotificationBell />

        {/* Account Switcher (combines user info + role + switch) */}
        <AccountSwitcher />
      </div>
    </header>
  );
}

export default AppHeader;
