"use client";

import { useEffect } from "react";
import { PageLayout } from "@/components/ui/page-layout";
import { Skeleton } from "@/components/ui/skeleton";
import { setTeacher } from "@/store/appSlice";
import { useParams } from "next/navigation";
import { useDispatch } from "react-redux";
import { trpc } from "@/lib/trpc";

export default function ClassLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { id } = useParams();

  const dispatch = useDispatch();
  const { data: userData, isLoading: isUserLoading, error: isUserError} = trpc.auth.check.useQuery();
  
  // add computed flags
  const {data: classData, isLoading: isClassLoading, error: isClassError} = trpc.class.getAll.useQuery();

  // Set teacher status based on class data
  useEffect(() => {
    if (classData && id) {
      const teacherInClass = classData.teacherInClass;
      const studentInClass = classData.studentInClass;

      if (teacherInClass.find(cls => cls.id === id)) {
        dispatch(setTeacher(true));
      } else if (studentInClass.find(cls => cls.id === id)) {
        dispatch(setTeacher(false));
      }
    }
  }, [classData, id, dispatch]);
  
  const loading = isUserLoading || isClassLoading;
  if (loading) {
    return (
      <PageLayout>
        {/* Header skeleton */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-72" />
            </div>
            <div className="flex space-x-2">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-20" />
            </div>
          </div>
        </div>

        {/* Navigation/Tabs skeleton */}
        <div className="mb-6">
          <div className="flex space-x-1 border-b">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-28" />
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>

        {/* Content area skeleton */}
        <div className="space-y-4">
          {/* Toolbar skeleton */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-9 w-80" />
              <Skeleton className="h-9 w-20" />
            </div>
            <div className="flex space-x-2">
              <Skeleton className="h-9 w-16" />
              <Skeleton className="h-9 w-16" />
              <Skeleton className="h-9 w-20" />
            </div>
          </div>

          {/* Main content grid skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="border rounded-lg p-4 space-y-3">
                <Skeleton className="h-12 w-12 mx-auto" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-2/3 mx-auto" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </PageLayout>
    );
  }
  return (
    <PageLayout>
      {!loading && <div className="flex h-screen">
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>}
    </PageLayout>
  );
}
