import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { useAuth } from './AuthContext';
import { MockStorage } from '../services/mockStorage';
import { AppNotification } from '../types';
import {
  playNotificationChime,
  isNotificationSoundEnabled,
  setNotificationSoundEnabled,
} from '../utils/notificationSound';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  title: string;
  message?: string;
  type: ToastType;
}

export interface NotificationContextType {
  // Floating Toast Notifications
  toasts: ToastItem[];
  showToast: (title: string, message?: string, type?: ToastType) => void;
  removeToast: (id: string) => void;

  // Role-Based In-App Notifications
  notifications: AppNotification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAllNotifications: () => void;
  removeNotification: (id: string) => void;
  addNotification: (item: Omit<AppNotification, 'id' | 'timestamp' | 'read'> & { read?: boolean }) => AppNotification;
  resetRoleNotifications: () => void;

  // Sound Preferences & Trigger
  soundEnabled: boolean;
  toggleSound: () => void;
  playChime: (soundType?: 'default' | 'emergency' | 'success') => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, currentHospital } = useAuth();

  // Floating Toasts
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Sound preference state
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(() => isNotificationSoundEnabled());

  // Role-based notifications state
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Refresh role-scoped notifications from storage
  const refreshNotifications = useCallback(() => {
    const role = user?.role;
    const hospitalId = currentHospital?.id || user?.hospitalId;
    const userId = user?.id;
    const portal = user?.portal;
    const list = MockStorage.getRoleNotifications(role, hospitalId, userId, portal);
    setNotifications(list);
  }, [user?.role, user?.hospitalId, user?.id, user?.portal, currentHospital?.id]);

  // Load notifications whenever user/hospital changes
  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  // Sync when storage changes (across tabs or custom events)
  useEffect(() => {
    const handleStorageUpdate = (e: CustomEvent | StorageEvent) => {
      const key = (e as CustomEvent)?.detail?.key || (e as StorageEvent)?.key;
      if (!key || key === 'pulse_notifications') {
        refreshNotifications();
      }
    };

    window.addEventListener('pulse_storage_updated' as any, handleStorageUpdate);
    window.addEventListener('storage', handleStorageUpdate);

    return () => {
      window.removeEventListener('pulse_storage_updated' as any, handleStorageUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, [refreshNotifications]);

  // Toast handlers
  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((title: string, message?: string, type: ToastType = 'success') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const newToast: ToastItem = { id, title, message, type };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  // Sound toggle
  const toggleSound = useCallback(() => {
    setSoundEnabledState((prev) => {
      const next = !prev;
      setNotificationSoundEnabled(next);
      if (next) {
        // Play brief preview chime when enabled
        playNotificationChime('default');
      }
      return next;
    });
  }, []);

  const playChime = useCallback((soundType: 'default' | 'emergency' | 'success' = 'default') => {
    playNotificationChime(soundType);
  }, []);

  // Notification actions
  const markAsRead = useCallback((id: string) => {
    MockStorage.markNotificationAsRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllAsRead = useCallback(() => {
    const role = user?.role;
    const hospitalId = currentHospital?.id || user?.hospitalId;
    const userId = user?.id;
    const portal = user?.portal;
    MockStorage.markAllRoleNotificationsAsRead(role, hospitalId, userId, portal);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, [user?.role, user?.hospitalId, user?.id, user?.portal, currentHospital?.id]);

  const clearAllNotifications = useCallback(() => {
    const role = user?.role;
    const hospitalId = currentHospital?.id || user?.hospitalId;
    const userId = user?.id;
    const portal = user?.portal;
    MockStorage.clearRoleNotifications(role, hospitalId, userId, portal);
    setNotifications([]);
  }, [user?.role, user?.hospitalId, user?.id, user?.portal, currentHospital?.id]);

  const removeNotification = useCallback((id: string) => {
    MockStorage.deleteNotification(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const addNotification = useCallback((item: Omit<AppNotification, 'id' | 'timestamp' | 'read'> & { read?: boolean }): AppNotification => {
    const created = MockStorage.addNotification(item);
    refreshNotifications();

    // Play chime if sound is enabled
    if (soundEnabled) {
      const soundType = created.type === 'emergency' ? 'emergency' : created.type === 'success' ? 'success' : 'default';
      playNotificationChime(soundType);
    }

    return created;
  }, [refreshNotifications, soundEnabled]);

  const resetRoleNotifications = useCallback(() => {
    MockStorage.resetDefaultNotifications();
    refreshNotifications();
  }, [refreshNotifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        toasts,
        showToast,
        removeToast,
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearAllNotifications,
        removeNotification,
        addNotification,
        resetRoleNotifications,
        soundEnabled,
        toggleSound,
        playChime,
      }}
    >
      {children}
      {/* Toast Render Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-md w-full px-4 sm:px-0">
        {toasts.map((t) => {
          const icons = {
            success: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
            error: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />,
            warning: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
            info: <Info className="w-5 h-5 text-indigo-600 shrink-0" />,
          };

          const borderColors = {
            success: 'border-emerald-200 bg-emerald-50/95 text-emerald-950',
            error: 'border-rose-200 bg-rose-50/95 text-rose-950',
            warning: 'border-amber-200 bg-amber-50/95 text-amber-950',
            info: 'border-indigo-200 bg-indigo-50/95 text-indigo-950',
          };

          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-md transition-all transform animate-in slide-in-from-right duration-300 ${borderColors[t.type]}`}
            >
              {icons[t.type]}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold leading-tight">{t.title}</h4>
                {t.message && <p className="text-xs mt-1 opacity-85 leading-relaxed">{t.message}</p>}
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-slate-400 hover:text-slate-700 transition-colors p-1"
                aria-label="Close notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
