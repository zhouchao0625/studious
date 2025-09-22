"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { PrimarySidebar } from "./primary-sidebar";
import { ClassSidebar } from "./class-sidebar";

interface AppLayoutProps {
  children: ReactNode;
  isAuthenticated?: boolean;
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
}

// Mock class data - in real app this would come from API
const mockClasses = {
  "1": { id: "1", title: "Advanced Physics", section: "AP-101", subject: "Physics", color: "#3b82f6" },
  "2": { id: "2", title: "Calculus I", section: "MATH-201", subject: "Mathematics", color: "#8b5cf6" },
  "3": { id: "3", title: "English Literature", section: "ENG-101", subject: "English", color: "#ef4444" },
  "4": { id: "4", title: "World History", section: "HIST-150", subject: "History", color: "#f59e0b" },
  "5": { id: "5", title: "Computer Science", section: "CS-102", subject: "Computer Science", color: "#10b981" }
};

export function AppLayout({ children, isAuthenticated = false, user }: AppLayoutProps) {
  const pathname = usePathname();
  
  console.log("🔍 AppLayout Debug:");
  console.log("  Current pathname:", pathname);
  
  // Check if we're in a class route - updated for Next.js routes
  const classMatch = pathname.match(/^\/class\/([^\/]+)(?:\/|$)/);
  const classId = classMatch?.[1];

  const isInClass = Boolean(classId && classId !== "" && classId !== "undefined");

  // Don't show sidebars for auth pages
  if (!isAuthenticated || ["/login", "/signup", "/pricing"].includes(pathname)) {
    return <div className="min-h-screen bg-gradient-surface">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-surface">
      {/* Primary Sidebar */}
      <PrimarySidebar isAuthenticated={isAuthenticated} user={user} />
      
      {/* Class Sidebar (only show if in a class route) */}
      {isInClass && <ClassSidebar classId={classId!} />}
      
      {/* Main Content */}
      <main className={`min-h-screen overflow-auto transition-all duration-200 ${
        isInClass ? 'ml-80' : 'ml-16'
      }`}>
        {children}
      </main>
    </div>
  );
}