import { useState } from "react";
import { useDrag } from "react-dnd";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { RouterOutputs, trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Download,
  MoreHorizontal,
  Share,
  Edit,
  Trash2,
  Eye,
  Folder,
  GripVertical,
  Check,
  X,
  Move
} from "lucide-react";
import ColorPicker from "@/components/ui/color-picker";
import { MoveItemDropdown } from "@/components/MoveItemDropdown";

type ApiFile = NonNullable<RouterOutputs["folder"]["getRootFolder"]>["files"][number];

export interface FileItem {
  id: string;
  name: string;
  type: "file" | "folder";
  fileType?: string;
  size?: string;
  uploadedBy?: string;
  uploadedAt?: string;
  itemCount?: number;
  lastModified?: string;
  children?: FileItem[];
}

interface DraggableFileItemProps {
  item: FileItem;
  getFileIcon: (fileType: string, size?: "sm" | "lg") => React.ReactNode;
  onItemAction: (action: string, item: FileItem) => void;
  onFileClick?: (file: FileItem) => void;
  classId: string;
  currentFolderId?: string;
  readonly?: boolean;
  onRefetch?: () => void;
}

export function DraggableFileItem({ 
  item, 
  getFileIcon, 
  onItemAction,
  onFileClick,
  classId,
  currentFolderId,
  readonly = false,
  onRefetch
}: DraggableFileItemProps) {
  const [{ isDragging }, drag] = useDrag({
    type: "file",
    item: { id: item.id, name: item.name, type: item.type },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  // Local state for dialogs
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [newName, setNewName] = useState(item.name);

  // tRPC mutations
  const renameFileMutation = trpc.file.rename.useMutation({
    onSuccess: () => {
      toast.success("File renamed successfully");
      setShowRenameDialog(false);
      onRefetch?.();
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const renameFolderMutation = trpc.folder.update.useMutation({
    onSuccess: () => {
      toast.success("Folder renamed successfully");
      setShowRenameDialog(false);
      onRefetch?.();
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const deleteFileMutation = trpc.file.delete.useMutation({
    onSuccess: () => {
      toast.success("File deleted successfully");
      setShowDeleteDialog(false);
      onRefetch?.();
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const deleteFolderMutation = trpc.folder.delete.useMutation({
    onSuccess: () => {
      toast.success("Folder deleted successfully");
      setShowDeleteDialog(false);
      onRefetch?.();
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const handleRename = () => {
    if (!newName.trim() || newName.trim() === item.name) {
      setShowRenameDialog(false);
      setNewName(item.name);
      return;
    }

    if (item.type === "file") {
      renameFileMutation.mutate({ classId, fileId: item.id, newName: newName.trim() });
    }
  };

  const handleDelete = () => {
    if (item.type === "file") {
      deleteFileMutation.mutate({ classId, fileId: item.id });
    } else if (item.type === "folder") {
      deleteFolderMutation.mutate({ classId, folderId: item.id });
    }
  };

  const isLoading = renameFileMutation.isPending || renameFolderMutation.isPending || 
                   deleteFileMutation.isPending || deleteFolderMutation.isPending;

  return (
    <div 
      ref={drag as unknown as React.Ref<HTMLDivElement>} 
      className={`group relative rounded-lg border border-transparent hover:border-border hover:shadow-sm transition-all duration-200 bg-background ${
        isDragging ? 'opacity-50' : 'opacity-100'
      }`}
      onDoubleClick={() => {
        if (item.type === "file" && onFileClick) {
          onFileClick(item);
        }
      }}
    >
      <div className="p-3 flex flex-col items-center">
        {/* Drag Handle */}
        <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
        </div>

        {/* Icon and Star */}
        <div className="relative mb-2 flex justify-center">
            <div className="relative">
              <div className="mb-2">
                {getFileIcon(item.fileType!, "lg")}
              </div>
            </div>
        </div>
        
        {/* File Name */}
        <div className="w-full text-center">
          <p className="text-xs font-medium text-foreground truncate leading-tight mb-1" title={item.name}>
            {item.name}
          </p>
          <p className="text-xs text-muted-foreground">
            {item.type === "folder" 
              ? `${item.itemCount} items`
              : item.size
            }
          </p>
        </div>
      </div>

      {/* Actions Menu */}
      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 bg-background/80 backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {item.type === "file" && (
              <>
                <DropdownMenuItem onClick={() => onItemAction("download", item)}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onFileClick?.(item)}>
                  <Eye className="mr-2 h-4 w-4" />
                  Preview
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuItem onClick={() => onItemAction("share", item)}>
              <Share className="mr-2 h-4 w-4" />
              Share
            </DropdownMenuItem>
            {!readonly && (
              <>
                <DropdownMenuItem 
                  onClick={() => {
                    setNewName(item.name);
                    setShowRenameDialog(true);
                  }}
                  disabled={isLoading}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Rename
                </DropdownMenuItem>
                <MoveItemDropdown
                  itemId={item.id}
                  itemName={item.name}
                  itemType={item.type}
                  classId={classId}
                  currentFolderId={currentFolderId}
                  onSuccess={onRefetch}
                  onOpenChange={(open) => {
                    if (open) {
                      setDropdownOpen(false);
                    }
                  }}
                />
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={isLoading}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Rename Dialog */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{item.type === "folder" ? "Edit folder" : "Rename file"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleRename();
                  }
                }}
                disabled={isLoading}
                placeholder="Enter new name"
              />
            </div>

          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowRenameDialog(false);
                setNewName(item.name);
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleRename}
              disabled={isLoading || !newName.trim()}
            >
              {isLoading ? (item.type === "folder" ? "Saving..." : "Renaming...") : (item.type === "folder" ? "Save Changes" : "Rename")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {item.type}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{item.name}"? 
              {item.type === "folder" && " This will also delete all files and folders inside it."}
              {" "}This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}