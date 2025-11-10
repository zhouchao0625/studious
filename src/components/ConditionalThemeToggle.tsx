"use client";

import { usePathname } from "next/navigation";
import { FloatingThemeToggle } from "@/components/ui/floating-theme-toggle";

export function ConditionalThemeToggle() {
  const pathname = usePathname();
  
  // Hide theme toggle on marketing pages
  const isMarketingPage = pathname === "/" || 
    pathname.startsWith("/pricing") || 
    pathname.startsWith("/about") || 
    pathname.startsWith("/press") || 
    pathname.startsWith("/program") ||
    pathname === "/login" ||
    pathname === "/signup";
  
  if (isMarketingPage) {
    return null;
  }
  
  return <FloatingThemeToggle />;
}
