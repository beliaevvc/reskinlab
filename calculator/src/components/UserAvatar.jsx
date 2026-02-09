import { useState } from 'react';

/**
 * Unified user avatar component.
 * Shows profile image if available, otherwise displays initials with muted role-based colors.
 *
 * @param {Object} props
 * @param {string} [props.name] - Full name of the user
 * @param {string} [props.email] - Email fallback for initials
 * @param {string} [props.avatarUrl] - URL to the user's profile image
 * @param {'admin'|'am'|'client'} [props.role] - User role for color theming
 * @param {'xs'|'sm'|'md'|'lg'|'xl'|'2xl'} [props.size='md'] - Avatar size
 * @param {string} [props.className] - Additional CSS classes
 * @param {boolean} [props.ring] - Show a colored ring around the avatar
 */

// Muted role-based colors
const ROLE_COLORS = {
  admin: {
    bg: 'bg-purple-50',
    text: 'text-purple-500',
    ring: 'ring-purple-200',
  },
  am: {
    bg: 'bg-blue-50',
    text: 'text-blue-500',
    ring: 'ring-blue-200',
  },
  client: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-500',
    ring: 'ring-emerald-200',
  },
};

const DEFAULT_COLORS = {
  bg: 'bg-neutral-100',
  text: 'text-neutral-500',
  ring: 'ring-neutral-200',
};

// Size presets
const SIZES = {
  xs:  { container: 'w-5 h-5',        text: 'text-[9px]',  font: 'font-semibold' },
  sm:  { container: 'w-7 h-7',        text: 'text-[11px]', font: 'font-semibold' },
  md:  { container: 'w-9 h-9',        text: 'text-sm',     font: 'font-medium' },
  lg:  { container: 'w-12 h-12',      text: 'text-base',   font: 'font-semibold' },
  xl:  { container: 'w-[72px] h-[72px]', text: 'text-xl',  font: 'font-semibold' },
  '2xl': { container: 'w-24 h-24',    text: 'text-2xl',    font: 'font-bold' },
};

function getInitials(name, email) {
  if (name && name.trim()) {
    const words = name.trim().split(/\s+/).filter(Boolean);
    if (words.length >= 2) {
      return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    }
    return words[0][0].toUpperCase();
  }
  if (email) {
    return email[0].toUpperCase();
  }
  return '?';
}

export default function UserAvatar({
  name,
  email,
  avatarUrl,
  role,
  size = 'md',
  className = '',
  ring = false,
}) {
  const [imgError, setImgError] = useState(false);
  const colors = ROLE_COLORS[role] || DEFAULT_COLORS;
  const sizeConfig = SIZES[size] || SIZES.md;
  const initials = getInitials(name, email);
  const showImage = avatarUrl && !imgError;

  const ringClass = ring ? `ring-2 ${colors.ring}` : '';

  if (showImage) {
    return (
      <img
        src={avatarUrl}
        alt={name || email || 'User'}
        className={`${sizeConfig.container} rounded-full object-cover flex-shrink-0 ${ringClass} ${className}`}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div
      className={`${sizeConfig.container} rounded-full flex items-center justify-center flex-shrink-0 ${colors.bg} ${ringClass} ${className}`}
    >
      <span className={`${sizeConfig.text} ${sizeConfig.font} ${colors.text} leading-none select-none`}>
        {initials}
      </span>
    </div>
  );
}
