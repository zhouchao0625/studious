"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { PageLayout } from "@/components/ui/page-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { 
  Upload, 
  FolderPlus, 
  Search, 
  Download,
  File,
  FileText,
  Image,
  FileVideo,
  Grid3X3,
  List,
  Filter,
  Share,
  Trash2,
  ArrowUpDown,
  HardDrive,
  Music,
  Archive,
  FileSpreadsheet,
  Presentation,
  AlertCircle,
  Loader2,
  ChevronRight,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { UploadFileModal, FilePreviewModal, RenameModal, CreateFolderModal } from "@/components/modals";
import { DraggableFileItem } from "@/components/DraggableFileItem";
import { DroppableFolderItem } from "@/components/DroppableFolderItem";
import { DraggableTableRow } from "@/components/DraggableTableRow";
import {
  RouterInputs,
  trpc
} from "@/lib/trpc";
import { FileItem, FileHandlers, ApiFolderGetFile, ApiFolderGetFolder } from "@/lib/types/file";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";


export default function FolderPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.id as string;
  const folderId = params.folderId as string;

  const appState = useSelector((state: RootState) => state.app);
  
  // State management
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"name" | "modified" | "size">("name");
  const [selectedItems] = useState<string[]>([]);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [renameItem, setRenameItem] = useState<FileItem | null>(null);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [createFolderModalOpen, setCreateFolderModalOpen] = useState(false);
  
  // API calls
  // Get current folder details
  const { data: currentFolder, isLoading: folderLoading, error: folderError, refetch } = trpc.folder.get.useQuery(
    { classId, folderId },
    { enabled: !!classId && !!folderId }
  );
  
  // Mutations
  const createFolderMutation = trpc.folder.create.useMutation({
    onSuccess: () => {
      toast.success("Folder created successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });
  
  const deleteFolderMutation = trpc.folder.delete.useMutation({
    onSuccess: () => {
      toast.success("Folder deleted successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });
  
  const renameFolderMutation = trpc.folder.update.useMutation({
    onSuccess: () => {
      toast.success("Folder renamed successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });
  
  const uploadFilesMutation = trpc.folder.uploadFiles.useMutation({
    onSuccess: () => {
      toast.success("Files uploaded successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });
  
  const deleteFileMutation = trpc.file.delete.useMutation({
    onSuccess: () => {
      toast.success("File deleted successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });
  
  const renameFileMutation = trpc.file.rename.useMutation({
    onSuccess: () => {
      toast.success("File renamed successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });
  
  const moveFileMutation = trpc.file.move.useMutation({
    onSuccess: () => {
      toast.success("File moved successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });
  
  const moveFolderMutation = trpc.folder.move.useMutation({
    onSuccess: () => {
      toast.success("Folder moved successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });
  
  const getSignedUrlMutation = trpc.file.getSignedUrl.useMutation();
  
  // Check if user is teacher
  const isTeacher = appState.user.teacher;

  // Transform API data to FileItem format
  const transformFolderToFileItem = (folder: ApiFolderGetFolder): FileItem => ({
    id: folder.id,
    name: folder.name,
    type: "folder" as const,
    itemCount: (folder._count?.childFolders || 0) + (folder._count?.files || 0),
    lastModified: new Date().toISOString(),
    color: folder.color || "#3b82f6",
    readonly: !isTeacher,
  });
  
  const transformFileToFileItem = (file: ApiFolderGetFile): FileItem => ({
    id: file.id,
    name: file.name,
    type: "file" as const,
    fileType: file.type.split('/')[1] || file.name.split('.').pop(),
    size: formatFileSize(file.size || 0),
    uploadedBy: "Unknown",
    uploadedAt: new Date().toISOString(),
    readonly: !isTeacher,
  });
  
  // Get current folder content
  const getCurrentFolderContent = (): FileItem[] => {
    const folders = currentFolder?.childFolders?.map(transformFolderToFileItem) || [];
    const files = currentFolder?.files?.map(transformFileToFileItem) || [];
    return [...folders, ...files];
  };

  const currentItems = getCurrentFolderContent();
  
  const filteredItems = currentItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Helper function to format file size
  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getFolderColor = (folderId: string) => {
    const colors = [
      "text-blue-500",
      "text-green-500", 
      "text-purple-500",
      "text-orange-500",
      "text-pink-500",
      "text-indigo-500",
      "text-teal-500",
      "text-red-500"
    ];
    const index = parseInt(folderId) % colors.length;
    return colors[index];
  };

  // External handlers for all file/folder operations
  const fileHandlers: FileHandlers = {
    onFolderClick: (folderName: string) => {
      // Find the folder by name to get its ID
      const folder = currentItems.find(item => item.name === folderName && item.type === "folder");
      if (folder) {
        router.push(`/class/${classId}/files/${folder.id}`);
      }
    },

    onFileClick: (file: FileItem) => {
      if (file.type === "file") {
        setPreviewFile(file);
        setIsPreviewOpen(true);
      }
    },

    onDownload: async (item: FileItem) => {
      if (!isTeacher && ["modify", "delete", "move"].includes("download")) {
        toast.error("Permission denied");
        return;
      }
      
      try {
        const result = await getSignedUrlMutation.mutateAsync({ fileId: item.id });
        window.open(result.url, '_blank');
        toast.success("Download started");
      } catch (error) {
        toast.error("Download failed");
        throw error;
      }
    },

    onShare: async (item: FileItem) => {
      try {
        const result = await getSignedUrlMutation.mutateAsync({ fileId: item.id });
        await navigator.clipboard.writeText(result.url);
        toast.success("Share link copied");
      } catch (error) {
        toast.error("Share failed");
        throw error;
      }
    },

    onRename: async (item: FileItem, newName: string, color?: string) => {
      if (!isTeacher) {
        toast.error("Permission denied");
        return;
      }

      // If called with the same name and no color change, open the rename modal
      if (newName === item.name && (!color || color === item.color)) {
        setRenameItem(item);
        setIsRenameOpen(true);
        return;
      }

      try {
        if (item.type === "folder") {
          // For folders, we can change name and/or color
          await renameFolderMutation.mutateAsync({ 
            classId, 
            folderId: item.id, 
            name: newName,
            color: color || item.color || getFolderColor(item.id)
          });
        } else {
          // For files, only rename (no color)
          if (newName !== item.name) {
            await renameFileMutation.mutateAsync({ classId, fileId: item.id, newName });
          }
        }
      } catch (error) {
        throw error;
      }
    },

    onDelete: async (item: FileItem) => {
      if (!isTeacher) {
        toast.error("Permission denied");
        return;
      }

      try {
        if (item.type === "folder") {
          await deleteFolderMutation.mutateAsync({ classId, folderId: item.id });
        } else {
          await deleteFileMutation.mutateAsync({ classId, fileId: item.id });
        }
      } catch (error) {
        throw error;
      }
    },

    onMove: async (draggedItemId: string, targetFolderId: string, draggedItemType: string) => {
      if (!isTeacher) {
        toast.error("Permission denied");
        return;
      }

      try {
        if (draggedItemType === "folder") {
          await moveFolderMutation.mutateAsync({
            classId,
            folderId: draggedItemId,
            targetParentFolderId: targetFolderId
          });
        } else {
          await moveFileMutation.mutateAsync({
            classId,
            fileId: draggedItemId,
            targetFolderId: targetFolderId
          });
        }
      } catch (error) {
        throw error;
      }
    },

    onPreview: (file: FileItem) => {
      setPreviewFile(file);
      setIsPreviewOpen(true);
    },

    onRefresh: () => {
      refetch();
    }
  };

  const handleModify = (item: FileItem, newName: string, color?: string) => {
    fileHandlers.onRename(item, newName, color);
  };

  const handleCreateFolder = async (folderData: { name: string; description?: string; color?: string }) => {
    try {
      await createFolderMutation.mutateAsync({
        classId,
        name: folderData.name,
        parentFolderId: folderId,
        color: folderData.color || "#3b82f6" // Default blue color
      });
    } catch (error) {
      // Error handling is done by the mutation hook
      throw error;
    }
  };

  const handleUploadFiles = (files: RouterInputs['folder']['uploadFiles']['files']) => {
    const apiFiles = files.map(file => ({
      name: file.name,
      type: file.type,
      size: file.size,
      data: file.data || ''
    }));
    
    uploadFilesMutation.mutate({
      classId,
      folderId: folderId,
      files: apiFiles
    });
  };

  const selectedCount = selectedItems.length;
  const isLoading = folderLoading;
  const hasError = folderError;

  if (!currentFolder && !isLoading) {
    return (
      <PageLayout>
        <div className="text-center py-16">
          <h1 className="text-2xl font-bold mb-4">Folder Not Found</h1>
          <p className="text-muted-foreground mb-6">The requested folder could not be found.</p>
          <Button onClick={() => router.push(`/class/${classId}/files`)}>
            Back to Files
          </Button>
        </div>
      </PageLayout>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <PageLayout>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">{currentFolder?.name || "Loading..."}</h1>
            <p className="text-muted-foreground">Folder contents</p>
          </div>
          
          {isTeacher && (
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCreateFolderModalOpen(true)}
                disabled={createFolderMutation.isPending}
              >
                {createFolderMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FolderPlus className="h-4 w-4 mr-2" />
                )}
                New Folder
              </Button>
              <UploadFileModal 
                currentFolder={folderId}
                onFilesUploaded={handleUploadFiles}
              >
                <Button size="sm" disabled={uploadFilesMutation.isPending}>
                  {uploadFilesMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  Upload
                </Button>
              </UploadFileModal>
            </div>
          )}
        </div>

        {/* Error Alert */}
        {hasError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load folder contents. Please try again later.
            </AlertDescription>
          </Alert>
        )}

        {/* Breadcrumbs */}
        <div className="flex items-center space-x-1 mb-4 text-sm">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/class/${classId}/files`)}
            className="h-auto p-1 font-medium hover:bg-muted"
          >
            Class Files
          </Button>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-1 font-medium hover:bg-muted cursor-default"
            disabled
          >
            {currentFolder?.name || "Loading..."}
          </Button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search in folder"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-80"
              />
            </div>
            
            {selectedCount > 0 && (
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">{selectedCount} selected</Badge>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button variant="outline" size="sm">
                  <Share className="h-4 w-4 mr-2" />
                  Share
                </Button>
                <Button variant="outline" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>File Type</DropdownMenuLabel>
                <DropdownMenuCheckboxItem>Documents</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem>Images</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem>Videos</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem>Presentations</DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  Sort
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setSortBy("name")}>
                  Name
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("modified")}>
                  Last modified
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("size")}>
                  File size
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex items-center border rounded-md">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        {isLoading || !folderId ? (
          /* Loading State */
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="p-4">
                  <Skeleton className="h-12 w-12 mx-auto mb-3" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-3 w-2/3 mx-auto" />
                </Card>
              ))}
            </div>
          </div>
        ) : filteredItems.length > 0 ? (
          viewMode === "grid" ? (
            /* Grid View */
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
              {filteredItems.map((item) => (
                item.type === "folder" ? (
                  <DroppableFolderItem
                    key={item.id}
                    item={item}
                    classId={classId}
                    readonly={item.readonly}
                    handlers={fileHandlers}
                    getFolderColor={getFolderColor}
                    getFileIcon={getFileIcon}
                    currentFolderId={folderId}
                  />
                ) : (
                  <DraggableFileItem
                    key={item.id}
                    item={item}
                    classId={classId}
                    readonly={item.readonly}
                    handlers={fileHandlers}
                    getFileIcon={getFileIcon}
                    currentFolderId={folderId}
                  />
                )
              ))}
            </div>
          ) : (
            /* List View */
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Last modified</TableHead>
                    <TableHead>File size</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => (
                    <DraggableTableRow
                      key={item.id}
                      item={item}
                      classId={classId}
                      readonly={item.readonly}
                      handlers={fileHandlers}
                      getFolderColor={getFolderColor}
                      getFileIcon={getFileIcon}
                      formatDate={formatDate}
                      currentFolderId={folderId}
                    />
                  ))}
                </TableBody>
              </Table>
            </Card>
          )
        ) : (
          /* Empty State */
          <div className="space-y-6">
            <EmptyState
              icon={HardDrive}
              title={searchQuery ? "No files found" : "This folder is empty"}
              description={searchQuery 
                ? `No files match "${searchQuery}". Try a different search term.`
                : "Upload files or create folders to organize your materials."
              }
            />
            {isTeacher && (
              <div className="flex justify-center space-x-3">
                <UploadFileModal 
                  currentFolder={folderId}
                  onFilesUploaded={handleUploadFiles}
                >
                  <Button disabled={uploadFilesMutation.isPending}>
                    {uploadFilesMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    Upload Files
                  </Button>
                </UploadFileModal>
                <Button 
                  variant="outline"
                  onClick={() => setCreateFolderModalOpen(true)}
                  disabled={createFolderMutation.isPending}
                >
                  {createFolderMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <FolderPlus className="h-4 w-4 mr-2" />
                  )}
                  Create Folder
                </Button>
              </div>
            )}
          </div>
        )}

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
              case "modify":
                await fileHandlers.onRename(item, item.name);
                break;
              case "delete":
                await fileHandlers.onDelete(item);
                break;
            }
          }}
          getPreviewUrl={async (fileId: string) => {
            const result = await getSignedUrlMutation.mutateAsync({ fileId });
            return result.url;
          }}
        />

        {/* Rename Modal */}
        <RenameModal
          item={renameItem}
          isOpen={isRenameOpen}
          onClose={() => setIsRenameOpen(false)}
          onRename={handleModify}
        />

        {/* Create Folder Modal */}
        <CreateFolderModal
          open={createFolderModalOpen}
          onOpenChange={setCreateFolderModalOpen}
          onFolderCreated={handleCreateFolder}
          isLoading={createFolderMutation.isPending}
        />
      </PageLayout>
    </DndProvider>
  );
}
