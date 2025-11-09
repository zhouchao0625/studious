import { useDrop, DropTargetMonitor } from "react-dnd";

interface DroppableAssignmentSlotProps {
  children: React.ReactNode;
  index: number;
  folderId: string | null;
  onMoveAssignment: (assignmentId: string, targetFolderId: string | null, targetIndex?: number) => void;
}

// Drop zone for assignments within sections
export function SectionDropZone({
  index,
  folderId,
  onMoveAssignment,
  isTeacher = true
}: {
  index: number;
  folderId: string | null;
  onMoveAssignment: (assignmentId: string, targetFolderId: string | null, targetIndex?: number) => void;
  isTeacher?: boolean;
}) {
  const [{ isOver, draggedItem, canDrop }, drop] = useDrop({
    accept: "assignment",
    canDrop: (item: { id: string; type?: string; index?: number }) => {
      return isTeacher;
    },
    drop: (item: { id: string }, monitor: DropTargetMonitor) => {
      // Only handle if not already handled by a nested child
      if (monitor.didDrop()) return;
      // Call the move handler with the target index
      onMoveAssignment(item.id, folderId, index);
      // Return a result to mark that we handled it (prevents parent from handling)
      return { handled: true };
    },
    collect: (monitor: DropTargetMonitor) => ({
      isOver: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop(),
      draggedItem: monitor.getItem() as { id: string; type?: string; index?: number } | null,
    }),
  });

  // Only show drop zone when dragging and it's a valid drop target
  const isDragging = !!draggedItem;
  const shouldShow = isDragging && canDrop;
  const isActive = isOver && shouldShow;

  if (!shouldShow) {
    return <div className="h-1" />; // Minimal spacer when not dragging
  }

  return (
    <div 
      ref={drop as unknown as React.Ref<HTMLDivElement>}
      className={`transition-all duration-200 relative ${
        isActive 
          ? 'h-6 my-1' 
          : 'h-1.5 my-0.5'
      }`}
    >
      <div 
        className={`absolute inset-x-0 top-1/2 -translate-y-1/2 transition-all duration-200 ${
          isActive
            ? 'h-1.5 bg-primary rounded-full shadow-lg shadow-primary/50 opacity-100'
            : 'h-0.5 bg-primary/30 rounded-full opacity-50'
        }`}
      />
      {isActive && (
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none z-20">
          <div className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full border border-primary/30 backdrop-blur-sm">
            Drop here
          </div>
        </div>
      )}
    </div>
  );
}

export function DroppableAssignmentSlot({ 
  children, 
  index, 
  folderId, 
  onMoveAssignment 
}: DroppableAssignmentSlotProps) {
  return (
    <div className="relative">
      {children}
    </div>
  );
}