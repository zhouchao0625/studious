"use client";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  GradingBoundaryEditor, 
  GradingTemplateSelector, 
  GradingBoundary, 
  GradingBoundarySet,
  GradingTemplate 
} from "@/components/grading";
import { RouterOutputs, trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface GradingBoundariesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
  existingGradingBoundary?: RouterOutputs["class"]["listGradingBoundaries"][number];
}

export function GradingBoundariesModal({ open, onOpenChange, classId, existingGradingBoundary }: GradingBoundariesModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [isCreatingCustom, setIsCreatingCustom] = useState(false);
  const [newSetName, setNewSetName] = useState("");
  const [customBoundaries, setCustomBoundaries] = useState<GradingBoundary[]>([]);
  const createGradingBoundary = trpc.class.createGradingBoundary.useMutation();
  const updateGradingBoundary = trpc.class.updateGradingBoundary.useMutation();

  // Populate form when editing existing grading boundary
  useEffect(() => {
    if (existingGradingBoundary) {
      try {
        const parsed = JSON.parse(existingGradingBoundary.structured);
        setNewSetName(parsed.name || '');
        setCustomBoundaries(parsed.boundaries || []);
        setIsCreatingCustom(true);
      } catch (error) {
        console.error('Error parsing existing grading boundary:', error);
      }
    } else {
      // Reset form when creating new
      setNewSetName('');
      setCustomBoundaries([]);
      setIsCreatingCustom(false);
      setSelectedTemplate('');
    }
  }, [existingGradingBoundary]);

  const handleTemplateSelect = (templateKey: string, template: GradingTemplate) => {
    setSelectedTemplate(templateKey);
    setIsCreatingCustom(true);
    setNewSetName(template.name);
    
    // Convert template boundaries to full GradingBoundary objects with IDs
    const convertedBoundaries = template.boundaries.map((boundary, index) => ({
      ...boundary,
      id: (index + 1).toString()
    }));
    setCustomBoundaries(convertedBoundaries);
  };

  const handleCreateCustom = () => {
    setIsCreatingCustom(true);
    setSelectedTemplate("");
    setNewSetName("");
    setCustomBoundaries([
      { id: "1", grade: "A", minPercentage: 90, maxPercentage: 100, color: "#059669", description: "Excellent performance demonstrating mastery of concepts" },
      { id: "2", grade: "B", minPercentage: 80, maxPercentage: 89, color: "#2563eb", description: "Good performance showing solid understanding" },
      { id: "3", grade: "C", minPercentage: 70, maxPercentage: 79, color: "#ca8a04", description: "Satisfactory performance with basic understanding" },
      { id: "4", grade: "D", minPercentage: 60, maxPercentage: 69, color: "#ea580c", description: "Below average performance with limited understanding" },
      { id: "5", grade: "F", minPercentage: 0, maxPercentage: 59, color: "#dc2626", description: "Failing performance showing insufficient understanding" }
    ]);
  };

  const handleCreate = async () => {
    if (isCreatingCustom) {
      try {
        const structured = {
          name: newSetName,
          boundaries: customBoundaries
        };
        
        if (existingGradingBoundary) {
          // Update existing grading boundary
          await updateGradingBoundary.mutateAsync({
            classId,
            gradingBoundaryId: existingGradingBoundary.id,
            name: newSetName,
            structure: JSON.stringify(structured)
          });
          
          toast.success("Grading boundary updated successfully");
        } else {
          // Create new grading boundary
          await createGradingBoundary.mutateAsync({
            classId,
            name: newSetName,
            structure: JSON.stringify(structured)
          });
          
          toast.success("Grading boundary created successfully");
        }
        
        onOpenChange(false);
      } catch (error) {
        toast.error(existingGradingBoundary ? "Failed to update grading boundary" : "Failed to create grading boundary");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {existingGradingBoundary ? "Edit Grade Boundary" : "Create Grade Boundary"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-3 gap-6 h-[calc(90vh-140px)] overflow-hidden">
          {/* Left Column - Template Selection */}
          <div className="col-span-1 flex flex-col overflow-hidden">
            <h3 className="text-lg font-semibold mb-4">Select Template</h3>
            <div className="flex-1 overflow-y-auto">
              <div className="pr-4">
                <GradingTemplateSelector
                  selectedTemplate={selectedTemplate}
                  onTemplateSelect={handleTemplateSelect}
                  onCreateCustom={handleCreateCustom}
                />
              </div>
            </div>
          </div>

          {/* Right Column - Editor */}
          <div className="col-span-2 border-l pl-6 flex flex-col overflow-hidden">
            {isCreatingCustom ? (
              <>
                <h3 className="text-lg font-semibold mb-4">Edit Grading Scale</h3>
                <ScrollArea className="flex-1 h-0">
                  <div className="space-y-6 pr-4">
                    <GradingBoundaryEditor
                      boundaries={customBoundaries}
                      onUpdate={setCustomBoundaries}
                      scaleName={newSetName}
                      onScaleNameChange={setNewSetName}
                    />
                  </div>
                </ScrollArea>
                
                {/* Footer */}
                <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreate}
                    disabled={!newSetName.trim() || customBoundaries.length === 0 || createGradingBoundary.isPending || updateGradingBoundary.isPending}
                  >
                    {(createGradingBoundary.isPending || updateGradingBoundary.isPending) 
                      ? (existingGradingBoundary ? "Updating..." : "Creating...") 
                      : (existingGradingBoundary ? "Update Grading Scale" : "Create Grading Scale")
                    }
                  </Button>
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <p>Select a template or create custom to start editing</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}