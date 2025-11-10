"use client";

import { ThemeProvider } from "@/components/ui/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { AppLayout } from "@/components/ui/app-layout";
import { ConditionalThemeToggle } from "@/components/ConditionalThemeToggle";
import { TRPCProvider } from "@/lib/trpc-provider";
import { Provider } from "react-redux";
import { AuthProvider } from "./providers/AuthProvider";
import { store } from "@/store/store";


interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <Provider store={store}>
      <TRPCProvider>
        <ThemeProvider defaultDarkMode="system" defaultColorTheme="default" storageKey="vite-ui-theme">
          <TooltipProvider>
            <AuthProvider>
            <Sonner />
            <AppLayout isAuthenticated={true}>
              <ConditionalThemeToggle />
              {children}
            </AppLayout>
            </AuthProvider>
          </TooltipProvider>
        </ThemeProvider>
      </TRPCProvider>
    </Provider>
  );
}
