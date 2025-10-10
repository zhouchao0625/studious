"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { PrimarySidebar } from "./primary-sidebar";
import { ClassSidebar } from "./class-sidebar";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";

interface AppLayoutProps {
  children: ReactNode;
  isAuthenticated?: boolean;
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
}

export function AppLayout({ children, isAuthenticated = false, user }: AppLayoutProps) {
  const pathname = usePathname();
  const appState = useSelector((state: RootState) => state.app);
  console.log("🔍 AppLayout Debug:");
  console.log("  Current pathname:", pathname);
  
  // Check if we're in a class route - updated for Next.js routes
  const classMatch = pathname.match(/^\/class\/([^\/]+)(?:\/|$)/);
  const classId = classMatch?.[1];

  const isInClass = Boolean(classId && classId !== "" && classId !== "undefined");

  // Don't show sidebars for auth pages
  if (!isAuthenticated || ["/login", "/signup", "/pricing"].includes(pathname)) {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Primary Sidebar */}
      {appState.user.loggedIn && <PrimarySidebar isAuthenticated={isAuthenticated} user={user} />}
      
      {/* Class Sidebar (only show if in a class route) */}
      {isInClass && appState.user.loggedIn && <ClassSidebar classId={classId!} />}
      
      {/* Main Content */}
      <main className={`min-h-screen overflow-auto transition-all duration-200 ${
        isInClass ? 'ml-80' : (appState.user.loggedIn ? 'ml-16' : 'ml-0')
      }`}>
        {children}
      </main>
    </div>
  );
}