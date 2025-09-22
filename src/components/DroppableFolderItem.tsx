import { useState, useRef } from "react";
import { useDrop, useDrag } from "react-dnd";
import { Button } from "@/components/ui/button";
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
import { trpc } from "@/lib/trpc";
import {
  MoreHorizontal,
  Share,
  Edit,
  Star,
  Trash2,
  Folder,
  GripVertical,
  Check,
  X,
  Move
} from "lucide-react";
import { MoveItemDropdown } from "@/components/MoveItemDropdown";
import { toast } from "sonner";
interface FileItem {
  id: string;
  name: string;
  type: "file" | "folder";
  fileType?: string;
  size?: string;
  uploadedBy?: string;
  uploadedAt?: string;
  itemCount?: number;
  color?: string;
  lastModified?: string;
  starred?: boolean;
  children?: FileItem[];
}

interface DroppableFolderItemProps {
  item: FileItem;
  getFolderColor: (folderId: string) => string;
  onFolderClick: (folderName: string) => void;
  onItemAction: (action: string, item: FileItem) => void;
  classId: string;
  currentFolderId?: string;
  readonly?: boolean;
  onRefetch?: () => void;
}

export function DroppableFolderItem({ 
  item, 
  getFolderColor, 
  onFolderClick, 
  onItemAction,
  classId,
  currentFolderId,
  readonly = false,
  onRefetch
}: DroppableFolderItemProps) {
  
  // Local state for dialogs
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // tRPC mutations

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

  const moveFolderMutation = trpc.folder.move.useMutation({
    onSuccess: () => {
      toast.success("Folder moved successfully");
      onRefetch?.();
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const moveFileMutation = trpc.file.move.useMutation({
    onSuccess: () => {
      toast.success("File moved successfully");
      onRefetch?.();
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });


  const handleDelete = () => {
    deleteFolderMutation.mutate({ classId, folderId: item.id });
  };

  const handleMoveItem = (draggedItemId: string, draggedItemType: string) => {
    if (draggedItemType === "folder") {
      moveFolderMutation.mutate({ 
        classId, 
        folderId: draggedItemId, 
        targetParentFolderId: item.id 
      });
    } else {
      moveFileMutation.mutate({ 
        classId, 
        fileId: draggedItemId, 
        targetFolderId: item.id 
      });
    }
  };

  const isLoading = deleteFolderMutation.isPending ||
                   moveFolderMutation.isPending || moveFileMutation.isPending;

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: "file",
    drop: (draggedItem: { id: string; name: string; type: string }) => {
      if (draggedItem.id !== item.id) {
        handleMoveItem(draggedItem.id, draggedItem.type);
      }
    },
    canDrop: (draggedItem) => draggedItem.id !== item.id, // Can't drop on itself
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const [{ isDragging }, drag] = useDrag({
    type: "file",
    item: { id: item.id, name: item.name, type: item.type },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const ref = useRef<HTMLDivElement>(null);
  drag(drop(ref));

  return (
    <div 
      ref={ref}
      className={`group relative rounded-lg border transition-all duration-200 bg-background ${
        isDragging ? 'opacity-50' : ''
      } ${
        isOver && canDrop 
          ? 'border-primary bg-primary/5 shadow-md' 
          : 'border-transparent hover:border-border hover:shadow-sm'
      }`}
      onDoubleClick={() => onFolderClick(item.name)}
    >
      <div className="p-3 flex flex-col items-center">
        {/* Drag Handle */}
        <div 
          ref={drag as unknown as React.Ref<HTMLDivElement>}
          className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-move"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>

        {/* Drop indicator */}
        {isOver && canDrop && (
          <div className="absolute inset-0 flex items-center justify-center bg-primary/10 rounded-lg border-2 border-dashed border-primary">
            <span className="text-primary font-medium text-sm">Drop here</span>
          </div>
        )}

        {/* Icon and Star */}
        <div className="relative mb-2 flex justify-center">
          <div className="relative">
            <Folder className={`h-8 w-8  fill-current drop-shadow-sm`} style={{ color: item.color }} />
            {item.starred && (
              <Star className="h-3 w-3 text-yellow-500 fill-current absolute -top-0.5 -right-0.5" />
            )}
          </div>
        </div>
        
        {/* Folder Name */}
        <div className="w-full text-center">
          <p className="text-xs font-medium text-foreground truncate leading-tight mb-1" title={item.name}>
            {item.name}
          </p>
          <p className="text-xs text-muted-foreground">
            {item.itemCount} items
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
            <DropdownMenuItem onClick={() => onItemAction("share", item)}>
              <Share className="mr-2 h-4 w-4" />
              Share
            </DropdownMenuItem>
            {!readonly && (
              <>
                <DropdownMenuItem 
                  onClick={() => {
                    onItemAction("modify", item);
                  }}
                  disabled={isLoading}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Modify
                </DropdownMenuItem>
                 <DropdownMenuItem onClick={() => onItemAction("star", item)}>
                   <Star className="mr-2 h-4 w-4" />
                   {item.starred ? "Remove star" : "Add star"}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Folder</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{item.name}"? This will also delete all files and folders inside it. This action cannot be undone.
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

