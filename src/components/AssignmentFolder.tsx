import { useDrop, useDrag } from "react-dnd";
import { useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, Folder, FolderOpen, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { DraggableAssignment } from "./DraggableAssignment";
import { DroppableAssignmentSlot } from "./DroppableAssignmentSlot";
import { RouterOutputs } from "@/lib/trpc";

type Assignment = RouterOutputs['assignment']['get'];
interface AssignmentFolderProps {
  folder: {
    id: string;
    name: string;
    color: string;
    assignments: Assignment[];
  };
  classId: string;
  isOpen: boolean;
  onToggle: () => void;
  onMoveAssignment: (assignmentId: string, targetFolderId: string | null, targetIndex?: number) => void;
  onReorderAssignmentInSection?: (assignmentId: string, sectionId: string, targetIndex: number) => void;
  onEditSection?: (section: { id: string; name: string; color: string }) => void;
  onDeleteSection?: (sectionId: string) => void;
  onDeleteAssignment?: (assignmentId: string) => void;
  index?: number;
}

export function AssignmentFolder({ 
  folder, 
  classId, 
  isOpen, 
  onToggle, 
  onMoveAssignment,
  onReorderAssignmentInSection,
  onEditSection,
  onDeleteSection,
  onDeleteAssignment,
  index 
}: AssignmentFolderProps) {
  const [{ isOver }, drop] = useDrop({
    accept: "assignment",
    drop: (item: { id: string }, monitor) => {
      if (monitor.didDrop()) return; // Already handled by child
      onMoveAssignment(item.id, folder.id);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  const [{ isDragging }, drag] = useDrag({
    type: "folder",
    item: { id: folder.id, type: "folder", index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const handleAssignmentMove = (assignmentId: string, targetFolderId: string | null, targetIndex?: number) => {
    // If target folder is the same as current folder, it's a reorder within section
    if (targetFolderId === folder.id && onReorderAssignmentInSection && targetIndex !== undefined) {
      onReorderAssignmentInSection(assignmentId, folder.id, targetIndex);
    } else {
      // Otherwise, it's a move between sections
      onMoveAssignment(assignmentId, targetFolderId, targetIndex);
    }
  };

  const ref = useRef<HTMLDivElement>(null);
  drag(drop(ref));

  return (
    <div ref={ref} className={`transition-opacity ${isDragging ? 'opacity-50' : 'opacity-100'}`}>
      <Collapsible open={isOpen} onOpenChange={onToggle}>
        <Card className={`transition-all duration-200 bg-card cursor-move ${isOver ? 'ring-2 ring-primary shadow-lg' : ''}`}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3 px-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full`} style={{ backgroundColor: folder.color }} />
                  <CardTitle className="text-sm font-bold">
                    {folder.name}
                  </CardTitle>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">
                    {folder.assignments.length} assignment{folder.assignments.length !== 1 ? 's' : ''}
                  </Badge>
                  {isOver && (
                    <Badge variant="outline" className="bg-primary/10 text-primary">
                      Drop here
                    </Badge>
                  )}
                  
                  {/* Section Actions */}
                  {(onEditSection || onDeleteSection) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 hover:bg-muted"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {onEditSection && (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditSection({ id: folder.id, name: folder.name, color: folder.color });
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Section
                          </DropdownMenuItem>
                        )}
                        {onDeleteSection && (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteSection(folder.id);
                            }}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Section
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 px-4 pb-3">
              <div className="space-y-2">
                {folder.assignments.map((assignment, index) => (
                  <DroppableAssignmentSlot
                    key={assignment.id}
                    index={index}
                    folderId={folder.id}
                    onMoveAssignment={handleAssignmentMove}
                  >
                    <DraggableAssignment
                      assignment={assignment}
                      classId={classId}
                      index={index}
                      onDelete={onDeleteAssignment}
                    />
                  </DroppableAssignmentSlot>
                ))}
                {folder.assignments.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    <Folder className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Empty folder - drag assignments here</p>
                  </div>
                )}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
}