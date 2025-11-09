"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Home, 
  BookOpen, 
  Calendar, 
  MessageSquare, 
  Settings, 
  User, 
  LogOut,
  Plus,
  Bell,
} from "lucide-react";
import { NotificationBell } from "@/components/notifications";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { trpc } from "@/lib/trpc";
import { useChat } from "@/hooks/useChat";
import { useTranslations } from "next-intl";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface PrimarySidebarProps {
  isAuthenticated?: boolean;
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
}

// Navigation items with translation keys
const getNavigationItems = (t: (key: string) => string) => [
  { href: "/home", label: t('home'), icon: Home },
  { href: "/classes", label: t('classes'), icon: BookOpen },
  { href: "/agenda", label: t('agenda'), icon: Calendar },
  { href: "/chat", label: t('chat'), icon: MessageSquare },
];

const mockChatServers = [
  { id: "1", name: "General Discussion", initials: "GD", unread: 3 },
  { id: "2", name: "CS101 - Intro to Programming", initials: "CS", unread: 0 },
  { id: "3", name: "MATH202 - Calculus", initials: "MC", unread: 1 },
  { id: "4", name: "Study Group", initials: "SG", unread: 5 },
  { id: "5", name: "Project Team Alpha", initials: "PTA", unread: 0 },
];

