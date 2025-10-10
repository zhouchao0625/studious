"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { toast } from "sonner";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { PageLayout } from "@/components/ui/page-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DraggableAssignment } from "@/components/DraggableAssignment";
import { trpc } from "@/lib/trpc";
import { AILabModal } from "@/components/modals";
import { 
  Sparkles, 
  BookOpen, 
  Users, 
  FileText, 
  Brain, 
  ClipboardList, 
  GraduationCap, 
  Target, 
  Zap,
  MessageSquare,
  Eye,
  Clock,
  Trash2
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";



export default function ClassAILabs() {
  const { id: classId } = useParams();
  const router = useRouter();
  const appState = useSelector((state: RootState) => state.app);
  const isStudent = appState.user.student;
  
  const [selectedLabType, setSelectedLabType] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'drafts' | 'chats'>('drafts');

  // Fetch lab chats from backend
  const { data: labChats, isLoading: isLoadingLabChats, refetch: refetchLabChats } = trpc.labChat.list.useQuery({
    classId: classId as string
  });

  // Fetch class data to get assignments
  const { data: classData, isLoading: isLoadingClass } = trpc.class.get.useQuery({
    classId: classId as string
  });

  // Create lab chat mutation
  const createLabChatMutation = trpc.labChat.create.useMutation({
    onSuccess: (newLabChat) => {
      toast.success('AI Lab created successfully!');
      setShowModal(false);
      setSelectedLabType(null);
      refetchLabChats();
      // Navigate to the new lab chat
      router.push(`/class/${classId}/ai-labs/chats/${newLabChat.id}`);
    },
    onError: (error) => {
      toast.error('Failed to create AI Lab: ' + error.message);
    }
  });

  // Delete lab chat mutation
  const deleteLabChatMutation = trpc.labChat.delete.useMutation({
    onSuccess: () => {
      toast.success('AI Lab deleted successfully!');
      refetchLabChats();
    },
    onError: (error) => {
      toast.error('Failed to delete AI Lab: ' + error.message);
    }
  });

  // Sort chats by most recent first
  const sortedChats = labChats?.sort((a, b) => 
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  ) || [];

  // Filter assignments that are inProgress (lab drafts) and sort by most recent
  const assignments = classData?.class?.assignments || [];
  const labDrafts = assignments.filter(assignment => assignment.inProgress);
  const sortedDrafts = labDrafts.sort((a, b) => 
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  const handleCreateLabChat = (data: { title: string; context: any }) => {
    createLabChatMutation.mutate({
      classId: classId as string,
      title: data.title,
      context: JSON.stringify(data.context)
    });
  };

  const handleDeleteLabChat = (labChatId: string) => {
    if (window.confirm('Are you sure you want to delete this AI Lab? This action cannot be undone.')) {
      deleteLabChatMutation.mutate({ labChatId });
    }
  };

  const handleLabChatClick = (labChatId: string) => {
    router.push(`/class/${classId}/ai-labs/chats/${labChatId}`);
  };


  const creationWidgets = [
    {
      id: "assignment",
      title: "Assignment",
      description: "Create interactive assignments with AI assistance",
      icon: FileText,
      bgColor: "bg-primary/10",
      textColor: "text-primary"
    },
    {
      id: "quiz", 
      title: "Quiz",
      description: "Generate quizzes with various question types",
      icon: Brain,
      bgColor: "bg-primary/10",
      textColor: "text-primary"
    },
    {
      id: "worksheet",
      title: "Worksheet",
      description: "Build practice worksheets and exercises",
      icon: ClipboardList,
      bgColor: "bg-primary/10",
      textColor: "text-primary"
    },
    {
      id: "lesson-plan",
      title: "Lesson Plan",
      description: "Design comprehensive lesson plans",
      icon: GraduationCap,
      bgColor: "bg-primary/10",
      textColor: "text-primary"
    },
    {
      id: "rubric",
      title: "Rubric",
      description: "Create detailed grading rubrics",
      icon: Target,
      bgColor: "bg-primary/10",
      textColor: "text-primary"
    }
  ];

  const handleWidgetClick = (widgetId: string) => {
    const widget = creationWidgets.find(w => w.id === widgetId);
    if (widget) {
      setSelectedLabType(widget.title);
      setShowModal(true);
    }
  };

  const handleDeleteLab = (labId: string) => {
    console.log("Delete lab:", labId);
    // Handle lab deletion
  };

  const handlePublishLab = (labId: string) => {
    console.log("Publish lab:", labId);
    // Handle lab publishing
  };


  return (
    <DndProvider backend={HTML5Backend}>
      <PageLayout>
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">AI Labs</h1>
              <p className="text-muted-foreground mt-2">
                Create educational content with AI assistance
              </p>
            </div>
            <Badge className="bg-primary text-primary-foreground">
              <Sparkles className="h-3 w-3 mr-1" />
              AI Powered
            </Badge>
          </div>

          {/* Creation Widgets - Only show for teachers */}
          {!isStudent && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold">Create New Content</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {creationWidgets.map((widget) => {
                  const IconComponent = widget.icon;
                  return (
                    <Card 
                      key={widget.id}
                      className="cursor-pointer hover:shadow-md transition-all duration-200 group hover:border-primary/30"
                      onClick={() => handleWidgetClick(widget.id)}
                    >
                      <CardContent className="p-6 text-center space-y-3">
                        <div className={`p-3 ${widget.bgColor} rounded-lg mx-auto w-fit group-hover:scale-105 transition-transform`}>
                          <IconComponent className={`h-6 w-6 ${widget.textColor}`} />
                        </div>
    <div>
                          <h3 className="font-semibold">{widget.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {widget.description}
                          </p>
                        </div>
                        <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                          <Zap className="h-3 w-3" />
                          AI Generated
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Content Tabs */}
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'drafts' | 'chats')}>
            <TabsList>
              <TabsTrigger value="drafts">Draft Labs</TabsTrigger>
              <TabsTrigger value="chats">AI Chats</TabsTrigger>
            </TabsList>

            {/* Draft Labs Tab */}
            <TabsContent value="drafts" className="space-y-6">
              {isLoadingClass ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-muted rounded-lg">
                            <div className="h-5 w-5 bg-muted-foreground/20 rounded" />
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-muted rounded w-1/2" />
                            <div className="flex gap-2">
                              <div className="h-3 bg-muted rounded w-16" />
                              <div className="h-3 bg-muted rounded w-20" />
                            </div>
                            <div className="h-3 bg-muted rounded w-24" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : sortedDrafts.length === 0 ? (
                <EmptyState
                  icon={BookOpen}
                  title="No lab drafts yet"
                  description="Create your first AI-generated educational content using the widgets above."
                />
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Draft Labs ({sortedDrafts.length})</h3>
                  </div>
                  <div className="space-y-4">
                    {sortedDrafts.map((assignment, index) => (
                      <DraggableAssignment
                        key={assignment.id}
                        assignment={assignment}
                        classId={classId as string}
                        index={index}
                        onDelete={handleDeleteLab}
                        onPublish={handlePublishLab}
                        isTeacher={!isStudent}
                      />
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* AI Chats Tab */}
            <TabsContent value="chats" className="space-y-6">
              {isLoadingLabChats ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-muted rounded-lg">
                            <div className="h-5 w-5 bg-muted-foreground/20 rounded" />
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-muted rounded w-1/2" />
                            <div className="flex gap-2">
                              <div className="h-3 bg-muted rounded w-16" />
                              <div className="h-3 bg-muted rounded w-20" />
                            </div>
                            <div className="h-3 bg-muted rounded w-24" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : sortedChats.length === 0 ? (
                <EmptyState
                  icon={MessageSquare}
                  title="No AI Labs yet"
                  description="Create your first AI Lab to start collaborating with AI on educational content."
                />
              ) : (
                <div className="space-y-6">
                  {/* All Lab Chats */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">AI Labs ({sortedChats.length})</h3>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        <Brain className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    </div>
                    <div className="grid gap-4">
                      {sortedChats.map((labChat) => {
                        // Note: context is not included in the list response
                        // We'll show basic info and get context when opening the chat
                        const context = { topic: 'AI Lab', subject: 'General', difficulty: 'intermediate' };
                        
                        return (
                          <Card 
                            key={labChat.id}
                            className="cursor-pointer hover:shadow-md transition-all duration-200 hover:border-primary/30"
                            onClick={() => handleLabChatClick(labChat.id)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3">
                                  <div className="p-2 bg-primary/10 rounded-lg">
                                    <Brain className="h-5 w-5 text-primary" />
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-base">{labChat.title}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Badge variant="outline" className="text-xs">
                                        {context.topic || 'AI Lab'}
                                      </Badge>
                                      <Badge variant="outline" className="text-xs">
                                        {context.subject || 'General'}
                                      </Badge>
                                      {context.difficulty && (
                                        <Badge variant="outline" className="text-xs">
                                          {context.difficulty}
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                      <div className="flex items-center gap-1">
                                        <MessageSquare className="h-3 w-3" />
                                        {labChat.messageCount || 0} messages
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {formatDistanceToNow(new Date(labChat.updatedAt), { addSuffix: true })}
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Users className="h-3 w-3" />
                                        Created by {labChat.createdBy.profile?.displayName || labChat.createdBy.username}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleLabChatClick(labChat.id);
                                    }}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  {!isStudent && (
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteLabChat(labChat.id);
                                      }}
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
    </div>

        {/* AI Lab Modal */}
        <AILabModal
          open={showModal}
          onOpenChange={setShowModal}
          labType={selectedLabType || "assignment"}
          classId={classId as string}
          onSubmit={handleCreateLabChat}
          isLoading={createLabChatMutation.isPending}
        />
      </PageLayout>
    </DndProvider>
  );
}