"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useRef } from "react";
import { PageLayout } from "@/components/ui/page-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { 
  MessageSquare, 
  Send, 
  FileText, 
  Calendar,
  Users,
  BookOpen,
  Paperclip,
  X,
  Loader2,
  MoreVertical,
  Clock,
} from "lucide-react";
import { trpc, type RouterOutputs } from "@/lib/trpc";
import { toast } from "sonner";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { useTranslations } from "next-intl";
import { fixUploadUrl } from "@/lib/directUpload";
import { AnnouncementCard } from "@/components/announcements/AnnouncementCard";
import { format } from "date-fns";

type Class = RouterOutputs['class']['get']['class'];
type Announcement = RouterOutputs['class']['get']['class']['announcements'][number];
type Assignment = RouterOutputs['class']['get']['class']['assignments'][number];

export default function ClassFeed() {
  const params = useParams();
  const router = useRouter();

  const appState = useSelector((state: RootState) => state.app);
  const classId = params.id as string;
  
  const [newPost, setNewPost] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = useTranslations('overview');

  // Get tRPC utils for cache invalidation
  const utils = trpc.useUtils();

  // Get class data
  const { data: classData, isLoading, refetch } = trpc.class.get.useQuery({ 
    classId 
  });

  // Fetch announcements separately using dedicated endpoint (includes attachments)
  const { data: announcementsData, refetch: refetchAnnouncements } = trpc.announcement.getAll.useQuery({
    classId,
  });

  // File upload mutation
  const confirmAnnouncementUpload = trpc.announcement.confirmAnnouncementUpload.useMutation();

  // Create announcement mutation (Approach 1: Single-step with files)
  const createAnnouncementMutation = trpc.announcement.create.useMutation({
    onSuccess: async (result) => {
      // Check if upload URLs were returned in the response
      const uploadFiles = (result as any).uploadFiles || [];
      
      // If there are files to upload, handle them
      if (selectedFiles.length > 0 && uploadFiles.length > 0) {
        try {
          setUploadStatus("Uploading files...");
          setUploadProgress(10);

          // Upload each file to its signed URL
          for (let i = 0; i < uploadFiles.length; i++) {
            const uploadFile = uploadFiles[i];
            const file = selectedFiles.find(f => f.name === uploadFile.name);
            
            if (!file) {
              console.warn(`File ${uploadFile.name} not found in selected files`);
              continue;
            }

            try {
              setUploadStatus(`Uploading ${file.name}...`);
              const fileProgress = 10 + ((i / uploadFiles.length) * 80);
              setUploadProgress(fileProgress);

              // Fix upload URL
              const uploadUrl = fixUploadUrl(uploadFile.uploadUrl);
              console.log(`Uploading ${file.name} to ${uploadUrl}`);

              // Upload to signed URL using PUT (as per guide)
              const response = await fetch(uploadUrl, {
                method: 'PUT',
                body: file,
                headers: {
                  'Content-Type': uploadFile.type,
                },
              });

              if (!response.ok) {
                const errorText = await response.text().catch(() => response.statusText);
                console.error(`Upload failed for ${file.name}:`, {
                  status: response.status,
                  statusText: response.statusText,
                  error: errorText
                });
                throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
              }

              console.log(`File ${file.name} uploaded successfully, confirming...`);

              // Confirm upload
              await confirmAnnouncementUpload.mutateAsync({
                fileId: uploadFile.id,
                uploadSuccess: true,
                classId: classId,
              });

              console.log(`File ${file.name} confirmed successfully`);
            } catch (error) {
              console.error(`Error uploading file ${file.name}:`, error);
              // Report error to backend
              try {
                await confirmAnnouncementUpload.mutateAsync({
                  fileId: uploadFile.id,
                  uploadSuccess: false,
                  errorMessage: error instanceof Error ? error.message : 'Unknown error',
                  classId: classId,
                });
              } catch (confirmError) {
                console.error('Failed to confirm upload error:', confirmError);
              }
              throw error;
            }
          }

          setUploadProgress(100);
          setUploadStatus("Complete!");
          
          // Wait a bit for backend to process and link files
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error('File upload error:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          toast.error(`Announcement created but file upload failed: ${errorMessage}`);
        }
      }

      toast.success("Your announcement has been shared with the class.");
      setNewPost("");
      setSelectedFiles([]);
      setIsPosting(false);
      setUploadProgress(0);
      setUploadStatus("");
      
      // Wait a moment for backend to process and link files
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Invalidate queries to clear cache
      utils.announcement.getAll.invalidate({ classId }).catch(console.error);
      utils.class.get.invalidate({ classId }).catch(console.error);
      
      // Refetch to get fresh data with attachments
      await refetchAnnouncements();
      await refetch();
    },
    onError: (error) => {
      toast.error(error.message);
      setIsPosting(false);
      setUploadProgress(0);
      setUploadStatus("");
    },
  });

  const handlePost = async () => {
    if (!newPost.trim()) return;
    
    setIsPosting(true);
    setUploadStatus("Creating announcement...");
    
    // Prepare file metadata if files are selected
    const fileMetadata = selectedFiles.length > 0
      ? selectedFiles.map(file => ({
          name: file.name,
          type: file.type,
          size: file.size,
        }))
      : undefined;

    // Use Approach 1: Create with files (recommended)
    createAnnouncementMutation.mutate({
      classId,
      remarks: newPost.trim(),
      files: fileMetadata,
    });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const isTeacher = appState.user.teacher;
  const classInfo = classData?.class;

  // Combine announcements and assignments into a unified feed
  const feedItems: Array<{
    id: string;
    type: 'announcement' | 'assignment';
    data: Announcement | Assignment;
    teacher: RouterOutputs['announcement']['getAll']['announcements'][number]['teacher'];
    createdAt: string;
  }> = [];
  
  // Add announcements from dedicated endpoint (includes attachments)
  const announcements = announcementsData?.announcements || [];
  
  if (announcements.length > 0) {
    feedItems.push(...announcements.map(announcement => ({
      id: announcement.id,
      type: 'announcement' as const,
      data: announcement,
      createdAt: announcement.createdAt,
      teacher: announcement.teacher,
    })));
  }

  // Add assignments as feed items
  if (classInfo?.assignments) {
    feedItems.push(...classInfo.assignments.map(assignment => ({
      id: assignment.id,
      type: 'assignment' as const,
      data: assignment,
      createdAt: assignment.createdAt,
      teacher: assignment.teacher,
    })));
  }

  // Sort by creation date (newest first)
  feedItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (isLoading) {
    return (
      <PageLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded mb-4"></div>
            <div className="h-24 bg-muted rounded mb-6"></div>
            <div className="space-y-4">
              <div className="h-32 bg-muted rounded"></div>
              <div className="h-32 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Class Header */}
        <Card className="relative overflow-hidden border-0">
          <div className="h-32 relative">
            <div 
              className="absolute inset-0 bg-gradient-to-br opacity-90 rounded-lg"
              style={{ 
                backgroundImage: `linear-gradient(135deg, ${classInfo?.color || '#3b82f6'}dd, ${classInfo?.color || '#3b82f6'}aa), url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" stroke-width="0.5" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>')` 
              }}
            />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <h1 className="text-2xl font-bold text-white mb-1">
                {classInfo?.name || 'Loading...'}
              </h1>
              <div className="flex items-center gap-4 text-white/90 text-sm">
                <span className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  {classInfo?.subject || 'Subject'}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {classInfo?.students?.length || 0} {t('students')}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* New Post Card - Teachers Only */}
        {isTeacher && (
          <Card className="border-border shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarImage src={appState.user.profilePicture || ""} />
                  <AvatarFallback className="bg-primary/10 text-primary font-medium">
                    {appState.user.username?.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-4">
                  <Textarea
                    placeholder="Share something with your class..."
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    className="min-h-[80px] resize-none border-border bg-background focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all duration-200 placeholder:text-muted-foreground/60"
                  />
                  
                  {/* Selected Files */}
                  {selectedFiles.length > 0 && (
                    <div className="space-y-2">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-muted/50 rounded-md text-sm">
                          <Paperclip className="h-4 w-4 text-muted-foreground" />
                          <span className="flex-1 truncate">{file.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {(file.size / 1024).toFixed(2)} KB
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => removeFile(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload Progress */}
                  {isPosting && uploadStatus && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{uploadStatus}</span>
                        <span className="text-muted-foreground">{Math.round(uploadProgress)}%</span>
                      </div>
                      <Progress value={uploadProgress} className="h-2" />
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center space-x-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-9 px-3 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isPosting}
                      >
                        <Paperclip className="h-4 w-4 mr-2" />
                        {t('attachFile')}
                      </Button>
                      {selectedFiles.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
                        </span>
                      )}
                    </div>
                    <Button 
                      onClick={handlePost}
                      disabled={!newPost.trim() || isPosting}
                      size="sm"
                      className="h-9 px-4 font-medium"
                    >
                      {isPosting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {t('posting')}
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          {t('post')}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Feed Items */}
        <div className="space-y-6">
          {feedItems.length === 0 ? (
            <Card className="border-border shadow-sm">
              <CardContent className="py-12 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t('noPosts')}</h3>
                <p className="text-muted-foreground mb-4">
                  {isTeacher 
                    ? "Share announcements, assignments, and updates with your class."
                    : "Your teacher hasn't posted anything yet."
                  }
                </p>
                {isTeacher && (
                  <Button onClick={() => setNewPost("Share something with your class...")}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    {t('createFirstPost')}
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            feedItems.filter((item) => item.type === "announcement").map((item) => (
              item.type === 'announcement' ? (
                <AnnouncementCard
                  key={`announcement-${item.id}`}
                  announcement={item.data as Announcement}
                  classId={classId}
                  onUpdate={refetch}
                />
              ) : null
            ))
          )}
        </div>
      </div>
    </PageLayout>
  );
}


// Assignment Item Component  
function AssignmentItem({ assignment }: { assignment: Assignment }) {
  const router = useRouter();
  const isOverdue = assignment.dueDate && new Date(assignment.dueDate) < new Date();
  const dueDate = assignment.dueDate ? new Date(assignment.dueDate) : null;
  const t = useTranslations('assignment');

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <FileText className="h-4 w-4 text-blue-600" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm">{t('newAssignment')}</p>
            <p className="text-xs text-muted-foreground flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              {format(new Date(assignment.modifiedAt || assignment.createdAt), 'MMM d, yyyy \'at\' h:mm a')}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {assignment.graded && (
            <Badge variant="secondary" className="text-xs">
              {assignment.maxGrade} {t('pts')}
            </Badge>
          )}
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="ml-11">
        <div className="space-y-2">
          <h3 className="text-base font-semibold">{assignment.title}</h3>
          {assignment.instructions && (
            <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {assignment.instructions.length > 200 
                ? `${assignment.instructions.substring(0, 200)}...` 
                : assignment.instructions
              }
            </div>
          )}
          
          {/* Due Date */}
          {dueDate && (
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className={`text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                Due {format(dueDate, 'EEE, MMM d \'at\' h:mm a')}
                {isOverdue && (' ' + t('overdue'))}
              </span>
            </div>
          )}

          {/* Attachments */}
          {assignment.attachments && assignment.attachments.length > 0 && (
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Paperclip className="h-4 w-4" />
              <span>{assignment.attachments.length} attachment{assignment.attachments.length !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="ml-11 pt-2">
        <Separator className="mb-3" />
        <div className="flex items-center justify-end">
          <Button 
            size="sm" 
            className="h-8"
            onClick={() => router.push(`/class/${assignment.classId}/assignment/${assignment.id}`)}
          >
            {t('viewAssignment')}
          </Button>
        </div>
      </div>
    </div>
  );
}