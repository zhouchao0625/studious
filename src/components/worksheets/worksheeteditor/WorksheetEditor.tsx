"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  CheckCircle,
  FileText,
  Calculator,
  ToggleLeft,
  Save,
  Eye,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { WorksheetBlockEditor, type Question, type QuestionType, type MultipleChoiceOption } from "./WorksheetBlockEditor";
import { WorksheetViewer } from "../worksheet-viewer";
import { QuestionListItem, DropZone } from "../question-list-item";
import { trpc } from "@/lib/trpc";
import { EmptyState } from "@/components/ui/empty-state";

interface WorksheetEditorProps {
  worksheetId?: string;
  classId?: string;
  initialTitle?: string;
  initialQuestions?: Question[];
}

// Helper function to map frontend question types to backend types
const mapQuestionTypeToBackend = (type: QuestionType): 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'MATH_EXPRESSION' | 'LONG_ANSWER' => {
  switch (type) {
    case "multiple_choice":
      return "MULTIPLE_CHOICE";
    case "true_false":
      return "TRUE_FALSE";
    case "math":
      return "MATH_EXPRESSION";
    case "long_form":
      return "LONG_ANSWER";
    default:
      return "LONG_ANSWER";
  }
};

// Helper function to map backend question types to frontend types
const mapBackendTypeToFrontend = (type: string): QuestionType => {
  switch (type) {
    case "MULTIPLE_CHOICE":
      return "multiple_choice";
    case "TRUE_FALSE":
      return "true_false";
    case "MATH_EXPRESSION":
      return "math";
    case "LONG_ANSWER":
    case "ESSAY":
      return "long_form";
    default:
      return "long_form";
  }
};

// Helper function to convert question to backend format
const convertQuestionToBackend = (q: Question): { answer: string; markScheme: any } => {
  let answer = "";
  let markScheme: any = null;

  switch (q.type) {
    case "multiple_choice":
      // Store options as JSON array with { label: string, correct?: boolean }
      if (q.options && q.options.length > 0) {
        const optionsJson = q.options.map(opt => ({
          label: opt.text,
          correct: opt.isCorrect || false
        }));
        answer = JSON.stringify(optionsJson);
      }
      break;
    case "true_false":
      answer = q.correctAnswer ? "true" : "false";
      break;
    case "math":
      answer = q.mathExpression || "";
      break;
    case "long_form":
      answer = q.sampleAnswer || "";
      break;
  }

  // Convert markscheme items to JSON
  if (q.markschemeItems && q.markschemeItems.length > 0) {
    markScheme = q.markschemeItems;
  }

  return { answer, markScheme };
};

