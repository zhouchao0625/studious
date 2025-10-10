"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageLayout, PageHeader } from "@/components/ui/page-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { DataTable } from "@/components/ui/data-table";
import { 
  ArrowLeft,
  Download,
  Edit,
  CheckCircle,
  X,
  TrendingUp,
  TrendingDown,
  Minus,
  ClipboardList,
  ExternalLink
} from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { RouterOutputs, trpc } from "@/lib/trpc";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";

export default function StudentGrades() {
  const params = useParams();
  const router = useRouter();
  const classId = params.id as string;
  const studentId = params.studentId as string;
  const [editingGrades, setEditingGrades] = useState<{[key: string]: string}>({});
  
  const appState = useSelector((state: RootState) => state.app);
  const isStudent = appState.user.student;
  
  const { data: classData, isLoading: classLoading } = trpc.class.get.useQuery({ classId });
  const { data: studentGrades, isLoading: gradesLoading, refetch } = trpc.class.getGrades.useQuery({ classId, userId: studentId });
  const updateGrade = trpc.class.updateGrade.useMutation({ onSuccess: () => refetch() });

  const student = classData?.class?.students.find(s => s.id === studentId);
  const grades = studentGrades?.grades ?? [];

  // Grade table columns
  const gradeColumns: ColumnDef<RouterOutputs["class"]["getGrades"]["grades"][number]>[] = [
    {
      accessorKey: "assignment.title",
      header: "Assignment",
      cell: ({ row }) => {
        const grade = row.original;
        return (
          <div className="font-medium">
            {grade.assignment.title}
          </div>
        );
      },
    },
    {
      accessorKey: "grade",
      header: "Grade",
      cell: ({ row }) => {
        const grade = row.original;
        const hasRubric = grade.assignment.markScheme !== null;
        const isEditing = !isStudent && !hasRubric && editingGrades[grade.assignment.id] !== undefined;
        
        // Read-only view for students
        if (isStudent) {
          return (
            <div className="text-center">
              {grade.gradeReceived ? (
                <div className={`font-medium ${getGradeColor(grade.gradeReceived, "graded")}`}>
                  {grade.gradeReceived}
                </div>
              ) : (
                <span className="text-muted-foreground">-</span>
              )}
            </div>
          );
        }
        
        // If assignment has a rubric, show grade with button to open assignment
        if (hasRubric) {
          return (
            <div className="flex items-center justify-center space-x-2">
              <div className="text-center">
                {grade.gradeReceived ? (
                  <div className={`font-medium ${getGradeColor(grade.gradeReceived, "graded")}`}>
                    {grade.gradeReceived}
                  </div>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => router.push(`/class/${classId}/assignment/${grade.assignment.id}`)}
                className="h-6 px-2 text-xs"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Grade
              </Button>
            </div>
          );
        }
        
        // Editable view for teachers (no rubric)
        if (isEditing) {
          return (
            <div className="flex items-center justify-center space-x-1">
              <Input
                type="number"
                value={editingGrades[grade.assignment.id]}
                onChange={(e) => handleGradeChange(grade.assignment.id, e.target.value)}
                className="w-16 text-center"
                max={grade.assignment.maxGrade || undefined}
                min={0}
                autoFocus
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => saveGrade(grade.assignment.id, grade.id)}
                disabled={updateGrade.isPending}
              >
                <CheckCircle className="h-4 w-4 text-green-600" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => cancelEditing(grade.assignment.id)}
              >
                <X className="h-4 w-4 text-red-600" />
              </Button>
            </div>
          );
        }

        return (
          <div className="group relative">
            {grade.gradeReceived ? (
              <div 
                className="cursor-pointer hover:bg-muted/50 p-1 rounded border border-transparent hover:border-border" 
                onClick={() => startEditing(grade.assignment.id, grade.gradeReceived?.toString() || '')}
              >
                <div className={`font-medium ${getGradeColor(grade.gradeReceived, "graded")}`}>
                  {grade.gradeReceived}
                </div>
                <Edit className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity absolute -top-1 -right-1" />
              </div>
            ) : (
              <div 
                className="cursor-pointer hover:bg-muted/50 p-1 rounded border border-transparent hover:border-border" 
                onClick={() => startEditing(grade.assignment.id, '')}
              >
                <span className="text-muted-foreground">-</span>
                <Edit className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity absolute -top-1 -right-1" />
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "assignment.maxGrade",
      header: "Total",
      cell: ({ row }) => {
        const grade = row.original;
        return (
          <div className="text-center text-muted-foreground">
            {grade.assignment.maxGrade || "—"}
          </div>
        );
      },
    },
    {
      accessorKey: "percentage",
      header: "%",
      cell: ({ row }) => {
        const grade = row.original;
        const percentage = grade.gradeReceived ? 
          (grade.gradeReceived / (grade.assignment.maxGrade || 1) * 100).toFixed(1) : null;
        
        return (
          <div className="text-center">
            {percentage ? `${percentage}%` : (
              <span className="text-muted-foreground">-</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const grade = row.original;
        return (
          <div className="flex justify-center">
            <Badge variant={
              grade.gradeReceived !== null ? "default" : "secondary"
            }>
              {grade.gradeReceived !== null ? "Graded" : "Pending"}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: "submitted",
      header: "Submitted",
      cell: ({ row }) => {
        const grade = row.original;
        return (
          <div className="text-center">
            <span className="text-sm text-muted-foreground">
              {grade.submittedAt ? new Date(grade.submittedAt).toLocaleDateString() : '—'}
            </span>
          </div>
        );
      },
    },
  ];

  if (classLoading || gradesLoading) {
    return (
      <PageLayout>
        <div className="space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 bg-muted rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-6 w-64 bg-muted rounded" />
                  <div className="h-4 w-48 bg-muted rounded" />
                </div>
              </div>
            </CardContent>
          </Card>
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

  if (!student) {
    return (
      <PageLayout>
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold text-muted-foreground">Student not found</h2>
          <Button 
            className="mt-4"
            onClick={() => window.history.back()}
          >
            Go Back
          </Button>
        </div>
      </PageLayout>
    );
  }

  const startEditing = (assignmentId: string, currentValue: string) => {
    setEditingGrades(prev => ({
      ...prev,
      [assignmentId]: currentValue
    }));
  };

  const handleGradeChange = (assignmentId: string, value: string) => {
    setEditingGrades(prev => ({
      ...prev,
      [assignmentId]: value
    }));
  };

  const saveGrade = async (assignmentId: string, submissionId: string) => {
    const editedValue = editingGrades[assignmentId];
    if (editedValue !== undefined) {
      await updateGrade.mutateAsync({
        classId,
        assignmentId,
        submissionId,
        gradeReceived: editedValue === "" ? null : Number(editedValue)
      });
      setEditingGrades(prev => {
        const newState = { ...prev };
        delete newState[assignmentId];
        return newState;
      });
    }
  };

  const cancelEditing = (assignmentId: string) => {
    setEditingGrades(prev => {
      const newState = { ...prev };
      delete newState[assignmentId];
      return newState;
    });
  };

  const getGradeColor = (grade: number | null, status: string) => {
    if (!grade) {
      return status === "missing" ? "text-destructive font-semibold" : "text-warning font-medium";
    }
    if (grade >= 90) return "text-green-600 font-semibold";
    if (grade >= 80) return "text-blue-600 font-medium";
    if (grade >= 70) return "text-yellow-600 font-medium";
    return "text-red-600 font-semibold";
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up": return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "down": return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  // Calculate overall grade
  let totalWeighted = 0;
  let totalWeight = 0;
  for (const g of grades) {
    if (g.gradeReceived != null && g.assignment.maxGrade && g.assignment.weight) {
      totalWeighted += (g.gradeReceived / g.assignment.maxGrade) * g.assignment.weight;
      totalWeight += g.assignment.weight;
    }
  }
  const overallGrade = totalWeight > 0 ? (totalWeighted / totalWeight) * 100 : 0;
  const completedAssignments = grades.filter(g => g.gradeReceived != null).length;
  const totalAssignments = grades.length;

  return (
    <PageLayout>
      <PageHeader 
        title={isStudent ? "My Grades" : `${student.username} - Grades`}
        description={isStudent ? "View your grades and progress" : "Individual student grade management"}
      >
        <div className="flex items-center space-x-2">
          {!isStudent && (
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          )}
          <Button 
            variant="outline" 
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
      </PageHeader>

      {/* Student Info */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${student.username}`} alt={student.username} />
            </Avatar>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">
                {isStudent ? "Your Performance" : student.username}
              </h2>
              {isStudent && (
                <p className="text-muted-foreground">Track your academic progress</p>
              )}
            </div>
            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <div className={`text-2xl font-bold ${getGradeColor(overallGrade, "graded")}`}>
                  {overallGrade.toFixed(1)}%
                </div>
                <p className="text-sm text-muted-foreground">Overall Grade</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">
                  {completedAssignments}/{totalAssignments}
                </div>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
              <div>
                <div className="flex items-center justify-center">
                  {getTrendIcon("up")}
                </div>
                <p className="text-sm text-muted-foreground">Trend</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assignments Table */}
      <Card>
        <CardHeader>
          <CardTitle>{isStudent ? "Your Grades" : "Assignments"}</CardTitle>
        </CardHeader>
        <CardContent>
          {grades.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="No assignments found"
              description="This student has no assignments to display"
            />
          ) : (
            <DataTable
              columns={gradeColumns}
              data={grades}
              searchKey="assignment.title"
              searchPlaceholder="Search assignments..."
            />
          )}
        </CardContent>
      </Card>
    </PageLayout>
  );
}
