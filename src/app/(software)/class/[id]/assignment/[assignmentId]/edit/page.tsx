"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageLayout } from "@/components/ui/page-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft,
  Save,
  Upload,
  Calendar,
  Settings
} from "lucide-react";
import { format } from "date-fns";
import { trpc, type RouterOutputs, type RouterInputs } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "sonner";
import {
  ClipboardCheck,
  ClipboardList,
  Target
} from "lucide-react";
import { DraggableFileItem } from "@/components/DraggableFileItem";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { FilePreviewModal } from "@/components/modals";
import { FileItem, FileHandlers } from "@/lib/types/file";
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
import { baseFileHandler } from "@/lib/fileHandler";
import { fixUploadUrl } from "@/lib/directUpload";

type Assignment = RouterOutputs['assignment']['get'];
type AssignmentUpdateInput = RouterInputs['assignment']['update'];

const assignmentTypes = [
  { value: "HOMEWORK", label: "Homework" },
  { value: "QUIZ", label: "Quiz" },
  { value: "EXAM", label: "Exam" },
  { value: "PROJECT", label: "Project" },
  { value: "ESSAY", label: "Essay" },
  { value: "LAB", label: "Lab" },
  { value: "PRESENTATION", label: "Presentation" },
  { value: "OTHER", label: "Other" }
];

function AssignmentEditSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Skeleton className="h-10 w-10" />
        <Skeleton className="h-8 w-48" />
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6 space-y-6">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-32 w-full" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
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

