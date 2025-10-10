"use client";

import { AppLayout } from "@/components/ui/app-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { trpc, type RouterOutputs } from "@/lib/trpc";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { 
  Calendar, 
  Clock, 
  BookOpen, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  Users,
  Bell,
  ChevronRight,
  GraduationCap
} from "lucide-react";
import Link from "next/link";
import { format, isToday, isTomorrow, parseISO } from "date-fns";

type ClassData = RouterOutputs['class']['getAll'];
type Assignment = NonNullable<ClassData['teacherInClass']>[0]['assignments'][0];
type ClassWithAssignments = NonNullable<ClassData['teacherInClass']>[0];

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-16" />
            </CardHeader>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-10 w-10 rounded" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32 mt-1" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        <div>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-28" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i}>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-20 mt-1" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  description, 
  trend 
}: { 
  title: string; 
  value: string | number; 
  icon: any; 
  description?: string;
  trend?: { value: string; isPositive: boolean };
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        {trend && (
          <div className={`flex items-center text-xs ${trend.isPositive ? 'text-green-600' : 'text-red-600'} mt-1`}>
            <TrendingUp className="h-3 w-3 mr-1" />
            {trend.value}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function UpcomingAssignments({ classes }: { classes: ClassData }) {
  const allAssignments: Array<Assignment & { class: ClassWithAssignments; role: 'teacher' | 'student' }> = [
    ...(classes?.teacherInClass || []).flatMap(cls => 
      cls.assignments.map(assignment => ({ ...assignment, class: cls, role: 'teacher' as const }))
    ),
    ...(classes?.studentInClass || []).flatMap(cls => 
      cls.assignments.map(assignment => ({ ...assignment, class: cls, role: 'student' as const }))
    )
  ];

  const upcomingAssignments = allAssignments
    .filter(assignment => new Date(assignment.dueDate) > new Date())
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5);

  const formatDueDate = (dueDate: string) => {
    const date = parseISO(dueDate);
    if (isToday(date)) return "Due today";
    if (isTomorrow(date)) return "Due tomorrow";
    return `Due ${format(date, 'MMM d')}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Assignments</CardTitle>
        <CardDescription>Your next deadlines</CardDescription>
      </CardHeader>
      <CardContent>
        {upcomingAssignments.length === 0 ? (
          <div className="space-y-4">
            <EmptyState
              icon={CheckCircle}
              title="All caught up!"
              description="No upcoming assignments at the moment."
            />
            <div className="flex justify-center">
              <Link href="/agenda">
                <Button variant="outline">
                  View Agenda
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {upcomingAssignments.map((assignment) => (
              <div key={`${assignment.class.id}-${assignment.id}`} className="flex items-start space-x-3 p-3 rounded-lg border">
                <div className={`w-3 h-3 rounded-full mt-2 ${assignment.class.color ? `bg-[${assignment.class.color}]` : 'bg-primary'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <Link 
                        href={`/class/${assignment.class.id}/assignment/${assignment.id}`}
                        className="font-medium text-foreground hover:text-primary transition-colors"
                      >
                        {assignment.title}
                      </Link>
                      <p className="text-sm text-muted-foreground">{assignment.class.name}</p>
                    </div>
                    <Badge 
                      variant={isToday(parseISO(assignment.dueDate)) ? "destructive" : "secondary"}
                      className="ml-2"
                    >
                      {formatDueDate(assignment.dueDate)}
                    </Badge>
                  </div>
                  {assignment.role === 'teacher' && (
                    <div className="flex items-center gap-2 mt-1">
                      <Users className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Teaching</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <Link href="/agenda">
              <Button variant="ghost" className="w-full">
                View All Assignments
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RecentNotifications() {
  const { data: notifications, isLoading } = trpc.notification.list.useQuery();

  const recentNotifications = notifications?.slice(0, 5) || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Notifications</CardTitle>
        <CardDescription>Latest updates</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i}>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-20 mt-1" />
              </div>
            ))}
          </div>
        ) : recentNotifications.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-2" />
            <p>No new notifications</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentNotifications.map((notification) => (
              <div key={notification.id} className="flex items-start space-x-3">
                <div className={`w-2 h-2 rounded-full mt-2 ${notification.read ? 'bg-muted' : 'bg-primary'}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${notification.read ? 'text-muted-foreground' : 'text-foreground font-medium'}`}>
                    {notification.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(notification.createdAt), 'MMM d, h:mm a')}
                  </p>
                </div>
              </div>
            ))}
            <Link href="/notifications">
              <Button variant="ghost" className="w-full">
                View All Notifications
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ClassOverview({ classes }: { classes: ClassData }) {
  const teachingClasses = classes?.teacherInClass || [];
  const enrolledClasses = classes?.studentInClass || [];
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>My Classes</CardTitle>
        <CardDescription>Quick access to your classes</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {teachingClasses.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                Teaching ({teachingClasses.length})
              </h4>
              <div className="space-y-2">
                {teachingClasses.slice(0, 3).map((cls) => (
                  <Link key={cls.id} href={`/class/${cls.id}`}>
                    <div className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50 transition-colors">
                      <div className={`w-3 h-3 rounded-full ${cls.color ? `bg-[${cls.color}]` : 'bg-primary'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{cls.name}</p>
                        <p className="text-xs text-muted-foreground">{cls.subject} • {cls.section}</p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {cls.dueToday?.length || 0} due
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
          
          {enrolledClasses.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Enrolled ({enrolledClasses.length})
              </h4>
              <div className="space-y-2">
                {enrolledClasses.slice(0, 3).map((cls) => (
                  <Link key={cls.id} href={`/class/${cls.id}`}>
                    <div className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50 transition-colors">
                      <div className={`w-3 h-3 rounded-full ${cls.color ? `bg-[${cls.color}]` : 'bg-primary'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{cls.name}</p>
                        <p className="text-xs text-muted-foreground">{cls.subject} • {cls.section}</p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {cls.dueToday?.length || 0} due
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
          
          {teachingClasses.length === 0 && enrolledClasses.length === 0 && (
            <div className="text-center py-6 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-2" />
              <p>No classes yet</p>
              <Link href="/classes">
                <Button variant="outline" className="mt-2">
                  Browse Classes
                </Button>
              </Link>
            </div>
          )}
          
          <Link href="/classes">
            <Button variant="ghost" className="w-full">
              View All Classes
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function HomePage() {
  const appState = useSelector((state: RootState) => state.app);
  const { data: classes, isLoading } = trpc.class.getAll.useQuery();

  if (isLoading) {
    return (
      <AppLayout isAuthenticated={appState.user.loggedIn}>
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <DashboardSkeleton />
        </div>
      </AppLayout>
    );
  }

  const teachingClasses = classes?.teacherInClass || [];
  const enrolledClasses = classes?.studentInClass || [];
  const totalClasses = teachingClasses.length + enrolledClasses.length;
  
  const allAssignments: Assignment[] = [
    ...teachingClasses.flatMap(cls => cls.assignments),
    ...enrolledClasses.flatMap(cls => cls.assignments)
  ];
  
  const upcomingCount = allAssignments.filter(a => new Date(a.dueDate) > new Date()).length;
  const dueTodayCount = allAssignments.filter(a => isToday(parseISO(a.dueDate))).length;

  return (
    <AppLayout isAuthenticated={appState.user.loggedIn}>
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {appState.user.displayName || appState.user.username}!
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening with your classes today.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Classes"
            value={totalClasses}
            icon={BookOpen}
            description={`${teachingClasses.length} teaching, ${enrolledClasses.length} enrolled`}
          />
          <StatsCard
            title="Due Today"
            value={dueTodayCount}
            icon={AlertCircle}
            description="Assignments due today"
          />
          <StatsCard
            title="Upcoming"
            value={upcomingCount}
            icon={Clock}
            description="Assignments coming up"
          />
          <StatsCard
            title="This Week"
            value={allAssignments.length}
            icon={Calendar}
            description="Total assignments"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Assignments */}
          <div className="lg:col-span-2">
            <UpcomingAssignments classes={classes || { teacherInClass: [], studentInClass: [] }} />
          </div>
          
          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            <ClassOverview classes={classes || { teacherInClass: [], studentInClass: [] }} />
            <RecentNotifications />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
