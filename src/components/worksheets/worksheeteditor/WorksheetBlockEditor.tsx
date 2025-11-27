"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Plus,
  Trash2,
  CheckCircle,
  FileText,
  Calculator,
  ToggleLeft,
  Clock,
  Gem,
  Pencil,
} from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { WorksheetQuestionEditorInput } from "./WorksheetQuestionEditorInput";

export type QuestionType = "multiple_choice" | "long_form" | "math" | "true_false";
export type BackendQuestionType = "MULTIPLE_CHOICE" | "LONG_FORM" | "MATH" | "TRUE_FALSE";

export interface MultipleChoiceOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface MarkschemeItem {
  id: string;
  points: number;
  description: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  question: string;
  points: number;
  required: boolean;
  estimationTime?: number;
  markschemeItems?: MarkschemeItem[];
  options?: MultipleChoiceOption[];
  randomizeOrder?: boolean;
  correctAnswer?: boolean;
  mathExpression?: string;
  sampleAnswer?: string;
  order: number;
}

interface WorksheetBlockEditorProps {
  question: Question;
  questionIndex: number;
  onUpdate: (updates: Partial<Question>) => void;
  onAddOption: () => void;
  onRemoveOption: (optionId: string) => void;
  onUpdateOption: (optionId: string, updates: Partial<MultipleChoiceOption>) => void;
  onToggleCorrectAnswer: (optionId: string) => void;
}

export function WorksheetBlockEditor({
  question,
  questionIndex,
  onUpdate,
  onAddOption,
  onRemoveOption,
  onUpdateOption,
  onToggleCorrectAnswer,
}: WorksheetBlockEditorProps) {
  const t = useTranslations('worksheets');
  const [markschemeDialogOpen, setMarkschemeDialogOpen] = useState(false);
  const [editingMarkschemeItem, setEditingMarkschemeItem] = useState<MarkschemeItem | null>(null);
  const [markschemeForm, setMarkschemeForm] = useState({ points: "", description: "" });

  const openMarkschemeDialog = (item?: MarkschemeItem) => {
    if (item) {
      setEditingMarkschemeItem(item);
      setMarkschemeForm({ points: item.points.toString(), description: item.description });
    } else {
      setEditingMarkschemeItem(null);
      setMarkschemeForm({ points: "", description: "" });
    }
    setMarkschemeDialogOpen(true);
  };

  const saveMarkschemeItem = () => {
    const points = parseFloat(markschemeForm.points);
    if (!markschemeForm.description.trim() || isNaN(points) || points <= 0) {
      toast.error("Please provide valid points and description");
      return;
    }

    const newItem: MarkschemeItem = {
      id: editingMarkschemeItem?.id || `ms-${Date.now()}`,
      points,
      description: markschemeForm.description.trim()
    };

    const currentItems = question.markschemeItems || [];
    let updatedItems: MarkschemeItem[];
    
    if (editingMarkschemeItem) {
      updatedItems = currentItems.map(item => 
        item.id === editingMarkschemeItem.id ? newItem : item
      );
    } else {
      updatedItems = [...currentItems, newItem];
    }

    onUpdate({ markschemeItems: updatedItems, points: updatedItems.reduce((sum, item) => sum + item.points, 0) });
    setMarkschemeDialogOpen(false);
    setMarkschemeForm({ points: "", description: "" });
    setEditingMarkschemeItem(null);
  };

  const removeMarkschemeItem = (itemId: string) => {
    const updatedItems = (question.markschemeItems || []).filter(item => item.id !== itemId);
    onUpdate({ markschemeItems: updatedItems });
  };

  return (
    <>
      <Card className="h-full overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              Question {questionIndex + 1}
            </CardTitle>
            <div className="flex items-center gap-4">
              <Select
                value={question.type}
                onValueChange={(value) => onUpdate({ type: value as QuestionType })}
              >
                <SelectTrigger className="w-[180px] text-nowrap">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="multiple_choice">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      <span>{t('create.questionTypes.multipleChoice')}</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="long_form">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span>{t('create.questionTypes.longForm')}</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="math">
                    <div className="flex items-center gap-2">
                      <Calculator className="h-4 w-4" />
                      <span>{t('create.questionTypes.math')}</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="true_false">
                    <div className="flex items-center gap-2">
                      <ToggleLeft className="h-4 w-4" />
                      <span>{t('create.questionTypes.trueFalse')}</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Question Text */}
          <div className="space-y-1">
            <Label className="text-sm font-medium">
              Question Text <span className="text-destructive">*</span>
            </Label>
            <Textarea
              value={question.question}
              onChange={(e) => onUpdate({ question: e.target.value })}
              placeholder={t('create.questions.questionTextPlaceholder')}
              className="min-h-[100px] resize-none"
            />
          </div>

          {/* Question Type-Specific Inputs */}
          <WorksheetQuestionEditorInput
            question={question}
            onUpdate={onUpdate}
            onAddOption={onAddOption}
            onRemoveOption={onRemoveOption}
            onUpdateOption={onUpdateOption}
            onToggleCorrectAnswer={onToggleCorrectAnswer}
          />

          {/* Markscheme Section - Hidden for Multiple Choice */}
          {question.type !== "multiple_choice" && question.type !== "true_false" && (
            <>
              <Separator />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Markscheme</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openMarkschemeDialog()}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
                {question.markschemeItems && question.markschemeItems.length > 0 ? (
                  <div className="space-y-1">
                    {question.markschemeItems.map((item) => (
                      <Card key={item.id} className="border">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-0.5">
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="font-medium">
                                  {item.points} {item.points === 1 ? 'point' : 'points'}
                                </Badge>
                              </div>
                              <p className="text-sm text-foreground">{item.description}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openMarkschemeDialog(item)}
                                className="h-8 w-8 p-0"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeMarkschemeItem(item.id)}
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 border border-dashed rounded-lg bg-muted/20">
                    <p className="text-sm text-muted-foreground mb-3">No markscheme items yet</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openMarkschemeDialog()}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Item
                    </Button>
                  </div>
                )}
              </div>

              <Separator />
            </>
          )}

          {/* Question Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Estimation Time</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  value={question.estimationTime || 2}
                  onChange={(e) => onUpdate({ estimationTime: parseInt(e.target.value) || 2 })}
                  className="pl-9"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">mins</span>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-sm font-medium">Points</Label>
              <div className="relative">
                <Gem className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  value={question.points}
                  onChange={(e) => onUpdate({ points: parseInt(e.target.value) || 1 })}
                  className="pl-9"
                  disabled={question.markschemeItems && question.markschemeItems.length > 0}
                  min="0"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">pts</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Markscheme Item Dialog */}
      <Dialog open={markschemeDialogOpen} onOpenChange={setMarkschemeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingMarkschemeItem ? "Edit Markscheme Item" : "Add Markscheme Item"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="markscheme-points">
                Points <span className="text-destructive">*</span>
              </Label>
              <Input
                id="markscheme-points"
                type="number"
                value={markschemeForm.points}
                onChange={(e) => setMarkschemeForm({ ...markschemeForm, points: e.target.value })}
                placeholder="e.g., 5"
                min="0"
                step="0.5"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="markscheme-description">
                Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="markscheme-description"
                value={markschemeForm.description}
                onChange={(e) => setMarkschemeForm({ ...markschemeForm, description: e.target.value })}
                placeholder="Describe what students need to demonstrate..."
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setMarkschemeDialogOpen(false);
                  setMarkschemeForm({ points: "", description: "" });
                  setEditingMarkschemeItem(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={saveMarkschemeItem}>
                {editingMarkschemeItem ? "Save Changes" : "Add Item"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

