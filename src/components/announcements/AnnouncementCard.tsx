"use client";

import { useState, useRef, useMemo, useCallback, memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Clock,
  Edit,
  Trash2,
  MessageSquare,
  Paperclip,
  Download,
  Eye,
  MoreVertical,
  Send,
  Reply,
  Loader2,
  ChevronDown,
  ChevronUp,
  X,
  Save,
  Image,
  FileVideo,
  Music,
  Archive,
  FileSpreadsheet,
  Presentation,
  File,
  FileText,
} from "lucide-react";
import { format } from "date-fns";
import { trpc, type RouterOutputs } from "@/lib/trpc";
import { toast } from "sonner";
import { useSelector, shallowEqual } from "react-redux";
import { RootState } from "@/store/store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ReactionButton } from "@/components/reactions/ReactionButton";
import { fixUploadUrl } from "@/lib/directUpload";
import { DraggableFileItem } from "@/components/DraggableFileItem";
import { FileHandlers } from "@/lib/types/file";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { FilePreviewModal } from "@/components/modals";
import { baseFileHandler } from "@/lib/fileHandler";

type Announcement = RouterOutputs['class']['get']['class']['announcements'][number];

// Helper function to safely format dates
function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "Unknown date";
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) {
      return "Invalid date";
    }
    return format(dateObj, 'MMM d, yyyy \'at\' h:mm a');
  } catch (error) {
    return "Invalid date";
  }
}

interface AnnouncementCardProps {
  announcement: Announcement;
  classId: string;
  onUpdate?: () => void;
}

const COMMENTS_TO_SHOW = 2;
const REPLIES_TO_SHOW = 1;

// Utility functions moved outside component to prevent recreation
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
    case "jpeg":
    case "png":
    case "gif":
    case "webp":
      return <Image className={`${iconSize} text-emerald-500`} />;
    default:
      return <File className={`${iconSize} text-slate-500`} />;
  }
};

