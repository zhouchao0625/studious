"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Home, 
  BookOpen, 
  Calendar, 
  MessageSquare, 
  Settings, 
  User, 
  LogOut,
  GraduationCap,
  Hash,
  Plus,
  Bell
} from "lucide-react";
import { NotificationBell } from "@/components/notifications";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface PrimarySidebarProps {
  isAuthenticated?: boolean;
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
}

const navigationItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/classes", label: "Classes", icon: BookOpen },
  { href: "/agenda", label: "Agenda", icon: Calendar },
  { href: "/chat", label: "Chat", icon: MessageSquare },
];

const mockChatServers = [
  { id: "1", name: "General Discussion", initials: "GD", unread: 3 },
  { id: "2", name: "CS101 - Intro to Programming", initials: "CS", unread: 0 },
  { id: "3", name: "MATH202 - Calculus", initials: "MC", unread: 1 },
  { id: "4", name: "Study Group", initials: "SG", unread: 5 },
  { id: "5", name: "Project Team Alpha", initials: "PTA", unread: 0 },
];

export function PrimarySidebar({ isAuthenticated = false, user }: PrimarySidebarProps) {
  const pathname = usePathname();
  const [showChatServers, setShowChatServers] = useState(false);

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  const handleChatClick = () => {
    setShowChatServers(!showChatServers);
  };

  if (!isAuthenticated) {
    return null;
  }

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
              <Button
                key={item.href}
                variant="ghost"
                size="sm"
                onClick={handleChatClick}
                className={cn(
                  "flex items-center justify-center h-10 w-10 rounded-md text-sm font-medium transition-colors group relative mx-auto",
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
      <div className="p-2 border-t space-y-2">
        {/* Notification Bell */}
        <div className="flex justify-center">
          <NotificationBell />
        </div>
        
        {/* User Menu */}
        <div className="flex justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-10 w-10 rounded-md">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={user?.avatar} alt={user?.name} />
                  <AvatarFallback className="text-xs">
                    {user?.name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex flex-col space-y-1 p-2">
                <p className="text-sm font-medium leading-none">{user?.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
              </div>
              <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile" className="flex items-center">
                <User className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Account Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}