export function WorksheetEditor({ worksheetId: propWorksheetId, classId, initialTitle = "", initialQuestions = [] }: WorksheetEditorProps) {
  const t = useTranslations('worksheets');
  const router = useRouter();

  // Load worksheet data if worksheetId is provided
  const worksheetQuery = propWorksheetId ? trpc.worksheet.getWorksheet.useQuery({
    worksheetId: propWorksheetId,
  }) : null;
  const worksheetData = worksheetQuery?.data ?? null;
  const isLoading = worksheetQuery?.isLoading ?? false;
  const refetchWorksheet = worksheetQuery?.refetch;

  const reorderQuestionsMutation = trpc.worksheet.reorderQuestions.useMutation();

  // Initialize with worksheet data
  const [title, setTitle] = useState(
    worksheetData?.name || initialTitle
  );
  const [questions, setQuestions] = useState<Question[]>(() => {
    if (worksheetData?.questions && worksheetData.questions.length > 0) {
      // Convert backend questions to frontend format
      return worksheetData.questions.sort((a: any, b: any) => a.order - b.order).map((q: any) => {
        const baseQuestion = {
          id: q.id,
          type: mapBackendTypeToFrontend(q.type),
          question: q.question,
          points: 1, // Default, could be stored in backend
          required: true,
          estimationTime: 2,
          markschemeItems: q.markScheme || [],
          order: q.order,
        };

        // Parse MCQ options from JSON answer
        if (q.type === 'MULTIPLE_CHOICE' && q.answer) {
          try {
            const optionsJson = JSON.parse(q.answer);
            if (Array.isArray(optionsJson)) {
              return {
                ...baseQuestion,
                options: optionsJson.map((opt: any, index: number) => ({
                  id: `opt-${q.id}-${index}`,
                  text: opt.label || opt.text || '',
                  isCorrect: opt.correct || false,
                })),
              };
            }
          } catch (e) {
            // If parsing fails, return empty options
            console.error('Failed to parse MCQ options:', e);
          }
          return {
            ...baseQuestion,
            options: [],
          };
        }

        // Handle other question types
        if (q.type === 'TRUE_FALSE') {
          return {
            ...baseQuestion,
            correctAnswer: q.answer === 'true',
          };
        }

        if (q.type === 'MATH_EXPRESSION') {
          return {
            ...baseQuestion,
            mathExpression: q.answer,
          };
        }

        if (q.type === 'LONG_ANSWER') {
          return {
            ...baseQuestion,
            sampleAnswer: q.answer,
          };
        }

        return baseQuestion;
      });
    }
    return initialQuestions.length > 0 ? initialQuestions.sort((a, b) => a.order - b.order) : [];
  });
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(
    questions.length > 0 ? questions[0].id : null
  );
  const [previewOpen, setPreviewOpen] = useState(false);
  const [worksheetId] = useState<string | null>(propWorksheetId || null);
  const [originalQuestions, setOriginalQuestions] = useState<Question[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Update title when worksheet data loads
  useEffect(() => {
    if (worksheetData?.name) {
      setTitle(worksheetData.name);
    }
  }, [worksheetData?.name]);

  // Store original questions when they're loaded
  useEffect(() => {
    if (worksheetData?.questions && worksheetData.questions.length > 0) {
      const convertedQuestions = worksheetData.questions.map((q: any) => {
        const baseQuestion = {
          id: q.id,
          type: mapBackendTypeToFrontend(q.type),
          question: q.question,
          points: 1,
          required: true,
          estimationTime: 2,
          order: q.order,
          markschemeItems: q.markScheme || [],
        };

        if (q.type === 'MULTIPLE_CHOICE' && q.answer) {
          try {
            const optionsJson = JSON.parse(q.answer);
            if (Array.isArray(optionsJson)) {
              return {
                ...baseQuestion,
                options: optionsJson.map((opt: any, index: number) => ({
                  id: `opt-${q.id}-${index}`,
                  text: opt.label || opt.text || '',
                  isCorrect: opt.correct || false,
                })),
              };
            }
          } catch (e) {
            console.error('Failed to parse MCQ options:', e);
          }
          return { ...baseQuestion, options: [] };
        }

        if (q.type === 'TRUE_FALSE') {
          return { ...baseQuestion, correctAnswer: q.answer === 'true' };
        }

        if (q.type === 'MATH_EXPRESSION') {
          return { ...baseQuestion, mathExpression: q.answer };
        }

        if (q.type === 'LONG_ANSWER') {
          return { ...baseQuestion, sampleAnswer: q.answer };
        }

        return baseQuestion;
      });
      setOriginalQuestions(convertedQuestions.sort((a, b) => a.order - b.order));
    }
  }, [worksheetData]);

  // tRPC mutations
  const addQuestionMutation = trpc.worksheet.addQuestion.useMutation();
  const updateQuestionMutation = trpc.worksheet.updateQuestion.useMutation();
  const updateWorksheetMutation = trpc.worksheet.updateWorksheet.useMutation();

  const selectedQuestion = questions.find(q => q.id === selectedQuestionId) || questions[0] || null;
  const selectedQuestionIndex = selectedQuestion ? questions.findIndex(q => q.id === selectedQuestion.id) : -1;

  const addQuestion = (type: QuestionType) => {
    const newQuestion: Question = {
      id: `q-${Date.now()}-${Math.random()}`,
      type,
      question: "",
      points: 1,
      required: true,
      estimationTime: 2,
      order: questions.length,
      randomizeOrder: false,
      markschemeItems: [],
      ...(type === "multiple_choice" && {
        options: [
          { id: `opt-1`, text: "", isCorrect: false },
          { id: `opt-2`, text: "", isCorrect: false },
        ]
      }),
      ...(type === "true_false" && {
        correctAnswer: true
      })
    };
    const updatedQuestions = [...questions, newQuestion];
    setQuestions(updatedQuestions);
    setSelectedQuestionId(newQuestion.id);
  };

  const removeQuestion = (questionId: string) => {
    const updatedQuestions = questions.filter(q => q.id !== questionId);
    setQuestions(updatedQuestions);
    if (selectedQuestionId === questionId) {
      setSelectedQuestionId(updatedQuestions.length > 0 ? updatedQuestions[0].id : null);
    }
  };

  const updateQuestion = (questionId: string, updates: Partial<Question>) => {
    setQuestions(questions.map(q => 
      q.id === questionId ? { ...q, ...updates } : q
    ));
  };

  const addOption = (questionId: string) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId && q.type === "multiple_choice") {
        const newOption: MultipleChoiceOption = {
          id: `opt-${Date.now()}`,
          text: "",
          isCorrect: false
        };
        return {
          ...q,
          options: [...(q.options || []), newOption]
        };
      }
      return q;
    }));
  };

  const removeOption = (questionId: string, optionId: string) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId && q.type === "multiple_choice") {
        return {
          ...q,
          options: q.options?.filter(opt => opt.id !== optionId) || []
        };
      }
      return q;
    }));
  };

  const updateOption = (questionId: string, optionId: string, updates: Partial<MultipleChoiceOption>) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId && q.type === "multiple_choice") {
        return {
          ...q,
          options: q.options?.map(opt =>
            opt.id === optionId ? { ...opt, ...updates } : opt
          )
        };
      }
      return q;
    }));
  };

  const toggleCorrectAnswer = (questionId: string, optionId: string) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId && q.type === "multiple_choice") {
        return {
          ...q,
          options: q.options?.map(opt => ({
            ...opt,
            isCorrect: opt.id === optionId ? !opt.isCorrect : false
          }))
        };
      }
      return q;
    }));
  };

  const reorderQuestions = (draggedId: string, targetId: string, position: 'before' | 'after') => {
    reorderQuestionsMutation.mutate({
      worksheetId: worksheetId!,
      movedId: draggedId,
      targetId: targetId,
      position: position,
    });
    
    const targetIndex = questions.findIndex(q => q.id === targetId);
    const currentIndex = questions.findIndex(q => q.id === draggedId);
    if (currentIndex === -1 || currentIndex === targetIndex) return;
    if (targetIndex === -1) return;

    const newQuestions = [...questions];
    const [moved] = newQuestions.splice(currentIndex, 1);
    if (position === 'before') {
      newQuestions.splice(targetIndex - 1, 0, moved);
    } else {
      newQuestions.splice(targetIndex, 0, moved);
    }
    setQuestions(newQuestions);
  };

  const handleSave = async () => {
    if (isSaving) return; // Prevent multiple simultaneous saves
    
    if (!title.trim()) {
      toast.error(t('create.errors.titleRequired'));
      return;
    }

    if (questions.length === 0) {
      toast.error(t('create.errors.atLeastOneQuestion'));
      return;
    }

    // Validate all questions
    for (const q of questions) {
      if (!q.question.trim()) {
        toast.error(t('create.errors.questionTextRequired'));
        return;
      }
      if (q.type === "multiple_choice") {
        if (!q.options || q.options.length < 2) {
          toast.error(t('create.errors.multipleChoiceOptions'));
          return;
        }
        if (!q.options.some(opt => opt.isCorrect)) {
          toast.error(t('create.errors.multipleChoiceCorrectAnswer'));
          return;
        }
      }
    }

    setIsSaving(true);
    try {
      // Update worksheet name
      const currentWorksheetId = worksheetId;
      if (!currentWorksheetId) {
        toast.error("Worksheet ID is missing");
        return;
      }

      // Update worksheet name if it changed
      if (worksheetData?.name !== title.trim()) {
        await updateWorksheetMutation.mutateAsync({
          worksheetId: currentWorksheetId,
          name: title.trim(),
        });
      }

      // Helper function to check if a question has changed
      const hasQuestionChanged = (currentQ: Question, originalQ: Question | undefined): boolean => {
        if (!originalQ) return true; // New question
        
        // Compare basic fields
        if (currentQ.question !== originalQ.question) return true;
        if (currentQ.type !== originalQ.type) return true;
        if (currentQ.points !== originalQ.points) return true;
        if (currentQ.estimationTime !== originalQ.estimationTime) return true;
        
        // Compare markscheme items
        const currentMarkscheme = JSON.stringify(currentQ.markschemeItems || []);
        const originalMarkscheme = JSON.stringify(originalQ.markschemeItems || []);
        if (currentMarkscheme !== originalMarkscheme) return true;
        
        // Compare type-specific fields
        if (currentQ.type === "multiple_choice") {
          const currentOptions = JSON.stringify(currentQ.options?.map(o => ({ text: o.text, isCorrect: o.isCorrect })) || []);
          const originalOptions = JSON.stringify(originalQ.options?.map(o => ({ text: o.text, isCorrect: o.isCorrect })) || []);
          if (currentOptions !== originalOptions) return true;
        }
        
        if (currentQ.type === "true_false" && currentQ.correctAnswer !== originalQ.correctAnswer) return true;
        if (currentQ.type === "math" && currentQ.mathExpression !== originalQ.mathExpression) return true;
        if (currentQ.type === "long_form" && currentQ.sampleAnswer !== originalQ.sampleAnswer) return true;
        
        return false;
      };

      // Add/update only changed questions
      for (const q of questions) {
        const { answer, markScheme } = convertQuestionToBackend(q);
        const backendType = mapQuestionTypeToBackend(q.type);
        const originalQ = originalQuestions.find(oq => oq.id === q.id);
        console.log(q.points);
        // Check if question has a server ID (starts with "q-" means it's local)
        if (q.id.startsWith("q-")) {
          // New question - add it
          await addQuestionMutation.mutateAsync({
            worksheetId: currentWorksheetId,
            question: q.question.trim(),
            options: q.options,
            points: q.points,
            answer,
            markScheme,
            type: backendType,
          });
        } else if (hasQuestionChanged(q, originalQ)) {
          // Existing question - only update if it changed
          await updateQuestionMutation.mutateAsync({
            worksheetId: currentWorksheetId,
            questionId: q.id,
            question: q.question.trim(),
            options: q.options,
            answer,
            points: q.points,
            markScheme,
            type: backendType,
          });
        }
      }

      // Refetch worksheet data to update original questions
      if (propWorksheetId && refetchWorksheet) {
        await refetchWorksheet();
      }
      
      toast.success(t('create.toasts.updated'));
      // Stay on the edit page
    } catch (error) {
      console.error("Error saving worksheet:", error);
      toast.error(t('toasts.error'));
    } finally {
      setIsSaving(false);
    }
  };

  const getQuestionTypeLabel = (type: QuestionType) => {
    switch (type) {
      case "multiple_choice":
        return t('create.questionTypes.multipleChoice');
      case "long_form":
        return t('create.questionTypes.longForm');
      case "math":
        return t('create.questionTypes.math');
      case "true_false":
        return t('create.questionTypes.trueFalse');
      default:
        return type;
    }
  };

  const getQuestionTypeIcon = (type: QuestionType) => {
    switch (type) {
      case "multiple_choice":
        return <CheckCircle className="h-3.5 w-3.5" />;
      case "long_form":
        return <FileText className="h-3.5 w-3.5" />;
      case "math":
        return <Calculator className="h-3.5 w-3.5" />;
      case "true_false":
        return <ToggleLeft className="h-3.5 w-3.5" />;
      default:
        return null;
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3rem)]">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Loading worksheet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)] -mx-4">
      {/* Header */}
      <div className="flex-shrink-0 bg-background/95 backdrop-blur-sm border-b border-border px-4 pb-3 mb-3 pt-4">
        <div className="flex flex-col gap-3">
          {/* Title Row */}
          <div className="flex items-center justify-between gap-4">
            {classId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/class/${classId}/worksheets`)}
                className="flex-shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div className="flex-1 min-w-0">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('create.fields.titlePlaceholder')}
                className="text-2xl md:text-2xl font-semibold border-0 shadow-none px-0 h-auto py-1 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/40 bg-transparent"
              />
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setPreviewOpen(true)}
                className="gap-2"
              >
                <Eye className="h-4 w-4" />
                <span className="hidden sm:inline">Preview</span>
              </Button>
              <Button 
                onClick={handleSave} 
                size="sm"
                className="gap-2"
                disabled={isSaving || updateWorksheetMutation.isPending || addQuestionMutation.isPending || updateQuestionMutation.isPending}
              >
                {isSaving || updateWorksheetMutation.isPending || addQuestionMutation.isPending || updateQuestionMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="hidden sm:inline">Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span className="hidden sm:inline">{t('create.actions.save')}</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
              <span>{questions.length} {questions.length === 1 ? 'question' : 'questions'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
              <span>{questions.reduce((sum, q) => sum + q.points, 0)} points</span>
            </div>
            {questions.length > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                <span>~{questions.reduce((sum, q) => sum + (q.estimationTime || 0), 0)} min</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-6 px-4 overflow-hidden">
        {/* Left Sidebar - Question List */}
        <div className="lg:col-span-1 flex flex-col min-h-0">
          <Card className="flex flex-col h-full">
            <CardHeader className="flex-shrink-0 pb-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  Questions ({questions.length})
                </CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => addQuestion("multiple_choice")}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {t('create.questionTypes.multipleChoice')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => addQuestion("long_form")}>
                      <FileText className="h-4 w-4 mr-2" />
                      {t('create.questionTypes.longForm')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => addQuestion("math")}>
                      <Calculator className="h-4 w-4 mr-2" />
                      {t('create.questionTypes.math')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => addQuestion("true_false")}>
                      <ToggleLeft className="h-4 w-4 mr-2" />
                      {t('create.questionTypes.trueFalse')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 overflow-hidden">
              <DndProvider backend={HTML5Backend}>
                <div className="space-y-1 h-full overflow-y-auto">
                  {questions.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                      <p className="text-sm font-medium text-foreground mb-1">No questions yet</p>
                      <p className="text-xs text-muted-foreground mb-4">
                        Add your first question to get started
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => addQuestion("multiple_choice")}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Question
                      </Button>
                    </div>
                  ) : (
                    <>
                      {questions.map((question, index) => (
                        <QuestionListItem
                          key={question.id}
                          question={question}
                          index={index}
                          isSelected={selectedQuestionId === question.id}
                          onSelect={() => setSelectedQuestionId(question.id)}
                          onDelete={() => removeQuestion(question.id)}
                          onReorder={reorderQuestions}
                          getQuestionTypeIcon={getQuestionTypeIcon}
                          getQuestionTypeLabel={getQuestionTypeLabel}
                        />
                      ))}
                      <DropZone id={questions[questions.length - 1].id} position="after" onReorder={reorderQuestions} />
                    </>
                  )}
                </div>
              </DndProvider>
            </CardContent>
          </Card>
        </div>

        {/* Main Editor Area */}
        <div className="lg:col-span-2 flex flex-col min-h-0">
          {selectedQuestion ? (
              <WorksheetBlockEditor
                question={selectedQuestion}
                questionIndex={selectedQuestionIndex}
                onUpdate={(updates) => updateQuestion(selectedQuestion.id, updates)}
                onAddOption={() => addOption(selectedQuestion.id)}
                onRemoveOption={(optionId) => removeOption(selectedQuestion.id, optionId)}
                onUpdateOption={(optionId, updates) => updateOption(selectedQuestion.id, optionId, updates)}
                onToggleCorrectAnswer={(optionId) => toggleCorrectAnswer(selectedQuestion.id, optionId)}
              />
          ) : (
            <EmptyState
              icon={FileText}
              title="No question yet"
              description="Select a question from the list or add a new one to get started"
            />
          )}
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0 border-b">
            <DialogTitle className="text-2xl">{title || "Untitled Worksheet"}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="px-6 py-4">
                <WorksheetViewer
                  worksheetId={worksheetId!}
                />
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

