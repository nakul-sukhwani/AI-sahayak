'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Check, Circle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface Notification {
  id: string;
  event_type: string;
  message: string;
  read: boolean;
  reference_id: string | null;
  created_at: string;
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();

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
    // Poll every 60s for new notifications
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
      if (res.ok) {
        setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (e) {
      toast.error('Failed to mark notification as read');
    }
  };

  const handleNotificationClick = (n: Notification) => {
    if (!n.read) markAsRead(n.id);
    
    // Simple navigation routing based on event type
    if (n.event_type.startsWith('routing_')) {
      router.push('/university/inbox');
    } else if (n.reference_id && (n.event_type === 'team_formed' || n.event_type === 'stage_transition' || n.event_type.startsWith('milestone_') || n.event_type.startsWith('industry_'))) {
      // Assuming reference_id points to proposal or challenge. A real app might have deeper linking.
      router.push('/dashboard');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-slate-600 hover:text-slate-900">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80 max-h-[400px] overflow-y-auto">
        <DropdownMenuLabel className="font-semibold text-slate-900 sticky top-0 bg-white z-10 shadow-sm pb-2">
          Notifications
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-slate-500">
            No notifications yet
          </div>
        ) : (
          notifications.map((n) => (
            <DropdownMenuItem 
              key={n.id} 
              className={`flex flex-col items-start p-3 cursor-pointer ${!n.read ? 'bg-indigo-50/50' : ''}`}
              onClick={() => handleNotificationClick(n)}
            >
              <div className="flex items-start gap-2 w-full">
                <div className="mt-1 shrink-0">
                  {!n.read ? (
                    <Circle className="h-2 w-2 fill-indigo-600 text-indigo-600" />
                  ) : (
                    <Check className="h-3 w-3 text-slate-400" />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <p className={`text-sm leading-tight ${!n.read ? 'font-medium text-slate-900' : 'text-slate-600'}`}>
                    {n.message}
                  </p>
                  <p className="text-xs text-slate-400">
                    {new Date(n.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
