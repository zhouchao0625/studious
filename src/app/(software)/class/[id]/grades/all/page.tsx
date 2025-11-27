"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { PageLayout, PageHeader } from "@/components/ui/page-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { 
  ArrowLeft,
  Search,
  Download,
  Edit,
  CheckCircle,
  X,
  Users
} from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import { trpc, type RouterOutputs } from "@/lib/trpc";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function AllStudentsGrades() {
  const t = useTranslations('studentGrades');
  const tCommon = useTranslations('common');
  const { id: classId } = useParams();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: classData, isLoading } = trpc.class.get.useQuery({ classId: classId as string });
  const students = classData?.class?.students ?? [];

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return students;
    return students.filter(s => s.username.toLowerCase().includes(term));
  }, [students, searchTerm]);

  // Students table columns
  const studentColumns: ColumnDef<RouterOutputs["class"]["get"]["class"]["students"][number]>[] = [
    {
      accessorKey: "username",
      header: t('table.student'),
      cell: ({ row }) => {
        const student = row.original;
        return (
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={student.profile?.profilePicture || ""} alt={student.username} />
              <AvatarFallback>
                {student.username.split(' ').map(n => n[0]).join('').toUpperCase() || student.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium">{student.username}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "actions",
      header: t('table.actions'),
      cell: ({ row }) => {
        const student = row.original;
        return (
          <div className="">
            <Link href={`/class/${classId}/grades/student/${student.id}`}>
              <Button size="sm" variant="outline">
                {t('actions.viewSubmission')}
              </Button>
            </Link>
          </div>
        );
      },
    },
  ];

  if (isLoading) {
    return (
      <PageLayout>
        <div className="space-y-4">
          <div className="h-8 w-60 bg-muted rounded" />
          <Card>
            <CardHeader>
              <div className="h-5 w-40 bg-muted rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-40 w-full bg-muted rounded" />
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageHeader title={t('title')} description={t('allStudents')}>
        <Button variant="outline" onClick={() => window.history.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {tCommon('back')}
        </Button>
      </PageHeader>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder={tCommon('search')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              {tCommon('export')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Students */}
      <Card>
        <CardHeader>
          <CardTitle>{t('students')}</CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <EmptyState
              icon={Users}
              title={searchTerm.trim() ? tCommon('noData') : t('noGrades')}
              description={
                searchTerm.trim() 
                  ? t('noGradesDescription')
                  : t('noGradesDescription')
              }
            />
          ) : (
            <DataTable
              columns={studentColumns}
              data={filtered}
              searchKey="username"
              searchPlaceholder={tCommon('search')}
            />
          )}
        </CardContent>
      </Card>
    </PageLayout>
  );
}