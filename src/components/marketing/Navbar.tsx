"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X, Moon, Sun, Globe, ChevronDown, Check } from "lucide-react";
import { EarlyAccessModal } from "./EarlyAccessModal";
import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useTheme } from "@/components/ui/theme-provider";
import { setCookie } from "cookies-next";
import { LANGUAGES as languages } from "@/lib/language";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const t = useTranslations('navigation');
  const tMarketing = useTranslations('marketing.navbar');
  const [showEarlyAccess, setShowEarlyAccess] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { darkMode, setDarkMode } = useTheme();
  const locale = useLocale();

  const currentLang = languages.find(l => l.code === locale) || languages[0];

  const toggleDarkMode = () => {
    setDarkMode(darkMode === "dark" ? "light" : "dark");
  };

  const handleLanguageChange = (languageCode: string) => {
    setCookie('NEXT_LOCALE', languageCode, {
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: '/',
    });
    window.location.reload();
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <img src="/logo.png" alt="Studious" className="w-7 h-7" />
              <span className="text-lg font-semibold text-foreground">Studious</span>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {t('pricing')}
              </Link>
              <Link href="/program" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {t('schoolProgram')}
              </Link>
              <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {t('about')}
              </Link>
              <Link href="/press" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {t('press')}
              </Link>
              <div className="flex items-center gap-2">
                {/* Theme Toggle */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleDarkMode}
                >
                  {darkMode === "dark" ? (
                    <Moon className="h-4 w-4" />
                  ) : (
                    <Sun className="h-4 w-4" />
                  )}
                </Button>

                {/* Language Selector */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-9 gap-1">
                      <span className="text-sm">{currentLang.flag}</span>
                      <span className="px-1.5 py-0.5 text-xs bg-primary/10 text-primary rounded-md font-medium">
                        BETA
                      </span>
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 max-h-96 overflow-y-auto">
                    {languages.map((language) => (
                      <DropdownMenuItem
                        key={language.code}
                        onClick={() => handleLanguageChange(language.code)}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <span>{language.flag}</span>
                        <span className="flex-1">{language.name}</span>
                        {locale === language.code && (
                          <Check className="h-4 w-4" />
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {t('signIn')}
              </Link>
              <Button 
                size="sm" 
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={() => setShowEarlyAccess(true)}
              >
                {tMarketing('requestEarlyAccess')}
              </Button>
            </div>
            
            {/* Mobile Menu Button */}
            <button 
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5 text-muted-foreground" />
              ) : (
                <Menu className="h-5 w-5 text-muted-foreground" />
              )}
            </button>
          </div>
          
          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-md">
              <div className="px-6 py-4 space-y-4">
                <Link 
                  href="/pricing" 
                  className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {t('pricing')}
                </Link>
                <Link 
                  href="/program" 
                  className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {t('schoolProgram')}
                </Link>
                <Link 
                  href="/about" 
                  className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {t('about')}
                </Link>
                <Link 
                  href="/press" 
                  className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {t('press')}
                </Link>

                {/* Theme and Language Controls */}
                <div className="pt-4 border-t border-border space-y-3">
                  {/* Theme Toggle */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Theme</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleDarkMode}
                      className="h-9 gap-2"
                    >
                      {darkMode === "dark" ? (
                        <>
                          <Moon className="h-4 w-4" />
                          <span className="text-sm">Dark</span>
                        </>
                      ) : (
                        <>
                          <Sun className="h-4 w-4" />
                          <span className="text-sm">Light</span>
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Language Selector */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      Language
                      <span className="px-1.5 py-0.5 text-xs bg-primary/10 text-primary rounded-md font-medium">
                        BETA
                      </span>
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-9 gap-1">
                          <span className="text-sm">{currentLang.flag}</span>
                          <span className="text-sm">{currentLang.name}</span>
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 max-h-96 overflow-y-auto">
                        {languages.map((language) => (
                          <DropdownMenuItem
                            key={language.code}
                            onClick={() => handleLanguageChange(language.code)}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <span>{language.flag}</span>
                            <span className="flex-1">{language.name}</span>
                            {locale === language.code && (
                              <Check className="h-4 w-4" />
                            )}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <Link 
                    href="/login" 
                    className="block text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {t('signIn')}
                  </Link>
                  <Button 
                    size="sm" 
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                    onClick={() => {
                      setShowEarlyAccess(true);
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    {tMarketing('requestEarlyAccess')}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      <EarlyAccessModal open={showEarlyAccess} onOpenChange={setShowEarlyAccess} />
    </>
  );
}

