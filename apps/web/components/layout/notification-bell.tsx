"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, Clock, MessageCircle, Trophy, UserPlus, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth-context";
import * as api from "@/lib/api-client";
import type { NotificationDTO, NotificationType } from "@indiamart-crm/shared";
import { cn } from "@/lib/utils";

const TYPE_ICON: Record<NotificationType, React.ElementType> = {
  NEW_LEAD: UserPlus,
  FOLLOW_UP_REMINDER: Clock,
  CUSTOMER_REPLY: MessageCircle,
  DEAL_WON: Trophy,
  DEAL_LOST: XCircle,
};

export function NotificationBell() {
  const { token } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = React.useState<NotificationDTO[]>([]);
  const [open, setOpen] = React.useState(false);

  const fetchNotifications = React.useCallback(() => {
    if (!token) return;
    api.listNotifications(token).then(setNotifications).catch(() => {});
  }, [token]);

  React.useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  async function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) fetchNotifications();
  }

  async function handleClick(notification: NotificationDTO) {
    if (!token) return;
    if (!notification.isRead) {
      setNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n)));
      api.markNotificationRead(token, notification.id).catch(() => {});
    }
    setOpen(false);
    if (notification.entityType === "customer" && notification.entityId) {
      router.push(`/customers/${notification.entityId}`);
    }
  }

  async function handleMarkAllRead() {
    if (!token) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    await api.markAllNotificationsRead(token);
  }

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-2 py-1.5">
          <DropdownMenuLabel className="p-0 font-normal text-sm font-semibold">Notifications</DropdownMenuLabel>
          {unreadCount > 0 && (
            <button onClick={handleMarkAllRead} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </button>
          )}
        </div>
        <DropdownMenuSeparator />
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="p-4 text-center text-sm text-muted-foreground">No notifications yet.</p>
          ) : (
            notifications.map((n) => {
              const Icon = TYPE_ICON[n.type];
              return (
                <DropdownMenuItem key={n.id} onClick={() => handleClick(n)} className="flex items-start gap-2 py-2">
                  <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", n.isRead ? "text-muted-foreground" : "text-primary")} />
                  <div className="flex-1 space-y-0.5">
                    <p className={cn("text-sm", !n.isRead && "font-medium")}>{n.title}</p>
                    {n.body && <p className="line-clamp-1 text-xs text-muted-foreground">{n.body}</p>}
                    <p className="text-[10px] text-muted-foreground">{new Date(n.createdAt).toLocaleString()}</p>
                  </div>
                  {!n.isRead && <Badge className="h-1.5 w-1.5 shrink-0 rounded-full p-0" />}
                </DropdownMenuItem>
              );
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
