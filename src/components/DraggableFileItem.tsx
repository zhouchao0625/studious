import { useState } from "react";
import { useDrag } from "react-dnd";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Download,
  MoreHorizontal,
  Share,
  Edit,
  Trash2,
  Eye,
  GripVertical,
  Star,
  Move
} from "lucide-react";
import { GridFileComponentProps } from "@/lib/types/file";
import { MoveItemDropdown } from "@/components/MoveItemDropdown";

export function DraggableFileItem({ 
  item, 
  classId,
  currentFolderId,
  readonly = false,
  handlers,
  getFileIcon,
  getFolderColor
}: GridFileComponentProps) {
  const [{ isDragging }, drag] = useDrag({
    type: "file",
    item: { id: item.id, name: item.name, type: item.type },
    canDrag: !readonly && !item.readonly,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleAction = async (action: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDropdownOpen(false);
    
    try {
      switch (action) {
        case "download":
          await handlers.onDownload(item);
          break;
        case "share":
          await handlers.onShare(item);
          break;
        case "rename":
          // This will trigger external rename modal/dialog
          await handlers.onRename(item, item.name);
          break;
        case "delete":
          await handlers.onDelete(item);
          break;
        case "star":
          if (handlers.onStar) {
            await handlers.onStar(item);
          }
          break;
        case "preview":
          if (handlers.onPreview) {
            handlers.onPreview(item);
          }
          break;
      }
    } catch (error) {
      // Error handling is done by the handlers
      console.error(`Action ${action} failed:`, error);
    }
  };

  return (
    <div 
      ref={drag as unknown as React.Ref<HTMLDivElement>} 
      className={`group relative rounded-lg border border-transparent hover:border-border hover:shadow-sm transition-all duration-200 bg-background ${
        isDragging ? 'opacity-50' : 'opacity-100'
      }`}
      onDoubleClick={() => {
        if (item.type === "file" && handlers.onFileClick) {
          handlers.onFileClick(item);
        }
      }}
    >
      <div className="p-3 flex flex-col items-center">
        {/* Drag Handle */}
        {!readonly && !item.readonly && (
          <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
          </div>
        )}

        {/* Icon and Star */}
        <div className="relative mb-2 flex justify-center">
          <div className="relative">
            <div className="mb-2">
              {getFileIcon(item.fileType!, "lg")}
            </div>
            {item.starred && (
              <Star className="h-3 w-3 text-yellow-500 fill-current absolute -top-0.5 -right-0.5" />
            )}
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
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 w-6 p-0 bg-background/80 backdrop-blur-sm" 
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {item.type === "file" && (
              <>
                <DropdownMenuItem onClick={(e) => handleAction("download", e)}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => handleAction("preview", e)}>
                  <Eye className="mr-2 h-4 w-4" />
                  Preview
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuItem onClick={(e) => handleAction("share", e)}>
              <Share className="mr-2 h-4 w-4" />
              Share
            </DropdownMenuItem>
            {!readonly && !item.readonly && (
              <>
                <DropdownMenuItem onClick={(e) => handleAction("rename", e)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Rename
                </DropdownMenuItem>
                <MoveItemDropdown
                  itemId={item.id}
                  itemName={item.name}
                  itemType={item.type}
                  classId={classId}
                  currentFolderId={currentFolderId}
                  onSuccess={() => handlers.onRefresh?.()}
                  onOpenChange={(open) => {
                    if (open) {
                      setDropdownOpen(false);
                    }
                  }}
                />
                {handlers.onStar && (
                  <DropdownMenuItem onClick={(e) => handleAction("star", e)}>
                    <Star className="mr-2 h-4 w-4" />
                    {item.starred ? "Remove star" : "Add star"}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={(e) => handleAction("delete", e)}
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
    </div>
  );
}