"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageLayout, PageHeader } from "@/components/ui/page-layout";
import { ClassCard } from "@/components/ui/class-card";
import {
  Plus,
  UserPlus,
  Building,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { CreateClassModal, JoinClassModal } from "@/components/modals";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { ClassCardSkeleton } from "@/components/ui/class-card-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ClassCreateInput } from "@/lib/trpc";
import { useTranslations } from "next-intl";

export default function Classes() {
  const t = useTranslations('classes');
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("teaching");

  // Use React Query hooks for automatic loading, error, and data management
  const { data: classes, isLoading, error, refetch } = trpc.class.getAll.useQuery();
  const deleteClassMutation = trpc.class.delete.useMutation();
  const createClassMutation = trpc.class.create.useMutation();

  // React Query handles loading automatically, no useEffect needed!

  const filteredTeaching = classes?.teacherInClass.filter(cls =>
    cls.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cls.section?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cls.subject?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const filteredEnrolled = classes?.studentInClass.filter(cls =>
    cls.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cls.section?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cls.subject?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleDeleteClass = async (classId: string) => {
    try {
      await deleteClassMutation.mutateAsync({ classId, id: classId });
      toast.success(t('classDeleted'));
    } catch (err) {
      console.error("Failed to delete class:", err);
      toast.error(t('classDeleteFailed'));
    }
  };

  const handleClassCreated = () => {
    refetch();
  };

  const handleClassJoined = () => {
    // Add the joined class to the enrolled classes
    refetch();
  };

  if (isLoading || !classes) {
    return (
      <PageLayout>
        <PageHeader
          title={t('title')}
          description={t('description')}
        >
          <div className="flex flex-col sm:flex-row gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-28" />
            <Skeleton className="h-10 w-32" />
          </div>
        </PageHeader>

        {/* Search skeleton */}
        <div className="relative max-w-md mb-6">
          <Skeleton className="h-10 w-full" />
        </div>

        {/* Tabs skeleton */}
        <div className="space-y-6">
          <div className="grid w-full max-w-md grid-cols-2 gap-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>

          {/* Classes grid skeleton */}
          <ClassCardSkeleton count={8} />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageHeader
        title={t('title')}
        description={t('description')}
      >
        <div className="flex flex-col sm:flex-row gap-2">
          <JoinClassModal onClassJoined={handleClassJoined}>
            <Button variant="outline" className="flex items-center space-x-2">
              <UserPlus className="h-4 w-4" />
              <span>{t('joinClass')}</span>
            </Button>
          </JoinClassModal>
          <CreateClassModal onClassCreated={handleClassCreated}>
            <Button className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>{t('createClass')}</span>
            </Button>
          </CreateClassModal>
        </div>
      </PageHeader>

      {/* Search */}
      <div className="relative max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t('searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Classes Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="teaching">
            <span>{t('teaching')}</span>
            <span className="bg-muted text-muted-foreground px-2 rounded-full text-xs ml-2">
              {filteredTeaching.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="enrolled">
            <span>{t('enrolled')}</span>
            <span className="bg-muted text-muted-foreground px-2 rounded-full text-xs ml-2">
              {filteredEnrolled.length}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="teaching" className="space-y-6">
          {error && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 text-sm">
                {error.message || t('failedToLoad')}. Showing fallback data.
              </p>
            </div>
          )}
          {filteredTeaching.length > 0 ? (
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3">
              {filteredTeaching.map((classItem) => (
                <ClassCard
                  key={classItem.id}
                  id={classItem.id}
                  title={classItem.name}
                  section={classItem.section}
                  subject={classItem.subject}
                  color={classItem.color || "#3b82f6"}
                  dueTodayAssignments={classItem.dueToday || []}
                  role="teacher"
                  onDelete={() => handleDeleteClass(classItem.id)}
                />
              ))}
            </div>
          ) : searchQuery ? (
            <EmptyState
              icon={Search}
              title={t('noClassesFound')}
              description={t('noTeachingClassesFound', { query: searchQuery })}
            />
          ) : (
            <EmptyState
              icon={Building}
              title={t('noClassesYet')}
              description={t('noClassesYetDesc')} 
            />
          )}
        </TabsContent>

        <TabsContent value="enrolled" className="space-y-6">
          {error && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 text-sm">
                {error.message || t('failedToLoad')}. Showing fallback data.
              </p>
            </div>
          )}
          {filteredEnrolled.length > 0 ? (
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3">
              {filteredEnrolled.map((classItem) => (
                <ClassCard
                  key={classItem.id}
                  id={classItem.id}
                  title={classItem.name}
                  section={classItem.section}
                  subject={classItem.subject}
                  color={classItem.color || "#3b82f6"}
                  dueTodayAssignments={classItem.dueToday || []}
                  role="student"
                />
              ))}
            </div>
          ) : searchQuery ? (
            <EmptyState
              icon={Search}
              title={t('noClassesFound')}
              description={t('noEnrolledClassesFound', { query: searchQuery })}
            />
          ) : (
            <EmptyState
              icon={UserPlus}
              title={t('noEnrolledClasses')}
              description={t('noEnrolledClassesDesc')}
            />
          )}
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
}
