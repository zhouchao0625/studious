"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { DndProvider, DropTargetMonitor, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { PageLayout } from "@/components/ui/page-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Search, 
  Filter, 
  FileText, 
  Folder
} from "lucide-react";
import { AssignmentFolder } from "@/components/AssignmentFolder";
import { DraggableAssignment } from "@/components/DraggableAssignment";
import { CreateAssignmentModal, CreateSectionModal, SectionModal } from "@/components/modals";
import { AssignmentCardSkeleton } from "@/components/ui/class-card-skeleton";
import { RouterInputs, RouterOutputs, trpc } from "@/lib/trpc";
import { EmptyState } from "@/components/ui/empty-state";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

type Assignment = RouterOutputs['assignment']['get'];
type Section = RouterOutputs['class']['get']['class']['sections'][number];
type Folder = {
  id: string;
  name: string;
  color: string;
  assignments: Assignment[];
  order: number | null;
};
// Drop zone that appears between items when dragging
function DropZone({ 
  index, 
  onMoveItem,
  onMoveAssignment,
  isTeacher = true
}: { 
  index: number;
  onMoveItem: (draggedId: string, draggedType: string, targetIndex: number) => void;
  onMoveAssignment: (assignmentId: string, targetFolderId: string | null, targetIndex?: number) => void;
  isTeacher?: boolean;
}) {
  const [{ isOver, draggedItem, canDrop }, drop] = useDrop({
    accept: ["assignment", "folder"],
    canDrop: () => {
      // Allow drop if it's a teacher
      // Works for both assignments and sections (folders)
      return isTeacher;
    },
    drop: (item: { id: string; type?: string, index?: number }, monitor: DropTargetMonitor) => {
      if (monitor.didDrop()) return;
      const itemType = item.type || "assignment";
      
      // If it's an assignment, check if it needs to be moved to root first
      // Assignments from sections won't be in topLevelItems, so we need to use moveAssignment
      if (itemType === "assignment") {
        // For assignments, use moveAssignment to handle both root and section moves
        // targetIndex in the unified list corresponds to the position between items
        onMoveAssignment(item.id, null, index);
      } else {
        // For folders/sections, use moveItem (they're always top-level)
        onMoveItem(item.id, itemType, index);
      }
    },
    collect: (monitor: DropTargetMonitor) => ({
      isOver: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop(),
      draggedItem: monitor.getItem() as { id: string; type?: string; index?: number } | null,
    }),
  });

  // Only show drop zone when something is being dragged and it's a valid drop target
  // Works for both assignments and sections (folders)
  const isDragging = !!draggedItem;
  const isDraggingSection = draggedItem?.type === "folder";
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
          ? 'h-8 my-2' 
          : shouldShow
          ? 'h-3 my-1'
          : 'h-1 my-0.5'
      }`}
    >
      <div 
        className={`absolute inset-x-0 top-1/2 -translate-y-1/2 transition-all duration-200 ${
          isActive
            ? `h-1.5 ${isDraggingSection ? 'bg-purple-500' : 'bg-primary'} rounded-full shadow-lg ${isDraggingSection ? 'shadow-purple-500/50' : 'shadow-primary/50'} opacity-100`
            : shouldShow
            ? `h-0.5 ${isDraggingSection ? 'bg-purple-400/40' : 'bg-primary/30'} rounded-full opacity-60`
            : 'h-0 opacity-0'
        }`}
      />
      {isActive && (
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none z-20">
          <div className={`${isDraggingSection ? 'bg-purple-500/10 text-purple-600 border-purple-500/30' : 'bg-primary/10 text-primary border-primary/30'} text-xs px-3 py-1 rounded-full border backdrop-blur-sm`}>
            {isDraggingSection ? 'Drop section here' : 'Drop here'}
          </div>
        </div>
      )}
    </div>
  );
}

// Unified droppable slot component for both assignments and folders
function DroppableItemSlot({ 
  children, 
  index, 
  onMoveItem,
  isTeacher = true,
  slotType
}: { 
  children?: React.ReactNode;
  index: number;
  onMoveItem: (draggedId: string, draggedType: string, targetIndex: number) => void;
  isTeacher?: boolean;
  slotType?: 'assignment' | 'folder';
}) {
  return (
    <div className="relative">
      {children}
    </div>
  );
}

// Main drop zone component
function MainDropZone({ 
  children, 
  onMoveAssignment,
  isTeacher = true,
  dropMessage
}: { 
  children: React.ReactNode;
  onMoveAssignment: (assignmentId: string, targetFolderId: string | null) => void;
  isTeacher?: boolean;
  dropMessage: string;
}) {
  const t = useTranslations('assignment');

  const [{ isOver }, drop] = useDrop({
    accept: "assignment",
    canDrop: () => isTeacher,
    drop: (item: { id: string }, monitor: DropTargetMonitor) => {
      if (monitor.isOver({ shallow: true })) {
        console.log('Dropping assignment to top level:', item.id);
        onMoveAssignment(item.id, null); // Move to top-level
      }
    },
    collect: (monitor: DropTargetMonitor) => ({
      isOver: monitor.isOver({ shallow: true }),
    }),
  });

  return (
    <div 
      ref={drop as unknown as React.Ref<HTMLDivElement>} 
      className={`relative min-h-[400px] py-4 transition-all duration-200 ${
        isOver ? 'bg-muted/20 border-2 border-dashed border-primary rounded-lg' : ''
      }`}
    >
      {children}
      {isOver && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="bg-primary/10 text-primary px-4 py-2 rounded-lg border-2 border-dashed border-primary">
            {dropMessage}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Assignments() {
  const params = useParams();
  const classId = params.id as string;
  const appState = useSelector((state: RootState) => state.app);
  const isStudent = appState.user.student;
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [topLevelItems, setTopLevelItems] = useState<Array<{type: 'assignment' | 'folder', data: Assignment | Folder}>>([]);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [editingSection, setEditingSection] = useState<{ id: string; name: string; color: string } | null>(null);
  const t = useTranslations('assignment');

  // API queries
  const { data: classData, isLoading, refetch } = trpc.class.get.useQuery({ classId });
    const reorderAssignmentMutation = trpc.assignment.reorder.useMutation({
      onSuccess: () => {
        refetch();
      },
      onError: (error) => {
        console.error('Assignment reorder mutation failed:', error);
        toast.error("Failed to reorder assignment");
      }
    });
    const reorderSectionMutation = trpc.section.reorder.useMutation({
      onSuccess: () => {
        refetch();
      },
      onError: (error) => {
        console.error('Section reorder mutation failed:', error);
        toast.error("Failed to reorder section");
      }
    });
    const deleteAssignmentMutation = trpc.assignment.delete.useMutation({
      onSuccess: () => {
        refetch();
      },
      onError: (error) => {
        console.error('Assignment deletion failed:', error);
      }
    });
    const moveAssignmentMutation = trpc.assignment.move.useMutation({
      onSuccess: () => {
        refetch();
      },
      onError: (error) => {
        console.error('Assignment move failed:', error);
      }
    });
    const deleteSectionMutation = trpc.section.delete.useMutation({
      onSuccess: () => {
        refetch();
      },
      onError: (error) => {
        console.error('Section deletion failed:', error);
      }
    });

  const publishAssignmentMutation = trpc.assignment.update.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Assignment published successfully!");
    },
    onError: (error) => {
      console.error('Failed to publish assignment:', error);
      toast.error("Failed to publish assignment");
    }
  });

  const handlePublishAssignment = (assignmentId: string) => {
    publishAssignmentMutation.mutate({
      classId,
      id: assignmentId,
      inProgress: false
    });
  };
  
  // Initialize unified mixed list (all assignments + sections sorted by unified order)
  useEffect(() => {
    if (classData?.class) {
      let assignments = classData.class.assignments || [];
      
      // Filter out draft assignments for students
      if (isStudent) {
        assignments = assignments.filter(assignment => !assignment.inProgress);
      }
      const sections = classData.class.sections || [];
      
      // Build folders with assignments per section (for display purposes)
      const folderItems: Folder[] = sections.map(section => ({
        id: section.id,
        name: section.name,
        color: section.color ?? '',
        order: section.order ?? 0,
        assignments: assignments
          .filter(a => a.section && a.section.id === section.id)
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
          .map(a => a as unknown as Assignment)
      }));

      // Root assignments (tasks without sections)
      const rootAssignments = assignments
        .filter(a => !a.section)
        .map(a => ({ type: 'assignment' as const, data: a as unknown as Assignment }));

      // Sections as folder items
      const sectionItems = folderItems.map(f => ({ type: 'folder' as const, data: f }));

      // Combine all items (assignments and sections) and sort by unified order
      // The backend maintains a single order sequence for both types
      const allItems = [...rootAssignments, ...sectionItems];
      allItems.sort((a, b) => {
        const orderA = a.data.order ?? 0;
        const orderB = b.data.order ?? 0;
        return orderA - orderB;
      });

      setTopLevelItems(allItems);
    }
  }, [classData, isStudent]);

  // Filtering unified list with preserved original indices
  const filteredWithOriginalIndex = topLevelItems
    .map((item, originalIndex) => ({ item, originalIndex }))
    .filter(({ item }) => {
      if (item.type === 'folder') {
        const folder = item.data as Folder;
        return folder.assignments.some((assignment: Assignment) =>
          assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          assignment.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
          assignment.instructions.toLowerCase().includes(searchQuery.toLowerCase())
        ) || folder.name.toLowerCase().includes(searchQuery.toLowerCase());
      } else {
        const assignment = item.data as Assignment;
        return assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          assignment.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
          assignment.instructions.toLowerCase().includes(searchQuery.toLowerCase());
      }
    });

  const toggleSection = (sectionId: string) => {
    setOpenSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  // Reorder within unified list (assignments and sections can be interleaved)
  const moveItem = async (draggedId: string, draggedType: string, targetIndex: number) => {
    const currentIndex = topLevelItems.findIndex(item => 
      item.data.id === draggedId && item.type === draggedType
    );
    if (currentIndex === -1 || currentIndex === targetIndex) return;

    // Check if inserting at end before accessing targetItem
    const insertingAtEnd = targetIndex >= topLevelItems.length;
    const targetItem = insertingAtEnd ? null : topLevelItems[targetIndex];
    if (!insertingAtEnd && !targetItem) return;

    // Determine position and targetId based on drop position
    let position: 'start' | 'end' | 'before' | 'after';
    let targetId: string | undefined = undefined;

    if (targetIndex === 0) {
      position = 'start';
    } else if (insertingAtEnd) {
      position = 'end';
    } else if (currentIndex < targetIndex) {
      // Moving down: place after the item before target
      const beforeTarget = topLevelItems[targetIndex - 1];
      position = 'after';
      targetId = beforeTarget.data.id;
    } else {
      // Moving up: place before the target item
      // targetItem is guaranteed to exist here since we checked !insertingAtEnd && !targetItem above
      position = 'before';
      targetId = targetItem!.data.id;
    }

    const original = [...topLevelItems];
    const next = [...topLevelItems];
    const [moved] = next.splice(currentIndex, 1);
    // Use safe insertion index for end-of-list drops
    next.splice(Math.min(targetIndex, next.length), 0, moved);
    setTopLevelItems(next);

    try {
      if (draggedType === 'assignment') {
        // targetId can be either a section ID or assignment ID
        await reorderAssignmentMutation.mutateAsync({ 
          classId, 
          movedId: draggedId, 
          position, 
          ...(targetId ? { targetId } : {}) 
        });
      } else if (draggedType === 'folder') {
        // targetId can be either a section ID or assignment ID
        await reorderSectionMutation.mutateAsync({ 
          classId, 
          movedId: draggedId, 
          position, 
          ...(targetId ? { targetId } : {}) 
        });
      }
    } catch (e) {
      setTopLevelItems(original);
      refetch();
    }
  };

  

  const handleEditSection = (section: { id: string; name: string; color: string }) => {
    setEditingSection(section);
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!confirm(t('sectionDeletionConfirmation'))) {
      return;
    }
    
    try {
      await deleteSectionMutation.mutateAsync({
        classId,
        id: sectionId
      });
    } catch (error) {
      console.error('Failed to delete section:', error);
    }
  };

  const handleSectionUpdated = () => {
    setEditingSection(null);
    refetch();
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!confirm(t('assignmentDeletionConfirmation'))) {
      return;
    }
    
    try {
      await deleteAssignmentMutation.mutateAsync({
        classId,
        id: assignmentId
      });
    } catch (error) {
      console.error('Failed to delete assignment:', error);
    }
  };

  const reorderAssignmentInSection = async (assignmentId: string, sectionId: string, targetIndex: number) => {
    const sectionItem = topLevelItems.find(item => item.type === 'folder' && item.data.id === sectionId);
    if (!sectionItem || sectionItem.type !== 'folder') return;
    
    const section = sectionItem.data as Folder;
    const currentIndex = section.assignments.findIndex(a => a.id === assignmentId);
    if (currentIndex === -1 || currentIndex === targetIndex) return;

    // Determine position and targetId using unified ordering
    // targetId can be either a section ID or assignment ID
    let position: 'start' | 'end' | 'before' | 'after';
    let targetId: string | undefined = undefined;
    
    if (targetIndex <= 0) {
      position = 'start';
      // If moving to start of section, targetId should be the section itself
      targetId = sectionId;
    } else if (targetIndex >= section.assignments.length - 1) {
      position = 'end';
    } else if (currentIndex < targetIndex) {
      position = 'after';
      targetId = section.assignments[targetIndex - 1].id;
    } else {
      position = 'before';
      targetId = section.assignments[targetIndex].id;
    }

    const original = [...topLevelItems];
    setTopLevelItems(prev => prev.map(item => {
      if (item.type === 'folder' && item.data.id === sectionId) {
        const next = [...(item.data as Folder).assignments];
        const [m] = next.splice(currentIndex, 1);
        next.splice(targetIndex, 0, m);
        return { ...item, data: { ...item.data, assignments: next } };
      }
      return item;
    }));

    try {
      await reorderAssignmentMutation.mutateAsync({ 
        classId, 
        movedId: assignmentId, 
        position, 
        ...(targetId ? { targetId } : {}) 
      });
    } catch (e) {
      console.error('Reorder in section failed', e);
      setTopLevelItems(original);
      refetch();
    }
  };

  if (isLoading) {
    return (
      <PageLayout>
        <div className="space-y-6">
          <AssignmentCardSkeleton count={6} />
        </div>
      </PageLayout>
    );
  }

  const moveAssignment = async (assignmentId: string, targetFolderId: string | null, targetIndex?: number) => {
    // Find assignment in mixed list
    let assignment: Assignment | null = null;
    let sourceSectionId: string | null = null;
    let currentIndex: number = -1;
    
    // Check root assignments
    const rootItem = topLevelItems.find(item => item.type === 'assignment' && item.data.id === assignmentId);
    if (rootItem) {
      assignment = rootItem.data as Assignment;
    } else {
      // Check sections
      for (const item of topLevelItems) {
        if (item.type === 'folder') {
          const foundIndex = (item.data as Folder).assignments.findIndex(a => a.id === assignmentId);
          if (foundIndex !== -1) {
            assignment = (item.data as Folder).assignments[foundIndex];
            sourceSectionId = item.data.id;
            currentIndex = foundIndex;
            break;
          }
        }
      }
    }
    
    if (!assignment) return;

    // First, move the assignment to the target section (or root)
    const targetSectionId = targetFolderId || '';
    
    try {
      // If targetIndex is provided, calculate position BEFORE moving (using current state)
      let position: 'start' | 'end' | 'before' | 'after' | undefined;
      let targetId: string | undefined = undefined;

      if (targetIndex !== undefined) {
        if (targetFolderId === null) {
          // Moving to root - find position in unified list using current topLevelItems
          // targetIndex is the position between items (0 = before first, 1 = between first and second, etc.)
          if (targetIndex === 0) {
            position = 'start';
          } else if (targetIndex >= topLevelItems.length) {
            position = 'end';
          } else {
            // Place before the item at targetIndex
            const targetItem = topLevelItems[targetIndex];
            if (targetItem) {
              position = 'before';
              targetId = targetItem.data.id; // Can be section or assignment ID
            } else {
              position = 'end';
            }
          }
        } else if (targetFolderId) {
          // Moving to a section - calculate position within section
          const destSectionItem = topLevelItems.find(it => it.type === 'folder' && it.data.id === targetFolderId);
          if (destSectionItem && destSectionItem.type === 'folder') {
            const destSection = destSectionItem.data as Folder;
            const isMovingFromSameSection = sourceSectionId === targetFolderId;
            
            if (targetIndex === 0) {
              position = 'start';
              targetId = targetFolderId; // Use section ID as target
            } else if (targetIndex !== undefined) {
              // Calculate the correct anchor assignment
              // If moving within same section, we need to account for the item being removed
              let anchorIndex = targetIndex - 1;
              if (isMovingFromSameSection && currentIndex < targetIndex) {
                // Moving down: anchor is at targetIndex - 1 (item hasn't been removed yet)
                anchorIndex = targetIndex - 1;
              } else if (isMovingFromSameSection && currentIndex >= targetIndex) {
                // Moving up: anchor is at targetIndex (item will be removed before this position)
                anchorIndex = targetIndex;
              }
              
              const anchor = destSection.assignments[anchorIndex];
              if (anchor && anchor.id !== assignmentId) {
                position = anchorIndex < targetIndex ? 'after' : 'before';
                targetId = anchor.id;
              } else if (destSection.assignments.length > 0) {
                // Fallback: use last assignment
                const lastAssignment = destSection.assignments[destSection.assignments.length - 1];
                position = 'after';
                targetId = lastAssignment.id;
              } else {
                position = 'start';
                targetId = targetFolderId;
              }
            }
          } else {
            position = 'end';
          }
        }
      }

      // Update the section assignment (this doesn't change order, just section membership)
      await moveAssignmentMutation.mutateAsync({ 
        classId, 
        id: assignmentId, 
        targetSectionId 
      });

      // If targetIndex is provided, reorder using unified ordering
      if (targetIndex !== undefined && position) {
        // Reorder using unified ordering API (targetId can be section or assignment ID)
        await reorderAssignmentMutation.mutateAsync({ 
          classId, 
          movedId: assignmentId, 
          position, 
          ...(targetId ? { targetId } : {}) 
        });
      } else {
        // No specific position, just move to end
        await reorderAssignmentMutation.mutateAsync({ 
          classId, 
          movedId: assignmentId, 
          position: 'end' 
        });
      }
    } catch (e) {
      console.error('Move assignment failed', e);
      refetch();
    }
  };

  const handleSectionCreated = () => {
    refetch(); // Refresh class data to get new section
  };

  const handleAssignmentCreated = () => {
    refetch();
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <PageLayout>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">{t('assignments')}</h1>
            <p className="text-muted-foreground">{t('manageAndTrack')}</p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              {t('filters')}
            </Button>
            <CreateSectionModal classId={classId} onSectionCreated={handleSectionCreated}>
              <Button variant="outline" size="sm">
                <Folder className="h-4 w-4 mr-2" />
                {t('newSection')}
              </Button>
            </CreateSectionModal>
            <CreateAssignmentModal onAssignmentCreated={handleAssignmentCreated}>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                {t('createAssignment')}
              </Button>
            </CreateAssignmentModal>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('searchAssignments')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Assignments Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">{t('allAssignments')}</TabsTrigger>
            <TabsTrigger value="open">{t('open')}</TabsTrigger>
            <TabsTrigger value="closed">{t('closed')}</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-6">
            {filteredWithOriginalIndex.length > 0 ? (
              <MainDropZone 
                onMoveAssignment={moveAssignment} 
                isTeacher={!isStudent}
                dropMessage={t('assignmentDrop')}
              >
                <div className="space-y-3">
                  {/* Top drop zone */}
                  <DropZone 
                    index={0} 
                    onMoveItem={moveItem}
                    onMoveAssignment={moveAssignment}
                    isTeacher={!isStudent}
                  />
                  
                  {filteredWithOriginalIndex.map(({ item, originalIndex }) => (
                    <div key={`${item.type}-${item.data.id}`}>
                      <DroppableItemSlot 
                        index={originalIndex}
                        onMoveItem={moveItem}
                        isTeacher={!isStudent}
                        slotType={item.type}
                      >
                        {item.type === 'assignment' ? (
                          <DraggableAssignment
                            assignment={item.data as Assignment}
                            classId={classId!}
                            index={originalIndex}
                            onDelete={handleDeleteAssignment}
                            onPublish={handlePublishAssignment}
                            isTeacher={!isStudent}
                          />
                        ) : (
                          <AssignmentFolder
                            folder={item.data as Folder}
                            classId={classId!}
                            isOpen={openSections[item.data.id]}
                            onToggle={() => toggleSection(item.data.id)}
                            onMoveAssignment={moveAssignment}
                            onReorderAssignmentInSection={reorderAssignmentInSection}
                            onEditSection={handleEditSection}
                            onDeleteSection={handleDeleteSection}
                            onDeleteAssignment={handleDeleteAssignment}
                            onPublishAssignment={handlePublishAssignment}
                            isTeacher={!isStudent}
                            index={originalIndex}
                          />
                        )}
                      </DroppableItemSlot>
                      
                      {/* Drop zone after each item */}
                      <DropZone 
                        index={originalIndex + 1} 
                        onMoveItem={moveItem}
                        onMoveAssignment={moveAssignment}
                        isTeacher={!isStudent}
                      />
                    </div>
                  ))}
                </div>
              </MainDropZone>
            ) : (
              <EmptyState
                icon={FileText}
                title={t('noAssignmentsFound')}
                description={t('createFirstAssignment')}
              />
            )}
          </TabsContent>
        </Tabs>
      </PageLayout>
      
      {/* Edit Section Modal */}
      <SectionModal
        classId={classId}
        section={editingSection || undefined}
        open={!!editingSection}
        onOpenChange={(open) => !open && setEditingSection(null)}
        onSectionUpdated={handleSectionUpdated}
      />
    </DndProvider>
  );
}