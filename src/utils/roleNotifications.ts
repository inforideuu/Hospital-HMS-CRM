import { AppNotification, UserRole } from '../types';

// Start freshly with zero mock notifications. Real-time alerts are created dynamically as hospital workflows occur.
export const INITIAL_ROLE_NOTIFICATIONS: AppNotification[] = [];

/**
 * Filter notifications suitable for the current user's role, hospital, and portal.
 */
export function filterNotificationsForUser(
  notifications: AppNotification[],
  role?: string,
  hospitalId?: string,
  userId?: string,
  portal?: string
): AppNotification[] {
  if (!role && !portal) return [];

  const normalizedRole = (role || '').toLowerCase();
  const isSuperAdmin =
    normalizedRole === 'super_admin' ||
    normalizedRole === 'super_admin_manager' ||
    normalizedRole === 'superadmin_manager' ||
    portal === 'platform';
  const isSales = normalizedRole === 'sales_executive' || portal === 'sales';

  return notifications.filter((notif) => {
    // Check specific user target if specified
    if (notif.userId && userId && notif.userId !== userId) {
      return false;
    }

    // Platform Super Admin
    if (isSuperAdmin) {
      if (notif.roleTarget === 'super_admin' || notif.roleTarget === 'platform' || notif.roleTarget === 'all') return true;
      if (notif.targetRoles && (notif.targetRoles.includes('super_admin') || notif.targetRoles.includes('super_admin_manager'))) return true;
      return false;
    }

    // Sales Executive
    if (isSales) {
      if (notif.roleTarget === 'sales_executive' || notif.roleTarget === 'all') return true;
      if (notif.targetRoles && notif.targetRoles.includes('sales_executive')) return true;
      return false;
    }

    // Role target match
    const matchesRole =
      notif.roleTarget === normalizedRole ||
      notif.roleTarget === 'all' ||
      notif.roleTarget === 'hospital_staff' ||
      (notif.targetRoles && notif.targetRoles.includes(normalizedRole as UserRole));

    if (!matchesRole) return false;

    // Hospital tenant scoping: If notification is tied to a specific hospital, ensure matching hospitalId
    if (notif.hospitalId && hospitalId && notif.hospitalId !== hospitalId) {
      return false;
    }

    return true;
  });
}

/**
 * Format timestamp into human-readable relative string.
 */
export function formatNotificationTime(timestamp: string): string {
  try {
    const timeMs = new Date(timestamp).getTime();
    if (isNaN(timeMs)) return timestamp;

    const diffSec = Math.floor((Date.now() - timeMs) / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch {
    return timestamp;
  }
}
