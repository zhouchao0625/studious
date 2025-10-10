"use client";

import { useState } from "react";
import { PageLayout } from "@/components/ui/page-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Filter,
} from "lucide-react";
import { trpc, type RouterOutputs } from "@/lib/trpc";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

type Notification = RouterOutputs['notification']['list'][number];

export default function NotificationsPage() {
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [markingAsRead, setMarkingAsRead] = useState<string | null>(null);

  // Get notifications
  const { data: notifications, isLoading, refetch } = trpc.notification.list.useQuery();

  // Mark as read mutation
  const markAsReadMutation = trpc.notification.markAsRead.useMutation({
    onSuccess: () => {
      setMarkingAsRead(null);
      refetch();
      toast.success("Notification marked as read");
      refetch();
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

  // Filter notifications based on selected filter
  const filteredNotifications = notifications?.filter(notification => {
    if (filter === 'unread') return !notification.read;
    if (filter === 'read') return notification.read;
    return true;
  }) || [];

  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  if (isLoading) {
    return (
      <PageLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="h-32 bg-gray-200 rounded-lg animate-pulse"></div>
          <Card className="h-40 animate-pulse"></Card>
          <Card className="h-40 animate-pulse"></Card>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
            <p className="text-muted-foreground">
              Stay up to date with your classes and assignments
            </p>
          </div>
          
          {unreadCount > 0 && (
            <Badge variant="secondary" className="text-sm">
              {unreadCount} unread
            </Badge>
          )}
        </div>

        {/* Filter Tabs */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Filter:</span>
              <div className="flex space-x-1">
                <Button
                  variant={filter === 'all' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setFilter('all')}
                >
                  All ({notifications?.length || 0})
                </Button>
                <Button
                  variant={filter === 'unread' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setFilter('unread')}
                >
                  Unread ({unreadCount})
                </Button>
                <Button
                  variant={filter === 'read' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setFilter('read')}
                >
                  Read ({(notifications?.length || 0) - unreadCount})
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications List */}
        <div className="space-y-4">
          {filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {filter === 'unread' ? 'No unread notifications' : 
                   filter === 'read' ? 'No read notifications' : 
                   'No notifications yet'}
                </h3>
                <p className="text-muted-foreground">
                  {filter === 'unread' ? 'All caught up! You have no unread notifications.' :
                   filter === 'read' ? 'No notifications have been marked as read yet.' :
                   'When you receive notifications, they will appear here.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredNotifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
                isMarkingAsRead={markingAsRead === notification.id}
              />
            ))
          )}
        </div>
      </div>
    </PageLayout>
  );
}

function NotificationCard({ 
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
    <Card className={cn(
      "transition-all hover:shadow-sm",
      !notification.read && "ring-1 ring-primary/20 bg-primary/5"
    )}>
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <div className={cn("flex-shrink-0 mt-1", iconColor)}>
            <Icon className="h-5 w-5" />
          </div>
          
          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h3 className={cn(
                  "font-medium text-foreground",
                  !notification.read && "font-semibold"
                )}>
                  {notification.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {notification.content}
                </p>
              </div>
              
              {!notification.read && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onMarkAsRead(notification.id)}
                  disabled={isMarkingAsRead}
                  className="ml-4 flex-shrink-0"
                >
                  {isMarkingAsRead ? (
                    <>
                      <div className="animate-spin h-3 w-3 border border-primary border-t-transparent rounded-full mr-2" />
                      Marking...
                    </>
                  ) : (
                    <>
                      <Check className="h-3 w-3 mr-2" />
                      Mark as Read
                    </>
                  )}
                </Button>
              )}
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>{formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}</span>
                </div>
                
                <span className="text-muted-foreground/60">•</span>
                
                <span>{format(new Date(notification.createdAt), 'MMM d, yyyy \'at\' h:mm a')}</span>
              </div>
              
              {notification.sender && (
                <div className="flex items-center space-x-1">
                  <span>from</span>
                  <span className="font-medium">{notification.sender.username}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
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
