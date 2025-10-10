import { useDrop } from "react-dnd";

interface DroppableAssignmentSlotProps {
  children: React.ReactNode;
  index: number;
  folderId: string | null;
  onMoveAssignment: (assignmentId: string, targetFolderId: string | null, targetIndex?: number) => void;
}

export function DroppableAssignmentSlot({ 
  children, 
  index, 
  folderId, 
  onMoveAssignment 
}: DroppableAssignmentSlotProps) {
  const [{ isOver, draggedItem }, drop] = useDrop({
    accept: "assignment",
    drop: (item: { id: string }, monitor) => {
      if (monitor.didDrop()) return; // Already handled by child
      onMoveAssignment(item.id, folderId, index);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
      draggedItem: monitor.getItem() as { id: string; type?: string; index?: number } | null,
    }),
  });

  // Determine drop indicator position based on dragged item's current index
  const shouldShowTopIndicator = draggedItem && draggedItem.index !== undefined 
    ? draggedItem.index > index 
    : true; // Default to top if no index info

  return (
    <div ref={drop as unknown as React.Ref<HTMLDivElement>} className="relative">
      {isOver && (
        <div className={`absolute ${shouldShowTopIndicator ? '-top-1' : 'bottom-1'} left-0 right-0 h-0.5 bg-primary rounded-full z-10`} />
      )}
      {children}
    </div>
  );
}