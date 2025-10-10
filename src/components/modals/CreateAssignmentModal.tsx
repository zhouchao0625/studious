"use client";

import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import ColorPicker from "@/components/ui/color-picker";
import {
  Plus,
  FileText,
  Upload,
  X,
  ClipboardCheck,
  ClipboardList,
  Calendar,
  Target,
  BookOpen,
  Trash2
} from "lucide-react";
import { useParams } from "next/navigation";
import {
  trpc,
} from "@/lib/trpc";

type FileData = {
  id?: string;
  name: string;
  type: string;
  size: number;
  data: string;
};

interface AssignmentFormData {
  title: string;
  instructions: string;
  dueDate: string;
  sectionId?: string;
  graded: boolean;
  maxGrade: number;
  weight: number;
  type: 'HOMEWORK' | 'QUIZ' | 'TEST' | 'PROJECT' | 'ESSAY' | 'DISCUSSION' | 'PRESENTATION' | 'LAB' | 'OTHER';
  markSchemeId?: string | null;
  gradingBoundaryId?: string | null;
  inProgress: boolean;
  files: FileData[];
}

interface CreateAssignmentModalProps {
  children?: React.ReactNode;
  onAssignmentCreated?: (assignmentData: AssignmentFormData) => void;
}

const defaultFormData: AssignmentFormData = {
  title: '',
  instructions: '',
  dueDate: new Date().toISOString().split('T')[0],
  sectionId: undefined,
  graded: false,
  maxGrade: 100,
  weight: 1,
  type: 'HOMEWORK',
  markSchemeId: null,
  gradingBoundaryId: null,
  inProgress: false,
  files: []
};

const assignmentTypes: { label: string; value: AssignmentFormData['type']; icon: React.ReactNode }[] = [
  { label: "Homework", value: "HOMEWORK", icon: <BookOpen className="h-4 w-4" /> },
  { label: "Quiz", value: "QUIZ", icon: <FileText className="h-4 w-4" /> },
  { label: "Test", value: "TEST", icon: <ClipboardCheck className="h-4 w-4" /> },
  { label: "Project", value: "PROJECT", icon: <Target className="h-4 w-4" /> },
  { label: "Essay", value: "ESSAY", icon: <FileText className="h-4 w-4" /> },
  { label: "Discussion", value: "DISCUSSION", icon: <BookOpen className="h-4 w-4" /> },
  { label: "Presentation", value: "PRESENTATION", icon: <Target className="h-4 w-4" /> },
  { label: "Lab", value: "LAB", icon: <ClipboardList className="h-4 w-4" /> },
  { label: "Other", value: "OTHER", icon: <FileText className="h-4 w-4" /> }
];

