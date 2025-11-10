"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageLayout } from "@/components/ui/page-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  ArrowLeft,
  Save,
  Upload
} from "lucide-react";
import { format } from "date-fns";
import { trpc, type RouterOutputs, type RouterInputs } from "@/lib/trpc";
import { fixUploadUrl } from "@/lib/directUpload";
import type { 
  RubricGrade,
} from "@/lib/types/assignment";
import {  parseMarkScheme,
  parseGradingBoundary} from "@/lib/types/assignment";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "sonner";
import { DraggableFileItem } from "@/components/DraggableFileItem";
import { FileItem, FileHandlers } from "@/lib/types/file";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { FilePreviewModal } from "@/components/modals";
import {
  FileText,
  Image,
  FileVideo,
  Music,
  Archive,
  FileSpreadsheet,
  Presentation,
  File
} from "lucide-react";
import { RootState } from "@/store/store";
import { useSelector } from "react-redux";
import { baseFileHandler } from "@/lib/fileHandler";

type AssignmentUpdateSubmissionAsTeacherInput = RouterInputs['assignment']['updateSubmissionAsTeacher'];

type RubricCriterion = {
  id: string;
  title: string;
  description?: string;
  levels: Array<{
    id: string;
    name: string;
    points: number;
    color?: string;
    description?: string;
  }>;
};

// RubricGrade type is now imported from @/lib/types/assignment

function SubmissionDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Skeleton className="h-10 w-10" />
        <Skeleton className="h-8 w-64" />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-48 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function SubmissionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const appState = useSelector((state: RootState) => state.app);
  const classId = params.id as string;
  const assignmentId = params.assignmentId as string;
  const submissionId = params.submissionId as string;
  const isTeacher = appState.user.teacher;

  const [feedback, setFeedback] = useState("");
  const [grade, setGrade] = useState<number | undefined>(undefined);
  const [rubricGrades, setRubricGrades] = useState<RubricGrade[]>([]);

  // File upload state for annotations
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentUploadStatus, setCurrentUploadStatus] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);

  // File preview state
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Get signed URL mutation for file preview
  const getSignedUrlMutation = trpc.file.getSignedUrl.useMutation();

  // Get submission data
  const { data: submission, isLoading, refetch: refetchSubmission } = trpc.assignment.getSubmissionById.useQuery({
    assignmentId: assignmentId,
    classId: classId,
    submissionId: submissionId,
  });

  // Get assignment data for rubric info
  const { data: assignment } = trpc.assignment.get.useQuery({
    id: assignmentId,
    classId: classId,
  });

  // Update submission as teacher mutation
  const updateSubmissionMutation = trpc.assignment.updateSubmissionAsTeacher.useMutation({
    onSuccess: () => {
        toast.success("Grade saved");
      refetchSubmission();
    },
    onError: (error) => {
      toast.error(error.message || "There was a problem saving the grade. Please try again.");
    },
  });

  // Parse rubric criteria from assignment's mark scheme
  const [rubricCriteria, setRubricCriteria] = useState<RubricCriterion[]>([]);

  // Parse rubric data when assignment loads
  useEffect(() => {
    if (assignment?.markScheme?.structured) {
      const parsedMarkScheme = parseMarkScheme(assignment.markScheme.structured);
      console.log("Parsed mark scheme:", parsedMarkScheme);
      
      if (parsedMarkScheme?.criteria && parsedMarkScheme.criteria.length > 0) {
        console.log("Setting rubric criteria from assignment:", parsedMarkScheme.criteria.length, "criteria");
        setRubricCriteria(parsedMarkScheme.criteria);
      }
    }
  }, [assignment?.markScheme]);


  // Initialize form data from submission
  useEffect(() => {
    if (submission) {
      setFeedback((submission).teacherComments || "");
      
      // Parse rubric grades if they exist
      if (submission.rubricState) {
        try {
          const existingGrades = JSON.parse(submission.rubricState);
          if (Array.isArray(existingGrades) && existingGrades.length > 0) {
            // Check if existing grades are compatible with current rubric criteria
            const isCompatible = existingGrades.every(grade => 
              rubricCriteria.some(criterion => 
                criterion.id === grade.criteriaId &&
                criterion.levels.some(level => level.id === grade.selectedLevelId)
              )
            );

            if (isCompatible && existingGrades.length === rubricCriteria.length) {
              // Rubric state is compatible, use existing grades
              setRubricGrades(existingGrades);
            } else {
              // Rubric state is incompatible, reset and initialize new grades
              console.log("Rubric state incompatible with current criteria, resetting...");
              if (rubricCriteria.length > 0) {
                const initialGrades = rubricCriteria.map(criterion => ({
                  criteriaId: criterion.id,
                  selectedLevelId: '',
                  points: 0,
                  comments: ''
                }));
                setRubricGrades(initialGrades);
              } else {
                setGrade(submission.gradeReceived || undefined);
              }
            }
          } else {
            // Empty rubric state, initialize with default grades if rubric exists
            if (rubricCriteria.length > 0) {
              const initialGrades = rubricCriteria.map(criterion => ({
                criteriaId: criterion.id,
                selectedLevelId: '',
                points: 0,
                comments: ''
              }));
              setRubricGrades(initialGrades);
            } else {
              setGrade(submission.gradeReceived || undefined);
            }
          }
        } catch (error) {
          console.error("Error parsing rubric grades:", error);
          // Reset to manual grading on parse error
          setGrade(submission.gradeReceived || undefined);
          setRubricGrades([]);
        }
      } else {
        // No rubric state, check if we need to initialize rubric or use manual grade
        if (rubricCriteria.length > 0) {
          const initialGrades = rubricCriteria.map(criterion => ({
            criteriaId: criterion.id,
            selectedLevelId: '',
            points: 0,
            comments: ''
          }));
          setRubricGrades(initialGrades);
        } else {
          setGrade(submission.gradeReceived || undefined);
        }
      }
    }
  }, [submission, rubricCriteria]);

  // Calculate rubric totals
  const totalRubricPoints = rubricGrades.reduce((sum, grade) => sum + grade.points, 0);

  const maxRubricPoints = rubricCriteria.reduce((sum, criterion) => {
    const maxPoints = Math.max(...criterion.levels.map(level => level.points));
    return sum + maxPoints;
  }, 0);

  // Update grade when rubric grades change
  useEffect(() => {
    if (rubricGrades.length > 0) {
      // When rubric is being used, sync the grade field with rubric total
      setGrade(totalRubricPoints);
    }
  }, [rubricGrades, totalRubricPoints]);

  const handleSaveGrade = async () => {
    if (!submission) return;

    // Check if rubric has any data (either selected levels or comments)
    const hasRubricData = rubricGrades.length > 0 && rubricGrades.some(g => 
      g.selectedLevelId || (g.comments)
    );

    // Calculate final grade based on rubric or manual input
    const finalGrade = hasRubricData && rubricGrades.some(g => g.selectedLevelId)
      ? totalRubricPoints 
      : grade;

    const updateData: AssignmentUpdateSubmissionAsTeacherInput = {
      assignmentId,
      classId,
      submissionId,
      gradeReceived: finalGrade,
      feedback: feedback,
      rubricGrades: hasRubricData ? rubricGrades : [],
    };

    updateSubmissionMutation.mutate(updateData);
  };

  const handleReturnSubmission = async () => {
    if (!submission) return;

    const updateData: AssignmentUpdateSubmissionAsTeacherInput = {
      assignmentId,
      classId,
      submissionId,
      'return': true, // Toggle the returned status
    };

    updateSubmissionMutation.mutate(updateData);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string, size: "sm" | "lg" = "sm") => {
    const iconSize = size === "sm" ? "h-4 w-4" : "h-8 w-8";
    
    switch (fileType) {
      case "pdf":
        return <FileText className={`${iconSize} text-red-500`} />;
      case "docx":
        return <FileText className={`${iconSize} text-blue-500`} />;
      case "pptx":
        return <Presentation className={`${iconSize} text-orange-500`} />;
      case "xlsx":
        return <FileSpreadsheet className={`${iconSize} text-green-500`} />;
      case "mp4":
        return <FileVideo className={`${iconSize} text-purple-500`} />;
      case "mp3":
        return <Music className={`${iconSize} text-pink-500`} />;
      case "zip":
        return <Archive className={`${iconSize} text-gray-500`} />;
      case "jpg":
      case "png":
      case "gif":
        return <Image className={`${iconSize} text-emerald-500`} />;
      default:
        return <File className={`${iconSize} text-slate-500`} />;
    }
  };

  const convertAttachmentsToFileItems = (attachments: RouterOutputs['assignment']['getSubmission']['attachments']) => {
    return attachments.map(attachment => ({
      id: attachment.id,
      name: attachment.name,
      type: "file" as const,
      fileType: attachment.type.split('/')[1] || attachment.type,
      size: formatFileSize(attachment.size || 0),
      uploadedAt: attachment.uploadedAt || undefined,
    }));
  };

  // File handlers for submission files
  const fileHandlers: FileHandlers = {
    ...baseFileHandler,
    onFolderClick: () => {}, // Not used in assignment context
    onRename: async () => {
      // Not allowed in submission view
    },
    onDelete: async (item: FileItem) => {
      if (isTeacher) {
        // Handle annotation deletion for teachers
        updateSubmissionMutation.mutate({
          assignmentId,
          classId,
          submissionId,
          removedAttachments: [item.id],
        });
      }
    },
    onMove: async () => {
      // Not applicable for submission files
    },
    onPreview: (file: FileItem) => {
      setPreviewFile(file);
      setIsPreviewOpen(true);
    },
    onFileClick: (file: FileItem) => {
      setPreviewFile(file);
      setIsPreviewOpen(true);
    }
  };

  const handleFileClick = (file: FileItem) => {
    // Handle file click - open preview
    setPreviewFile(file);
    setIsPreviewOpen(true);
  };

  // Direct upload functions using proper TRPC hooks for annotations (teacher uploads)
  const getAnnotationUploadUrls = trpc.assignment.getAnnotationUploadUrls.useMutation();
  const confirmAnnotationUpload = trpc.assignment.confirmAnnotationUpload.useMutation();

  // Handle annotation file upload (teacher uploads feedback files to student submission)
  const handleAnnotationUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !submission) return;

    // Start upload progress tracking
    setIsUploading(true);
    setUploadProgress(0);
    setCurrentUploadStatus('Preparing annotation upload...');
    setTotalFiles(files.length);
    setUploadedFiles(0);

    try {
      // Use NEW direct upload approach for annotations
      const fileMetadata = Array.from(files).map(file => ({
        name: file.name,
        type: file.type,
        size: file.size
      }));

      // 1. Get upload URLs from backend using ANNOTATION endpoint
      setCurrentUploadStatus('Getting upload URLs...');
      setUploadProgress(10);

      const uploadResponse = await getAnnotationUploadUrls.mutateAsync({
        submissionId,
        classId,
        files: fileMetadata
      });

      setUploadProgress(20);

      // 2. Upload files through backend proxy
      const uploadPromises = Array.from(files).map(async (file, index) => {
        const uploadFile = uploadResponse.uploadFiles[index];
        
        // Update status for current file
        setCurrentUploadStatus(`Uploading annotation ${file.name}...`);
        const fileProgress = 20 + ((index / files.length) * 60); // 20-80% for uploads
        setUploadProgress(fileProgress);

        // Fix upload URL to use correct API base URL from environment
        const fixedUploadUrl = fixUploadUrl(uploadFile.uploadUrl);
        
        // Upload to backend proxy endpoint (resolves CORS issues)
        const response = await fetch(fixedUploadUrl, {
          method: 'POST', // Backend proxy uses POST
          body: file,
          headers: { 'Content-Type': file.type }
        });

        if (!response.ok) {
          throw new Error(`Upload failed for ${file.name}`);
        }

        // 3. Confirm upload to backend
        setCurrentUploadStatus(`Confirming ${file.name}...`);
        await confirmAnnotationUpload.mutateAsync({
          classId,
          fileId: uploadFile.id,
          uploadSuccess: true
        });

        // Update progress
        setUploadedFiles(index + 1);
        
        return uploadFile.id;
      });

      await Promise.all(uploadPromises);
      
      setUploadProgress(100);
      setCurrentUploadStatus('Upload complete!');
      toast.success('Annotations uploaded successfully');

      // Refresh submission to show new annotations
      refetchSubmission();

      // Clear the input
      event.target.value = '';

      // Reset progress after delay
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
        setCurrentUploadStatus('');
        setUploadedFiles(0);
        setTotalFiles(0);
      }, 1000);
    } catch (error) {
      toast.error(`Failed to upload files: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsUploading(false);
      setUploadProgress(0);
      setCurrentUploadStatus('');
    }
  };

  const getStatusBadge = () => {
    if (!submission) return null;

    if (submission.returned) {
      return <Badge variant="default">Returned</Badge>;
    }
    if (submission.submitted && (submission).late) {
      return <Badge variant="destructive">Late Submission</Badge>;
    }
    if (submission.submitted) {
      return <Badge variant="secondary">Submitted</Badge>;
    }
    return <Badge variant="outline">Not Submitted</Badge>;
  };

  const updateRubricGrade = (criteriaId: string, levelId: string, points: number, comments?: string) => {
    setRubricGrades(prev => {
      const existing = prev.find(g => g.criteriaId === criteriaId);
      if (existing) {
        return prev.map(g => 
          g.criteriaId === criteriaId 
            ? { ...g, selectedLevelId: levelId, points, comments: comments || "" }
            : g
        );
      } else {
        return [...prev, { criteriaId, selectedLevelId: levelId, points, comments: comments || "" }];
      }
    });
  };

  if (isLoading) {
    return (
      <PageLayout>
        <SubmissionDetailSkeleton />
      </PageLayout>
    );
  }

  if (!submission) {
    return (
      <PageLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <EmptyState
            icon={FileText}
            title="Submission not found"
            description="The submission you're looking for doesn't exist or has been removed."
          />
          <Button onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </PageLayout>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <PageLayout>
        <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{submission.assignment.title}</h1>
              <p className="text-muted-foreground">Submission by {submission.student.username}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {getStatusBadge()}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Submission Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Student Attachments */}
            <Card>
              <CardHeader>
                <CardTitle>Student Submission</CardTitle>
              </CardHeader>
              <CardContent>
                {submission.attachments.length > 0 ? (
                  <DndProvider backend={HTML5Backend}>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {convertAttachmentsToFileItems(submission.attachments).map((fileItem) => (
                        <DraggableFileItem
                          key={fileItem.id}
                          item={fileItem}
                          classId={classId}
                          readonly={true}
                          handlers={fileHandlers}
                          getFileIcon={getFileIcon}
                        />
                      ))}
                    </div>
                  </DndProvider>
                ) : (
                  <EmptyState
                    icon={FileText}
                    title="No files submitted"
                    description="The student hasn't submitted any files for this assignment."
                  />
                )}
              </CardContent>
            </Card>

            {/* Grade & Feedback - Teacher Only */}
            {isTeacher && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {rubricCriteria.length > 0 ? 'Rubric Grading & Feedback' : 'Grade & Feedback'}
                    {submission.returned && (
                      <Badge variant="secondary" className="ml-2">Returned - Read Only</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
              <CardContent className="space-y-6">
                {/* Rubric Grading Section */}
                {rubricCriteria.length > 0 && (
                  <div className="space-y-6">
                    <div className="text-sm font-medium text-muted-foreground">
                      Rubric Assessment ({rubricCriteria.length} criteria)
                    </div>
                    {rubricCriteria.map((criterion) => {
                      const grade = rubricGrades.find(g => g.criteriaId === criterion.id);
                      return (
                        <div key={criterion.id} className="space-y-4">
                          <div>
                            <h4 className="font-semibold">{criterion.title}</h4>
                            {criterion.description && (
                              <p className="text-sm text-muted-foreground">{criterion.description}</p>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                            {criterion.levels.map((level) => (
                              <button
                                key={level.id}
                                onClick={() => !submission.returned && updateRubricGrade(criterion.id, level.id, level.points)}
                                disabled={submission.returned || false}
                                className={`p-3 rounded-lg border text-left transition-all ${
                                  grade?.selectedLevelId === level.id
                                    ? 'border-primary bg-primary/10'
                                    : submission.returned 
                                      ? 'border-border bg-muted cursor-not-allowed opacity-60'
                                      : 'border-border hover:border-primary/50'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-medium text-sm">{level.name}</span>
                                  <span className="text-sm font-semibold">{level.points}pts</span>
                                </div>
                                {level.description && (
                                  <p className="text-xs text-muted-foreground">{level.description}</p>
                                )}
                              </button>
                            ))}
                          </div>
                          
                          {grade && (
                            <Textarea
                              placeholder={submission.returned ? "Comments (read-only)" : "Add comments for this criterion..."}
                              value={grade.comments}
                              onChange={(e) => !submission.returned && updateRubricGrade(
                                criterion.id, 
                                grade.selectedLevelId, 
                                grade.points, 
                                e.target.value
                              )}
                              readOnly={submission.returned || false}
                              rows={2}
                              className={submission.returned ? "bg-muted cursor-not-allowed" : ""}
                            />
                          )}
                          
                          <Separator />
                        </div>
                      );
                    })}
                    
                    {rubricGrades.length > 0 && (
                      <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                        <span className="font-semibold">Rubric Total</span>
                        <span className="text-lg font-bold">
                          {totalRubricPoints} / {maxRubricPoints} points
                        </span>
                      </div>
                    )}

                    {/* Grade Preview */}
                    {(rubricGrades.length > 0 || grade !== undefined) && (
                      <div className="p-6 bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/30 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <span className="text-lg font-bold text-primary">Final Grade Preview</span>
                            <p className="text-sm text-muted-foreground">What the student will see</p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-primary">
                              {rubricGrades.length > 0 ? totalRubricPoints : (grade || 0)} / {rubricGrades.length > 0 ? maxRubricPoints : (assignment?.maxGrade || submission.assignment?.maxGrade || 100)}
                            </div>
                            {assignment?.gradingBoundary && (rubricGrades.length > 0 || grade !== undefined) && (
                              <div className="text-sm font-medium text-primary/80">
                                {(() => {
                                  const finalGrade = rubricGrades.length > 0 ? totalRubricPoints : (grade || 0);
                                  const maxGrade = rubricGrades.length > 0 ? maxRubricPoints : (assignment?.maxGrade || submission.assignment?.maxGrade || 100);
                                  const percentage = (finalGrade / maxGrade) * 100;
                                  
                                  try {
                                    const parsedBoundary = parseGradingBoundary(assignment.gradingBoundary.structured);
                                    if (parsedBoundary?.boundaries) {
                                      const letterGrade = parsedBoundary.boundaries.find(b => 
                                        percentage >= b.minPercentage && percentage <= b.maxPercentage
                                      )?.grade || 'F';
                                      return `${percentage.toFixed(1)}% (${letterGrade})`;
                                    }
                                    return `${percentage.toFixed(1)}%`;
                                  } catch {
                                    return `${percentage.toFixed(1)}%`;
                                  }
                                })()}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    <Separator />
                  </div>
                )}

                {/* Traditional Grading Section - Only show when no rubric */}
                {rubricCriteria.length === 0 && (
                  <div className="space-y-4">
                    <div className="text-sm font-medium text-muted-foreground">Manual Grading</div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="grade">Grade</Label>
                        <Input
                          id="grade"
                          type="number"
                          value={grade || ""}
                          onChange={(e) => !submission.returned && setGrade(e.target.value ? parseInt(e.target.value) : undefined)}
                          placeholder={submission.returned ? "Grade (read-only)" : "Enter grade"}
                          max={submission.assignment.maxGrade ?? undefined}
                          min="0"
                          readOnly={submission.returned || false}
                          className={submission.returned ? "bg-muted cursor-not-allowed" : ""}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Max Points</Label>
                        <div className="flex items-center h-10 px-3 border rounded-md bg-muted">
                          {submission.assignment.maxGrade}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Feedback Section - Always show */}
                <div className="space-y-4">
                  {rubricCriteria.length > 0 && (
                    <div className="text-sm font-medium text-muted-foreground">Overall Feedback</div>
                  )}

                <div className="space-y-2">
                  <Label htmlFor="feedback">Feedback</Label>
                  <Textarea
                    id="feedback"
                    value={feedback}
                    onChange={(e) => !submission.returned && setFeedback(e.target.value)}
                    placeholder={submission.returned ? "Feedback (read-only)" : "Provide feedback for the student..."}
                    rows={4}
                    readOnly={submission.returned || false}
                    className={submission.returned ? "bg-muted cursor-not-allowed" : ""}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  {!submission.returned && (
                    <Button 
                      onClick={handleSaveGrade}
                      disabled={updateSubmissionMutation.isPending}
                      className="flex items-center space-x-2"
                    >
                      <Save className="h-4 w-4" />
                      <span>{updateSubmissionMutation.isPending ? "Saving..." : "Save Grade"}</span>
                    </Button>
                  )}
                  
                  <Button 
                    variant={submission.returned ? "default" : "outline"}
                    onClick={handleReturnSubmission}
                    disabled={updateSubmissionMutation.isPending}
                    className={submission.returned ? "bg-orange-600 hover:bg-orange-700" : ""}
                  >
                    {submission.returned ? "Unreturn Submission" : "Return to Student"}
                  </Button>
                  
                  {submission.returned && (
                    <div className="text-sm text-muted-foreground">
                      Grade and feedback have been returned to the student
                    </div>
                  )}
                </div>
                </div>
              </CardContent>
              </Card>
            )}

          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Student Info */}
            <Card>
              <CardHeader>
                <CardTitle>Student</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={submission.student?.profile?.profilePicture || ""} />
                    <AvatarFallback>
                      {submission.student.username.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{submission.student.username}</p>
                    <p className="text-sm text-muted-foreground">Student</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submission Details */}
            <Card>
              <CardHeader>
                <CardTitle>Submission Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status</span>
                  {getStatusBadge()}
                </div>
                
                {submission.submittedAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Submitted</span>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(submission.submittedAt), 'MMM d, yyyy \'at\' h:mm a')}
                    </span>
                  </div>
                )}
                
                {submission.assignment.dueDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Due Date</span>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(submission.assignment.dueDate), 'MMM d, yyyy \'at\' h:mm a')}
                    </span>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Files</span>
                  <span className="text-sm">{submission.attachments.length}</span>
                </div>
                
                {submission.gradeReceived !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Grade</span>
                    <span className="text-sm font-semibold">
                      {submission.gradeReceived} / {submission.assignment.maxGrade}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Teacher Annotations */}
            <Card>
              <CardHeader>
                <CardTitle>Annotations & Files</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {submission.annotations.length > 0 ? (
                  <DndProvider backend={HTML5Backend}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {convertAttachmentsToFileItems(submission.annotations).map((fileItem) => (
                        <DraggableFileItem
                          key={fileItem.id}
                          item={fileItem}
                          classId={classId}
                          readonly={false}
                          handlers={fileHandlers}
                          getFileIcon={getFileIcon}
                        />
                      ))}
                    </div>
                  </DndProvider>
                ) : (
                  <div className="text-center py-4">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm font-medium mb-1">No annotations</p>
                    <p className="text-xs text-muted-foreground mb-3">Upload files to provide additional feedback to the student.</p>
                  </div>
                )}

                {isTeacher && (
                  <div className="space-y-4">
                    {/* Upload Progress */}
                    {isUploading && (
                      <div className="space-y-2 p-4 bg-muted rounded-lg">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{currentUploadStatus}</span>
                          <span>{Math.round(uploadProgress)}%</span>
                        </div>
                        <Progress value={uploadProgress} className="h-2" />
                        {totalFiles > 0 && (
                          <p className="text-xs text-muted-foreground text-center">
                            {uploadedFiles} of {totalFiles} annotations uploaded
                          </p>
                        )}
                      </div>
                    )}

                    <Label htmlFor="annotation-upload" className="cursor-pointer">
                      <div className="flex items-center justify-center w-full p-4 border-2 border-dashed border-muted-foreground/25 rounded-lg hover:border-muted-foreground/50 transition-colors">
                        <div className="text-center">
                          <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm font-medium">{isUploading ? 'Uploading...' : 'Upload Annotations'}</p>
                          <p className="text-xs text-muted-foreground">Click to select files or drag and drop</p>
                        </div>
                      </div>
                    </Label>
                    <Input
                      id="annotation-upload"
                      type="file"
                      multiple
                      onChange={handleAnnotationUpload}
                      className="hidden"
                      accept="*/*"
                      disabled={isUploading}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        </div>

        {/* File Preview Modal */}
        <FilePreviewModal
          file={previewFile}
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          onAction={async (action: string, item: FileItem) => {
            switch (action) {
              case "download":
                await fileHandlers.onDownload(item);
                break;
              case "share":
                await fileHandlers.onShare(item);
                break;
              case "delete":
                await fileHandlers.onDelete(item);
                break;
              case "preview":
                fileHandlers.onPreview?.(item);
                break;
            }
          }}
          getPreviewUrl={async (fileId: string) => {
            const result = await getSignedUrlMutation.mutateAsync({ fileId });
            return result.url;
          }}
        />
      </PageLayout>
    </DndProvider>
  );
}
