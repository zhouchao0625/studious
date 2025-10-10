"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Clock,
  MessageSquare,
  FileText,
  Users,
  Calendar,
  AlertCircle,
  ExternalLink
} from "lucide-react";
import { trpc, type RouterOutputs } from "@/lib/trpc";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

type Notification = RouterOutputs['notification']['list'][number];

interface NotificationDropdownProps {
  notifications: Notification[];
  isLoading: boolean;
  onClose: () => void;
}

export function NotificationDropdown({ notifications, isLoading, onClose }: NotificationDropdownProps) {
  const router = useRouter();
  const [markingAsRead, setMarkingAsRead] = useState<string | null>(null);

  // Mark as read mutation
  const markAsReadMutation = trpc.notification.markAsRead.useMutation({
    onSuccess: () => {
      setMarkingAsRead(null);
      // Optionally refresh notifications or use optimistic updates
    },
    onError: (error) => {
      toast.error(error.message);
      setMarkingAsRead(null);
    },
  });

  const handleMarkAsRead = (notificationId: string) => {
    setMarkingAsRead(notificationId);
    markAsReadMutation.mutate({ id: notificationId });
  };

  const getNotificationIcon = (notification: Notification) => {
    const title = notification.title.toLowerCase();
    
    if (title.includes('assignment')) return FileText;
    if (title.includes('grade')) return CheckCheck;
    if (title.includes('comment') || title.includes('message')) return MessageSquare;
    if (title.includes('class') || title.includes('student')) return Users;
    if (title.includes('due') || title.includes('reminder')) return Calendar;
    if (title.includes('urgent') || title.includes('important')) return AlertCircle;
    
    return Bell;
  };

  const getNotificationColor = (notification: Notification) => {
    const title = notification.title.toLowerCase();
    
    if (title.includes('urgent') || title.includes('overdue')) return 'text-destructive';
    if (title.includes('grade') || title.includes('completed')) return 'text-primary';
    if (title.includes('assignment') || title.includes('due')) return 'text-primary';
    if (title.includes('reminder')) return 'text-primary';
    
    return 'text-muted-foreground';
  };

  const unreadNotifications = notifications.filter(n => !n.read);
  const readNotifications = notifications.filter(n => n.read);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col max-h-96">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <h3 className="font-semibold">Notifications</h3>
          {unreadNotifications.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {unreadNotifications.length} new
            </Badge>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <ScrollArea className="flex-1">
        {notifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y">
            {/* Unread Notifications */}
            {unreadNotifications.length > 0 && (
              <>
                {unreadNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={handleMarkAsRead}
                    isMarkingAsRead={markingAsRead === notification.id}
                  />
                ))}
                {readNotifications.length > 0 && <Separator />}
              </>
            )}

            {/* Read Notifications */}
            {readNotifications.slice(0, 10).map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
                isMarkingAsRead={markingAsRead === notification.id}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="border-t p-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full text-xs"
            onClick={() => {
              router.push('/notifications');
              onClose();
            }}
          >
            <ExternalLink className="h-3 w-3 mr-2" />
            View All Notifications
          </Button>
        </div>
      )}
    </div>
  );
}

function NotificationItem({ 
  notification, 
  onMarkAsRead, 
  isMarkingAsRead 
}: { 
  notification: Notification; 
  onMarkAsRead: (id: string) => void;
  isMarkingAsRead: boolean;
}) {
  const Icon = getNotificationIcon(notification);
  const iconColor = getNotificationColor(notification);

  return (
    <div 
      className={cn(
        "p-3 hover:bg-muted/50 transition-colors",
        !notification.read && "bg-primary/5"
      )}
    >
      <div className="flex items-start space-x-3">
        <div className={cn("flex-shrink-0 mt-0.5", iconColor)}>
          <Icon className="h-4 w-4" />
        </div>
        
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-start justify-between">
            <p className={cn(
              "text-sm font-medium truncate",
              !notification.read && "font-semibold"
            )}>
              {notification.title}
            </p>
            {!notification.read && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 ml-2 flex-shrink-0"
                onClick={() => onMarkAsRead(notification.id)}
                disabled={isMarkingAsRead}
              >
                {isMarkingAsRead ? (
                  <div className="animate-spin h-3 w-3 border border-primary border-t-transparent rounded-full" />
                ) : (
                  <Check className="h-3 w-3" />
                )}
              </Button>
            )}
          </div>
          
          <p className="text-xs text-muted-foreground line-clamp-2">
            {notification.content}
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}</span>
            </div>
            
            {notification.sender && (
              <span className="text-xs text-muted-foreground">
                from {notification.sender.username}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function getNotificationIcon(notification: Notification) {
  const title = notification.title.toLowerCase();
  
  if (title.includes('assignment')) return FileText;
  if (title.includes('grade')) return CheckCheck;
  if (title.includes('comment') || title.includes('message')) return MessageSquare;
  if (title.includes('class') || title.includes('student')) return Users;
  if (title.includes('due') || title.includes('reminder')) return Calendar;
  if (title.includes('urgent') || title.includes('important')) return AlertCircle;
  
  return Bell;
}

function getNotificationColor(notification: Notification) {
  const title = notification.title.toLowerCase();
  
  if (title.includes('urgent') || title.includes('overdue')) return 'text-destructive';
  if (title.includes('grade') || title.includes('completed')) return 'text-primary';
  if (title.includes('assignment') || title.includes('due')) return 'text-primary';
  if (title.includes('reminder')) return 'text-primary';
  
  return 'text-muted-foreground';
}
