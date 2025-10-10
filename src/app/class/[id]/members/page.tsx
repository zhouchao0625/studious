"use client";

import { useState, useMemo } from "react";
import { PageLayout } from "@/components/ui/page-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { 
  UserPlus, 
  Search, 
  Copy, 
  MoreHorizontal,
  Mail,
  UserX,
  Shield,
  User, 
  RefreshCcw
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RouterOutputs, trpc } from "@/lib/trpc";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { toast } from "sonner";
import { useParams } from "next/navigation";

type Member = {
  id: string;
  username: string;
  email?: string;
  type: 'teacher' | 'student';
  avatar?: string;
  joinedAt?: string;
  lastActive?: string;
};

type MemberFilter = 'all' | 'teachers' | 'students';

// Skeleton component for member cards
const MemberCardSkeleton = () => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
    </CardContent>
  </Card>
);

// Skeleton for the entire members page
const MembersPageSkeleton = () => (
  <PageLayout>
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Invite code skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-24" />
          </div>
        </CardContent>
      </Card>

      {/* Search skeleton */}
      <Skeleton className="h-10 w-96" />

      {/* Members list skeleton */}
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <MemberCardSkeleton key={index} />
        ))}
      </div>
    </div>
  </PageLayout>
);

export default function Members() {
  const { id: classId } = useParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("students");
  
  const appState = useSelector((state: RootState) => state.app);

  // API hooks
  const { data: classData, isLoading, error, refetch } = trpc.class.get.useQuery({ classId: classId as string });
  const { data: inviteCodeData, isLoading: inviteCodeLoading, refetch: refetchInviteCode } = trpc.class.getInviteCode.useQuery({ classId: classId as string });
  const changeRoleMutation = trpc.class.changeRole.useMutation();
  const removeMemberMutation = trpc.class.removeMember.useMutation();
  const regenerateInviteCodeMutation = trpc.class.createInviteCode.useMutation({
    onSuccess: () => {
      toast.success('Invite code regenerated successfully');
      refetchInviteCode();
    },
    onError: () => {
      toast.error('Failed to regenerate invite code');
    }
  });
  // Process members data
  const members = useMemo(() => {
    if (!classData?.class) return { teachers: [], students: [] };

    return {
      teachers: classData.class.teachers.map((t: RouterOutputs["class"]["get"]['class']['teachers'][number]) => ({ 
        ...t, 
        type: 'teacher' as const 
      })),
      students: classData.class.students.map((s: RouterOutputs["class"]["get"]['class']['students'][number]) => ({ 
        ...s, 
        type: 'student' as const 
      })),
    };
  }, [classData]);

  // Filter members based on search and tab
  const filteredMembers = useMemo(() => {
    if (!members) return { teachers: [], students: [] };

    const filterMembers = (memberList: Member[]) => {
      return memberList.filter(member => 
        member.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (member.email && member.email.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    };

    return {
      teachers: filterMembers(members.teachers),
      students: filterMembers(members.students)
    };
  }, [members, searchQuery]);

  const inviteCode = inviteCodeData?.code  || "Loading...";

  const copyInviteCode = () => {
    if (inviteCode && inviteCode !== "Loading...") {
      navigator.clipboard.writeText(inviteCode);
      toast.success("Invite code copied to clipboard");
    }
  };

  const handleRoleChange = async (userId: string, newType: 'teacher' | 'student') => {
    try {
      await changeRoleMutation.mutateAsync({
        classId: classId as string,
        userId,
        type: newType,
      });
      toast.success(`Role changed to ${newType}`);
      refetch();
    } catch {
      toast.error('Failed to change role');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      await removeMemberMutation.mutateAsync({
        classId: classId as string,
        userId,
      });
      toast.success("Member removed successfully");
      refetch();
    } catch {
      toast.error('Failed to remove member');
    }
  };


  const regenerateInviteCode = async () => {
    await regenerateInviteCodeMutation.mutateAsync({
      classId: classId as string,
    });
    toast.success('Invite code regenerated successfully');
  };
  const getRoleBadge = (type: string) => {
    switch (type) {
      case "teacher":
        return <Badge variant="secondary">Teacher</Badge>;
      default:
        return <Badge variant="outline">Student</Badge>;
    }
  };

  // Show skeleton loading
  if (isLoading) {
    return <MembersPageSkeleton />;
  }


  console.log(appState.user);
  // Show error state
  if (error) {
    return (
      <PageLayout>
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold mb-2">Failed to load members</h3>
          <p className="text-muted-foreground mb-4">{error.message}</p>
          <Button onClick={() => refetch()}>Try Again</Button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Members</h1>
          <p className="text-muted-foreground">
            {members.teachers.length + members.students.length} members
          </p>
        </div>
        
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Invite Member
        </Button>
      </div>

      {/* Invite Code Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Class Invite Code</CardTitle>
          <p className="text-sm text-muted-foreground">
            Share this code with students to join the class
          </p>
        </CardHeader>
        <CardContent>
          {inviteCodeLoading ? (
            <div className="flex items-center space-x-2">
              <Skeleton className="h-10 w-48 font-mono" />
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-10 w-24" />
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Input 
                value={inviteCode} 
                readOnly 
                className="font-mono max-w-xs"
              />
              <Button 
                variant="outline" 
                onClick={copyInviteCode}
                disabled={inviteCode === "Loading..."}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
              <Button variant="outline" onClick={regenerateInviteCode}>
                <RefreshCcw className="h-4 w-4 mr-2" />
                Regenerate
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search members..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Members Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="students" className="flex items-center space-x-2">
            <span>Students</span>
            <span className="bg-muted text-muted-foreground px-2 py-1 rounded-full text-xs">
              {filteredMembers.students.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="teachers" className="flex items-center space-x-2">
            <span>Teachers</span>
            <span className="bg-muted text-muted-foreground px-2 py-1 rounded-full text-xs">
              {filteredMembers.teachers.length}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="space-y-4">
          {filteredMembers.students.length > 0 ? (
            <div className="space-y-4">
              {filteredMembers.students.map((student) => (
                <Card key={student.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={student.avatar} />
                          <AvatarFallback>
                            {student.username.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="space-y-1">
                          <div className="flex items-center space-x-3">
                            <h4 className="font-medium">{student.username}</h4>
                            {getRoleBadge(student.type)}
                          </div>
                          {student.email && (
                            <p className="text-sm text-muted-foreground">{student.email}</p>
                          )}
                          {student.joinedAt && (
                            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                              <span>Joined {new Date(student.joinedAt).toLocaleDateString()}</span>
                              {student.lastActive && <span>Last active {student.lastActive}</span>}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Mail className="h-4 w-4 mr-2" />
                          Message
                        </Button>
                        {appState.user?.teacher && student.id !== appState.user?.id && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <User className="mr-2 h-4 w-4" />
                                View Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                View Grades
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleRoleChange(student.id, 'teacher')}
                              >
                                <Shield className="mr-2 h-4 w-4" />
                                Make Teacher
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => handleRemoveMember(student.id)}
                              >
                                <UserX className="mr-2 h-4 w-4" />
                                Remove from Class
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                        {student.id === appState.user?.id && (
                          <div className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded-full">
                            You
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={User}
              title="No students found"
              description={searchQuery ? `No students match "${searchQuery}"` : "No students have joined this class yet"}
            />
          )}
        </TabsContent>

        <TabsContent value="teachers" className="space-y-4">
          {filteredMembers.teachers.length > 0 ? (
            <div className="space-y-4">
              {filteredMembers.teachers.map((teacher) => (
                <Card key={teacher.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={teacher.avatar} />
                          <AvatarFallback>
                            {teacher.username.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="space-y-1">
                          <div className="flex items-center space-x-3">
                            <h4 className="font-medium">{teacher.username}</h4>
                            {getRoleBadge(teacher.type)}
                          </div>
                          {teacher.email && (
                            <p className="text-sm text-muted-foreground">{teacher.email}</p>
                          )}
                          {teacher.joinedAt && (
                            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                              <span>Joined {new Date(teacher.joinedAt).toLocaleDateString()}</span>
                              {teacher.lastActive && <span>Last active {teacher.lastActive}</span>}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Mail className="h-4 w-4 mr-2" />
                          Message
                        </Button>
                        {appState.user?.teacher && teacher.id !== appState.user?.id && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <User className="mr-2 h-4 w-4" />
                                View Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleRoleChange(teacher.id, 'student')}
                              >
                                <User className="mr-2 h-4 w-4" />
                                Make Student
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => handleRemoveMember(teacher.id)}
                              >
                                <UserX className="mr-2 h-4 w-4" />
                                Remove Access
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                        {teacher.id === appState.user?.id && (
                          <div className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded-full">
                            You
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Shield}
              title="No teachers found"
              description={searchQuery ? `No teachers match "${searchQuery}"` : "No additional teachers have been added"}
            />
          )}
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
}