"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { 
  BookOpen, 
  FileText, 
  BarChart3, 
  FolderOpen, 
  Users, 
  UserCheck, 
  // FlaskConical, 
  FileCheck, 
  Settings,
  Copy,
  RefreshCcw,
  Sparkles,
  Menu,
  ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "./skeleton";
import { toast } from "sonner";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { RouterOutputs, trpc } from "@/lib/trpc";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";

interface ClassSidebarProps {
  classId: string;
}

export function ClassSidebar({ classId }: ClassSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = useTranslations('classSidebar');

  const appState = useSelector((state: RootState) => state.app);

  const classNavigationItems = [
    { href: "", label: t('overview'), icon: BookOpen },
    { href: "/assignments", label: t('assignments'), icon: FileText },
    { href: "/grades", label: t('grades'), icon: BarChart3 },
    { href: "/files", label: t('files'), icon: FolderOpen },
    { href: "/attendance", label: t('attendance'), icon: UserCheck },
    { href: "/ai-labs", label: t('aiLabs'), icon: Sparkles },
    { href: "/members", label: t('members'), icon: Users },
    { href: "/syllabus", label: t('syllabus'), icon: FileCheck },
    { href: "/settings", label: t('settings'), icon: Settings },
  ];

  const { data: allClasses, isLoading, error } = trpc.class.getAll.useQuery();
  const classes = allClasses?.teacherInClass.concat(allClasses?.studentInClass);
  const {data: inviteCodeData, isLoading: isInviteCodeLoading, error: isInviteCodeError, refetch: refetchInviteCode } = trpc.class.getInviteCode.useQuery({ classId: classId! });
  const inviteCode = inviteCodeData?.code;
  const { data: classData, isLoading: isClassLoading, error: isClassError } = trpc.class.get.useQuery({ classId: classId! });
  const className = classData?.class;
  const regenerateInviteCodeMutation = trpc.class.createInviteCode.useMutation({
    onSuccess: () => {
      toast.success(t('toast.inviteCodeRegenerated'));
      refetchInviteCode();
    },
    onError: () => {
      toast.error(t('toast.inviteCodeRegenerateFailed'));
    }
  });

  if (!classId) {
    console.log("❌ No classId - returning null");
    return null;
  }

  console.log("✅ ClassSidebar will render");

  const handleClassChange = (newClassId: string) => {
    router.push(`/class/${newClassId}`);
  };

  const handleRegenerateInviteCode = () => {
    regenerateInviteCodeMutation.mutate({
      classId: classId!
    });
  };

  const isActive = (path: string) => {
    const fullPath = `/class/${classId}${path}`;
    return pathname === fullPath;
  };

  const handleCopyInviteCode = () => {
    navigator.clipboard.writeText(inviteCode!);
    toast.success(t('toast.inviteCodeCopied'));
  };

  // Mobile version - Sheet/Dropdown style
  if (isMobile) {
    return (
      <>
        {/* Mobile Class Header with Dropdown */}
        <div className="fixed top-0 left-0 right-0 z-30 bg-card border-b">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" className="w-full justify-between px-4 py-6 h-auto rounded-none">
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  {isClassLoading ? (
                    <>
                      <Skeleton className="w-3 h-3 rounded-full flex-shrink-0" />
                      <Skeleton className="w-32 h-4 rounded-full flex-shrink-0" />
                    </>
                  ) : className ? (
                    <>
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: className.color || "#000000" }}
                      />
                      <div className="min-w-0 flex-1 text-left">
                        <div className="font-medium truncate text-left">{className.name}</div>
                        <div className="text-xs text-muted-foreground truncate text-left">{className.section} • {className.subject}</div>
                      </div>
                    </>
                  ) : null}
                </div>
                <ChevronDown className="h-4 w-4 flex-shrink-0" />
              </Button>
            </SheetTrigger>
            <SheetContent side="top" className="h-[100vh] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>{t('classNavigation')}</SheetTitle>
              </SheetHeader>
              
              <div className="space-y-6 mt-6">
                {/* Class Selector */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('switchClass')}</label>
                  <Select value={classId} onValueChange={(newClassId) => {
                    handleClassChange(newClassId);
                    setMobileMenuOpen(false);
                  }}>
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        {isClassLoading && <Skeleton className="w-32 h-4" />}
                        {className && !isClassLoading && (
                          <div className="flex items-center space-x-3 min-w-0 flex-1">
                            <div 
                              className="w-3 h-3 rounded-full flex-shrink-0" 
                              style={{ backgroundColor: className.color || "#000000" }}
                            />
                            <span className="truncate">{className.name}</span>
                          </div>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {classes?.map((cls: RouterOutputs["class"]["getAll"]['teacherInClass'][number] | RouterOutputs["class"]["getAll"]['studentInClass'][number]) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          <div className="flex items-center space-x-3 min-w-0 flex-1">
                            <div 
                              className="w-3 h-3 rounded-full flex-shrink-0" 
                              style={{ backgroundColor: cls.color || "#000000" }}
                            />
                            <div className="min-w-0 flex-1 text-left">
                              <div className="font-medium truncate">{cls.name}</div>
                              <div className="text-xs text-muted-foreground truncate">{cls.section} • {cls.subject}</div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Navigation Items */}
                <nav className="space-y-2">
                  {classNavigationItems
                    .filter((item) => {
                      if (item.href === "/settings" && appState.user.student) {
                        return false;
                      }
                      return true;
                    })
                    .map((item) => {
                      const Icon = item.icon;
                      const href = `/class/${classId}${item.href}`;
                      
                      return (
                        <Link
                          key={item.href}
                          href={href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={cn(
                            "flex items-center space-x-3 px-4 py-3 rounded-md text-sm font-medium transition-colors",
                            isActive(item.href)
                              ? "bg-accent text-accent-foreground"
                              : "text-muted-foreground hover:text-foreground hover:bg-accent"
                          )}
                        >
                          <Icon className="h-5 w-5" />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                </nav>

                {/* Invite Code (Teachers only) */}
                {appState.user.teacher && (
                  <div className="space-y-2 pt-4 border-t">
                    <label className="text-sm font-medium text-muted-foreground">{t('classInviteCode')}</label>
                    <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                      <code className="text-sm font-mono">{inviteCode}</code>
                      <div className="flex space-x-1">
                        <Button onClick={handleCopyInviteCode} variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button onClick={handleRegenerateInviteCode} variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <RefreshCcw className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </>
    );
  }

  // Desktop version - Original sidebar
  return (
    <div className="w-64 h-screen bg-card border-r flex flex-col fixed left-16 top-0 z-30">
      {/* Class Header */}
      <div className="px-4 py-2">
        
        <div className="space-y-1">
          <Select value={classId} onValueChange={handleClassChange}>
            <SelectTrigger className="w-full text-left px-4 focus:outline-none focus:ring-0 border-none hover:bg-accent transition-colors duration-200">
              <SelectValue>
                {isClassLoading && <div className="flex flex-row space-x-3">
                  <Skeleton className="w-3 h-3 rounded-full flex-shrink-0" />
                  <Skeleton className="w-20 h-3 rounded-full flex-shrink-0" /> 
                  </div>}
                {className && !isClassLoading && (
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: className.color || "#000000" }}
                    />
                    <div className="min-w-0 flex-1 text-left">
                      <div className="font-medium truncate text-left">{className.name}</div>
                      <div className="text-xs text-muted-foreground truncate text-left">{className.section} • {className.subject}</div>
                    </div>
                  </div>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="w-64 bg-popover border shadow-md">
               {classes?.map((cls: RouterOutputs["class"]["getAll"]['teacherInClass'][number] | RouterOutputs["class"]["getAll"]['studentInClass'][number]) => (
                <SelectItem key={cls.id} value={cls.id} className="cursor-pointer">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: cls.color || "#000000" }}
                    />
                    <div className="min-w-0 flex-1 text-left">
                      <div className="font-medium truncate text-left">{cls.name}</div>
                      <div className="text-xs text-muted-foreground truncate text-left">{cls.section} • {cls.subject}</div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Separator */}
      <div className="border-b border-border/60 mx-4"></div>

      {/* Class Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {classNavigationItems
          .filter((item) => {
            // Hide Settings for students
            if (item.href === "/settings" && appState.user.student) {
              return false;
            }
            return true;
          })
          .map((item) => {
          const Icon = item.icon;
          const href = `/class/${classId}${item.href}`;
          
          return (
            <Link
              key={item.href}
              href={href}
              className={cn(
                "flex items-center space-x-3 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 hover:scale-105",
                isActive(item.href)
                  ? "bg-accent text-accent-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      
      {/* Class Invite Code */}
      {appState.user.teacher && <div className="p-4 pt-3 border-t mt-auto">
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">{t('classInviteCode')}</label>
          <div className="flex items-center justify-between p-2 bg-muted rounded-md hover:bg-muted/60 transition-colors duration-200">
            <code className="text-sm font-mono">{inviteCode}</code>
            <div className="flex space-x-1">
              <Button onClick={handleCopyInviteCode} variant="ghost" size="sm" className="h-6 w-6 p-0 hover:scale-110 transition-transform duration-200" title={t('copyCode')}>
                <Copy className="h-3 w-3" />
              </Button>
              <Button onClick={handleRegenerateInviteCode} variant="ghost" size="sm" className="h-6 w-6 p-0 hover:scale-110 transition-transform duration-200" title={t('regenerateCode')}>
                <RefreshCcw className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>}
    </div>
  );
}