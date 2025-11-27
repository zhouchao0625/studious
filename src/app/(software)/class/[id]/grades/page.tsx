"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { PageLayout } from "@/components/ui/page-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GradingBoundariesModal, RubricModal } from "@/components/modals";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/ui/empty-state";
import { DataTable } from "@/components/ui/data-table";
import { Rubric } from "@/components/rubric";

import {
  BarChart3,
  Settings,
  FileText,
  Edit,
  Trash2,
  ClipboardCheck,
  ClipboardList,
  Eye,
  Edit3,
  Users,
  ExternalLink
} from "lucide-react";
import { trpc, type RouterOutputs } from "@/lib/trpc";
import { calculateTrend, getTrendIcon } from "@/lib/utils";

import type {
  MarkScheme,
  GradingBoundary,
  RubricCriteria,
  GradeBoundary,
} from "@/lib/types/rubric";
import type { ColumnDef } from "@tanstack/react-table";


export default function Grades() {
  const t = useTranslations('classGrades');
  const { id: classId } = useParams();
  const router = useRouter();
  const [gradingBoundariesOpen, setGradingBoundariesOpen] = useState(false);
  const [rubricModalOpen, setRubricModalOpen] = useState(false);
  const [editingGradingBoundary, setEditingGradingBoundary] = useState<GradingBoundary | null>(null);
  // Track edits for fields; if a field is undefined we fall back to original
  const [rowEdits, setRowEdits] = useState<Record<string, { maxGrade?: number; weight?: number; graded?: boolean }>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Preview states
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewMarkscheme, setPreviewMarkscheme] = useState<MarkScheme | null>(null);
  const [previewGradingBoundary, setPreviewGradingBoundary] = useState<GradingBoundary | null>(null);
  const [previewRubricCriteria, setPreviewRubricCriteria] = useState<RubricCriteria[]>([]);
  const [previewGradeBoundaries, setPreviewGradeBoundaries] = useState<GradeBoundary[]>([]);

  // Edit states
  const [editingRubric, setEditingRubric] = useState<MarkScheme | null>(null);

  const { data: classData, isLoading: classLoading, refetch } = trpc.class.get.useQuery({ classId: classId as string });
  const { data: markschemesData, isLoading: markschemesLoading, refetch: refetchMarkschemes } = trpc.class.listMarkSchemes.useQuery({ classId: classId as string });
  const { data: gradingBoundariesData, isLoading: gradingBoundariesLoading, refetch: refetchGrading } = trpc.class.listGradingBoundaries.useQuery({ classId: classId as string });
  const updateAssignment = trpc.assignment.update.useMutation();

  // Get grades for all students to calculate real averages
  const students = classData?.class?.students || [];
  const assignments = classData?.class?.assignments || [];
  const markschemes: MarkScheme[] = markschemesData ?? [];
  const gradingBoundaries: GradingBoundary[] = gradingBoundariesData ?? [];
  const submissionRate = assignments.length > 0 ? (classData?.class.assignments.reduce((sum, assignment) => sum + assignment.submissions.length, 0) || 0) / assignments.length : 0;
  // Get grades for each student
  const studentGradesQueries = students.map(student =>
    trpc.class.getGrades.useQuery({
      classId: classId as string,
      userId: student.id
    }, { enabled: !!student.id })
  );

  const deleteMarkscheme = trpc.class.deleteMarkScheme.useMutation({
    onSuccess: () => {
      refetchMarkschemes();
    },
  });
  const deleteGradingBoundary = trpc.class.deleteGradingBoundary.useMutation({
    onSuccess: () => {
      refetchGrading();
    },
  });

  // Preview handlers
  const handlePreviewMarkscheme = (markscheme: MarkScheme) => {
    try {
      console.log("Preview markscheme:", markscheme);
      const parsed = JSON.parse(markscheme.structured);
      console.log("Parsed markscheme:", parsed);
      let criteria = [];

      if (parsed.criteria) {
        criteria = parsed.criteria;
        console.log("Using criteria:", criteria);
      } else if (parsed.items) {
        // Convert old format to new format
        criteria = parsed.items.map((item: { id: string; title: string; description: string; criteria: string[]; maxPoints: number }, index: number) => ({
          id: item.id || `criteria-${index}`,
          title: item.title || `Criteria ${index + 1}`,
          description: item.description || "",
          levels: [
            { id: "excellent", name: "Excellent", description: item.criteria?.[0] || "Outstanding performance", points: item.maxPoints || 4, color: "#4CAF50" },
            { id: "good", name: "Good", description: item.criteria?.[1] || "Good performance", points: Math.floor((item.maxPoints || 4) * 0.75), color: "#8BC34A" },
            { id: "satisfactory", name: "Satisfactory", description: item.criteria?.[2] || "Adequate performance", points: Math.floor((item.maxPoints || 4) * 0.5), color: "#FFEB3B" },
            { id: "needs-improvement", name: "Needs Improvement", description: item.criteria?.[3] || "Below expectations", points: Math.floor((item.maxPoints || 4) * 0.25), color: "#FF9800" }
          ]
        }));
        console.log("Converted criteria:", criteria);
      }

      // Set both states together to avoid any intermediate state issues
      setPreviewRubricCriteria(criteria);
      setPreviewMarkscheme(markscheme);
      setPreviewGradingBoundary(null); // Clear grading boundary if showing rubric
      setPreviewModalOpen(true);
      console.log("Set preview states");
    } catch (error) {
      console.error("Error parsing markscheme:", error);
    }
  };

  const handlePreviewGradingBoundary = (gradingBoundary: GradingBoundary) => {
    try {
      const parsed = JSON.parse(gradingBoundary.structured);
      setPreviewGradeBoundaries(parsed.boundaries || []);
      setPreviewGradingBoundary(gradingBoundary);
      setPreviewMarkscheme(null); // Clear markscheme if showing grading boundary
      setPreviewModalOpen(true);
    } catch (error) {
      console.error("Error parsing grading boundary:", error);
    }
  };

  const closePreview = () => {
    setPreviewModalOpen(false);
    setPreviewMarkscheme(null);
    setPreviewGradingBoundary(null);
    setPreviewRubricCriteria([]);
    setPreviewGradeBoundaries([]);
  };

  const handleEditRubric = (markscheme: MarkScheme) => {
    setEditingRubric(markscheme);
    setRubricModalOpen(true);
  };

  const handleCreateNewRubric = () => {
    setEditingRubric(null);
    setRubricModalOpen(true);
  };

  // Remove duplicate declarations - these are already defined above

  const getGradeColor = (grade: number | null, status: string) => {
    if (!grade) {
      return status === "missing" ? "text-destructive font-semibold" : "text-warning font-medium";
    }
    if (grade >= 90) return "text-primary font-semibold";
    if (grade >= 80) return "text-accent font-medium";
    if (grade >= 70) return "text-foreground font-medium";
    return "text-destructive font-semibold";
  };

  // Calculate real class average from student grades
  const classAverage = useMemo(() => {
    if (!students.length || !assignments.length) return 0;

    let totalGrade = 0;
    let totalStudents = 0;

    studentGradesQueries.forEach((query, index) => {
      if (query.data?.grades) {
        const studentGrades = query.data.grades
          .filter(grade => grade.gradeReceived !== null)
          .map(grade => {
            const percentage = (grade.gradeReceived! / grade.assignment.maxGrade!) * 100;
            return percentage;
          });

        if (studentGrades.length > 0) {
          const studentAverage = studentGrades.reduce((sum, grade) => sum + grade, 0) / studentGrades.length;
          totalGrade += studentAverage;
          totalStudents++;
        }
      }
    });

    return totalStudents > 0 ? totalGrade / totalStudents : 0;
  }, [studentGradesQueries, students, assignments]);

  const getEffective = (id: string, field: "maxGrade" | "weight" | "graded", original: number | boolean) => {
    const edit = rowEdits[id];
    if (edit && edit[field] !== undefined) return edit[field] as number | boolean;
    return original;
  };

  const setEdit = (id: string, field: "maxGrade" | "weight" | "graded", value: number | boolean) => {
    setRowEdits(prev => ({ ...prev, [id]: { ...prev[id], [field]: value as number | boolean } }));
  };

  // Determine if there are modifications relative to originals
  const hasChanges = useMemo(() => {
    return assignments.some(a => {
      const e = rowEdits[a.id];
      if (!e) return false;
      const graded = e.graded ?? a.graded ?? false;
      const maxGrade = e.maxGrade ?? a.maxGrade ?? 0;
      const weight = e.weight ?? a.weight ?? 0;
      return graded !== (a.graded ?? false) || maxGrade !== (a.maxGrade ?? 0) || weight !== (a.weight ?? 0);
    });
  }, [assignments, rowEdits]);

  const saveAllChanges = async () => {
    setIsSaving(true);
    try {
      const updates = assignments
        .map(a => ({ a, e: rowEdits[a.id] }))
        .filter(({ a, e }) => e && (
          (e.graded ?? a.graded ?? false) !== (a.graded ?? false) ||
          (e.maxGrade ?? a.maxGrade ?? 0) !== (a.maxGrade ?? 0) ||
          (e.weight ?? a.weight ?? 0) !== (a.weight ?? 0)
        ))
        .map(({ a, e }) => updateAssignment.mutateAsync({
          classId: classId as string,
          id: a.id,
          graded: e!.graded ?? a.graded ?? false,
          maxGrade: e!.maxGrade ?? a.maxGrade ?? 0,
          weight: e!.weight ?? a.weight ?? 0
        }));

      await Promise.all(updates);
      await refetch();
      setRowEdits({});
    } finally {
      setIsSaving(false);
    }
  };

  // Assignment table columns
  const assignmentColumns: ColumnDef<RouterOutputs["assignment"]["get"]>[] = [
    {
      accessorKey: "title",
      header: t("columns.assignment"),
      cell: ({ row }) => {
        const assignment = row.original;
        const hasRubric = assignment.markScheme !== null;
        return (
          <div className="flex items-center gap-2">
            <div className="font-medium">
              {assignment.title}
            </div>
            {hasRubric && (
              <Badge variant="secondary" className="text-xs">
                {t("labels.rubric")}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "maxGrade",
      header: t("columns.maxPoints"),
      cell: ({ row }) => {
        const assignment = row.original;
        const hasRubric = assignment.markScheme !== null;
        const effectiveMax = Number(getEffective(assignment.id, "maxGrade", assignment.maxGrade ?? 0));
        const effectiveGraded = Boolean(getEffective(assignment.id, "graded", assignment.graded ?? false));
        
        if (hasRubric) {
          return (
            <div className="text-center text-muted-foreground">
              {assignment.maxGrade || "—"}
            </div>
          );
        }
        
        return (
          <Input
            type="number"
            value={effectiveMax}
            onChange={(e) => setEdit(assignment.id, "maxGrade", parseInt(e.target.value) || 0)}
            className="w-20 text-center border-0 bg-transparent hover:bg-muted/50 focus:bg-background focus:border-input"
            disabled={!effectiveGraded}
          />
        );
      },
    },
    {
      accessorKey: "weight",
      header: t("columns.weight"),
      cell: ({ row }) => {
        const assignment = row.original;
        const hasRubric = assignment.markScheme !== null;
        const effectiveWeight = Number(getEffective(assignment.id, "weight", assignment.weight ?? 0));
        const effectiveGraded = Boolean(getEffective(assignment.id, "graded", assignment.graded ?? false));
        
        if (hasRubric) {
          return (
            <div className="text-center text-muted-foreground">
              {assignment.weight || "—"}
            </div>
          );
        }
        
        return (
          <Input
            type="number"
            value={effectiveWeight}
            onChange={(e) => setEdit(assignment.id, "weight", parseFloat(e.target.value) || 0)}
            className="w-16 text-center border-0 bg-transparent hover:bg-muted/50 focus:bg-background focus:border-input"
            min="0"
            step="0.1"
            disabled={!effectiveGraded}
          />
        );
      },
    },
    {
      accessorKey: "graded",
      header: t("columns.graded"),
      cell: ({ row }) => {
        const assignment = row.original;
        const hasRubric = assignment.markScheme !== null;
        const effectiveGraded = Boolean(getEffective(assignment.id, "graded", assignment.graded ?? false));
        
        return (
          <div className="flex justify-center">
            <Switch
              checked={effectiveGraded}
              onCheckedChange={(checked) => setEdit(assignment.id, "graded", checked)}
              disabled={hasRubric}
            />
          </div>
        );
      },
    },
    {
      accessorKey: "dueDate",
      header: t("columns.dueDate"),
      cell: ({ row }) => {
        const assignment = row.original;
        return (
          <span className="text-sm text-muted-foreground">
            {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : '—'}
          </span>
        );
      },
    },
    {
      accessorKey: "actions",
      header: t("columns.actions"),
      cell: ({ row }) => {
        const assignment = row.original;
        const hasRubric = assignment.markScheme !== null;
        
        if (!hasRubric) {
          return <Button size="sm" variant="outline" onClick={() => ('@todo: this!')} className="h-8 px-3 text-xs">
            <ExternalLink className="h-3 w-3 mr-1" />
            {t("actions.edit")}
          </Button>;
        }
        
        return (
          <div className="flex justify-center">
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push(`/class/${classId}/assignment/${assignment.id}`)}
              className="h-8 px-3 text-xs"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              {t("actions.manage")}
            </Button>
          </div>
        );
      },
    },
  ];

  // Students table columns
  const studentColumns: ColumnDef<RouterOutputs["class"]["get"]["class"]["students"][number]>[] = [
    {
      accessorKey: "username",
      header: t("columns.student"),
      cell: ({ row }) => {
        const student = row.original;
        return (
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={student.profile?.profilePicture || ""} />
              <AvatarFallback>
                {student.username.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <span className="font-medium">{student.username}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "overallGrade",
      header: t("columns.overallGrade"),
      cell: ({ row }) => {
        const student = row.original;
        const index = students.findIndex(s => s.id === student.id);
        const studentGradesQuery = studentGradesQueries[index];
        const studentGrades = studentGradesQuery?.data?.grades || [];

        let overallGrade = 0;
        if (studentGrades.length > 0) {
          const validGrades = studentGrades.filter(grade => grade.gradeReceived !== null);
          if (validGrades.length > 0) {
            const totalPoints = validGrades.reduce((sum, grade) => sum + grade.gradeReceived!, 0);
            const maxPoints = validGrades.reduce((sum, grade) => sum + grade.assignment.maxGrade!, 0);
            overallGrade = maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0;
          }
        }

        return (
          <div className={`text-lg font-bold text-center ${getGradeColor(overallGrade, "graded")}`}>
            {overallGrade}%
          </div>
        );
      },
    },
    {
      accessorKey: "completedAssignments",
      header: t("columns.assignmentsCompleted"),
      cell: ({ row }) => {
        const student = row.original;
        const index = students.findIndex(s => s.id === student.id);
        const studentGradesQuery = studentGradesQueries[index];
        const studentGrades = studentGradesQuery?.data?.grades || [];

        const completedAssignments = studentGrades.filter(grade => grade.gradeReceived !== null).length;
        const totalAssignments = assignments.filter(assignment => assignment.graded).length;

        return (
          <div className="text-center">
            <span className="text-muted-foreground">
              {completedAssignments}/{totalAssignments}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "trend",
      header: t("columns.trend"),
      cell: ({ row }) => {
        const student = row.original;
        const index = students.findIndex(s => s.id === student.id);
        const studentGradesQuery = studentGradesQueries[index];
        const studentGrades = studentGradesQuery?.data?.grades || [];
        
        const trend = calculateTrend(studentGrades);
        
        return (
          <div className="flex justify-center">
            {getTrendIcon(trend)}
          </div>
        );
      },
    },
    {
      accessorKey: "actions",
      header: t("columns.actions"),
      cell: ({ row }) => {
        const student = row.original;
        return (
          <div className="flex justify-center">
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.location.href = `/class/${classId}/grades/student/${student.id}`}
            >
              {t("actions.viewGrades")}
            </Button>
          </div>
        );
      },
    },
  ];

  if (classLoading || markschemesLoading || gradingBoundariesLoading) {
    return (
      <PageLayout>
        <div className="space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <Card className="mb-6">
            <CardHeader>
              <div className="h-5 w-40 bg-muted rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-40 w-full bg-muted rounded" />
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

  return (
    <PageLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>

      </div>

      {/* Class Stats */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>{t("overview.title")}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{classAverage.toFixed(1)}%</div>
              <p className="text-sm text-muted-foreground">{t("overview.classAverage")}</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{students.length}</div>
              <p className="text-sm text-muted-foreground">{t("overview.totalStudents")}</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{assignments.length}</div>
              <p className="text-sm text-muted-foreground">{t("overview.assignments")}</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{submissionRate.toFixed(1)}%</div>
              <p className="text-sm text-muted-foreground">{t("overview.submissionRate")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assignment Management Table */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t("assignmentManagement.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title={t("assignmentManagement.empty.title")}
              description={t("assignmentManagement.empty.description")}
            />
          ) : (
            <>
              <DataTable
                columns={assignmentColumns}
                data={assignments}
                searchKey="title"
                searchPlaceholder={t("assignmentManagement.searchPlaceholder")}
              />
              {hasChanges && (
                <div className="mt-4 flex justify-end">
                  <Button onClick={saveAllChanges} disabled={isSaving}>
                    {isSaving ? t("actions.saving") : t("actions.saveChanges")}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t("students.title")}</CardTitle>
            <Button onClick={() => window.location.href = `/class/${classId}/grades/all`}>
              {t("students.viewAll")}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <EmptyState
              icon={Users}
              title={t("students.empty.title")}
              description={t("students.empty.description")}
            />
          ) : (
            <DataTable
              columns={studentColumns}
              data={students}
              searchKey="username"
              searchPlaceholder={t("students.searchPlaceholder")}
            />
          )}
        </CardContent>
      </Card>

      {/* Grade Boundaries Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t("gradeBoundaries.title")}</CardTitle>
            <Button size="sm" onClick={() => setGradingBoundariesOpen(true)}>
              <Settings className="h-4 w-4 mr-2" />
              {t("actions.manage")}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {gradingBoundaries.length === 0 ? (
              <EmptyState
                icon={ClipboardList}
                title={t("gradeBoundaries.empty.title")}
                description={t("gradeBoundaries.empty.description")}
              />
            ) : (
              gradingBoundaries.map((boundary) => {
                let name = t("gradeBoundaries.untitled");
                try {
                  const parsed = JSON.parse(boundary.structured);
                  name = parsed.name || name;
                } catch { }
                return (
                  <div key={boundary.id} className="flex flex-row justify-between items-center p-3 rounded-md hover:bg-background-muted dark:hover:bg-background-subtle transition-colors">
                    <div className="flex flex-row items-center space-x-4">
                      <ClipboardList className="w-5 h-5 text-primary-500" />
                      <span className="font-medium text-foreground cursor-pointer hover:text-primary-500 transition-colors" onClick={() => handlePreviewGradingBoundary(boundary)}>
                        {name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost" onClick={() => handlePreviewGradingBoundary(boundary)} title={t("actions.preview")}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => {
                        setEditingGradingBoundary(boundary);
                        setGradingBoundariesOpen(true);
                      }} title={t("actions.edit")}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => {
                        if (confirm(t("confirm.deleteGradingBoundary"))) {
                          deleteGradingBoundary.mutate({ classId: classId as string, gradingBoundaryId: boundary.id });
                        }
                      }} disabled={deleteGradingBoundary.isPending} title={t("actions.delete")}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Rubrics Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t("rubrics.title")}</CardTitle>
            <Button size="sm" onClick={handleCreateNewRubric}>
              <FileText className="h-4 w-4 mr-2" />
              {t("actions.createNew")}
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {markschemes.length === 0 ? (
              <EmptyState
                icon={ClipboardCheck}
                title={t("rubrics.empty.title")}
                description={t("rubrics.empty.description")}
              />
            ) : (
              markschemes.map((markscheme) => {
                let markschemeName = t("rubrics.untitled");
                try {
                  const parsed = JSON.parse(markscheme.structured);
                  markschemeName = parsed.name || markschemeName;
                } catch { }
                return (
                  <div key={markscheme.id} className="flex flex-row justify-between items-center p-3 rounded-md hover:bg-background-muted dark:hover:bg-background-subtle transition-colors">
                    <div className="flex flex-row items-center space-x-4">
                      <ClipboardCheck className="w-5 h-5 text-primary-500" />
                      <span className="font-medium text-foreground cursor-pointer hover:text-primary-500 transition-colors" onClick={() => handlePreviewMarkscheme(markscheme)}>
                        {markschemeName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost" onClick={() => handlePreviewMarkscheme(markscheme)} title={t("actions.preview")}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleEditRubric(markscheme)} title={t("actions.edit")}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => {
                        if (confirm(t("confirm.deleteRubric"))) {
                          deleteMarkscheme.mutate({ classId: classId as string, markSchemeId: markscheme.id });
                        }
                      }} disabled={deleteMarkscheme.isPending} title={t("actions.delete")}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Preview Modal */}
      <Dialog open={previewModalOpen} onOpenChange={setPreviewModalOpen}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>
              {previewMarkscheme ? (
                <>
                  {t("rubrics.previewTitle")}
                </>
              ) : (
                <>
                  {t("gradeBoundaries.previewTitle")}
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {previewMarkscheme && (
              <div className="flex-1 flex flex-col min-h-0">
                <ScrollArea className="flex-1 min-h-0">
                  <div className="space-y-4 pr-4">
                    {/* Rubric Details Card */}
                    <Card>
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base">{t("rubrics.details.title")}</CardTitle>
                          <Badge variant="outline" className="ml-auto">
                            {previewMarkscheme.structured ? (() => {
                              try {
                                const parsed = JSON.parse(previewMarkscheme.structured);
                                return parsed.category || t("rubrics.details.custom");
                              } catch {
                                return t("rubrics.details.custom");
                              }
                            })() : 'Custom'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">{t("rubrics.details.name")}</Label>
                            <div className="h-8 text-sm flex items-center">
                              {previewMarkscheme.structured ? (() => {
                                try {
                                  const parsed = JSON.parse(previewMarkscheme.structured);
                                  return parsed.name || t("rubrics.untitled");
                                } catch {
                                  return t("rubrics.untitled");
                                }
                              })() : 'Untitled Rubric'}
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs">{t("rubrics.details.category")}</Label>
                            <div className="h-8 text-sm flex items-center">
                              {previewMarkscheme.structured ? (() => {
                                try {
                                  const parsed = JSON.parse(previewMarkscheme.structured);
                                  return parsed.category || t("rubrics.details.custom");
                                } catch {
                                  return t("rubrics.details.custom");
                                }
                              })() : 'Custom'}
                            </div>
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs">{t("rubrics.details.description")}</Label>
                          <div className="text-sm text-muted-foreground">
                            {previewMarkscheme.structured ? (() => {
                              try {
                                const parsed = JSON.parse(previewMarkscheme.structured);
                                return parsed.description || t("rubrics.details.noDescription");
                              } catch {
                                return t("rubrics.details.noDescription");
                              }
                            })() : 'No description provided'}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Rubric Component */}
                    {previewRubricCriteria.length > 0 ? (
                      <Rubric criteria={previewRubricCriteria} onChange={() => { }} />
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>{t("rubrics.details.noCriteria")}</p>
                        <p className="text-sm mt-2">Debug: {JSON.stringify(previewRubricCriteria)}</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            )}

            {previewGradingBoundary && (
              <div className="flex-1 flex flex-col min-h-0">
                <ScrollArea className="flex-1 min-h-0">
                  <div className="space-y-4 pr-4">
                    {/* Grading Boundary Details Card */}
                    <Card>
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base">{t("gradeBoundaries.details.title")}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <Label className="text-xs">{t("gradeBoundaries.details.name")}</Label>
                          <div className="h-8 text-sm flex items-center">
                            {previewGradingBoundary.structured ? (() => {
                              try {
                                const parsed = JSON.parse(previewGradingBoundary.structured);
                                return parsed.name || t("gradeBoundaries.untitled");
                              } catch {
                                return t("gradeBoundaries.untitled");
                              }
                            })() : 'Untitled Grading Boundary'}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Grading Boundaries List */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">{t("gradeBoundaries.title")}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {previewGradeBoundaries.map((boundary, index) => (
                          <div key={boundary.id || index} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold"
                                style={{ backgroundColor: boundary.color || '#6B7280' }}
                              >
                                {boundary.grade?.charAt(0) || 'G'}
                              </div>
                              <div>
                                <span className="font-medium">{boundary.grade || 'Grade'}</span>
                                <p className="text-sm text-muted-foreground">{boundary.description || 'No description'}</p>
                              </div>
                            </div>
                            <Badge variant="outline">
                              {boundary.minPercentage || 0}% - {boundary.maxPercentage || 100}%
                            </Badge>
                          </div>
                        ))}
                        {previewGradeBoundaries.length === 0 && (
                          <p className="text-muted-foreground text-center py-4">{t("gradeBoundaries.details.noneDefined")}</p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <GradingBoundariesModal
        open={gradingBoundariesOpen}
        onOpenChange={(o) => { setGradingBoundariesOpen(o); if (!o) { refetchGrading(); setEditingGradingBoundary(null); } }}
        classId={classId as string}
        existingGradingBoundary={editingGradingBoundary as GradingBoundary}
      />

      <RubricModal
        open={rubricModalOpen}
        onOpenChange={(o) => { setRubricModalOpen(o); if (!o) { refetchMarkschemes(); setEditingRubric(null); } }}
        classId={classId as string}
        existingRubric={editingRubric as MarkScheme}
      />
    </PageLayout>
  );
}