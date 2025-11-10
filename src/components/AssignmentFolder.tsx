import { useDrop, useDrag } from "react-dnd";
import { useRef, useEffect } from "react";
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
import { DroppableAssignmentSlot, SectionDropZone } from "./DroppableAssignmentSlot";
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
  onPublishAssignment?: (assignmentId: string) => void;
  isTeacher?: boolean;
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
  onPublishAssignment,
  isTeacher,
  index
}: AssignmentFolderProps) {
  // Make the card droppable for visual feedback and as fallback drop target
  const cardRef = useRef<HTMLDivElement>(null);
  const [{ isOver, draggedItem, canDrop }, dropCard] = useDrop({
    accept: "assignment",
    drop: (item: { id: string }, monitor) => {
      // Only handle if not already handled by a child drop zone (SectionDropZone)
      if (monitor.didDrop()) return;
      // Move to section (default position) - fallback for drops on card/header
      onMoveAssignment(item.id, folder.id);
    },
    collect: (monitor) => ({
      // Show visual feedback when over the card
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
      draggedItem: monitor.getItem() as { id: string; type?: string; index?: number } | null,
    }),
  });

  // Auto-expand section when dragging assignment over it
  useEffect(() => {
    if (isOver && canDrop && !isOpen && draggedItem) {
      onToggle();
    }
  }, [isOver, canDrop, isOpen, draggedItem, onToggle]);

  const [{ isDragging }, drag] = useDrag({
    type: "folder",
    item: { id: folder.id, type: "folder", index },
    canDrag: isTeacher,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const handleAssignmentMove = (assignmentId: string, targetFolderId: string | null, targetIndex?: number) => {
    // Always use the parent's move handler which handles both moving and reordering
    // It will check if the assignment is already in this section and handle accordingly
    onMoveAssignment(assignmentId, targetFolderId, targetIndex);
  };

  const ref = useRef<HTMLDivElement>(null);
  if (isTeacher) {
    drag(ref);
  }
  dropCard(cardRef);

  return (
    <div ref={ref} className={`transition-opacity ${isDragging ? 'opacity-50' : 'opacity-100'}`}>
      <Collapsible open={isOpen} onOpenChange={onToggle}>
        <Card 
          ref={cardRef as unknown as React.Ref<HTMLDivElement>}
          className={`transition-all duration-200 bg-card ${isTeacher ? 'cursor-move' : ''} ${
            isOver && canDrop 
              ? 'ring-2 ring-primary shadow-lg bg-primary/5 border-primary' 
              : isOver 
              ? 'ring-1 ring-muted' 
              : ''
          }`}
        >
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
              <div className="space-y-0">
                {/* Top drop zone for section */}
                <SectionDropZone
                  index={0}
                  folderId={folder.id}
                  onMoveAssignment={handleAssignmentMove}
                  isTeacher={isTeacher}
                />
                
                {folder.assignments.length > 0 ? (
                  folder.assignments.map((assignment, index) => (
                    <div key={assignment.id}>
                      <DroppableAssignmentSlot
                        index={index}
                        folderId={folder.id}
                        onMoveAssignment={handleAssignmentMove}
                      >
                        <DraggableAssignment
                          assignment={assignment}
                          classId={classId}
                          index={index}
                          onDelete={onDeleteAssignment}
                          onPublish={onPublishAssignment}
                          isTeacher={isTeacher}
                        />
                      </DroppableAssignmentSlot>
                      
                      {/* Drop zone after each assignment */}
                      <SectionDropZone
                        index={index + 1}
                        folderId={folder.id}
                        onMoveAssignment={handleAssignmentMove}
                        isTeacher={isTeacher}
                      />
                    </div>
                  ))
                ) : (
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