export default function AssignmentEditPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.id as string;
  const assignmentId = params.assignmentId as string;

  const [hasChanges, setHasChanges] = useState(false);
  const [formData, setFormData] = useState<Partial<Assignment>>({});

  // File preview state
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Upload progress state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentUploadStatus, setCurrentUploadStatus] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);

  // Get signed URL mutation for file preview
  const getSignedUrlMutation = trpc.file.getSignedUrl.useMutation();
  const getAssignmentUploadUrls = trpc.assignment.getAssignmentUploadUrls.useMutation();
  const confirmAssignmentUpload = trpc.assignment.confirmAssignmentUpload.useMutation();

  // Specific mutations for grading tools and events
  const attachMarkSchemeMutation = trpc.assignment.attachMarkScheme.useMutation({
    onSuccess: () => {
      toast.success("Rubric attached successfully.");
      refetchAssignment();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to attach rubric.");
    },
  });

  const detachMarkSchemeMutation = trpc.assignment.detachMarkScheme.useMutation({
    onSuccess: () => {
      toast.success("Rubric detached successfully.");
      toast.success("Rubric detached successfully.");
      refetchAssignment();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to detach rubric.");
    },
  });

  const attachGradingBoundaryMutation = trpc.assignment.attachGradingBoundary.useMutation({
    onSuccess: () => {
      toast.success("Grading boundary attached successfully.");
      handleSave();
      refetchAssignment();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to attach grading boundary.");
    },
  });

  const detachGradingBoundaryMutation = trpc.assignment.detachGradingBoundary.useMutation({
    onSuccess: () => {
      toast.success("Grading boundary detached successfully.");
      handleSave();
      refetchAssignment();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to detach grading boundary.");
    },
  });

  const attachToEventMutation = trpc.assignment.attachToEvent.useMutation({
    onSuccess: () => {
      toast.success("Event attached successfully.");
      handleSave();
      refetchAssignment();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to attach event.");
    },
  });

  const detachEventMutation = trpc.assignment.detachEvent.useMutation({
    onSuccess: () => {
      toast.success("Event detached successfully.");
      handleSave();
      refetchAssignment();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to detach event.");
    },
  });

  // Get available events for attachment
  const { data: availableEvents } = trpc.assignment.getAvailableEvents.useQuery({
    assignmentId,
    classId,
  });

  // Get assignment data
  const { data: assignment, isLoading, refetch: refetchAssignment } = trpc.assignment.get.useQuery({
    id: assignmentId,
    classId: classId,
  });

  // Get class data for sections
  const { data: classData } = trpc.class.get.useQuery({ classId });

  // Get grading tools data directly from tRPC
  const { data: markSchemes } = trpc.class.listMarkSchemes.useQuery({ classId });
  const { data: gradingBoundaries } = trpc.class.listGradingBoundaries.useQuery({ classId });

  // Update assignment mutation
  const updateAssignmentMutation = trpc.assignment.update.useMutation({
    onSuccess: () => {
      toast.success("Assignment saved");
      setHasChanges(false);
      refetchAssignment();
    },
    onError: (error) => {
      toast.error(error.message || "There was a problem saving your changes. Please try again.");
    },
  });

  // Initialize form data when assignment loads
  useEffect(() => {
    if (assignment) {
      setFormData({
        title: assignment.title,
        instructions: assignment.instructions,
        dueDate: assignment.dueDate ? new Date(assignment.dueDate).toISOString().slice(0, 16) : undefined,
        maxGrade: assignment.maxGrade,
        graded: assignment.graded,
        type: assignment.type,
        weight: assignment.weight,
        inProgress: assignment.inProgress,
        sectionId: assignment.section?.id,
        markSchemeId: assignment.markScheme?.id,
        gradingBoundaryId: assignment.gradingBoundary?.id,
      });
    }
  }, [assignment]);

  const updateFormData = (updates: Partial<Assignment & { markSchemeId?: string; gradingBoundaryId?: string }>) => {
    setFormData(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!assignment) return;
    
    const updateData: AssignmentUpdateInput = {
      classId,
      id: assignmentId,
      title: formData.title,
      instructions: formData.instructions,
      dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined,
      maxGrade: formData.maxGrade,
      graded: formData.graded,
      type: formData.type,
      weight: formData.weight,
      inProgress: formData.inProgress,
      sectionId: formData.sectionId || null,
    };
    
    updateAssignmentMutation.mutate(updateData);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !assignment) return;

    // Start upload progress tracking
    setIsUploading(true);
    setUploadProgress(0);
    setCurrentUploadStatus('Preparing upload...');
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
      setCurrentUploadStatus('Getting upload URLs...');
      setUploadProgress(10);

      const uploadResponse = await getAssignmentUploadUrls.mutateAsync({
        assignmentId,
        classId,
        files: fileMetadata
      });

      setUploadProgress(20);

      // 2. Upload files through backend proxy
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const uploadFile = uploadResponse.uploadFiles[i];

        try {
          // Update status for current file
          setCurrentUploadStatus(`Uploading ${file.name}...`);
          const fileProgress = 20 + ((i / files.length) * 60); // 20-80% for uploads
          setUploadProgress(fileProgress);

          // Fix upload URL to use correct API base URL from environment
          const uploadUrl = fixUploadUrl(uploadFile.uploadUrl);

          // Upload to backend proxy endpoint
          const response = await fetch(uploadUrl, {
            method: 'POST',
            body: file,
            headers: {
              'Content-Type': file.type
            }
          });

          if (!response.ok) {
            throw new Error(`Upload failed: ${response.statusText}`);
          }

          // 3. Confirm upload to backend
          setCurrentUploadStatus(`Confirming ${file.name}...`);
          await confirmAssignmentUpload.mutateAsync({
            fileId: uploadFile.id,
            uploadSuccess: true,
            classId
          });

          // Update progress
          setUploadedFiles(i + 1);
          console.log(`File ${file.name} uploaded successfully`);
        } catch (error) {
          // Report error to backend
          await confirmAssignmentUpload.mutateAsync({
            fileId: uploadFile.id,
            uploadSuccess: false,
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            classId
          });

          console.error(`Upload failed for ${file.name}:`, error);
          toast.error(`Failed to upload ${file.name}`);
        }
      }

      // Final steps
      setCurrentUploadStatus('Finalizing...');
      setUploadProgress(90);

      // Refresh assignment data to show new files
      refetchAssignment();
      
      setUploadProgress(100);
      setCurrentUploadStatus('Upload complete!');
      toast.success("Files uploaded successfully");
      
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
      console.error('File upload error:', error);
      toast.error('Failed to upload files');
      setIsUploading(false);
      setUploadProgress(0);
      setCurrentUploadStatus('');
    }
  };

  const removeAttachment = (attachmentId: string) => {
    if (!assignment) return;
    
    updateAssignmentMutation.mutate({
      classId,
      id: assignmentId,
      removedAttachments: [attachmentId],
    });
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

  const convertAttachmentsToFileItems = (attachments: Assignment['attachments']) => {
    return attachments.map((attachment: Assignment['attachments'][number]) => ({
      id: attachment.id,
      name: attachment.name,
      type: "file" as const,
      fileType: attachment.type.split('/')[1] || attachment.type,
      size: formatFileSize(attachment.size),
      uploadedAt: attachment.uploadedAt,
    }));
  };

  // File handlers for attachments
  const fileHandlers: FileHandlers = {
    ...baseFileHandler,
    onDelete: async (item: FileItem) => {
      removeAttachment(item.id);
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

  const handleFileClick = (file: FileItem) => {
    // Handle file click - open preview
    setPreviewFile(file);
    setIsPreviewOpen(true);
  };

  if (isLoading) {
    return (
      <PageLayout>
        <AssignmentEditSkeleton />
      </PageLayout>
    );
  }

  if (!assignment) {
    return (
      <PageLayout>
        <EmptyState
          icon={FileText}
          title="Assignment not found"
          description="The assignment you're trying to edit doesn't exist or has been removed."
        />
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
            <h1 className="text-2xl font-bold">Edit Assignment</h1>
          </div>
          
          <div className="flex items-center space-x-2">
            {hasChanges && (
              <Badge variant="secondary">Unsaved changes</Badge>
            )}
            <Button 
              onClick={handleSave}
              disabled={!hasChanges || updateAssignmentMutation.isPending}
              className="flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>{updateAssignmentMutation.isPending ? "Saving..." : "Save Changes"}</span>
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Column - Main Form */}
          <div className="xl:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Assignment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={formData.title || ''}
                      onChange={(e) => updateFormData({ title: e.target.value })}
                      placeholder="Enter assignment title"
                    />
                </div>

                {/* Instructions */}
                <div className="space-y-2">
                  <Label htmlFor="instructions">Instructions</Label>
                    <Textarea
                      id="instructions"
                      value={formData.instructions || ''}
                      onChange={(e) => updateFormData({ instructions: e.target.value })}
                      placeholder="Enter assignment instructions"
                      rows={6}
                    />
                </div>

                {/* Due Date and Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input
                      id="dueDate"
                      type="datetime-local"
                      value={formData.dueDate || ""}
                      onChange={(e) => updateFormData({ dueDate: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="section">Section</Label>
                    <Select
                      value={formData.sectionId || "none"}
                      onValueChange={(value) => 
                        updateFormData({ sectionId: value === "none" ? undefined : value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a section" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No section</SelectItem>
                        {classData?.class?.sections?.map((section) => (
                          <SelectItem key={section.id} value={section.id}>
                            {section.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Assignment Type */}
                <div className="space-y-2">
                  <Label htmlFor="type">Assignment Type</Label>
                  <Select
                    value={formData.type || "HOMEWORK"}
                    onValueChange={(value) => updateFormData({ type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {assignmentTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Grading Options */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="graded"
                      checked={formData.graded || false}
                      onCheckedChange={(checked) => updateFormData({ graded: checked })}
                    />
                    <Label htmlFor="graded">Graded Assignment</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="inProgress"
                      checked={formData.inProgress || false}
                      onCheckedChange={(checked) => updateFormData({ inProgress: checked })}
                    />
                    <Label htmlFor="inProgress">Save as Draft</Label>
                  </div>

                  {formData.inProgress && (
                    <p className="text-sm text-muted-foreground">
                      Draft assignments are saved to your Labs page and won't be visible to students until published.
                    </p>
                  )}

                </div>
              </CardContent>
            </Card>

            {/* Grading & Assessment */}
            {formData.graded && (
              <Card>
                <CardHeader>
                <CardTitle>Grading & Assessment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Rubric Selection */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Rubric</Label>
                      <Select
                        value={formData.markSchemeId || 'none'}
                        onValueChange={(value) => {
                          if (value === 'none') {
                            if (formData.markSchemeId) {
                              detachMarkSchemeMutation.mutate({ classId, assignmentId });
                            }
                          } else {
                            attachMarkSchemeMutation.mutate({ classId, assignmentId, markSchemeId: value });
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose rubric" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No rubric</SelectItem>
                          {markSchemes?.map((markScheme) => {
                            let name = "Untitled Rubric";
                            try {
                              const parsed = JSON.parse(markScheme.structured);
                              name = parsed.name || "Untitled Rubric";
                            } catch (error) {
                              console.error("Error parsing markscheme:", error);
                            }
                            return (
                              <SelectItem key={markScheme.id} value={markScheme.id}>
                                <div className="flex items-center gap-2">
                                  <ClipboardCheck className="h-3 w-3" />
                                  {name}
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Grading Boundaries */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Grade Scale</Label>
                      <Select
                        value={formData.gradingBoundaryId || 'none'}
                        onValueChange={(value) => {
                          if (value === 'none') {
                            if (formData.gradingBoundaryId) {
                              detachGradingBoundaryMutation.mutate({ classId, assignmentId });
                            }
                          } else {
                            attachGradingBoundaryMutation.mutate({ classId, assignmentId, gradingBoundaryId: value });
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose grade scale" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Default scale</SelectItem>
                          {gradingBoundaries?.map((boundary) => {
                            let name = "Untitled Scale";
                            try {
                              const parsed = JSON.parse(boundary.structured);
                              name = parsed.name || "Untitled Scale";
                            } catch (error) {
                              console.error("Error parsing grading boundary:", error);
                            }
                            return (
                              <SelectItem key={boundary.id} value={boundary.id}>
                                <div className="flex items-center gap-2">
                                  <ClipboardList className="h-3 w-3" />
                                  {name}
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Scoring Settings */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="maxGrade" className="text-sm font-medium">
                        {formData.markSchemeId ? "Computed Max Score" : "Max Points"}
                      </Label>
                      <Input
                        id="maxGrade"
                        type="number"
                        value={formData.maxGrade || 0}
                        onChange={(e) => updateFormData({ maxGrade: parseInt(e.target.value) })}
                        disabled={!!formData.markSchemeId}
                        min="0"
                        placeholder="100"
                        className={formData.markSchemeId ? "bg-muted" : ""}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="weight" className="text-sm font-medium">Weight (%)</Label>
                      <Input
                        id="weight"
                        type="number"
                        value={formData.weight || 0}
                        onChange={(e) => updateFormData({ weight: parseInt(e.target.value) })}
                        min="0"
                        step="0.1"
                        placeholder="1.0"
                      />
                    </div>
                  </div>

                  {formData.markSchemeId && (
                    <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <ClipboardCheck className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-blue-700 dark:text-blue-300">
                        Points will be calculated automatically from the selected rubric
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Attachments */}
            <Card>
              <CardHeader>
                <CardTitle>Attachments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {assignment.attachments.length > 0 ? (
                  <DndProvider backend={HTML5Backend}>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {convertAttachmentsToFileItems(assignment.attachments).map((fileItem: FileItem) => (
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
                  <EmptyState
                    icon={FileText}
                    title="No attachments"
                    description="Upload files to attach to this assignment."
                  />
                )}

                <Separator />

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
                  <Label htmlFor="file-upload" className="cursor-pointer">
                    <div className="flex items-center justify-center w-full p-4 border-2 border-dashed border-muted-foreground/25 rounded-lg hover:border-muted-foreground/50 transition-colors">
                      <div className="text-center">
                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm font-medium">Upload files</p>
                        <p className="text-xs text-muted-foreground">Click to select files or drag and drop</p>
                      </div>
                    </div>
                  </Label>
                  <Input
                    id="file-upload"
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    accept="*/*"
                    disabled={isUploading}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Event Attachment */}
            <Card>
              <CardHeader>
                <CardTitle>Event Attachment</CardTitle>
              </CardHeader>
              <CardContent>
                {assignment.eventAttached ? (
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{assignment.eventAttached.name}</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Detach event using specific endpoint
                          detachEventMutation.mutate({ classId, assignmentId });
                        }}
                      >
                        Detach
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(assignment.eventAttached.startTime), 'MMM d, yyyy \'at\' h:mm a')}
                    </p>
                    {assignment.eventAttached.location && (
                      <p className="text-xs text-muted-foreground mt-1">
                        📍 {assignment.eventAttached.location}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Attach to Event</Label>
                      <Select
                        value="none"
                        onValueChange={(value) => {
                          if (value !== 'none') {
                            attachToEventMutation.mutate({ classId, assignmentId, eventId: value });
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose event" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No event</SelectItem>
                          {availableEvents?.events.map((event) => (
                            <SelectItem key={event.id} value={event.id}>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-3 w-3" />
                                <span>{event.name}</span>
                                <span className="text-xs text-muted-foreground ml-2">
                                  {format(new Date(event.startTime), 'MMM d')}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
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
