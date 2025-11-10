"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageLayout } from "@/components/ui/page-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Calendar, 
  Edit, 
  FileText, 
  Users,
  CheckCircle,
  Upload,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { trpc, type RouterOutputs } from "@/lib/trpc";
import { fixUploadUrl } from "@/lib/directUpload";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { DataTable } from "@/components/ui/data-table";
import { toast } from "sonner";
import { DraggableFileItem } from "@/components/DraggableFileItem";
import { FileHandlers } from "@/lib/types/file";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { FilePreviewModal } from "@/components/modals";
import {
  Image,
  FileVideo,
  Music,
  Archive,
  FileSpreadsheet,
  Presentation,
  File
  } from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import type { 
  ParsedMarkScheme, 
  StoredRubricItem,
} from "@/lib/types/assignment";
import {  parseMarkScheme,
  parseGradingBoundary} from "@/lib/types/assignment";
import { baseFileHandler } from "@/lib/fileHandler";
import { Progress } from "@/components/ui/progress";

type Submissions = RouterOutputs['assignment']['getSubmissions'];
type Submission = Submissions[number];

type FileItem = {
  id: string;
  name: string;
  type: "file" | "folder";
  fileType?: string;
  size?: string;
  uploadedAt?: string;
};

function AssignmentDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-20" />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function AssignmentDetailPage() {
  const params = useParams();
  const router = useRouter();

  const appState = useSelector((state: RootState) => state.app);
  const classId = params.id as string;
  const assignmentId = params.assignmentId as string;
  const isTeacher = appState.user.teacher;
  const isStudent = !isTeacher; // If not a teacher, assume student role

  // Get assignment data
  const { data: assignment, isLoading: assignmentLoading } = trpc.assignment.get.useQuery({
    id: assignmentId,
    classId: classId,
  });

  // Get submissions data (for teachers)
  const { data: submissions, isLoading: submissionsLoading } = trpc.assignment.getSubmissions.useQuery({
    assignmentId: assignmentId,
    classId: classId,
  }, {
    enabled: isTeacher,
  });

  // Get student submission (for students)
  const { data: studentSubmission, isLoading: studentSubmissionLoading, refetch: refetchStudentSubmission } = trpc.assignment.getSubmission.useQuery({
    assignmentId: assignmentId,
    classId: classId,
  }, {
    enabled: isStudent,
  });

  // Student submission upload mutation
  const updateStudentSubmissionMutation = trpc.assignment.updateSubmission.useMutation({
    onSuccess: () => {
      toast.success("Submission updated");
      refetchStudentSubmission();
    },
    onError: (error) => {
      toast.error(error.message || "There was a problem updating your submission. Please try again.");
    },
  });

  // Direct upload functions using proper TRPC hooks
  const getSubmissionUploadUrls = trpc.assignment.getSubmissionUploadUrls.useMutation();
  const confirmSubmissionUpload = trpc.assignment.confirmSubmissionUpload.useMutation();

  const isLoading = assignmentLoading || submissionsLoading || studentSubmissionLoading;

  // Import toast for notifications

  // File preview state
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Progress tracking state for file uploads
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentUploadStatus, setCurrentUploadStatus] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);

  // Status messages for different upload stages
  const uploadStatusMessages = [
    "Preparing files for upload...",
    "Getting upload URLs from server...",
    "Uploading files to secure cloud storage...",
    "Processing uploaded files...",
    "Confirming uploads...",
    "Finalizing submission...",
    "Almost done..."
  ];

  // Get signed URL mutation for file preview
  const getSignedUrlMutation = trpc.file.getSignedUrl.useMutation();

  if (isLoading) {
    return (
      <PageLayout>
        <AssignmentDetailSkeleton />
      </PageLayout>
    );
  }

  if (!assignment) {
    return (
      <PageLayout>
        <EmptyState
          icon={FileText}
          title="Assignment not found"
          description="The assignment you're looking for doesn't exist or has been removed."
        />
      </PageLayout>
    );
  }

  const getStatusBadge = (submission: Submission) => {
    if (submission.returned) {
      return <Badge variant="default">Returned</Badge>;
    }
    if (submission.submitted && submission.late) {
      return <Badge variant="destructive">Late</Badge>;
    }
    if (submission.submitted) {
      return <Badge variant="secondary">Submitted</Badge>;
    }
    return <Badge variant="outline">Missing</Badge>;
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

  // File handlers for student submission attachments
  const fileHandlers: FileHandlers = {
    ...baseFileHandler,
    onFolderClick: () => {}, // Not used in assignment context
    onRename: async () => {
      // Not allowed in assignment view
    },
    onDelete: async (file: FileItem) => {
      if (!studentSubmission || studentSubmission.submitted) {
        toast.error("Cannot delete files from submitted assignments");
        return;
      }
      
      try {
        await updateStudentSubmissionMutation.mutateAsync({
          assignmentId,
          classId,
          submissionId: studentSubmission.id,
          removedAttachments: [file.id]
        });
        toast.success("File deleted successfully");
      } catch (error) {
        console.error('Failed to delete file:', error);
        toast.error("Failed to delete file");
      }
    },
    onMove: async () => {
      // Not applicable for attachments
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

  // Handle student submission file upload
  const handleStudentFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !studentSubmission) return;

    // Debug logging
    console.log('Upload parameters:', {
      assignmentId,
      classId,
      submissionId: studentSubmission?.id,
      filesCount: files.length
    });

    // Validate required parameters
    if (!classId || !assignmentId || !studentSubmission?.id) {
      toast.error("Missing required parameters for upload");
      return;
    }

    // Start upload progress tracking
    setIsUploading(true);
    setUploadProgress(0);
    setCurrentUploadStatus(uploadStatusMessages[0]);
    setTotalFiles(files.length);
    setUploadedFiles(0);

    try {
      // Use direct upload approach
      const fileMetadata = Array.from(files).map(file => ({
        name: file.name,
        type: file.type,
        size: file.size
      }));

      // 1. Get upload URLs from backend
      setCurrentUploadStatus(uploadStatusMessages[1]);
      setUploadProgress(20);
      
      const uploadResponse = await getSubmissionUploadUrls.mutateAsync({
        assignmentId,
        classId,
        submissionId: studentSubmission.id,
        files: fileMetadata
      });

      // Debug the response structure
      console.log('Upload response:', uploadResponse);
      console.log('Upload files array:', uploadResponse.uploadFiles);

      // 2. Upload files through backend proxy (not direct to GCS)
      setCurrentUploadStatus(uploadStatusMessages[2]);
      setUploadProgress(30);
      
      const uploadPromises = Array.from(files).map(async (file, index) => {
        const uploadFile = uploadResponse.uploadFiles[index];
        
        if (!uploadFile) {
          throw new Error(`No upload data for file ${file.name} at index ${index}`);
        }
        
        // Backend returns 'id' not 'fileId'
        console.log('Upload file object:', uploadFile);
        
        const { uploadUrl, id } = uploadFile;
        
        // Backend uses 'id' as the file identifier
        const actualFileId = id;
        
        if (!actualFileId || !uploadUrl) {
          throw new Error(`Missing fileId or uploadUrl for file ${file.name}: fileId=${actualFileId}, uploadUrl=${uploadUrl}, available props: ${Object.keys(uploadFile)}`);
        }
        
        // Update status for current file
        setCurrentUploadStatus(`Uploading ${file.name}...`);
        
        // Fix upload URL to use correct API base URL from environment
        const fixedUploadUrl = fixUploadUrl(uploadUrl);
        
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
        setCurrentUploadStatus(`Confirming upload for ${file.name}...`);
        await confirmSubmissionUpload.mutateAsync({
          fileId: actualFileId,
          uploadSuccess: true,
          classId: classId
        });
        
        // Update progress
        setUploadedFiles(prev => prev + 1);
        const fileProgress = 30 + ((index + 1) / files.length) * 50; // 30-80% for file uploads
        setUploadProgress(fileProgress);
        
        return {
          name: file.name,
          type: file.type,
          size: file.size,
          fileId: actualFileId
        };
      });
      // @todo: fix the `uploadStatusMessages` to remove redundant messages / steps      
      setCurrentUploadStatus(uploadStatusMessages[6]);
      setUploadProgress(100);

      // Refresh submission data to show new files
      refetchStudentSubmission();

      // Clear the input
      event.target.value = '';
      
      // Show success and reset after a delay
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
      setUploadedFiles(0);
      setTotalFiles(0);
    }
  };

  // Handle student submission toggle
  const handleSubmitToggle = () => {
    if (!studentSubmission) return;
    
    updateStudentSubmissionMutation.mutate({
      assignmentId,
      classId,
      submissionId: studentSubmission.id,
      submit: !studentSubmission.submitted,
    });
  };

  const submissionColumns = [
    {
      accessorKey: "student.username",
      header: "Student",
      cell: ({ row }: { row: { original: Submission } }) => (
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src="" alt="Student avatar" />
            <AvatarFallback>
              {row.original.student.username.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span>{row.original.student.username}</span>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: { row: { original: Submission } }) => getStatusBadge(row.original),
    },
    {
      accessorKey: "gradeReceived",
      header: "Grade",
      cell: ({ row }: { row: { original: Submission } }) => (
        <span>
          {row.original.gradeReceived !== undefined 
            ? `${row.original.gradeReceived}/${assignment.maxGrade}` 
            : '—'}
        </span>
      ),
    },
    {
      accessorKey: "attachments",
      header: "Files",
      cell: ({ row }: { row: { original: Submission } }) => (
        <span>{row.original.attachments.length}</span>
      ),
    },
  ];

  return (
    <DndProvider backend={HTML5Backend}>
      <PageLayout>
        <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{assignment.title}</h1>
            <div className="flex items-center space-x-4 mt-2 text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>
                  Due {assignment.dueDate 
                    ? format(new Date(assignment.dueDate), 'MMM d, yyyy \'at\' h:mm a')
                    : 'No due date'}
                </span>
              </div>
              {assignment.graded && (
                <div className="flex items-center space-x-1">
                  <CheckCircle className="h-4 w-4" />
                  <span>{assignment.maxGrade} points</span>
                </div>
              )}
            </div>
          </div>
          {appState.user.teacher && (
          <Button 
            onClick={() => router.push(`/class/${classId}/assignment/${assignmentId}/edit`)}
            className="flex items-center space-x-2"
          >
            <Edit className="h-4 w-4" />
            <span>Edit</span>
          </Button>
          )}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Instructions and Submissions/Student Work */}
          <div className="lg:col-span-2 space-y-6">
            {/* Instructions */}
            <Card>
              <CardHeader>
                <CardTitle>Instructions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-wrap">{assignment.instructions}</p>
                </div>
              </CardContent>
            </Card>

            {/* Teacher View - Submissions */}
            {isTeacher && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>Submissions</span>
                    <Badge variant="outline">
                      {submissions?.filter(s => s.submitted).length || 0} / {submissions?.length || 0}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {submissions && submissions.length > 0 ? (
                    <DataTable
                      columns={submissionColumns}
                      data={submissions}
                      onRowClick={(row) => 
                        router.push(`/class/${classId}/assignment/${assignmentId}/submission/${row.id}`)
                      }
                    />
                  ) : (
                    <EmptyState
                      icon={Users}
                      title="No submissions yet"
                      description="Students haven't submitted their work for this assignment."
                    />
                  )}
                </CardContent>
              </Card>
            )}

            {/* Student View - My Submission */}
            {isStudent && studentSubmission && (
              <Card>
                <CardHeader>
                  <CardTitle>My Submission</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Status</span>
                    <Badge variant={studentSubmission.submitted ? "default" : "outline"}>
                      {studentSubmission.submitted ? "Submitted" : "Not Submitted"}
                    </Badge>
                  </div>
                  
                  {studentSubmission.attachments.length > 0 ? (
                    <div className="space-y-3">
                      <span className="text-sm font-medium">Attached Files</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {convertAttachmentsToFileItems(studentSubmission.attachments).map((fileItem) => (
                          <DraggableFileItem
                            key={fileItem.id}
                            item={fileItem}
                            classId={classId}
                            readonly={studentSubmission.submitted || false}
                            handlers={fileHandlers}
                            getFileIcon={getFileIcon}
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <EmptyState
                      icon={FileText}
                      title="No files attached"
                      description="Upload files for your submission."
                    />
                  )}
                  
                  {!studentSubmission.submitted && (
                    <div className="space-y-3">
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
                              {uploadedFiles} of {totalFiles} files uploaded
                            </p>
                          )}
                        </div>
                      )}
                      <div>
                      <Label htmlFor="student-file-upload" className="cursor-pointer">
                        <div className="flex items-center justify-center w-full p-4 border-2 border-dashed border-muted-foreground/25 rounded-lg hover:border-muted-foreground/50 transition-colors">
                          <div className="text-center">
                            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm font-medium">{isUploading ? 'Uploading...' : 'Upload files'}</p>
                            <p className="text-xs text-muted-foreground">Click to select files or drag and drop</p>
                          </div>
                        </div>
                      </Label>
                      </div>
                      <Input
                        id="student-file-upload"
                        type="file"
                        multiple
                        onChange={handleStudentFileUpload}
                        className="hidden"
                        accept="*/*"
                        disabled={isUploading}
                      />
                    </div>
                  )}
                  
                  <div className="flex justify-end">
                    <Button
                      onClick={handleSubmitToggle}
                      disabled={updateStudentSubmissionMutation.isPending}
                      variant={studentSubmission.submitted ? "outline" : "default"}
                    >
                      {updateStudentSubmissionMutation.isPending 
                        ? "Updating..." 
                        : studentSubmission.submitted 
                          ? "Unsubmit" 
                          : "Submit Assignment"
                      }
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Student View - Feedback (when submission is returned) */}
            {isStudent && studentSubmission && studentSubmission.returned && (
              <Card>
                <CardHeader>
                  <CardTitle>Teacher Feedback</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Grade Display */}
                  {assignment.graded && studentSubmission.gradeReceived !== undefined && (
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Grade</span>
                        <span className="text-lg font-bold">
                          {studentSubmission.gradeReceived ?? 0} / {assignment.maxGrade}
                        </span>
                      </div>
                      {assignment.gradingBoundary && (
                        <div className="text-sm text-muted-foreground">
                          {(() => {
                            try {
                              const parsedBoundary = parseGradingBoundary(assignment.gradingBoundary.structured);
                              if (parsedBoundary?.boundaries) {
                                const percentage = ((studentSubmission.gradeReceived ?? 0) / (assignment.maxGrade ?? 1)) * 100;
                                const letterGrade = parsedBoundary.boundaries.find(b => 
                                  percentage >= b.minPercentage && percentage <= b.maxPercentage
                                )?.grade || 'F';
                                return `${percentage.toFixed(1)}% (${letterGrade})`;
                              }
                              return `${(((studentSubmission.gradeReceived ?? 0) / (assignment.maxGrade ?? 1)) * 100).toFixed(1)}%`;
                            } catch {
                              return `${(((studentSubmission.gradeReceived ?? 0) / (assignment.maxGrade ?? 1)) * 100).toFixed(1)}%`;
                            }
                          })()}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Rubric Feedback Display */}
                  {studentSubmission.rubricState?.trim() && (
                    <div className="space-y-4">
                      <div className="text-sm font-medium">Rubric Feedback</div>
                      {(() => {
                        try {
                          const rubricGrades = JSON.parse(studentSubmission.rubricState) as StoredRubricItem[];
                          // Get actual rubric criteria from assignment's mark scheme
                          let rubricCriteria: ParsedMarkScheme['criteria'] = [];
                          
                          if (assignment?.markScheme?.structured) {
                            const parsedMarkScheme = parseMarkScheme(assignment.markScheme.structured);
                            rubricCriteria = parsedMarkScheme?.criteria || [];
                          }
                          

                          return rubricCriteria.map((criterion) => {
                            const grade = rubricGrades.find((g) => g.criteriaId === criterion.id);

                            if (!grade) return null;

                            
                            const selectedLevel = criterion.levels.find(l => l.id === grade.selectedLevelId);
                            
                            return (
                              <div key={criterion.id} className="p-3 border rounded-lg">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex-1">
                                    <h4 className="font-medium">{criterion.title}</h4>
                                    {criterion.description && (
                                      <p className="text-sm text-muted-foreground">{criterion.description}</p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">{grade.points} pts</span>
                                    {selectedLevel && (
                                      <Badge 
                                        style={{
                                          backgroundColor: selectedLevel.color,
                                          color: 'white'
                                        }}
                                      >
                                        {selectedLevel.name}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                
                                {grade.comments && (
                                  <div className="mt-2 p-2 bg-muted rounded text-sm">
                                    <strong>Comments:</strong> {grade.comments}
                                  </div>
                                )}
                              </div>
                            );
                          });
                        } catch {
                          return <p className="text-sm text-muted-foreground">Error loading rubric feedback</p>;
                        }
                      })()}
                    </div>
                  )}

                  {/* General Feedback */}
                  {(studentSubmission).teacherComments && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Teacher Comments</div>
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm">{(studentSubmission).teacherComments}</p>
                      </div>
                    </div>
                  )}

                  {/* Annotations/Teacher Files */}
                  {studentSubmission.annotations && studentSubmission.annotations.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Teacher Annotations</div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {convertAttachmentsToFileItems(studentSubmission.annotations).map((fileItem) => (
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
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Assignment Details */}
            <Card>
              <CardHeader>
                <CardTitle>Assignment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Type</span>
                  <Badge variant="outline">{assignment.type}</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Graded</span>
                  <Badge variant={assignment.graded ? "default" : "secondary"}>
                    {assignment.graded ? "Yes" : "No"}
                  </Badge>
                </div>
                
                {assignment.graded && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Points</span>
                    <span className="text-sm">{assignment.maxGrade}</span>
                  </div>
                )}
                
                <Separator />
                
                <div className="space-y-2">
                  <span className="text-sm font-medium">Submission Status</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="text-lg font-semibold text-green-700 dark:text-green-400">
                        {submissions?.filter(s => s.submitted && !s.late).length || 0}
                      </div>
                      <div className="text-xs text-green-600 dark:text-green-500">On Time</div>
                    </div>
                    <div className="text-center p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <div className="text-lg font-semibold text-yellow-700 dark:text-yellow-400">
                        {submissions?.filter(s => s.submitted && s.late).length || 0}
                      </div>
                      <div className="text-xs text-yellow-600 dark:text-yellow-500">Late</div>
                    </div>
                    <div className="text-center p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <div className="text-lg font-semibold text-red-700 dark:text-red-400">
                        {submissions?.filter(s => !s.submitted).length || 0}
                      </div>
                      <div className="text-xs text-red-600 dark:text-red-500">Missing</div>
                    </div>
                    <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="text-lg font-semibold text-blue-700 dark:text-blue-400">
                        {submissions?.filter(s => s.returned).length || 0}
                      </div>
                      <div className="text-xs text-blue-600 dark:text-blue-500">Returned</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Attachments */}
            <Card>
              <CardHeader>
                <CardTitle>Attachments</CardTitle>
              </CardHeader>
              <CardContent>
                {assignment.attachments.length > 0 ? (
                  <DndProvider backend={HTML5Backend}>
                    <div className="grid grid-cols-3">
                      {convertAttachmentsToFileItems(assignment.attachments).map((fileItem) => (
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
                    title="No attachments"
                    description="No files have been attached to this assignment."
                  />
                )}
              </CardContent>
            </Card>
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
        </div>
      </PageLayout>
    </DndProvider>
  );
}
