"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { PageLayout } from "@/components/ui/page-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { 
  MessageSquare, 
  Send, 
  FileText, 
  Calendar,
  Clock,
  Users,
  MoreVertical,
  BookOpen,
  Paperclip
} from "lucide-react";
import { trpc, type RouterOutputs } from "@/lib/trpc";
import { toast } from "sonner";
import { format } from "date-fns";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { useTranslations } from "next-intl"

type Class = RouterOutputs['class']['get']['class'];
type Announcement = RouterOutputs['class']['get']['class']['announcements'][number];
type Assignment = RouterOutputs['class']['get']['class']['assignments'][number];

export default function ClassFeed() {
  const params = useParams();
  const router = useRouter();

  const appState = useSelector((state: RootState) => state.app);
  const classId = params.id as string;
  
  const [newPost, setNewPost] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const t = useTranslations('overview');

  // Get class data
  const { data: classData, isLoading, refetch } = trpc.class.get.useQuery({ 
    classId 
  });

  // Create announcement mutation
  const createAnnouncementMutation = trpc.announcement.create.useMutation({
    onSuccess: () => {
      toast.success("Your announcement has been shared with the class.");
      setNewPost("");
      setIsPosting(false);
      // Refetch class data to show new announcement
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
      setIsPosting(false);
    },
  });

  const handlePost = async () => {
    if (!newPost.trim()) return;
    
    setIsPosting(true);
    createAnnouncementMutation.mutate({
      classId,
      remarks: newPost.trim(),
    });
  };

  const isTeacher = appState.user.teacher;
  const classInfo = classData?.class;

  // Combine announcements and assignments into a unified feed
  const feedItems: Array<{
    id: string;
    type: 'announcement' | 'assignment';
    data: Announcement | Assignment;
    teacher: RouterOutputs['announcement']['getAll']['announcements'][number]['teacher'];
    createdAt: string;
  }> = [];
  
  // Add announcements
  if (classInfo?.announcements) {
    feedItems.push(...classInfo.announcements.map(announcement => ({
      id: announcement.id,
      type: 'announcement' as const,
      data: announcement,
      createdAt: announcement.createdAt,
      teacher: announcement.teacher,
    })));
  }

  // Add assignments as feed items
  if (classInfo?.assignments) {
    feedItems.push(...classInfo.assignments.map(assignment => ({
      id: assignment.id,
      type: 'assignment' as const,
      data: assignment,
      createdAt: assignment.createdAt,
      teacher: assignment.teacher,
    })));
  }

  // Sort by creation date (newest first)
  feedItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (isLoading) {
    return (
      <PageLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded mb-4"></div>
            <div className="h-24 bg-muted rounded mb-6"></div>
            <div className="space-y-4">
              <div className="h-32 bg-muted rounded"></div>
              <div className="h-32 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Class Header */}
        <Card className="relative overflow-hidden border-0">
          <div className="h-32 relative">
            <div 
              className="absolute inset-0 bg-gradient-to-br opacity-90 rounded-lg"
              style={{ 
                backgroundImage: `linear-gradient(135deg, ${classInfo?.color || '#3b82f6'}dd, ${classInfo?.color || '#3b82f6'}aa), url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" stroke-width="0.5" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>')` 
              }}
            />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <h1 className="text-2xl font-bold text-white mb-1">
                {classInfo?.name || 'Loading...'}
              </h1>
              <div className="flex items-center gap-4 text-white/90 text-sm">
                <span className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  {classInfo?.subject || 'Subject'}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {classInfo?.students?.length || 0} {t('students')}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* New Post Card - Teachers Only */}
        {isTeacher && (
          <Card className="border-border shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarImage src={appState.user.profilePicture || ""} />
                  <AvatarFallback className="bg-primary/10 text-primary font-medium">
                    {appState.user.username?.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-4">
                  <Textarea
                    placeholder="Share something with your class..."
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    className="min-h-[80px] resize-none border-border bg-background focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all duration-200 placeholder:text-muted-foreground/60"
                  />
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm" className="h-9 px-3 text-muted-foreground hover:text-foreground hover:bg-muted/50">
                        <Paperclip className="h-4 w-4 mr-2" />
                        {t('attachFile')}
                      </Button>
                    </div>
                    <Button 
                      onClick={handlePost}
                      disabled={!newPost.trim() || isPosting}
                      size="sm"
                      className="h-9 px-4 font-medium"
                    >
                      {isPosting ? (
                        <>
                          <div className="animate-spin h-3 w-3 border border-white border-t-transparent rounded-full mr-2" />
                          {t('posting')}
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          {t('post')}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Feed Items */}
        <div className="space-y-6">
          {feedItems.length === 0 ? (
            <Card className="border-border shadow-sm">
              <CardContent className="py-12 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t('noPosts')}</h3>
                <p className="text-muted-foreground mb-4">
                  {isTeacher 
                    ? "Share announcements, assignments, and updates with your class."
                    : "Your teacher hasn't posted anything yet."
                  }
                </p>
                {isTeacher && (
                  <Button onClick={() => setNewPost("Share something with your class...")}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    {t('createFirstPost')}
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            feedItems.filter((item) => item.type === "announcement").map((item) => (
              <Card key={`${item.type}-${item.id}`} className="border-border shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  {item.type === 'announcement' && (
                    <AnnouncementItem announcement={item.data as Announcement} />
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </PageLayout>
  );
}

// Announcement Item Component
function AnnouncementItem({ announcement }: { announcement: Announcement }) {
  console.log(announcement);
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage src={announcement.teacher.profile?.profilePicture || ""} />
            <AvatarFallback>
              {announcement.teacher.username.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-medium text-sm">{announcement.teacher.username}</p>
            <p className="text-xs text-muted-foreground flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              {format(new Date(announcement.createdAt), 'MMM d, yyyy \'at\' h:mm a')}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="ml-11">
        <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
          {announcement.remarks}
        </div>
      </div>

    </div>
  );
}

// Assignment Item Component  
function AssignmentItem({ assignment }: { assignment: Assignment }) {
  const router = useRouter();
  const isOverdue = assignment.dueDate && new Date(assignment.dueDate) < new Date();
  const dueDate = assignment.dueDate ? new Date(assignment.dueDate) : null;
  const t = useTranslations('assignment');

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <FileText className="h-4 w-4 text-blue-600" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm">{t('newAssignment')}</p>
            <p className="text-xs text-muted-foreground flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              {format(new Date(assignment.createdAt), 'MMM d, yyyy \'at\' h:mm a')}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {assignment.graded && (
            <Badge variant="secondary" className="text-xs">
              {assignment.maxGrade} {t('pts')}
            </Badge>
          )}
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="ml-11">
        <div className="space-y-2">
          <h3 className="text-base font-semibold">{assignment.title}</h3>
          {assignment.instructions && (
            <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {assignment.instructions.length > 200 
                ? `${assignment.instructions.substring(0, 200)}...` 
                : assignment.instructions
              }
            </div>
          )}
          
          {/* Due Date */}
          {dueDate && (
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className={`text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                Due {format(dueDate, 'EEE, MMM d \'at\' h:mm a')}
                {isOverdue && (' ' + t('overdue'))}
              </span>
            </div>
          )}

          {/* Attachments */}
          {assignment.attachments && assignment.attachments.length > 0 && (
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Paperclip className="h-4 w-4" />
              <span>{assignment.attachments.length} attachment{assignment.attachments.length !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="ml-11 pt-2">
        <Separator className="mb-3" />
        <div className="flex items-center justify-end">
          <Button 
            size="sm" 
            className="h-8"
            onClick={() => router.push(`/class/${assignment.classId}/assignment/${assignment.id}`)}
          >
            {t('viewAssignment')}
          </Button>
        </div>
      </div>
    </div>
  );
}