export const AnnouncementCard = memo(function AnnouncementCard({ announcement, classId, onUpdate }: AnnouncementCardProps) {
  // Optimize Redux selector with shallow equality
  const currentUserId = useSelector((state: RootState) => state.app.user.id);
  const isTeacher = useSelector((state: RootState) => state.app.user.teacher);

  // Get tRPC utils for cache invalidation
  const utils = trpc.useUtils();

  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditingAnnouncement, setIsEditingAnnouncement] = useState(false);
  const [editAnnouncementText, setEditAnnouncementText] = useState(announcement.remarks);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState("");
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [editReplyText, setEditReplyText] = useState("");
  const [showAllComments, setShowAllComments] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  
  // File upload state
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [removedAttachments, setRemovedAttachments] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File preview state
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Get signed URL mutation for file preview
  const getSignedUrlMutation = trpc.file.getSignedUrl.useMutation();

  type FileItem = {
    id: string;
    name: string;
    type: "file" | "folder";
    fileType?: string;
    size?: string;
    uploadedAt?: string;
  };

  // Get comments (only when expanded) - optimized with staleTime
  const { data: commentsData, isLoading: commentsLoading, refetch: refetchComments } = trpc.announcement.getComments.useQuery({
    announcementId: announcement.id,
    classId: classId,
  }, {
    enabled: isExpanded,
    staleTime: 30000, // Cache for 30 seconds to reduce refetches
  });

  // Get comment count when not expanded (lightweight query)
  // This ensures we always have the count visible
  // Filter to only count top-level comments (exclude replies)
  const { data: commentsCountData } = trpc.announcement.getComments.useQuery({
    announcementId: announcement.id,
    classId: classId,
  }, {
    enabled: !isExpanded,
    select: (data) => {
      const topLevelCount = data?.comments?.filter((c: any) => !c.parentCommentId || c.parentCommentId === null).length ?? 0;
      return { count: topLevelCount };
    },
    staleTime: 30000, // Cache for 30 seconds
  });

  // File upload mutation
  const confirmAnnouncementUpload = trpc.announcement.confirmAnnouncementUpload.useMutation();

  // Update announcement mutation (Approach 1: Single-step with files)
  const updateAnnouncementMutation = trpc.announcement.update.useMutation({
    onSuccess: async (result) => {
      // Check if upload URLs were returned in the response
      const uploadFiles = (result as any).uploadFiles || [];
      
      // If there are new files to upload, handle them
      if (newFiles.length > 0 && uploadFiles.length > 0) {
        try {
          setUploadStatus("Uploading files...");
          setUploadProgress(10);

          // Upload each file to its signed URL
          for (let i = 0; i < uploadFiles.length; i++) {
            const uploadFile = uploadFiles[i];
            const file = newFiles.find(f => f.name === uploadFile.name);
            
            if (!file) {
              console.warn(`File ${uploadFile.name} not found in new files`);
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
          toast.error(`Announcement updated but file upload failed: ${errorMessage}`);
        }
      }

      toast.success("Announcement updated");
      setIsEditingAnnouncement(false);
      setNewFiles([]);
      setRemovedAttachments([]);
      setUploadProgress(0);
      setUploadStatus("");
      
      // Wait a moment for backend to process and link files
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Invalidate queries to refresh cache
      utils.announcement.getAll.invalidate({ classId }).catch(console.error);
      utils.announcement.get.invalidate({ id: announcement.id, classId }).catch(console.error);
      utils.class.get.invalidate({ classId }).catch(console.error);
      
      // Call onUpdate to refresh parent component
      onUpdate?.();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update announcement");
      setUploadProgress(0);
      setUploadStatus("");
    },
  });

  // Check if user can edit/delete
  const canEdit = announcement.teacher.id === currentUserId || isTeacher;
  const canDelete = canEdit;

  // Delete mutation
  const deleteMutation = trpc.announcement.delete.useMutation({
    onSuccess: () => {
      toast.success("Announcement deleted successfully");
      
      // Invalidate queries to refresh cache
      utils.announcement.getAll.invalidate({ classId }).catch(console.error);
      utils.class.get.invalidate({ classId }).catch(console.error);
      
      onUpdate?.();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete announcement");
    },
  });

  // Add comment mutation
  const addCommentMutation = trpc.announcement.addComment.useMutation({
    onSuccess: () => {
      toast.success("Comment added");
      setNewComment("");
      setReplyingTo(null);
      setShowCommentForm(false);
      refetchComments();
      // Invalidate announcement query to update comment count
      utils.announcement.getAll.invalidate({ classId }).catch(console.error);
      utils.announcement.get.invalidate({ id: announcement.id, classId }).catch(console.error);
      utils.class.get.invalidate({ classId }).catch(console.error);
      onUpdate?.();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add comment");
    },
  });

  // Update comment mutation
  const updateCommentMutation = trpc.announcement.updateComment.useMutation({
    onSuccess: () => {
      toast.success("Comment updated");
      setEditingCommentId(null);
      setEditCommentText("");
      setEditingReplyId(null);
      setEditReplyText("");
      refetchComments();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update comment");
    },
  });

  // Delete comment mutation
  const deleteCommentMutation = trpc.announcement.deleteComment.useMutation({
    onSuccess: () => {
      toast.success("Comment deleted");
      refetchComments();
      onUpdate?.();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete comment");
    },
  });

  const handleDelete = useCallback(() => {
    deleteMutation.mutate({ id: announcement.id, classId: classId });
  }, [deleteMutation, announcement.id, classId]);

  const handleSaveAnnouncement = useCallback(() => {
    if (!editAnnouncementText.trim()) {
      toast.error("Content cannot be empty");
      return;
    }
    
    // Prepare update data (Approach 1: Include files in update)
    const updateData: any = {
      remarks: editAnnouncementText.trim(),
    };

    // Add new files metadata if there are new files
    if (newFiles.length > 0) {
      updateData.files = newFiles.map(file => ({
        name: file.name,
        type: file.type,
        size: file.size,
      }));
    }
    
    // Add removed attachments if any
    if (removedAttachments.length > 0) {
      updateData.removedAttachments = removedAttachments;
    }

    updateAnnouncementMutation.mutate({
      id: announcement.id,
      data: updateData,
    });
  }, [editAnnouncementText, newFiles, removedAttachments, updateAnnouncementMutation, announcement.id]);

  const handleCancelEditAnnouncement = useCallback(() => {
    setIsEditingAnnouncement(false);
    setEditAnnouncementText(announcement.remarks);
    setNewFiles([]);
    setRemovedAttachments([]);
    setUploadProgress(0);
    setUploadStatus("");
  }, [announcement.remarks]);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setNewFiles(prev => [...prev, ...files]);
  }, []);

  const removeNewFile = useCallback((index: number) => {
    setNewFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const removeAttachment = useCallback((attachmentId: string) => {
    setRemovedAttachments(prev => [...prev, attachmentId]);
  }, []);

  const handleAddComment = useCallback(() => {
    if (!newComment.trim()) return;
    
    addCommentMutation.mutate({
      announcementId: announcement.id,
      classId: classId,
      content: newComment.trim(),
      parentCommentId: replyingTo || undefined,
    });
  }, [newComment, addCommentMutation, announcement.id, classId, replyingTo]);

  const handleAddReply = useCallback((commentId: string) => {
    const replyText = replyTexts[commentId];
    if (!replyText?.trim()) return;
    
    addCommentMutation.mutate({
      announcementId: announcement.id,
      classId: classId,
      content: replyText.trim(),
      parentCommentId: commentId,
    }, {
      onSuccess: () => {
        setReplyTexts(prev => {
          const newReplyTexts = { ...prev };
          delete newReplyTexts[commentId];
          return newReplyTexts;
        });
        setReplyingTo(null);
      }
    });
  }, [replyTexts, addCommentMutation, announcement.id, classId]);

  const handleUpdateComment = useCallback((commentId: string) => {
    if (!editCommentText.trim()) return;
    
    updateCommentMutation.mutate({
      id: commentId,
      content: editCommentText.trim(),
    });
  }, [editCommentText, updateCommentMutation]);

  const handleDeleteComment = useCallback((commentId: string) => {
    deleteCommentMutation.mutate({ id: commentId });
  }, [deleteCommentMutation]);

  const handleUpdateReply = useCallback((replyId: string) => {
    if (!editReplyText.trim()) return;
    
    updateCommentMutation.mutate({
      id: replyId,
      content: editReplyText.trim(),
    });
  }, [editReplyText, updateCommentMutation]);

  const handleDeleteReply = useCallback((replyId: string) => {
    deleteCommentMutation.mutate({ id: replyId });
  }, [deleteCommentMutation]);

  const startEditComment = useCallback((commentId: string, currentContent: string) => {
    setEditingCommentId(commentId);
    setEditCommentText(currentContent);
    setReplyingTo(null);
    setEditingReplyId(null);
    setShowCommentForm(false);
  }, []);

  const startEditReply = useCallback((replyId: string, currentContent: string) => {
    setEditingReplyId(replyId);
    setEditReplyText(currentContent);
    setReplyingTo(null);
    setEditingCommentId(null);
    setShowCommentForm(false);
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingCommentId(null);
    setEditCommentText("");
  }, []);

  const handleReplyClick = useCallback((commentId: string) => {
    setReplyingTo(commentId);
    setReplyTexts(prev => ({ ...prev, [commentId]: "" }));
    setShowCommentForm(false);
    setEditingCommentId(null);
  }, []);

  const handleCommentClick = useCallback(() => {
    setShowCommentForm(true);
    setReplyingTo(null);
    setEditingCommentId(null);
  }, []);

  const toggleReplies = useCallback((commentId: string) => {
    setExpandedReplies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  }, []);

  // Memoize textarea change handlers
  const handleEditAnnouncementTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditAnnouncementText(e.target.value);
  }, []);

  const handleNewCommentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewComment(e.target.value);
  }, []);

  // Memoize expensive computations
  const isModified = useMemo(() => 
    announcement.modifiedAt && 
    new Date(announcement.modifiedAt).getTime() !== new Date(announcement.createdAt).getTime(),
    [announcement.modifiedAt, announcement.createdAt]
  );
  
  // Try multiple possible attachment property names - memoized
  const allAttachments = useMemo(() => 
    (announcement as any).attachments 
    || (announcement as any).files
    || (announcement as any).fileAttachments
    || [],
    [announcement]
  );
  
  // Filter out removed attachments when displaying - memoized
  const attachments = useMemo(() => 
    isEditingAnnouncement 
      ? allAttachments.filter((att: any) => !removedAttachments.includes(att.id))
      : allAttachments,
    [isEditingAnnouncement, allAttachments, removedAttachments]
  );

  const comments = useMemo(() => commentsData?.comments || [], [commentsData?.comments]);

  const convertAttachmentsToFileItems = useCallback((attachments: any[]) => {
    return attachments.map(attachment => ({
      id: attachment.id,
      name: attachment.name,
      type: "file" as const,
      fileType: attachment.type?.split('/')[1] || attachment.type || 'file',
      size: formatFileSize(attachment.size || 0),
      uploadedAt: attachment.uploadedAt || undefined,
    }));
  }, []);

  // File handlers - memoized to prevent recreation
  const handleFilePreview = useCallback((file: FileItem) => {
    setPreviewFile(file);
    setIsPreviewOpen(true);
  }, []);

  const fileHandlers: FileHandlers = useMemo(() => ({
    ...baseFileHandler,
    onFolderClick: () => {},
    onRename: async () => {},
    onDelete: async () => {},
    onMove: async () => {},
    onPreview: handleFilePreview,
    onFileClick: handleFilePreview,
  }), [handleFilePreview]);
  
  // Get comment count - prioritize from announcement data, fallback to loaded comments or count query
  // Try multiple possible locations for the count - memoized
  const commentCountFromData = useMemo(() => 
    (announcement as any)._count?.comments 
    ?? (announcement as any).commentCount 
    ?? (announcement as any).commentsCount
    ?? undefined,
    [announcement]
  );
  
  // Filter top-level comments (no parentCommentId or null parentCommentId) - memoized
  const topLevelComments = useMemo(() => 
    comments.filter((c: any) => !c.parentCommentId || c.parentCommentId === null),
    [comments]
  );
  
  const commentCount = useMemo(() => 
    isExpanded 
      ? topLevelComments.length 
      : (commentCountFromData ?? commentsCountData?.count ?? 0),
    [isExpanded, topLevelComments.length, commentCountFromData, commentsCountData?.count]
  );
  
  // Show top 2 comments by default, or all if showAllComments is true - memoized
  const displayedComments = useMemo(() => 
    showAllComments ? topLevelComments : topLevelComments.slice(0, COMMENTS_TO_SHOW),
    [showAllComments, topLevelComments]
  );
  const hasMoreComments = useMemo(() => 
    topLevelComments.length > COMMENTS_TO_SHOW,
    [topLevelComments.length]
  );

  // Memoize file items to prevent recalculation on every render
  const fileItems = useMemo(() => 
    convertAttachmentsToFileItems(attachments),
    [attachments, convertAttachmentsToFileItems]
  );

  return (
    <>
      <Card className="border-border shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start space-x-3 flex-1">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarImage src={announcement.teacher?.profile?.profilePicture || ""} />
                <AvatarFallback>
                  {announcement.teacher?.username?.substring(0, 2).toUpperCase() || "AN"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm">{announcement.teacher?.username || "Unknown"}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-xs text-muted-foreground flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatDate(announcement.createdAt)}
                  </p>
                  {isModified && (
                    <p className="text-xs text-muted-foreground">
                      (edited)
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            {(canEdit || canDelete) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {canEdit && (
                    <DropdownMenuItem onClick={() => {
                      setIsEditingAnnouncement(true);
                      setEditAnnouncementText(announcement.remarks);
                    }}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  {canDelete && (
                    <DropdownMenuItem 
                      onClick={() => setShowDeleteDialog(true)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Content - Editable */}
          <div className="mb-4">
            {isEditingAnnouncement ? (
              <div className="space-y-3">
                <Textarea
                  value={editAnnouncementText}
                  onChange={handleEditAnnouncementTextChange}
                  className="min-h-[100px] resize-none text-sm"
                  placeholder="Share something with your class..."
                />
                
                {/* Existing Attachments - Editable */}
                {attachments.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Existing Attachments</p>
                    <div className="space-y-1">
                      {attachments.map((attachment: any) => (
                          <div key={attachment.id} className="flex items-center gap-2 p-2 bg-muted/50 rounded-md text-xs">
                            <Paperclip className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            <span className="flex-1 truncate">{attachment.name}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0"
                              onClick={() => removeAttachment(attachment.id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* New Files */}
                {newFiles.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">New Files</p>
                    <div className="space-y-1">
                      {newFiles.map((file, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-muted/50 rounded-md text-xs">
                          <Paperclip className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          <span className="flex-1 truncate">{file.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {(file.size / 1024).toFixed(2)} KB
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0"
                            onClick={() => removeNewFile(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* File Input */}
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={updateAnnouncementMutation.isPending}
                  >
                    <Paperclip className="h-3 w-3 mr-1" />
                    Attach Files
                  </Button>
                </div>

                {/* Upload Progress */}
                {(updateAnnouncementMutation.isPending && uploadStatus) && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{uploadStatus}</span>
                      <span className="text-muted-foreground">{Math.round(uploadProgress)}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-1.5" />
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={handleSaveAnnouncement}
                    disabled={updateAnnouncementMutation.isPending}
                    className="h-7 text-xs"
                  >
                    {updateAnnouncementMutation.isPending ? (
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <Save className="h-3 w-3 mr-1" />
                    )}
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCancelEditAnnouncement}
                    disabled={updateAnnouncementMutation.isPending}
                    className="h-7 text-xs"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                {announcement.remarks}
              </div>
            )}
          </div>

          {/* Attachments - Show right after text for better UX */}
          {!isEditingAnnouncement && attachments.length > 0 && (
            <div className="mb-4">
              <div className="space-y-2">
                <p className="text-xs font-medium flex items-center gap-2 text-muted-foreground">
                  <Paperclip className="h-3.5 w-3.5" />
                  Attachments ({attachments.length})
                </p>
                <DndProvider backend={HTML5Backend}>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {fileItems.map((fileItem) => (
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
              </div>
            </div>
          )}

          {/* Reactions, Comments Count & Expand Button */}
          <div className="flex items-center justify-between pt-3 border-t border-border">
            <div className="flex items-center gap-4">
              <ReactionButton
                announcementId={announcement.id}
                classId={classId}
                size="sm"
              />
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span>
                  {commentCount > 0 
                    ? `${commentCount} comment${commentCount !== 1 ? 's' : ''}` 
                    : 'Be the first to comment'}
                </span>
              </button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsExpanded(!isExpanded);
                if (!isExpanded) {
                  setShowCommentForm(false);
                }
              }}
              className="h-7 text-xs"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-3 w-3 mr-1" />
                  Hide
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3 mr-1" />
                  {commentCount > 0 ? "View Comments" : "Comment"}
                </>
              )}
            </Button>
          </div>

          {/* Expanded Content */}
          {isExpanded && (
            <div className="mt-4 pt-4 border-t border-border space-y-4">
              {/* Comments Section */}
              <div className="space-y-4">
                {/* Add Comment Form - Always visible when expanded */}
                {showCommentForm && (
                  <div className="space-y-2 pb-3 border-b border-border">
                    {replyingTo && (
                      <div className="flex items-center gap-2 mb-2">
                        <p className="text-xs text-muted-foreground">
                          Replying to comment
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setReplyingTo(null);
                            setShowCommentForm(false);
                          }}
                          className="h-5 text-xs px-2"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                    <Textarea
                      placeholder={replyingTo ? "Write a reply..." : "Write a comment..."}
                      value={newComment}
                      onChange={handleNewCommentChange}
                      className="min-h-[80px] resize-none text-sm"
                      autoFocus
                    />
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowCommentForm(false);
                          setReplyingTo(null);
                          setNewComment("");
                        }}
                        className="h-7 text-xs"
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleAddComment}
                        disabled={!newComment.trim() || addCommentMutation.isPending}
                        className="h-7 text-xs"
                      >
                        {addCommentMutation.isPending ? (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <Send className="h-3 w-3 mr-1" />
                        )}
                        {replyingTo ? "Reply" : "Comment"}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Comment Button - Show when form is hidden */}
                {!showCommentForm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCommentClick}
                    className="h-7 text-xs w-full justify-start"
                  >
                    <MessageSquare className="h-3 w-3 mr-2" />
                    Write a comment...
                  </Button>
                )}

                {/* Comments List */}
                {commentsLoading ? (
                  <div className="space-y-3">
                    <div className="h-16 bg-muted/50 rounded animate-pulse" />
                    <div className="h-16 bg-muted/50 rounded animate-pulse" />
                  </div>
                ) : displayedComments.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <MessageSquare className="h-6 w-6 mx-auto mb-2 opacity-50" />
                    <p className="text-xs">No comments yet. Be the first to comment!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {displayedComments.map((comment: any) => {
                      // Get replies for this comment - check both flat structure and nested structure
                      const replies = comment.replies 
                        ? comment.replies 
                        : comments.filter((c: any) => c.parentCommentId === comment.id);
                      const replyCount = replies.length;
                      const showReplies = expandedReplies.has(comment.id);
                      const displayedReplies = showReplies 
                        ? replies 
                        : replies.slice(0, REPLIES_TO_SHOW);
                      const hasMoreReplies = replies.length > REPLIES_TO_SHOW;

                      return (
                        <CommentItem
                          key={comment.id}
                          comment={comment}
                          currentUserId={currentUserId}
                          isTeacher={isTeacher}
                          replies={displayedReplies}
                          allReplies={replies}
                          replyCount={replyCount}
                          hasMoreReplies={hasMoreReplies}
                          showReplies={showReplies}
                          onToggleReplies={() => toggleReplies(comment.id)}
                          onReply={() => handleReplyClick(comment.id)}
                          onEdit={() => startEditComment(comment.id, comment.content)}
                          onDelete={() => handleDeleteComment(comment.id)}
                          isEditing={editingCommentId === comment.id}
                          editText={editCommentText}
                          onEditTextChange={setEditCommentText}
                          onSaveEdit={() => handleUpdateComment(comment.id)}
                          onCancelEdit={cancelEdit}
                          isReplying={replyingTo === comment.id}
                          replyText={replyTexts[comment.id] || ""}
                          onReplyTextChange={(text: string) => {
                            setReplyTexts(prev => ({ ...prev, [comment.id]: text }));
                          }}
                          onAddReply={() => handleAddReply(comment.id)}
                          onCancelReply={() => {
                            setReplyingTo(null);
                            const newReplyTexts = { ...replyTexts };
                            delete newReplyTexts[comment.id];
                            setReplyTexts(newReplyTexts);
                          }}
                          isSubmittingReply={addCommentMutation.isPending && replyingTo === comment.id}
                          editingReplyId={editingReplyId}
                          editReplyText={editReplyText}
                          onEditReplyTextChange={setEditReplyText}
                          onEditReply={(replyId: string, content: string) => startEditReply(replyId, content)}
                          onSaveReplyEdit={(replyId: string) => handleUpdateReply(replyId)}
                          onCancelReplyEdit={() => {
                            setEditingReplyId(null);
                            setEditReplyText("");
                          }}
                          onDeleteReply={(replyId: string) => handleDeleteReply(replyId)}
                          classId={classId}
                        />
                      );
                    })}
                    
                    {/* View More Comments Button */}
                    {hasMoreComments && !showAllComments && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAllComments(true)}
                        className="w-full h-8 text-xs"
                      >
                        View {topLevelComments.length - COMMENTS_TO_SHOW} more comment{topLevelComments.length - COMMENTS_TO_SHOW !== 1 ? 's' : ''}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Announcement</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this announcement? This action cannot be undone.
              All comments and attachments will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
    </>
  );
});

// Comment Item Component with nested replies
const CommentItem = memo(function CommentItem({
  comment,
  currentUserId,
  isTeacher,
  replies = [],
  allReplies = [],
  replyCount = 0,
  hasMoreReplies = false,
  showReplies = false,
  onToggleReplies,
  onReply,
  onEdit,
  onDelete,
  isEditing,
  editText,
  onEditTextChange,
  onSaveEdit,
  onCancelEdit,
  isReplying = false,
  replyText = "",
  onReplyTextChange,
  onAddReply,
  onCancelReply,
  isSubmittingReply = false,
  editingReplyId = null,
  editReplyText = "",
  onEditReplyTextChange,
  onEditReply,
  onSaveReplyEdit,
  onCancelReplyEdit,
  onDeleteReply,
  classId,
}: {
  comment: any;
  currentUserId: string;
  isTeacher: boolean;
  replies?: any[];
  allReplies?: any[];
  replyCount?: number;
  hasMoreReplies?: boolean;
  showReplies?: boolean;
  onToggleReplies: () => void;
  onReply: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isEditing: boolean;
  editText: string;
  onEditTextChange: (text: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  isReplying?: boolean;
  replyText?: string;
  onReplyTextChange?: (text: string) => void;
  onAddReply?: () => void;
  onCancelReply?: () => void;
  isSubmittingReply?: boolean;
  editingReplyId?: string | null;
  editReplyText?: string;
  onEditReplyTextChange?: (text: string) => void;
  onEditReply?: (replyId: string, content: string) => void;
  onSaveReplyEdit?: (replyId: string) => void;
  onCancelReplyEdit?: () => void;
  onDeleteReply?: (replyId: string) => void;
  classId: string;
}) {
  const canEdit = comment.authorId === currentUserId;
  const canDelete = comment.authorId === currentUserId || isTeacher;
  const isModified = comment.updatedAt && 
    new Date(comment.updatedAt).getTime() !== new Date(comment.createdAt).getTime();

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2">
        <Avatar className="h-7 w-7 flex-shrink-0">
          <AvatarImage src={comment.author?.profile?.profilePicture || ""} />
          <AvatarFallback className="text-xs">
            {comment.author?.username?.substring(0, 2).toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <p className="text-xs font-medium">{comment.author?.username || "Unknown"}</p>
              <p className="text-xs text-muted-foreground">
                {formatDate(comment.createdAt)}
              </p>
              {isModified && (
                <span className="text-xs text-muted-foreground">(edited)</span>
              )}
            </div>
            {(canEdit || canDelete) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {canEdit && (
                    <DropdownMenuItem onClick={onEdit}>
                      <Edit className="h-3 w-3 mr-2" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  {canDelete && (
                    <DropdownMenuItem 
                      onClick={onDelete}
                      className="text-destructive"
                    >
                      <Trash2 className="h-3 w-3 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          
          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={editText}
                onChange={(e) => onEditTextChange(e.target.value)}
                className="min-h-[60px] resize-none text-sm"
                autoFocus
              />
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={onSaveEdit} className="h-7 text-xs">
                  <Save className="h-3 w-3 mr-1" />
                  Save
                </Button>
                <Button size="sm" variant="ghost" onClick={onCancelEdit} className="h-7 text-xs">
                  <X className="h-3 w-3 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-xs whitespace-pre-wrap leading-relaxed">{comment.content}</p>
              <div className="flex items-center gap-2 mt-1">
                <ReactionButton
                  commentId={comment.id}
                  classId={classId}
                  size="sm"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs px-2"
                  onClick={onReply}
                >
                  <Reply className="h-3 w-3 mr-1" />
                  Reply
                </Button>
                {replyCount > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {replyCount} {replyCount !== 1 ? 'replies' : 'reply'}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Inline Reply Form */}
      {isReplying && (
        <div className="ml-9 mt-2 space-y-2">
          <Textarea
            placeholder="Write a reply..."
            value={replyText}
            onChange={(e) => onReplyTextChange?.(e.target.value)}
            className="min-h-[60px] resize-none text-sm"
            autoFocus
          />
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={onAddReply}
              disabled={!replyText?.trim() || isSubmittingReply}
              className="h-7 text-xs"
            >
              {isSubmittingReply ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <Send className="h-3 w-3 mr-1" />
              )}
              Reply
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onCancelReply}
              className="h-7 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Replies Section - Always show if there are replies */}
      {(replies.length > 0 || allReplies.length > 0) && (
        <div className="ml-9 space-y-2 border-l-2 border-muted pl-3 mt-2">
          {replies.length > 0 ? (
            <>
              {replies.map((reply: any) => {
                const canEditReply = reply.authorId === currentUserId;
                const canDeleteReply = reply.authorId === currentUserId || isTeacher;
                const isReplyModified = reply.updatedAt && 
                  new Date(reply.updatedAt).getTime() !== new Date(reply.createdAt).getTime();
                const isEditingReply = editingReplyId === reply.id;

                return (
                  <div key={reply.id} className="space-y-1">
                    <div className="flex items-start gap-2">
                      <Avatar className="h-6 w-6 flex-shrink-0">
                        <AvatarImage src={reply.author?.profile?.profilePicture || ""} />
                        <AvatarFallback className="text-xs">
                          {reply.author?.username?.substring(0, 2).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-medium">{reply.author?.username || "Unknown"}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(reply.createdAt)}
                            </p>
                            {isReplyModified && (
                              <span className="text-xs text-muted-foreground">(edited)</span>
                            )}
                          </div>
                          {(canEditReply || canDeleteReply) && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-5 w-5 p-0">
                                  <MoreVertical className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {canEditReply && (
                                  <DropdownMenuItem onClick={() => onEditReply?.(reply.id, reply.content)}>
                                    <Edit className="h-3 w-3 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                )}
                                {canDeleteReply && (
                                  <DropdownMenuItem 
                                    onClick={() => onDeleteReply?.(reply.id)}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="h-3 w-3 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                        {isEditingReply ? (
                          <div className="space-y-2">
                            <Textarea
                              value={editReplyText}
                              onChange={(e) => onEditReplyTextChange?.(e.target.value)}
                              className="min-h-[60px] resize-none text-sm"
                              autoFocus
                            />
                            <div className="flex items-center gap-2">
                              <Button size="sm" onClick={() => onSaveReplyEdit?.(reply.id)} className="h-7 text-xs">
                                <Save className="h-3 w-3 mr-1" />
                                Save
                              </Button>
                              <Button size="sm" variant="ghost" onClick={onCancelReplyEdit} className="h-7 text-xs">
                                <X className="h-3 w-3 mr-1" />
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs whitespace-pre-wrap leading-relaxed">{reply.content}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {/* View More Replies Button */}
              {hasMoreReplies && !showReplies && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggleReplies}
                  className="h-6 text-xs px-2"
                >
                  View {allReplies.length - REPLIES_TO_SHOW} more {allReplies.length - REPLIES_TO_SHOW !== 1 ? 'replies' : 'reply'}
                </Button>
              )}
              
              {/* View Less Replies Button */}
              {showReplies && allReplies.length > REPLIES_TO_SHOW && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggleReplies}
                  className="h-6 text-xs px-2"
                >
                  Hide replies
                </Button>
              )}
            </>
          ) : replyCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleReplies}
              className="h-6 text-xs px-2"
            >
              View {replyCount} {replyCount !== 1 ? 'replies' : 'reply'}
            </Button>
          )}
        </div>
      )}
    </div>
  );
});