export function PrimarySidebar({ isAuthenticated = false, user }: PrimarySidebarProps) {
  const t = useTranslations('navigation');
  const pathname = usePathname();
  const appState = useSelector((state: RootState) => state.app);
  const [showChatServers, setShowChatServers] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const router = useRouter();
  const isMobile = useIsMobile();
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      router.push("/login");
    }
  });
  
  const navigationItems = getNavigationItems(t);

  // Get chat data for badge counts
  const { conversations } = useChat(appState.user.loggedIn ? appState.user.id : "");
  
  // Calculate total unread counts
  const totalUnreadCount = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);
  const totalMentionCount = conversations.reduce((sum, conv) => sum + conv.unreadMentionCount, 0);
  const isActive = (path: string) => {
    if (path === "/home") return pathname === "/" || pathname === "/home";
    return pathname.startsWith(path);
  };

  const handleChatClick = () => {
    router.push("/chat");
    // setShowChatServers(!showChatServers);
  };

  if (!isAuthenticated) {
    return null;
  }

  const { data: notifications } = trpc.notification.list.useQuery();
  const unreadNotificationCount = notifications?.filter(n => !n.read).length || 0;


  // Mobile version - Bottom navigation
  if (isMobile) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t">
        <nav className="flex items-center justify-around px-2 py-2 safe-area-inset-bottom">
          {/* All Navigation Items */}
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isItemActive = isActive(item.href);
            
            // Special handling for chat with badge
            if (item.href === "/chat") {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative flex flex-col items-center justify-center flex-1 py-2"
                >
                  <div className={cn(
                    "relative flex items-center justify-center h-10 w-10 rounded-md transition-colors",
                    isItemActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground"
                  )}>
                    <Icon className="h-5 w-5" />
                    
                    {/* Mention Badge (Red) */}
                    {totalMentionCount > 0 && (
                      <div className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs min-w-[16px] h-[16px] rounded-full flex items-center justify-center font-bold text-[10px]">
                        {totalMentionCount > 99 ? '99+' : totalMentionCount}
                      </div>
                    )}
                    
                    {/* Unread Badge (Gray) */}
                    {totalUnreadCount > 0 && totalMentionCount === 0 && (
                      <div className="absolute -top-1 -right-1 bg-muted-foreground text-background text-xs min-w-[16px] h-[16px] rounded-full flex items-center justify-center font-bold text-[10px]">
                        {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                      </div>
                    )}
                  </div>
                  <span className={cn(
                    "text-[10px] mt-0.5 font-medium",
                    isItemActive ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {item.label}
                  </span>
                </Link>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center flex-1 py-2"
              >
                <div className={cn(
                  "flex items-center justify-center h-10 w-10 rounded-md transition-colors",
                  isItemActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground"
                )}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className={cn(
                  "text-[10px] mt-0.5 font-medium",
                  isItemActive ? "text-foreground" : "text-muted-foreground"
                )}>
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* Notifications */}
          <Link
            href="/notifications"
            className="relative flex flex-col items-center justify-center flex-1 py-2"
          >
            <div className={cn(
              "relative flex items-center justify-center h-10 w-10 rounded-md transition-colors",
              pathname === "/notifications"
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground"
            )}>
              <Bell className="h-5 w-5" />
              {unreadNotificationCount > 0 && (
                <div className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs min-w-[16px] h-[16px] rounded-full flex items-center justify-center font-bold text-[10px]">
                  {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                </div>
              )}
            </div>
            <span className={cn(
              "text-[10px] mt-0.5 font-medium",
              pathname === "/notifications" ? "text-foreground" : "text-muted-foreground"
            )}>
              {t('notifications')}
            </span>
          </Link>

          {/* Profile */}
          <Popover open={profileMenuOpen} onOpenChange={setProfileMenuOpen}>
            <PopoverTrigger asChild>
              <button className="flex flex-col items-center justify-center flex-1 py-2">
                <div className={cn(
                  "flex items-center justify-center h-10 w-10 rounded-md transition-colors",
                  pathname === "/profile"
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground"
                )}>
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={appState.user.profilePicture} alt={appState.user.displayName} />
                    <AvatarFallback className="text-[10px]">
                      {appState.user.displayName?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <span className={cn(
                  "text-[10px] mt-0.5 font-medium",
                  pathname === "/profile" ? "text-foreground" : "text-muted-foreground"
                )}>
                  {t('profile')}
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-0 mb-2" align="center" side="top" sideOffset={8}>
              <div className="flex items-center gap-3 p-3 border-b">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={appState.user.profilePicture} alt={appState.user.displayName} />
                  <AvatarFallback>
                    {appState.user.displayName?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col space-y-0.5 flex-1 min-w-0">
                  <p className="text-sm font-semibold leading-none truncate">{appState.user.displayName}</p>
                  <p className="text-xs leading-none text-muted-foreground truncate">
                    {appState.user.username}
                  </p>
                </div>
              </div>
              <div className="p-2">
                <Link
                  href="/profile"
                  onClick={() => setProfileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-accent transition-colors cursor-pointer"
                >
                  <User className="h-4 w-4" />
                  <span>{t('profile')}</span>
                </Link>
                <button
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-accent transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  <span>{t('accountSettings')}</span>
                </button>
              </div>
              <div className="p-2 border-t">
                <button
                  onClick={() => {
                    logoutMutation.mutate();
                    setProfileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-destructive/10 transition-colors text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                  <span>{t('signOut')}</span>
                </button>
              </div>
            </PopoverContent>
          </Popover>
        </nav>
      </div>
    );
  }

  // Desktop version - Original sidebar
  return (
    <div className="w-16 h-screen bg-card border-r flex flex-col fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="p-4 border-b flex justify-center">
        <Link href="/" className="flex items-center">
          <img src="/logo.png" alt="Studious Logo" className="h-6 w-6" />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          
          // Special handling for chat icon
          if (item.href === "/chat") {
            return (
              <div key={item.href} className="relative flex justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleChatClick}
                  className={cn(
                    "flex items-center justify-center h-10 w-10 rounded-md text-sm font-medium transition-colors group relative",
                    showChatServers || isActive(item.href)
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                  title={item.label}
                >
                  <Icon className="h-4 w-4" />
                  {/* Tooltip */}
                  <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded border opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                    {item.label}
                  </div>
                </Button>
                
                {/* Mention Badge (Red) */}
                {totalMentionCount > 0 && (
                  <div className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs min-w-[18px] h-[18px] rounded-full flex items-center justify-center font-bold z-10">
                    {totalMentionCount > 99 ? '99+' : totalMentionCount}
                  </div>
                )}
                
                {/* Unread Badge (Gray) - only show if no mentions */}
                {totalUnreadCount > 0 && totalMentionCount === 0 && (
                  <div className="absolute -top-1 -right-1 bg-muted-foreground text-background text-xs min-w-[18px] h-[18px] rounded-full flex items-center justify-center font-bold z-10">
                    {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                  </div>
                )}
              </div>
            );
          }
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-center h-10 w-10 rounded-md text-sm font-medium transition-colors group relative mx-auto",
                isActive(item.href)
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
              title={item.label}
            >
              <Icon className="h-4 w-4" />
              {/* Tooltip */}
              <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded border opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                {item.label}
              </div>
            </Link>
          );
        })}
        
        {/* Chat Servers - Discord Style */}
        {showChatServers && (
          <div className="space-y-1">
            {mockChatServers.map((server) => (
              <div key={server.id} className="flex justify-center">
                <Link
                  href={`/chat/${server.id}`}
                  className="flex items-center justify-center h-10 w-10 rounded-md text-xs font-bold transition-all duration-200 group relative bg-muted hover:bg-primary hover:rounded-2xl hover:text-primary-foreground"
                  title={server.name}
                >
                  <span>{server.initials}</span>
                  {server.unread > 0 && (
                    <div className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center">
                      {server.unread}
                    </div>
                  )}
                  {/* Tooltip */}
                  <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded border opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                    {server.name}
                  </div>
                </Link>
              </div>
            ))}
            
            {/* Add Server Button */}
            <div className="flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                className="h-10 w-10 rounded-md border-2 border-dashed border-muted-foreground/50 text-muted-foreground hover:border-primary hover:text-primary transition-colors group relative"
                title="Add Server"
              >
                <Plus className="h-4 w-4" />
                {/* Tooltip */}
                <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded border opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                  Add Server
                </div>
              </Button>
            </div>
          </div>
        )}
      </nav>

      {/* Notifications & User Menu */}
      <div className="p-2 border-t space-y-1">
        {/* Notification Bell */}
        <div className="flex justify-center">
          <NotificationBell />
        </div>
        
        {/* User Menu */}
        <div className="flex justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-10 w-10 rounded-md p-0 hover:bg-accent focus-visible:ring-0 focus-visible:ring-offset-0">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={appState.user.profilePicture} alt={appState.user.displayName} />
                  <AvatarFallback className="text-xs">
                    {appState.user.displayName?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 mb-2" align="start" side="right" alignOffset={-8} sideOffset={8}>
              <div className="flex items-center gap-3 p-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={appState.user.profilePicture} alt={appState.user.displayName} />
                  <AvatarFallback>
                    {appState.user.displayName?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col space-y-0.5 flex-1 min-w-0">
                  <p className="text-sm font-semibold leading-none truncate">{appState.user.displayName}</p>
                  <p className="text-xs leading-none text-muted-foreground truncate">
                    {appState.user.username}
                  </p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <div className="p-1">
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center cursor-pointer">
                    <User className="mr-3 h-4 w-4" />
                    <span>{t('profile')}</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <Settings className="mr-3 h-4 w-4" />
                  <span>{t('accountSettings')}</span>
                </DropdownMenuItem>
              </div>
              <DropdownMenuSeparator />
              <div className="p-1">
                <DropdownMenuItem 
                  onClick={() => {
                    logoutMutation.mutate();
                  }}
                  className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                >
                  <LogOut className="mr-3 h-4 w-4" />
                  <span>{t('signOut')}</span>
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}