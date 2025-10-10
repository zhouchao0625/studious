"use client";

import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { useParams } from "next/navigation";
import { PageLayout } from "@/components/ui/page-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  Calendar as CalendarIcon, 
  UserCheck, 
  UserX, 
  Clock,
  Plus,
  MapPin,
  Check,
  X,
  ClipboardCheck,
  Edit,
  ArrowUpDown,
  Trash2,
  MoreHorizontal,
  Eye
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { trpc, type RouterOutputs } from "@/lib/trpc";
import { ClassEventModal, EventPreviewModal } from "@/components/modals";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";

interface AttendanceStatus {
  eventId: string;
  status: 'present' | 'late' | 'absent' | 'not_taken';
}

type AttendanceRecord = RouterOutputs["attendance"]["get"][number];
type Event = RouterOutputs["event"]["get"]["event"];

interface EventTableRow {
  id: string;
  date: string;
  name: string;
  time: string;
  location?: string | null;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  totalStudents: number;
  attendanceRate: number;
  status: 'completed' | 'upcoming' | 'ongoing';
}

export default function Attendance() {
  const { id: classId } = useParams();
  const appState = useSelector((state: RootState) => state.app);
  const isStudent = appState.user.student;
  const currentUserId = appState.user.id;
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<Event | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [eventToPreview, setEventToPreview] = useState<Event | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  // Get class data (students)
  const { data: classData, isLoading: classLoading, refetch: refetchClass } = trpc.class.get.useQuery({ 
    classId: classId as string 
  });

  // Fetch all attendance records for the class
  const { data: attendanceDataRaw, isLoading: attendanceLoading, refetch: refetchAttendance } = trpc.attendance.get.useQuery({ 
    classId: classId as string 
  });

  // Update attendance mutation
  const updateAttendanceMutation = trpc.attendance.update.useMutation({
    onSuccess: () => {
      refetchAttendance();
    }
  });

  // Delete event mutation
  const deleteEventMutation = trpc.event.delete.useMutation();

  const students = classData?.class?.students || [];
  const attendanceData = useMemo(() => attendanceDataRaw || [], [attendanceDataRaw]);
  
  // Extract events from attendance records
  const allEvents = useMemo(() => 
    attendanceData
      .map((record: AttendanceRecord) => record.event)
      .filter((event): event is NonNullable<AttendanceRecord["event"]> => !!event),
    [attendanceData]
  );

  // Define table columns
  const columns: ColumnDef<EventTableRow>[] = [
    {
      accessorKey: "date",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("date")}</div>
      ),
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Event Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.getValue("name")}</div>
          <div className="text-sm text-muted-foreground">{row.original.time}</div>
          {row.original.location && (
            <div className="text-xs text-muted-foreground flex items-center mt-1">
              <MapPin className="h-3 w-3 mr-1" />
              {row.original.location}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: "attendanceRate",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Attendance Rate
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const rate = row.getValue("attendanceRate") as number;
        return (
          <div className="text-center">
            <div className="font-medium">{rate}%</div>
            <div className="text-xs text-muted-foreground">
              {row.original.presentCount + row.original.lateCount}/{row.original.totalStudents}
            </div>
          </div>
        );
      },
    },
    {
      id: "attendance",
      header: "Attendance",
      cell: ({ row }) => (
        <div className="flex space-x-1 text-xs">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>{row.original.presentCount}</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <span>{row.original.lateCount}</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span>{row.original.absentCount}</span>
          </div>
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const event = allEvents.find(e => e.id === row.original.id);
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  setEventToPreview(event as Event);
                  setPreviewModalOpen(true);
                }}
              >
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setEventToEdit(event as Event);
                  setEventModalOpen(true);
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Event
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setEventToDelete({id: event!.id, name: event!.name || ""});
                  setDeleteConfirmOpen(true);
                }}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Event
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  // Process data for the table
  const tableData: EventTableRow[] = useMemo(() => {
    return allEvents
      .map((event) => {
        const record = attendanceData.find(r => r.event?.id === event.id);
        const presentCount = record?.present?.length || 0;
        const lateCount = record?.late?.length || 0;
        const absentCount = record?.absent?.length || 0;
        const totalStudents = students.length;
        const attendanceRate = totalStudents > 0 
          ? Math.round(((presentCount + lateCount) / totalStudents) * 100) 
          : 0;
        
        const now = new Date();
        const eventStart = new Date(event.startTime);
        const eventEnd = new Date(event.endTime);
        
        let status: 'completed' | 'upcoming' | 'ongoing' = 'upcoming';
        if (now > eventEnd) {
          status = 'completed';
        } else if (now >= eventStart && now <= eventEnd) {
          status = 'ongoing';
        }

        return {
          id: event.id,
          date: format(eventStart, "MMM d, yyyy"),
          name: event.name || 'Untitled Event',
          time: `${format(eventStart, "h:mm a")} - ${format(eventEnd, "h:mm a")}`,
          location: event.location || undefined,
          presentCount,
          lateCount,
          absentCount,
          totalStudents,
          attendanceRate,
          status,
        };
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Most recent first
  }, [allEvents, attendanceData, students]);

  const events = selectedDate 
    ? allEvents.filter(event => {
        const eventDate = new Date(event.startTime);
        const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
        const eventDateStr = format(eventDate, 'yyyy-MM-dd');
        return selectedDateStr === eventDateStr;
      })
    : allEvents;

  // Map attendance status for each event for the current user (if student view) or for management
  const attendanceStatuses = useMemo(() => {
    if (!attendanceData) return {};
    
    const statusMap: Record<string, AttendanceStatus> = {};
    for (const record of attendanceData) {
      if (!record.event) continue;
      
      // For now, we'll track the general status - this can be modified based on user role
      let status: 'present' | 'late' | 'absent' | 'not_taken' = 'not_taken';
      
      // Check if attendance has been taken for this event
      if (record.present.length > 0 || record.late.length > 0 || record.absent.length > 0) {
        status = 'present'; // Default to present if any attendance taken
      }
      
      statusMap[record.event.id] = { eventId: record.event.id, status };
    }
    return statusMap;
  }, [attendanceData]);

  // Initialize attendance when event is selected
  useEffect(() => {
    if (!selectedEvent || !students.length) return;
    
    const selectedRecord = attendanceData.find(record => record.event?.id === selectedEvent);
    if (selectedRecord) {
      const newAttendance: Record<string, string> = {};
      
      // Set existing attendance
      selectedRecord.present.forEach(student => {
        newAttendance[student.id] = "present";
      });
      selectedRecord.late.forEach(student => {
        newAttendance[student.id] = "late";
      });
      selectedRecord.absent.forEach(student => {
        newAttendance[student.id] = "absent";
      });
      
      // Default remaining students to present
      students.forEach(student => {
        if (!newAttendance[student.id]) {
          newAttendance[student.id] = "present";
        }
      });
      
      setAttendance(newAttendance);
    } else {
      // Initialize with all present for new attendance
      const newAttendance: Record<string, string> = {};
      students.forEach(student => {
        newAttendance[student.id] = "present";
      });
      setAttendance(newAttendance);
    }
  }, [selectedEvent, students, attendanceData]);

  const updateAttendance = (studentId: string, status: string) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }));
    setHasUnsavedChanges(true); // Mark that user made a change
  };

  const getStatusStats = () => {
    const stats = Object.values(attendance).reduce((acc, status) => {
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      present: stats.present || 0,
      late: stats.late || 0,
      absent: stats.absent || 0,
      total: students.length
    };
  };

  const saveAttendance = async (showToast = false) => {
    if (!selectedEvent || Object.keys(attendance).length === 0) return;

    try {
      const present = students.filter(s => attendance[s.id] === "present");
      const late = students.filter(s => attendance[s.id] === "late");
      const absent = students.filter(s => attendance[s.id] === "absent");

      await updateAttendanceMutation.mutateAsync({
        classId: classId as string,
        eventId: selectedEvent,
        attendance: {
          eventId: selectedEvent,
          present: present.map(s => ({ id: s.id, username: s.username })),
          late: late.map(s => ({ id: s.id, username: s.username })),
          absent: absent.map(s => ({ id: s.id, username: s.username })),
        }
      });

      if (showToast) {
        toast.success("Attendance saved successfully");
      }
    } catch (error) {
      console.error("Failed to save attendance:", error);
      if (showToast) {
        toast.error("Failed to save attendance");
      }
    }
  };

  const handleDeleteEvent = async () => {
    if (!eventToDelete) return;

    try {
      await deleteEventMutation.mutateAsync({
        id: eventToDelete.id
      });
      
      toast.success("Event deleted successfully");
      setDeleteConfirmOpen(false);
      setEventToDelete(null);
      
      // Refetch data
      refetchAttendance();
      refetchClass();
    } catch (error) {
      console.error("Failed to delete event:", error);
      toast.error("Failed to delete event");
    }
  };

  // Autosave when user makes changes (not when data is loaded)
  useEffect(() => {
    if (!selectedEvent || !hasUnsavedChanges || Object.keys(attendance).length === 0) return;
    
    setIsAutoSaving(true);
    
    // Debounce the save to avoid too many API calls
    const timeoutId = setTimeout(async () => {
      await saveAttendance();
      setHasUnsavedChanges(false); // Reset unsaved changes flag
      setIsAutoSaving(false);
    }, 1500); // Save 1.5 seconds after last change

    return () => {
      clearTimeout(timeoutId);
      setIsAutoSaving(false);
    };
  }, [hasUnsavedChanges, selectedEvent]);
  const getStatusIcon = (status: AttendanceStatus['status']) => {
    switch (status) {
      case 'present':
        return <Check className="h-5 w-5 text-green-500" />;
      case 'late':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'absent':
        return <X className="h-5 w-5 text-red-500" />;
      default:
        return <span className="text-sm text-muted-foreground">-</span>;
    }
  };

  const stats = getStatusStats();
  const selectedEventData = events.find(e => e.id === selectedEvent);
  const showStudentRoster = selectedEvent;

  // Student-specific data
  const studentAttendanceData = useMemo(() => {
    if (!isStudent || !attendanceData) return [];
    
    return attendanceData.map((record) => {
      const event = allEvents.find(e => e.id === record.eventId);
      
      // Check which array the current user is in
      let status: 'present' | 'late' | 'absent' | 'not_taken' = 'not_taken';
      if (record.present.some(s => s.id === currentUserId)) {
        status = 'present';
      } else if (record.late.some(s => s.id === currentUserId)) {
        status = 'late';
      } else if (record.absent.some(s => s.id === currentUserId)) {
        status = 'absent';
      }
      
      return {
        event,
        status,
        date: event?.startTime,
        name: event?.name,
        location: event?.location,
      };
    }).filter(item => item.event);
  }, [isStudent, attendanceData, allEvents, currentUserId]);

  const studentStats = useMemo(() => {
    if (!isStudent || studentAttendanceData.length === 0) {
      return { present: 0, late: 0, absent: 0, total: 0, attendanceRate: 0 };
    }

    const present = studentAttendanceData.filter(item => item.status === 'present').length;
    const late = studentAttendanceData.filter(item => item.status === 'late').length;
    const absent = studentAttendanceData.filter(item => item.status === 'absent').length;
    const total = studentAttendanceData.filter(item => item.status !== 'not_taken').length;
    const attendanceRate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

    return { present, late, absent, total, attendanceRate };
  }, [isStudent, studentAttendanceData]);

  // Student attendance table columns
  const studentAttendanceColumns: ColumnDef<typeof studentAttendanceData[number]>[] = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => {
        const date = row.original.event?.startTime;
        return date ? format(new Date(date), "MMM d, yyyy") : "-";
      },
    },
    {
      accessorKey: "name",
      header: "Event",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.event?.name}</div>
          {row.original.event?.location && (
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {row.original.event.location}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <div className="flex items-center gap-2">
            {getStatusIcon(status)}
            <Badge variant={
              status === 'present' ? 'default' : 
              status === 'late' ? 'secondary' : 
              status === 'absent' ? 'destructive' : 
              'outline'
            }>
              {status === 'not_taken' ? 'Not Taken' : status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
          </div>
        );
      },
    },
  ];

  if (classLoading || attendanceLoading) {
    return (
      <PageLayout>
        <div className="space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <Card>
            <CardContent className="pt-6">
              <div className="h-40 w-full bg-muted rounded" />
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    );
  }

  // Student view
  if (isStudent) {
    return (
      <PageLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold">My Attendance</h1>
            <p className="text-muted-foreground">
              Track your attendance for {classData?.class?.name || 'this class'}
            </p>
          </div>

          {/* Student Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{studentStats.present}</p>
                    <p className="text-xs text-muted-foreground">Present</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{studentStats.late}</p>
                    <p className="text-xs text-muted-foreground">Late</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                    <UserX className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{studentStats.absent}</p>
                    <p className="text-xs text-muted-foreground">Absent</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                    <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{studentStats.attendanceRate}%</p>
                    <p className="text-xs text-muted-foreground">Attendance Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Attendance History */}
          <Card>
            <CardHeader>
              <CardTitle>Attendance History</CardTitle>
            </CardHeader>
            <CardContent>
              {studentAttendanceData.length === 0 ? (
                <EmptyState
                  icon={ClipboardCheck}
                  title="No Attendance Records"
                  description="Your attendance will appear here once events are created and attendance is taken"
                />
              ) : (
                <DataTable
                  columns={studentAttendanceColumns}
                  data={studentAttendanceData}
                  searchKey="name"
                  searchPlaceholder="Search events..."
                />
              )}
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Class Events & Attendance</h1>
          <p className="text-muted-foreground">Track student attendance for each event</p>
        </div>
        
        <div className="flex items-center gap-2">
          {isAutoSaving && (
            <span className="text-sm text-muted-foreground">Auto-saving...</span>
          )}
          {hasUnsavedChanges && !isAutoSaving && (
            <span className="text-sm text-orange-600">Unsaved changes</span>
          )}
          {(hasUnsavedChanges || showStudentRoster) && <Button 
            disabled={!showStudentRoster || updateAttendanceMutation.isPending}
            onClick={async () => {
              await saveAttendance(true);
              setHasUnsavedChanges(false);
            }}
          >
            <ClipboardCheck className="h-4 w-4 mr-2" />
            {updateAttendanceMutation.isPending ? 'Saving...' : 'Save Attendance'}
          </Button>}
        </div>
      </div>
      <div className="flex flex-col lg:flex-row gap-6">
      {/* All Events Table */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>All Events</CardTitle>
          <p className="text-sm text-muted-foreground">
            Complete history of class events and attendance records
          </p>
        </CardHeader>
        <CardContent>
          {tableData.length === 0 ? (
            <EmptyState
              icon={CalendarIcon}
              title="No events found"
              description="Create your first event to start tracking attendance"
            />
          ) : (
            <DataTable
              columns={columns}
              data={tableData}
              searchKey="name"
              searchPlaceholder="Search events..."
              onRowClick={(row) => {
                // Set the selected event and date when row is clicked
                setSelectedEvent(row.id);
                const event = allEvents.find(e => e.id === row.id);
                if (event) {
                  setSelectedDate(new Date(event.startTime));
                }
              }}
              pageSize={10}
            />
          )}
        </CardContent>
      </Card>
      {/* Events List with inline date picker */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "MMMM dd") : "Pick date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <Button
              size="sm"
              onClick={() => {
                setEventToEdit(null);
                setEventModalOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Button>
          </div>
        </CardHeader>
        <CardContent>
            {events.length === 0 ? (
              <div className="space-y-4">
                <EmptyState
                  icon={CalendarIcon}
                  title={selectedDate ? "No events on this date" : "No events found"}
                  description={selectedDate 
                    ? `No events scheduled for ${format(selectedDate, "MMM d, yyyy")}. Try selecting a different date or create a new event.`
                    : "Create your first event to start tracking attendance"
                  }
                />
                <Button
                  onClick={() => {
                    setEventToEdit(null);
                    setEventModalOpen(true);
                  }}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {selectedDate ? "Create Event for This Date" : "Create First Event"}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors",
                      selectedEvent === event.id
                        ? "bg-primary/10 border-primary"
                        : "hover:bg-muted/50"
                    )}
                    onClick={() => setSelectedEvent(event.id)}
                  >
                    <div className="flex items-center space-x-4">
                      <div 
                        className="w-1 h-12 rounded-full"
                        style={{ backgroundColor: event.color || '#3B82F6' }}
                      />
                      <div>
                        <h3 className="font-medium">{event.name || 'Untitled Event'}</h3>
                        <div className="flex items-center text-sm text-muted-foreground space-x-4">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {format(new Date(event.startTime), "MMM d, yyyy 'at' h:mm a")} - {format(new Date(event.endTime), "h:mm a")}
                          </div>
                          {event.location && (
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1" />
                              {event.location}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Event Summary and Student Roster */}
      {showStudentRoster && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Event Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Event Summary</CardTitle>
              <p className="text-sm text-muted-foreground">
                {selectedEventData?.name || 'Selected Event'}
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-950">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.present}</div>
                  <p className="text-sm">Present</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950">
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.late}</div>
                  <p className="text-sm">Late</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 rounded-lg bg-red-50 dark:bg-red-950">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.absent}</div>
                  <p className="text-sm">Absent</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted">
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <p className="text-sm">Total</p>
                </div>
              </div>
              
              <div className="pt-3 border-t">
                <div className="flex justify-between text-sm">
                  <span>Attendance Rate</span>
                  <span className="font-medium">
                    {Math.round(((stats.present + stats.late) / stats.total) * 100)}%
                  </span>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="pt-3 border-t space-y-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    const newAttendance = {...attendance};
                    students.forEach(student => {
                      newAttendance[student.id] = "present";
                    });
                    setAttendance(newAttendance);
                    setHasUnsavedChanges(true);
                  }}
                >
                  <UserCheck className="h-4 w-4 mr-2" />
                  Mark All Present
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    const newAttendance = {...attendance};
                    students.forEach(student => {
                      newAttendance[student.id] = "absent";
                    });
                    setAttendance(newAttendance);
                    setHasUnsavedChanges(true);
                  }}
                >
                  <UserX className="h-4 w-4 mr-2" />
                  Mark All Absent
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Student Roster */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Student Roster</CardTitle>
              <p className="text-sm text-muted-foreground">
                Click the status buttons to mark attendance for each student
              </p>
            </CardHeader>
            <CardContent>
              {students.length === 0 ? (
                <EmptyState
                  icon={UserCheck}
                  title="No students enrolled"
                  description="Students will appear here once they join the class"
                />
              ) : (
                <div className="grid md:grid-cols-2 gap-3">
                  {students.map((student) => (
                    <div key={student.id} className="p-3 rounded-lg border hover:shadow-sm transition-shadow">
                      <div className="flex items-center space-x-3 mb-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${student.username}`} alt={student.username} />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                            {student.username.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium truncate">{student.username}</h4>
                          {student.username && (
                            <p className="text-xs text-muted-foreground truncate">{student.username}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-1">
                        <Button
                          variant={attendance[student.id] === "present" ? "default" : "outline"}
                          size="sm"
                          className="text-xs py-1 h-7"
                          onClick={() => updateAttendance(student.id, "present")}
                        >
                          Present
                        </Button>
                        <Button
                          variant={attendance[student.id] === "late" ? "destructive" : "outline"}
                          size="sm"
                          className={`text-xs py-1 h-7 ${attendance[student.id] === "late" &&"bg-yellow-500 text-yellow-500-foreground hover:bg-yellow-600 hover:text-yellow-600-foreground"}`}
                          onClick={() => updateAttendance(student.id, "late")}
                        >
                          Late
                        </Button>
                        <Button
                          variant={attendance[student.id] === "absent" ? "destructive" : "outline"}
                          size="sm"
                          className="text-xs py-1 h-7"
                          onClick={() => updateAttendance(student.id, "absent")}
                        >
                          Absent
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Prompt to select event */}
      {!showStudentRoster && events.length > 0 && (
        <Card>
          <CardContent className="py-8">
            <EmptyState
              icon={CalendarIcon}
              title="Select an Event"
              description="Choose an event above to view and manage student attendance"
            />
          </CardContent>
        </Card>
      )}

      {/* Class Event Modal (Create/Edit) */}
      <ClassEventModal
        open={eventModalOpen}
        onOpenChange={(open) => {
          setEventModalOpen(open);
          if (!open) {
            setEventToEdit(null);
          }
        }}
        event={eventToEdit}
        classId={classId as string}
        onEventCreated={() => {
          refetchClass();
          refetchAttendance();
        }}
        onEventUpdated={() => {
          refetchClass();
          refetchAttendance();
        }}
      />

      {/* Event Preview Modal */}
      <EventPreviewModal
        open={previewModalOpen}
        onOpenChange={setPreviewModalOpen}
        event={eventToPreview}
        showActions={true}
        onEdit={(event) => {
          setEventToEdit(event);
          setEventModalOpen(true);
        }}
        onDelete={(event) => {
          setEventToDelete({id: event!.id, name: event!.name || ""});
          setDeleteConfirmOpen(true);
        }}
      />

      {/* Delete Event Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{eventToDelete?.name}"? This action cannot be undone and will remove all associated attendance records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteEvent}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteEventMutation.isPending}
            >
              {deleteEventMutation.isPending ? "Deleting..." : "Delete Event"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageLayout>
  );
}