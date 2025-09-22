"use client";
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlusCircle, BookOpen, Beaker, Presentation, FileText, CheckSquare, School, Edit3 } from "lucide-react";
import { type RubricCriteria, type MarkScheme } from "@/lib/types/rubric";
import { trpc } from "@/lib/trpc";
import { Rubric } from "@/components/rubric";
import { toast } from "sonner";

interface RubricTemplate {
  id: string;
  name: string;
  description: string;
  totalPoints: number;
  criteria: RubricCriteria[];
  category: string;
}

interface RubricModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
  existingRubric?: MarkScheme; // For editing existing rubrics
}

const rubricTemplates = {
  ib_complete: {
    name: "IB Complete Assessment",
    description: "International Baccalaureate assessment with four criteria",
    category: "IB",
    totalPoints: 32,
    criteria: [
      {
        id: "a",
        title: "Criterion A - Knowledge and Understanding",
        description: "Demonstrate knowledge and understanding of subject-specific content and concepts",
        levels: [
          { id: "a4", name: "Level 7-8", description: "Excellent knowledge and understanding", points: 8, color: "#4CAF50" },
          { id: "a3", name: "Level 5-6", description: "Substantial knowledge and understanding", points: 6, color: "#8BC34A" },
          { id: "a2", name: "Level 3-4", description: "Adequate knowledge and understanding", points: 4, color: "#FFEB3B" },
          { id: "a1", name: "Level 1-2", description: "Limited knowledge and understanding", points: 2, color: "#FF9800" }
        ]
      },
      {
        id: "b",
        title: "Criterion B - Application and Analysis",
        description: "Apply knowledge and understanding to analyze and evaluate information",
        levels: [
          { id: "b4", name: "Level 7-8", description: "Excellent application and analysis", points: 8, color: "#4CAF50" },
          { id: "b3", name: "Level 5-6", description: "Substantial application and analysis", points: 6, color: "#8BC34A" },
          { id: "b2", name: "Level 3-4", description: "Adequate application and analysis", points: 4, color: "#FFEB3B" },
          { id: "b1", name: "Level 1-2", description: "Limited application and analysis", points: 2, color: "#FF9800" }
        ]
      },
      {
        id: "c",
        title: "Criterion C - Synthesis and Evaluation",
        description: "Synthesize information from multiple sources and evaluate different perspectives",
        levels: [
          { id: "c4", name: "Level 7-8", description: "Excellent synthesis and evaluation", points: 8, color: "#4CAF50" },
          { id: "c3", name: "Level 5-6", description: "Substantial synthesis and evaluation", points: 6, color: "#8BC34A" },
          { id: "c2", name: "Level 3-4", description: "Adequate synthesis and evaluation", points: 4, color: "#FFEB3B" },
          { id: "c1", name: "Level 1-2", description: "Limited synthesis and evaluation", points: 2, color: "#FF9800" }
        ]
      },
      {
        id: "d",
        title: "Criterion D - Communication and Organization",
        description: "Communicate ideas clearly and organize work effectively",
        levels: [
          { id: "d4", name: "Level 7-8", description: "Excellent communication and organization", points: 8, color: "#4CAF50" },
          { id: "d3", name: "Level 5-6", description: "Substantial communication and organization", points: 6, color: "#8BC34A" },
          { id: "d2", name: "Level 3-4", description: "Adequate communication and organization", points: 4, color: "#FFEB3B" },
          { id: "d1", name: "Level 1-2", description: "Limited communication and organization", points: 2, color: "#FF9800" }
        ]
      }
    ]
  },
  ap_scoring: {
    name: "AP Assessment",
    description: "Advanced Placement scoring guidelines",
    category: "AP",
    totalPoints: 5,
    criteria: [
      {
        id: "1",
        title: "Content Knowledge",
        description: "Demonstrates understanding and analytical skills",
        levels: [
          { id: "1", name: "Score 5", description: "Extremely well qualified", points: 5, color: "#059669" },
          { id: "2", name: "Score 4", description: "Well qualified", points: 4, color: "#2563eb" },
          { id: "3", name: "Score 3", description: "Qualified", points: 3, color: "#ca8a04" },
          { id: "4", name: "Score 2", description: "Possibly qualified", points: 2, color: "#ea580c" },
          { id: "5", name: "Score 1", description: "No recommendation", points: 1, color: "#dc2626" }
        ]
      }
    ]
  },
  essay_writing: {
    name: "Essay Writing",
    description: "Comprehensive essay evaluation rubric",
    category: "Essay",
    totalPoints: 100,
    criteria: [
      {
        id: "1",
        title: "Content and Ideas",
        description: "Quality of content, depth of ideas, and relevance to topic",
        levels: [
          { id: "1a", name: "Excellent", description: "Sophisticated, insightful ideas with exceptional depth", points: 25, color: "#059669" },
          { id: "1b", name: "Proficient", description: "Clear, well-developed ideas with good depth", points: 20, color: "#2563eb" },
          { id: "1c", name: "Developing", description: "Ideas present but lack depth or clarity", points: 15, color: "#ca8a04" },
          { id: "1d", name: "Beginning", description: "Unclear or underdeveloped ideas", points: 10, color: "#dc2626" }
        ]
      },
      {
        id: "2",
        title: "Organization and Structure",
        description: "Logical flow, transitions, and overall essay structure",
        levels: [
          { id: "2a", name: "Excellent", description: "Clear, logical structure with smooth transitions", points: 25, color: "#059669" },
          { id: "2b", name: "Proficient", description: "Generally well-organized with adequate transitions", points: 20, color: "#2563eb" },
          { id: "2c", name: "Developing", description: "Some organizational issues, unclear transitions", points: 15, color: "#ca8a04" },
          { id: "2d", name: "Beginning", description: "Poor organization, confusing structure", points: 10, color: "#dc2626" }
        ]
      },
      {
        id: "3",
        title: "Language and Style",
        description: "Grammar, vocabulary, sentence structure, and writing style",
        levels: [
          { id: "3a", name: "Excellent", description: "Sophisticated language with varied sentence structure", points: 25, color: "#059669" },
          { id: "3b", name: "Proficient", description: "Clear language with good sentence variety", points: 20, color: "#2563eb" },
          { id: "3c", name: "Developing", description: "Generally clear with some errors or repetition", points: 15, color: "#ca8a04" },
          { id: "3d", name: "Beginning", description: "Frequent errors that interfere with meaning", points: 10, color: "#dc2626" }
        ]
      },
      {
        id: "4",
        title: "Evidence and Support",
        description: "Use of examples, citations, and supporting evidence",
        levels: [
          { id: "4a", name: "Excellent", description: "Strong, relevant evidence with proper citations", points: 25, color: "#059669" },
          { id: "4b", name: "Proficient", description: "Good use of evidence with adequate support", points: 20, color: "#2563eb" },
          { id: "4c", name: "Developing", description: "Some evidence provided but may lack relevance", points: 15, color: "#ca8a04" },
          { id: "4d", name: "Beginning", description: "Little or no supporting evidence", points: 10, color: "#dc2626" }
        ]
      }
    ]
  },
  presentation: {
    name: "Presentation",
    description: "Oral presentation evaluation rubric",
    category: "Presentation",
    totalPoints: 100,
    criteria: [
      {
        id: "1",
        title: "Content Knowledge",
        description: "Understanding and accuracy of subject matter",
        levels: [
          { id: "1a", name: "Exceptional", description: "Comprehensive, accurate understanding with depth", points: 25, color: "#059669" },
          { id: "1b", name: "Proficient", description: "Solid understanding with minor gaps", points: 20, color: "#2563eb" },
          { id: "1c", name: "Developing", description: "Basic understanding with some inaccuracies", points: 15, color: "#ca8a04" },
          { id: "1d", name: "Beginning", description: "Minimal or inaccurate understanding", points: 10, color: "#dc2626" }
        ]
      },
      {
        id: "2",
        title: "Organization and Structure",
        description: "Logical flow and clear structure of presentation",
        levels: [
          { id: "2a", name: "Exceptional", description: "Clear, logical structure with smooth transitions", points: 25, color: "#059669" },
          { id: "2b", name: "Proficient", description: "Generally well-organized with adequate flow", points: 20, color: "#2563eb" },
          { id: "2c", name: "Developing", description: "Some organizational issues, unclear transitions", points: 15, color: "#ca8a04" },
          { id: "2d", name: "Beginning", description: "Poor organization, confusing structure", points: 10, color: "#dc2626" }
        ]
      },
      {
        id: "3",
        title: "Delivery and Communication",
        description: "Speaking skills, eye contact, and audience engagement",
        levels: [
          { id: "3a", name: "Exceptional", description: "Confident, engaging delivery with excellent communication", points: 25, color: "#059669" },
          { id: "3b", name: "Proficient", description: "Clear delivery with good audience connection", points: 20, color: "#2563eb" },
          { id: "3c", name: "Developing", description: "Adequate delivery with some hesitation", points: 15, color: "#ca8a04" },
          { id: "3d", name: "Beginning", description: "Poor delivery, difficult to understand", points: 10, color: "#dc2626" }
        ]
      },
      {
        id: "4",
        title: "Visual Aids and Materials",
        description: "Quality and effectiveness of supporting materials",
        levels: [
          { id: "4a", name: "Exceptional", description: "Excellent visual aids that enhance presentation", points: 25, color: "#059669" },
          { id: "4b", name: "Proficient", description: "Good visual aids that support content", points: 20, color: "#2563eb" },
          { id: "4c", name: "Developing", description: "Basic visual aids with some issues", points: 15, color: "#ca8a04" },
          { id: "4d", name: "Beginning", description: "Poor or distracting visual aids", points: 10, color: "#dc2626" }
        ]
      }
    ]
  }
};

