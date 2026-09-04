'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';

interface Notification {
  id: string;
  event_type: string;
  message: string;
  read: boolean;
  reference_id: string | null;
  created_at: string;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();
  const { toast } = useToast();

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
        setUnreadCount(data.notifications.filter((n: Notification) => !n.read).length);
      }
    } catch (e) {
      console.error('Failed to fetch notifications', e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch {
      toast('Failed to mark notification as read', 'error');
    }
  };

  const handleNotificationClick = (n: Notification) => {
    if (!n.read) markAsRead(n.id);
    setOpen(false);
    if (n.event_type.startsWith('routing_')) {
      router.push('/university/inbox');
    } else if (n.reference_id) {
      router.push('/dashboard');
    }
  };

  return (
    <div className="relative">
      {/* Bell trigger */}
      <button
        aria-label="Notifications"
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-lg text-[#545f72] hover:bg-[#f7f9fb] transition-colors focus:outline-none focus:ring-2 focus:ring-[#001e40]/30"
      >
        <span className="material-symbols-outlined text-[22px]">notifications</span>
        {unreadCount > 0 && (
          <Badge
            variant="critical"
            label={unreadCount > 99 ? '99+' : String(unreadCount)}
            className="absolute -top-1 -right-1 !px-1.5 !py-0 !rounded-full min-w-[18px] flex items-center justify-center text-[10px]"
          />
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <>
          {/* Overlay to close on outside click */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto bg-white border border-[#E2E8F0] rounded-xl shadow-lg z-50">
            <div className="sticky top-0 bg-white px-4 py-3 border-b border-[#E2E8F0]">
              <p className="text-sm font-semibold text-[#191c1e]">Notifications</p>
            </div>

            {notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-[#545f72]">No notifications yet</div>
            ) : (
              <ul>
                {notifications.map((n) => (
                  <li key={n.id}>
                    <button
                      onClick={() => handleNotificationClick(n)}
                      className={[
                        'w-full text-left px-4 py-3 flex items-start gap-3 transition-colors hover:bg-[#f7f9fb]',
                        !n.read ? 'bg-[#dbeafe]/30' : '',
                      ].join(' ')}
                    >
                      <span
                        className="material-symbols-outlined text-base mt-0.5 flex-shrink-0"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        {!n.read ? 'circle' : 'check_circle'}
                      </span>
                      <div className="flex-1 space-y-0.5">
                        <p className={['text-sm leading-tight', !n.read ? 'font-medium text-[#191c1e]' : 'text-[#545f72]'].join(' ')}>
                          {n.message}
                        </p>
                        <p className="text-xs text-[#737780]">
                          {new Date(n.created_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