export function CreateAssignmentModal({ children, onAssignmentCreated }: CreateAssignmentModalProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<AssignmentFormData>(defaultFormData);
  const [showNewSection, setShowNewSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [newSectionColor, setNewSectionColor] = useState('#3b82f6');

  const { id: classId } = useParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // API queries
  const { data: classData } = trpc.class.get.useQuery({ classId: classId as string });
  const { data: markSchemes } = trpc.class.listMarkSchemes.useQuery({ classId: classId as string });
  const { data: gradingBoundaries } = trpc.class.listGradingBoundaries.useQuery({ classId: classId as string });

  // Mutations
  const createAssignmentMutation = trpc.assignment.create.useMutation();
  const createSectionMutation = trpc.section.create.useMutation({
    onSuccess: (data) => {
      setFormData(prev => ({ ...prev, sectionId: data.id }));
      setShowNewSection(false);
      setNewSectionName('');
      setNewSectionColor('#3b82f6');
      toast.success(`Section "${data.name}" created successfully.`);
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const sections = classData?.class?.sections || [];

  const resetForm = () => {
    setFormData(defaultFormData);
    setShowNewSection(false);
    setNewSectionName('');
    setNewSectionColor('#3b82f6');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);

    files.forEach(async (file) => {
      try {
        const base64Data = await fileToBase64(file);
        const newFile: FileData = {
          name: file.name,
          type: file.type,
          size: file.size,
          data: base64Data
        };

        setFormData(prev => ({
          ...prev,
          files: [...prev.files, newFile]
        }));
      } catch (error) {
        toast.error(`Failed to process file: ${file.name}`);
      }
    });
  };

  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.instructions.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    try {
      // Separate new files from existing files
      const newFiles = formData.files.filter(file => !file.id);
      const existingFileIds = formData.files.filter(file => file.id).map(file => file.id!);

      const assignmentData = {
        classId: classId as string,
        title: formData.title,
        instructions: formData.instructions,
        dueDate: formData.dueDate,
        files: newFiles,
        existingFileIds: existingFileIds.length > 0 ? existingFileIds : undefined,
        maxGrade: formData.graded ? formData.maxGrade : undefined,
        graded: formData.graded,
        weight: formData.graded ? formData.weight : undefined,
        sectionId: formData.sectionId || undefined,
        type: formData.type,
        markSchemeId: formData.markSchemeId === "none" || formData.markSchemeId === null ? undefined : formData.markSchemeId,
        gradingBoundaryId: formData.gradingBoundaryId === "none" || formData.gradingBoundaryId === null ? undefined : formData.gradingBoundaryId,
        inProgress: formData.inProgress
      };

      await createAssignmentMutation.mutateAsync(assignmentData);

      toast.success(`Assignment ${formData.inProgress ? 'saved as draft' : 'created'} successfully.`);

      onAssignmentCreated?.(assignmentData as AssignmentFormData);
      setOpen(false);
      resetForm();
    } catch (error) {
      console.error('Failed to create assignment:', error);
      toast.error("Failed to create assignment. Please try again.");
    }
  };

  // Helper function to convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data:mime/type;base64, prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Assignment
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Create New Assignment
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <form onSubmit={handleSubmit} className="space-y-8 pr-4">
            {/* 📝 Basic Information Section */}
            <div className="space-y-6">
              <div className="text-lg font-semibold">
                Assignment Details
              </div>

              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-medium">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Chapter 5 Quiz, Physics Lab Report"
                    className="text-base"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instructions" className="text-sm font-medium">Instructions *</Label>
                  <Textarea
                    id="instructions"
                    value={formData.instructions}
                    onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                    placeholder="Provide clear instructions for students..."
                    rows={4}
                    className="resize-none"
                    required
                  />
                </div>
              </div>
            </div>

            {/* ⚙️ Assignment Configuration */}
            <div className="space-y-6">
              <div className="text-lg font-semibold">
                Configuration
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Side - Basic Settings */}
                <div className="space-y-4">
                  {/* Due Date */}
                  <div className="space-y-2">
                    <Label htmlFor="dueDate" className="text-sm font-medium">Due Date</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="dueDate"
                        type="date"
                        value={formData.dueDate}
                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Assignment Type */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Assignment Type</Label>
                    <Select value={formData.type} onValueChange={(value: AssignmentFormData['type']) => setFormData({ ...formData, type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {assignmentTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              {type.icon}
                              <span>{type.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Right Side - Advanced Settings */}
                <div className="space-y-4">
                  {/* Section */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Section</Label>
                    {!showNewSection ? (
                      <Select
                        value={formData.sectionId || 'none'}
                        onValueChange={(value) => {
                          if (value === 'create-new') {
                            setShowNewSection(true);
                          } else {
                            setFormData({ ...formData, sectionId: value === 'none' ? undefined : value });
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose section" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No section</SelectItem>
                          {sections.map((section) => (
                            <SelectItem key={section.id} value={section.id}>
                              {section.name}
                            </SelectItem>
                          ))}
                          <Separator />
                          <SelectItem value="create-new">
                            <div className="flex items-center gap-2 text-primary">
                              <Plus className="h-3 w-3" />
                              <span>Create New Section</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            value={newSectionName}
                            onChange={(e) => setNewSectionName(e.target.value)}
                            placeholder="Enter section name..."
                            className="flex-1"
                            autoFocus
                          />
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => {
                              if (newSectionName.trim()) {
                                createSectionMutation.mutate({
                                  classId: classId as string,
                                  name: newSectionName.trim(),
                                  color: newSectionColor
                                });
                              }
                            }}
                            disabled={!newSectionName.trim()}
                          >
                            Add
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setShowNewSection(false);
                              setNewSectionName('');
                              setNewSectionColor('#3b82f6');
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="space-y-2">
                          <ColorPicker
                            value={newSectionColor}
                            onChange={setNewSectionColor}
                            label="Section Color"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Assignment Options */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 rounded-lg border">
                      <Checkbox
                        id="graded"
                        checked={formData.graded}
                        onCheckedChange={(checked) => setFormData({ ...formData, graded: !!checked })}
                      />
                      <div className="flex-1">
                        <Label htmlFor="graded" className="text-sm font-medium cursor-pointer">
                          Graded Assignment
                        </Label>
                        <p className="text-xs text-muted-foreground">Include in gradebook</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-3 rounded-lg border">
                      <Checkbox
                        id="inProgress"
                        checked={formData.inProgress}
                        onCheckedChange={(checked) => setFormData({ ...formData, inProgress: !!checked })}
                      />
                      <div className="flex-1">
                        <Label htmlFor="inProgress" className="text-sm font-medium cursor-pointer">
                          Save as Draft
                        </Label>
                        <p className="text-xs text-muted-foreground">Hide from students</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 📊 Grading Settings (conditional) */}
            {formData.graded && (
              <div className="space-y-6">
                <div className="text-lg font-semibold">
                  Grading & Assessment
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Rubric Selection */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Rubric</Label>
                    <Select
                      value={formData.markSchemeId || 'none'}
                      onValueChange={(value) => setFormData({ ...formData, markSchemeId: value === 'none' ? null : value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose rubric" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No rubric</SelectItem>
                        {markSchemes?.map((markScheme) => {
                          let name = "Untitled Rubric";
                          try {
                            const parsed = JSON.parse(markScheme.structured);
                            name = parsed.name || "Untitled Rubric";
                          } catch (error) {
                            console.error("Error parsing markscheme:", error);
                          }
                          return (
                            <SelectItem key={markScheme.id} value={markScheme.id}>
                              <div className="flex items-center gap-2">
                                <ClipboardCheck className="h-3 w-3" />
                                {name}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Grading Boundaries */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Grade Scale</Label>
                    <Select
                      value={formData.gradingBoundaryId || 'none'}
                      onValueChange={(value) => setFormData({ ...formData, gradingBoundaryId: value === 'none' ? null : value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose grade scale" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Default scale</SelectItem>
                        {gradingBoundaries?.map((boundary) => {
                          let name = "Untitled Scale";
                          try {
                            const parsed = JSON.parse(boundary.structured);
                            name = parsed.name || "Untitled Scale";
                          } catch (error) {
                            console.error("Error parsing grading boundary:", error);
                          }
                          return (
                            <SelectItem key={boundary.id} value={boundary.id}>
                              <div className="flex items-center gap-2">
                                <ClipboardList className="h-3 w-3" />
                                {name}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Scoring Settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {!formData.markSchemeId && (
                    <div className="space-y-2">
                      <Label htmlFor="maxGrade" className="text-sm font-medium">Max Points</Label>
                      <Input
                        id="maxGrade"
                        type="number"
                        value={formData.maxGrade}
                        onChange={(e) => setFormData({ ...formData, maxGrade: parseInt(e.target.value) || 0 })}
                        min="0"
                        placeholder="100"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="weight" className="text-sm font-medium">Weight (%)</Label>
                    <Input
                      id="weight"
                      type="number"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: parseInt(e.target.value) || 0 })}
                      min="0"
                      step="0.1"
                      placeholder="1.0"
                    />
                  </div>
                </div>

                {formData.markSchemeId && (
                  <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <ClipboardCheck className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-blue-700 dark:text-blue-300">
                      Points will be calculated automatically from the selected rubric
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* 📎 File Attachments */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="text-lg font-semibold">
                  Attachments
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Files
                </Button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                accept="*/*"
              />

              {formData.files.length > 0 ? (
                <div className="grid gap-3">
                  {formData.files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type}
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  className="text-center py-8 border-2 border-dashed border-muted-foreground/25 rounded-lg hover:border-muted-foreground/50 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm font-medium text-muted-foreground">Drop files here or click to upload</p>
                  <p className="text-xs text-muted-foreground mt-1">Supports all file types • Max 50MB per file</p>
                </div>
              )}
            </div>

            {/* 🎯 Final Actions */}
            <div className="flex items-center justify-between pt-6 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {formData.inProgress ? (
                  <>
                    <FileText className="h-4 w-4" />
                    <span>Will be saved as draft</span>
                  </>
                ) : (
                  <>
                    <Target className="h-4 w-4" />
                    <span>Will be published to students</span>
                  </>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setOpen(false);
                    resetForm();
                  }}
                  disabled={createAssignmentMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createAssignmentMutation.isPending || !formData.title.trim() || !formData.instructions.trim()}
                  className="min-w-[140px]"
                >
                  {createAssignmentMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating...
                    </div>
                  ) : formData.inProgress ? (
                    <div className="flex items-center gap-2">
                      Save Draft
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      Create Assignment
                    </div>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}