const getTemplateIcon = (category: string) => {
  switch (category) {
    case "IB": return <CheckSquare className="h-4 w-4 text-blue-600" />;
    case "AP": return <School className="h-4 w-4 text-green-600" />;
    case "Essay": return <FileText className="h-4 w-4 text-purple-600" />;
    case "Presentation": return <Presentation className="h-4 w-4 text-orange-600" />;
    default: return <BookOpen className="h-4 w-4 text-gray-600" />;
  }
};

export function RubricModal({ open, onOpenChange, classId, existingRubric }: RubricModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [rubricCriteria, setRubricCriteria] = useState<RubricCriteria[]>([]);
  const [rubricName, setRubricName] = useState("");
  const [rubricDescription, setRubricDescription] = useState("");
  const [rubricCategory, setRubricCategory] = useState("");

  const createMarkScheme = trpc.class.createMarkScheme.useMutation({
    onSuccess: () => {
      toast.success("Rubric created successfully");
      onOpenChange(false);
      // Reset form
      setSelectedTemplate("");
      setRubricCriteria([]);
      setRubricName("");
      setRubricDescription("");
      setRubricCategory("");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create rubric");
    },
  });

  const updateMarkScheme = trpc.class.updateMarkScheme.useMutation({
    onSuccess: () => {
        toast.success("Rubric updated successfully");
      onOpenChange(false);
      // Reset form
      setSelectedTemplate("");
      setRubricCriteria([]);
      setRubricName("");
      setRubricDescription("");
      setRubricCategory("");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update rubric");
    },
  });

  // Load existing rubric data when editing
  useEffect(() => {
    if (existingRubric && open) {
      try {
        const parsed = JSON.parse(existingRubric.structured);
        setRubricName(parsed.name || "");
        setRubricDescription(parsed.description || "");
        setRubricCategory(parsed.category || "");
        setRubricCriteria(parsed.criteria || []);
        setSelectedTemplate("custom");
      } catch (error) {
        console.error("Error parsing existing rubric:", error);
      }
    } else if (open && !existingRubric) {
      // Reset form for new rubric
      setSelectedTemplate("");
      setRubricCriteria([]);
      setRubricName("");
      setRubricDescription("");
      setRubricCategory("");
    }
  }, [existingRubric, open]);

  const handleTemplateSelect = (templateKey: string) => {
    const template = rubricTemplates[templateKey as keyof typeof rubricTemplates];
    setRubricCriteria(template.criteria);
    setRubricName(template.name);
    setRubricDescription(template.description);
    setRubricCategory(template.category);
    setSelectedTemplate(templateKey);
  };

  const handleCreateCustom = () => {
    setRubricCriteria([]);
    setRubricName("New Rubric");
    setRubricDescription("");
    setRubricCategory("Custom");
    setSelectedTemplate("custom");
  };

  const handleCreate = () => {
    if (!rubricName.trim() || rubricCriteria.length === 0) {
      toast.error("Please provide a name and at least one criterion");
      return;
    }

    const totalPoints = rubricCriteria.reduce((sum, criterion) => 
      sum + Math.max(...criterion.levels.map(level => level.points as number), 0), 0);
    
    const structuredData = {
      name: rubricName,
      description: rubricDescription,
      category: rubricCategory,
      criteria: rubricCriteria,
      totalPoints 
    };

    if (existingRubric) {
      updateMarkScheme.mutate({
        classId,
        markSchemeId: existingRubric.id,
        name: rubricName,
        structure: JSON.stringify(structuredData),
      });
    } else {
      createMarkScheme.mutate({
        classId,
        name: rubricName,
        structure: JSON.stringify(structuredData),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{existingRubric ? "Edit Assessment Rubric" : "Create Assessment Rubric"}</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 flex gap-6 min-h-0 overflow-hidden">
          {/* Left Panel - Templates */}
          <div className="w-72 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <h3 className="font-medium">Templates</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCreateCustom}
                className="gap-1"
              >
                <PlusCircle className="h-3 w-3" />
                Custom
              </Button>
            </div>
            
            <ScrollArea className="flex-1 min-h-0">
              <div className="space-y-3 pr-4">
                {Object.entries(rubricTemplates).map(([key, template]) => (
                  <Card
                    key={key}
                    className={`cursor-pointer transition-colors ${
                      selectedTemplate === key 
                        ? "border-primary bg-primary/5" 
                        : "hover:bg-muted/50"
                    }`}
                    onClick={() => handleTemplateSelect(key)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start gap-2">
                        {getTemplateIcon(template.category)}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{template.name}</h4>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {template.description}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <Badge variant="outline" className="text-xs">
                              {template.category}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {template.totalPoints}pts
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Right Panel - Editor */}
          <div className="flex-1 flex flex-col min-w-0">
            {selectedTemplate ? (
              <ScrollArea className="flex-1">
                <div className="space-y-4 pr-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <Edit3 className="h-4 w-4" />
                        <CardTitle className="text-base">Rubric Details</CardTitle>
                        <Badge variant="outline" className="ml-auto">
                          {rubricCategory}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="rubricName" className="text-xs">Name</Label>
                          <Input
                            id="rubricName"
                            value={rubricName}
                            onChange={(e) => setRubricName(e.target.value)}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div>
                          <Label htmlFor="rubricCategory" className="text-xs">Category</Label>
                          <Input
                            id="rubricCategory"
                            value={rubricCategory}
                            onChange={(e) => setRubricCategory(e.target.value)}
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="rubricDescription" className="text-xs">Description</Label>
                        <Textarea
                          id="rubricDescription"
                          value={rubricDescription}
                          onChange={(e) => setRubricDescription(e.target.value)}
                          className="text-sm resize-none"
                          rows={2}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Rubric
                    criteria={rubricCriteria}
                    onChange={setRubricCriteria}
                  />
                </div>
              </ScrollArea>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center">
                <div>
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <h3 className="font-medium text-muted-foreground">Select a Template</h3>
                  <p className="text-sm text-muted-foreground">
                    Choose a template to start creating your rubric
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {selectedTemplate && (
              <span>
                Total Points: <span className="font-medium">
                  {rubricCriteria.reduce((sum, criterion) => 
                    sum + Math.max(...criterion.levels.map(level => level.points as number), 0), 0
                  )}
                </span>
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreate}
              disabled={!selectedTemplate || !rubricName.trim() || createMarkScheme.isPending || updateMarkScheme.isPending}
            >
              {createMarkScheme.isPending || updateMarkScheme.isPending 
                ? (existingRubric ? "Updating..." : "Creating...") 
                : (existingRubric ? "Update Rubric" : "Create Rubric")
              }
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}