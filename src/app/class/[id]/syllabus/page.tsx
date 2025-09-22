"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams } from "next/navigation";
import { PageLayout } from "@/components/ui/page-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Save, 
  Edit, 
  FileText,
  Download,
  BookOpen,
  Target,
  Calendar,
  GraduationCap,
  CheckCircle,
  AlertCircle,
  Clock,
  BarChart3,
  TrendingUp,
  X,
  School,
  ClipboardCheck,
  ClipboardList
} from "lucide-react";
import { 
  trpc, 
} from "@/lib/trpc";
import { RouterOutputs } from "@/lib/trpc";
import { GradingBoundary, RubricCriteria } from "@/lib/types/rubric";

// Types
type Assignment = {
  id: string;
  title: string;
  type: string;
  dueDate: string;
  maxGrade: number;
  weight: number;
  graded: boolean;
};

// Skeleton components
const StatisticsCardSkeleton = () => (
  <Card className="p-4">
    <div className="flex items-center justify-between">
      <div>
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-8 w-12" />
      </div>
      <Skeleton className="h-10 w-10 rounded-full" />
    </div>
  </Card>
);

const SyllabusPageSkeleton = () => (
  <div className="flex flex-col space-y-6">
    {/* Header skeleton */}
    <div className="flex items-center justify-between">
      <div>
        <Skeleton className="h-6 w-32 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-10 w-32" />
    </div>

    {/* Statistics Cards skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      <StatisticsCardSkeleton />
      <StatisticsCardSkeleton />
      <StatisticsCardSkeleton />
      <StatisticsCardSkeleton />
    </div>

    {/* Course Overview skeleton */}
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-40" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </CardContent>
    </Card>
  </div>
);

