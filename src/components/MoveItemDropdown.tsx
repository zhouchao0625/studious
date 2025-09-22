import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Move,
  Folder,
  ChevronLeft,
  Home,
  Check,
  Loader2,
  FolderOpen,
  ChevronRight,
} from "lucide-react";

interface SimpleFolder {
  id: string;
  name: string;
  color?: string;
}

interface MoveItemDropdownProps {
  itemId: string;
  itemName: string;
  itemType: "file" | "folder";
  classId: string;
  currentFolderId?: string;
  onSuccess?: () => void;
  onOpenChange?: (open: boolean) => void;
}

export function MoveItemDropdown({
  itemId,
  itemName,
  itemType,
  classId,
  currentFolderId,
  onSuccess,
  onOpenChange,
}: MoveItemDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [currentFolderId_nav, setCurrentFolderId_nav] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<SimpleFolder[]>([]);

  // Fetch current folder's children
  const { data: currentFolderData, isLoading } = currentFolderId_nav 
    ? trpc.folder.get.useQuery({ classId, folderId: currentFolderId_nav }, { enabled: isOpen })
    : trpc.folder.getRootFolder.useQuery({ classId }, { enabled: isOpen });

  // Move mutations
  const moveFileMutation = trpc.file.move.useMutation({
    onSuccess: () => {
      toast.success(`${itemName} moved successfully`);
      setIsOpen(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const moveFolderMutation = trpc.folder.move.useMutation({
    onSuccess: () => {
      toast.success(`${itemName} moved successfully`);
      setIsOpen(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleOpenMove = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onOpenChange?.(false);
    setTimeout(() => {
      setIsOpen(true);
      setCurrentFolderId_nav(null);
      setBreadcrumbs([]);
      setSelectedFolderId(null);
    }, 100);
  };

  const handleFolderClick = (folder: SimpleFolder) => {
    setCurrentFolderId_nav(folder.id);
    setBreadcrumbs([...breadcrumbs, folder]);
  };

  const handleBreadcrumbClick = (index: number) => {
    if (index === -1) {
      // Root
      setCurrentFolderId_nav(null);
      setBreadcrumbs([]);
    } else {
      const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
      setBreadcrumbs(newBreadcrumbs);
      setCurrentFolderId_nav(newBreadcrumbs[newBreadcrumbs.length - 1]?.id || null);
    }
  };

  const handleMove = () => {
    if (itemType === "file") {
      moveFileMutation.mutate({
        fileId: itemId,
        targetFolderId: selectedFolderId!,
        classId,
      });
    } else {
      moveFolderMutation.mutate({
        folderId: itemId,
        targetParentFolderId: selectedFolderId!,
        classId,
      });
    }
  };

  const folders = currentFolderData?.childFolders?.filter(f => 
    itemType !== "folder" || f.id !== itemId
  ).map(f => ({ id: f.id, name: f.name, color: f.color })) || [];

  const canMoveHere = selectedFolderId !== currentFolderId;

  return (
    <>
      <div 
        className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
        onClick={handleOpenMove}
      >
        <Move className="mr-2 h-4 w-4" />
        Move
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[450px] max-h-[600px]">
          <DialogHeader className="pb-4">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Move className="h-5 w-5 text-primary" />
              </div>
              Move "{itemName}"
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Breadcrumbs */}
            <div className="flex items-center text-sm bg-gradient-to-r from-muted/50 to-muted/30 p-3 rounded-lg border">
              <button 
                onClick={() => handleBreadcrumbClick(-1)} 
                className="flex items-center gap-1 px-2 py-1 rounded hover:bg-background/60 transition-colors"
              >
                <Home className="h-4 w-4 text-primary" />
                <span className="font-medium">Root</span>
              </button>
              {breadcrumbs.map((crumb, index) => (
                <div key={crumb.id} className="flex items-center">
                  <ChevronRight className="h-3 w-3 mx-1 text-muted-foreground" />
                  <button 
                    onClick={() => handleBreadcrumbClick(index)}
                    className="px-2 py-1 rounded hover:bg-background/60 transition-colors truncate max-w-[120px]"
                    title={crumb.name}
                  >
                    {crumb.name}
                  </button>
                </div>
              ))}
            </div>

            {/* Current Location */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FolderOpen className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    {currentFolderId_nav ? breadcrumbs[breadcrumbs.length - 1]?.name : "Root Folder"}
                  </p>
                  <p className="text-xs text-muted-foreground">Current location</p>
                </div>
              </div>
              <Button
                variant={selectedFolderId === currentFolderId_nav ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedFolderId(currentFolderId_nav)}
                className="min-w-[80px]"
              >
                {selectedFolderId === currentFolderId_nav ? (
                  <>
                    <Check className="h-3 w-3 mr-1" />
                    Selected
                  </>
                ) : (
                  "Select"
                )}
              </Button>
            </div>

            {/* Folder List */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Folder className="h-4 w-4" />
                <span>Available folders</span>
              </div>
              <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">Loading folders...</p>
                    </div>
                  </div>
                ) : folders.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <div className="p-3 bg-muted/50 rounded-full">
                        <FolderOpen className="h-6 w-6 text-muted-foreground/50" />
                      </div>
                      <p className="text-sm text-muted-foreground">No folders here</p>
                    </div>
                  </div>
                ) : (
                  folders.map((folder) => {
                    const isSelected = selectedFolderId === folder.id;
                    return (
                      <div 
                        key={folder.id} 
                        className={`group flex items-center justify-between p-3 border rounded-lg transition-all duration-200 hover:shadow-sm ${
                          isSelected 
                            ? 'bg-primary/5 border-primary/30 shadow-sm' 
                            : 'hover:bg-muted/30 hover:border-border'
                        }`}
                      >
                        <button
                          onClick={() => handleFolderClick(folder as SimpleFolder)}
                          className="flex items-center gap-3 flex-1 text-left min-w-0"
                        >
                          <div className="flex-shrink-0">
                            <Folder 
                              className="h-5 w-5 fill-current transition-colors" 
                              style={{ color: folder.color || '#3b82f6' }}
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium truncate">{folder.name}</p>
                            <p className="text-xs text-muted-foreground">Click to open</p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                        </button>
                        <Button
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFolderId(folder.id);
                          }}
                          className="ml-2 min-w-[70px]"
                        >
                          {isSelected ? (
                            <>
                              <Check className="h-3 w-3 mr-1" />
                              Selected
                            </>
                          ) : (
                            "Select"
                          )}
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                {selectedFolderId ? "Ready to move" : "Select a destination"}
              </p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsOpen(false)}
                  disabled={moveFileMutation.isPending || moveFolderMutation.isPending}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleMove} 
                  disabled={!selectedFolderId || !canMoveHere || moveFileMutation.isPending || moveFolderMutation.isPending}
                  className="min-w-[100px]"
                >
                  {(moveFileMutation.isPending || moveFolderMutation.isPending) ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Moving...
                    </>
                  ) : (
                    <>
                      <Move className="h-4 w-4 mr-2" />
                      Move Here
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
