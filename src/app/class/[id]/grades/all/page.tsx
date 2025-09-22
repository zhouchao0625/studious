"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { PageLayout, PageHeader } from "@/components/ui/page-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
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

export default function AllStudentsGrades() {
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
      header: "Student",
      cell: ({ row }) => {
        const student = row.original;
        return (
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${student.username}`} alt={student.username} />
            </Avatar>
            <span className="font-medium">{student.username}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const student = row.original;
        return (
          <div className="">
            <Link href={`/class/${classId}/grades/student/${student.id}`}>
              <Button size="sm" variant="outline">
                View Grades
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
      <PageHeader title="All Students Grades" description="View and manage grades for all students">
        <Button variant="outline" onClick={() => window.history.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </PageHeader>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search students..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Students */}
      <Card>
        <CardHeader>
          <CardTitle>Students</CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <EmptyState
              icon={Users}
              title={searchTerm.trim() ? "No students found" : "No students enrolled"}
              description={
                searchTerm.trim() 
                  ? "Try adjusting your search terms" 
                  : "Students will appear here once they join the class"
              }
            />
          ) : (
            <DataTable
              columns={studentColumns}
              data={filtered}
              searchKey="username"
              searchPlaceholder="Search students..."
            />
          )}
        </CardContent>
      </Card>
    </PageLayout>
  );
}