export default function Syllabus() {
  const params = useParams();
  const classId = params.id as string;
  
  const [isEditing, setIsEditing] = useState(false);
  const [syllabusContent, setSyllabusContent] = useState("");
  const [originalContent, setOriginalContent] = useState("");

  // API queries
  const { data: syllabusData, isLoading: syllabusLoading, error: syllabusError } = trpc.class.getSyllabus.useQuery({ classId: classId });
  const { data: classData, isLoading: classLoading } = trpc.class.get.useQuery({ classId: classId });
  const { data: gradingBoundaries } = trpc.class.listGradingBoundaries.useQuery({ classId: classId });
  const { data: markSchemes } = trpc.class.listMarkSchemes.useQuery({ classId: classId });
  
  // Mutations
  const updateSyllabusMutation = trpc.class.updateSyllabus.useMutation();

  // Initialize syllabus content
  useEffect(() => {
    if (syllabusData?.syllabus) {
      setSyllabusContent(syllabusData.syllabus);
      setOriginalContent(syllabusData.syllabus);
    }
  }, [syllabusData]);

  const handleEdit = () => {
    setOriginalContent(syllabusContent);
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      await updateSyllabusMutation.mutateAsync({
        classId,
        contents: syllabusContent
      });
    setIsEditing(false);
    } catch (error) {
      console.error('Failed to update syllabus:', error);
    }
  };

  const handleCancel = () => {
    setSyllabusContent(originalContent);
    setIsEditing(false);
  };

  // Loading state
  if (syllabusLoading || classLoading) {
    return (
      <PageLayout>
        <SyllabusPageSkeleton />
      </PageLayout>
    );
  }

  // Error state
  if (syllabusError || !classData?.class) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Failed to load syllabus</h3>
            <p className="text-muted-foreground">Please try again later.</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  const assignments: Assignment[] = (classData.class.assignments || []).map((a: RouterOutputs["class"]["get"]['class']['assignments'][number]) => ({
    id: a.id,
    title: a.title,
    type: a.type || 'OTHER',
    dueDate: a.dueDate,
    maxGrade: a.maxGrade || 0,
    weight: a.weight || 0,
    graded: a.graded
  }));

  // Calculate statistics
  const totalPoints = assignments.reduce((sum, a) => sum + (a.maxGrade || 0), 0);
  const completionRate = assignments.length > 0 ? Math.round((assignments.filter(a => a.graded).length / assignments.length) * 100) : 0;
  const upcomingAssignments = assignments.filter(a => a.dueDate && new Date(a.dueDate) > new Date()).length;

  return (
    <PageLayout>
      <div className="flex flex-col space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
        <div>
            <h1 className="font-semibold text-xl">Syllabus</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {classData.class.name} • Course overview and academic information
            </p>
        </div>
          <div className="flex items-center space-x-3">
            {isEditing ? (
              <>
                <Button
                  onClick={handleSave}
                  className="flex items-center space-x-2"
                  disabled={updateSyllabusMutation.isPending}
                >
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
              </Button>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  className="flex items-center space-x-2"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
              </Button>
            </>
            ) : (
              <Button
                onClick={handleEdit}
                className="flex items-center space-x-2"
              >
                <Edit className="w-4 h-4" />
                <span>Edit Syllabus</span>
              </Button>
          )}
        </div>
      </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Assignments</p>
                <p className="text-2xl font-bold mt-1">{assignments.length}</p>
              </div>
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-primary" />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completion Rate</p>
                <p className="text-2xl font-bold mt-1">{completionRate}%</p>
              </div>
              <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-green-500" />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Points</p>
                <p className="text-2xl font-bold mt-1">{totalPoints}</p>
              </div>
              <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-500" />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Upcoming</p>
                <p className="text-2xl font-bold mt-1">{upcomingAssignments}</p>
              </div>
              <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-orange-500" />
              </div>
            </div>
          </Card>
        </div>

        {/* Course Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Course Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="space-y-4">
            <Textarea
                  value={syllabusContent}
                  onChange={(e) => setSyllabusContent(e.target.value)}
                  placeholder="Enter course overview, objectives, and other important information..."
                  className="min-h-[300px]"
                />
                <p className="text-sm text-muted-foreground">
                  Enter your course information, learning objectives, policies, and other important details.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  {syllabusContent ? (
                    <div className="whitespace-pre-wrap text-muted-foreground">
                      {syllabusContent}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No syllabus content yet</p>
                      <p className="text-sm">Click 'Edit Syllabus' to add course information, learning objectives, policies, and more.</p>
                    </div>
                  )}
                </div>

                {/* Course Assignments Table */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Course Assignments</h3>
                    {assignments.length > 0 && (
                      <div className="flex items-center space-x-4">
                        <div className="text-sm text-muted-foreground">
                          {assignments.filter(a => a.graded).length} of {assignments.length} graded
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {totalPoints} total points
                        </div>
                      </div>
                    )}
                  </div>

                  {assignments.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Assignment</TableHead>
                          <TableHead>Due Date</TableHead>
                          <TableHead className="text-right">Points</TableHead>
                          <TableHead>Weight</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {assignments
                          .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                          .map((assignment) => (
                          <TableRow key={assignment.id}>
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                                  <Target className="w-4 h-4 text-primary" />
                                </div>
                                <div>
                                  <span className="font-medium block">
                                    {assignment.title}
                                  </span>
                                  <span className="text-xs text-muted-foreground capitalize">
                                    {assignment.type.toLowerCase().replace('_', ' ')}
                                  </span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">
                                  {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  }) : 'No due date'}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="font-semibold">
                                {assignment.maxGrade ? `${assignment.maxGrade}` : '—'}
                              </span>
                              {assignment.maxGrade && <span className="text-xs text-muted-foreground ml-1">pts</span>}
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-muted-foreground font-medium">
                                {assignment.weight ? `${assignment.weight}%` : '—'}
                              </span>
                            </TableCell>
                            <TableCell>
                              {assignment.graded ? (
                                <Badge variant="default" className="bg-green-500/10 text-green-700 hover:bg-green-500/20">
                                  Graded
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-700 hover:bg-yellow-500/20">
                                  Pending
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No assignments yet</p>
                      <p className="text-sm">Assignments will appear here once they're created.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            </CardContent>
          </Card>

        {/* Course Information */}
          <Card>
            <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <School className="h-5 w-5" />
              Course Information
            </CardTitle>
            </CardHeader>
            <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-md font-medium border-b border-border pb-2">
                  Basic Information
                </h3>
              <div className="space-y-3">
                  <div className="bg-muted p-3 rounded-lg">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Class Name</label>
                    <p className="font-medium mt-1">{classData.class.name}</p>
                  </div>
                  <div className="bg-muted p-3 rounded-lg">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Section</label>
                    <p className="mt-1">{classData.class.section || 'Not specified'}</p>
                  </div>
                  <div className="bg-muted p-3 rounded-lg">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Subject</label>
                    <p className="mt-1">{classData.class.subject || 'Not specified'}</p>
                  </div>
                </div>
              </div>

              {/* Statistics */}
              <div className="space-y-4">
                <h3 className="text-md font-medium border-b border-border pb-2">
                  Course Statistics
                </h3>
                <div className="space-y-3">
                  <div className="bg-muted p-3 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Assignments</label>
                        <p className="text-xl font-bold mt-1">{assignments.length}</p>
                      </div>
                      <Target className="w-6 h-6 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="bg-muted p-3 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Graded Assignments</label>
                        <p className="text-xl font-bold mt-1">{assignments.filter(a => a.graded).length}</p>
                      </div>
                      <CheckCircle className="w-6 h-6 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="bg-muted p-3 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Points</label>
                        <p className="text-xl font-bold mt-1">{totalPoints}</p>
                      </div>
                      <TrendingUp className="w-6 h-6 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            </CardContent>
          </Card>
        </div>
    </PageLayout>
  );
}