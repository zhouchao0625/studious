"use client";

import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
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
  const t = useTranslations('attendance');
  const tCommon = useTranslations('common');
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
  const [lastModified, setLastModified] = useState<number>(0);
  const [lastSaved, setLastSaved] = useState<number>(0);
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
      // Only refetch if it's a manual save (not auto-save)
      // Auto-save already has the correct local state
      if (!isAutoSaving) {
        refetchAttendance();
      }
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
          {t('table.date')}
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
          {t('table.eventName')}
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
          {t('table.attendanceRate')}
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
      header: t('table.attendance'),
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
      header: t('table.actions'),
      cell: ({ row }) => {
        const event = allEvents.find(e => e.id === row.original.id);
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">{tCommon('openMenu')}</span>
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
                {t('actions.viewDetails')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setEventToEdit(event as Event);
                  setEventModalOpen(true);
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                {t('actions.editEvent')}
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
                {t('actions.deleteEvent')}
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
    setLastModified(Date.now()); // Track when the last change was made
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

    const saveTimestamp = Date.now();
    
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

      // Only update lastSaved if this save is still the most recent attempt
      // This prevents race conditions where an older save completes after a newer one
      setLastSaved(saveTimestamp);
      
      if (showToast) {
        toast.success(t('toast.attendanceSaved'));
      }
    } catch (error) {
      console.error("Failed to save attendance:", error);
      if (showToast) {
        toast.error(t('toast.attendanceSaveFailed'));
      }
    }
  };

  const handleDeleteEvent = async () => {
    if (!eventToDelete) return;

    try {
      await deleteEventMutation.mutateAsync({
        id: eventToDelete.id
      });
      
      toast.success(t('toast.eventDeleted'));
      setDeleteConfirmOpen(false);
      setEventToDelete(null);
      
      // Refetch data
      refetchAttendance();
      refetchClass();
    } catch (error) {
      console.error("Failed to delete event:", error);
      toast.error(t('toast.eventDeleteFailed'));
    }
  };

  // Autosave when user makes changes (not when data is loaded)
  // Compute if there are unsaved changes
  const hasUnsavedChanges = lastModified > lastSaved;

  useEffect(() => {
    if (!selectedEvent || !hasUnsavedChanges || Object.keys(attendance).length === 0) return;
    
    setIsAutoSaving(true);
    
    // Debounce the save to avoid too many API calls
    const timeoutId = setTimeout(async () => {
      await saveAttendance();
      setIsAutoSaving(false);
    }, 1500); // Save 1.5 seconds after last change

    return () => {
      clearTimeout(timeoutId);
      setIsAutoSaving(false);
    };
  }, [lastModified, selectedEvent]); // Trigger on lastModified changes
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
      header: t('table.date'),
      cell: ({ row }) => {
        const date = row.original.event?.startTime;
        return date ? format(new Date(date), "MMM d, yyyy") : "-";
      },
    },
    {
      accessorKey: "name",
      header: t('student.event'),
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
      header: t('student.status'),
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
              {status === 'not_taken' ? t('status.notTaken') : status.charAt(0).toUpperCase() + status.slice(1)}
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
            <h1 className="text-2xl font-bold">{t('student.title')}</h1>
            <p className="text-muted-foreground">
              {t('student.subtitle', { className: classData?.class?.name || tCommon('class') })}
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
                    <p className="text-xs text-muted-foreground">{t('status.present')}</p>
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
                    <p className="text-xs text-muted-foreground">{t('status.late')}</p>
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
                    <p className="text-xs text-muted-foreground">{t('status.absent')}</p>
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
                    <p className="text-xs text-muted-foreground">{t('student.attendanceRate')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Attendance History */}
          <Card>
            <CardHeader>
              <CardTitle>{t('student.history')}</CardTitle>
            </CardHeader>
            <CardContent>
              {studentAttendanceData.length === 0 ? (
                <EmptyState
                  icon={ClipboardCheck}
                  title={t('student.empty.title')}
                  description={t('student.empty.description')}
                />
              ) : (
                <DataTable
                  columns={studentAttendanceColumns}
                  data={studentAttendanceData}
                  searchKey="name"
                  searchPlaceholder={t('student.searchPlaceholder')}
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
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>
        
        <div className="flex items-center gap-2">
          {isAutoSaving && (
            <span className="text-sm text-muted-foreground">{t('saving.auto')}</span>
          )}
          {hasUnsavedChanges && !isAutoSaving && (
            <span className="text-sm text-orange-600">{t('saving.unsaved')}</span>
          )}
          {(hasUnsavedChanges || showStudentRoster) && <Button 
            disabled={!showStudentRoster || updateAttendanceMutation.isPending}
            onClick={async () => {
              await saveAttendance(true);
              // lastSaved will be updated by saveAttendance
            }}
          >
            <ClipboardCheck className="h-4 w-4 mr-2" />
            {updateAttendanceMutation.isPending ? t('saving.saving') : t('actions.saveAttendance')}
          </Button>}
        </div>
      </div>
      <div className="flex flex-col lg:flex-row gap-6">
      {/* All Events Table */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t('allEvents.title')}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {t('allEvents.description')}
          </p>
        </CardHeader>
        <CardContent>
          {tableData.length === 0 ? (
            <EmptyState
              icon={CalendarIcon}
              title={t('allEvents.empty.title')}
              description={t('allEvents.empty.description')}
            />
          ) : (
            <DataTable
              columns={columns}
              data={tableData}
              searchKey="name"
              searchPlaceholder={t('allEvents.searchPlaceholder')}
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
                    {selectedDate ? format(selectedDate, "MMMM dd") : t('eventsList.pickDate')}
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
              {t('actions.createEvent')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
            {events.length === 0 ? (
              <div className="space-y-4">
                <EmptyState
                  icon={CalendarIcon}
                  title={selectedDate ? t('eventsList.empty.noEventsOnDate') : t('eventsList.empty.noEvents')}
                  description={selectedDate 
                    ? t('eventsList.empty.noEventsOnDateDescription', { date: format(selectedDate, "MMM d, yyyy") })
                    : t('eventsList.empty.noEventsDescription')
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
                  {selectedDate ? t('eventsList.empty.createForDate') : t('eventsList.empty.createFirst')}
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
                        <h3 className="font-medium">{event.name || t('eventsList.untitled')}</h3>
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
              <CardTitle className="text-base">{t('summary.title')}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {selectedEventData?.name || t('summary.selectedEvent')}
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-950">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.present}</div>
                  <p className="text-sm">{t('status.present')}</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950">
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.late}</div>
                  <p className="text-sm">{t('status.late')}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 rounded-lg bg-red-50 dark:bg-red-950">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.absent}</div>
                  <p className="text-sm">{t('status.absent')}</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted">
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <p className="text-sm">{t('summary.total')}</p>
                </div>
              </div>
              
              <div className="pt-3 border-t">
                <div className="flex justify-between text-sm">
                  <span>{t('summary.attendanceRate')}</span>
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
                    setLastModified(Date.now());
                  }}
                >
                  <UserCheck className="h-4 w-4 mr-2" />
                  {t('actions.markAllPresent')}
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
                    setLastModified(Date.now());
                  }}
                >
                  <UserX className="h-4 w-4 mr-2" />
                  {t('actions.markAllAbsent')}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Student Roster */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">{t('roster.title')}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {t('roster.description')}
              </p>
            </CardHeader>
            <CardContent>
              {students.length === 0 ? (
                <EmptyState
                  icon={UserCheck}
                  title={t('roster.empty.title')}
                  description={t('roster.empty.description')}
                />
              ) : (
                <div className="grid md:grid-cols-2 gap-3">
                  {students.map((student) => (
                    <div key={student.id} className="p-3 rounded-lg border hover:shadow-sm transition-shadow">
                      <div className="flex items-center space-x-3 mb-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={student.profile?.profilePicture || ""} alt={student.username} />
                          <AvatarFallback>
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
                          {t('status.present')}
                        </Button>
                        <Button
                          variant={attendance[student.id] === "late" ? "destructive" : "outline"}
                          size="sm"
                          className={`text-xs py-1 h-7 ${attendance[student.id] === "late" &&"bg-yellow-500 text-yellow-500-foreground hover:bg-yellow-600 hover:text-yellow-600-foreground"}`}
                          onClick={() => updateAttendance(student.id, "late")}
                        >
                          {t('status.late')}
                        </Button>
                        <Button
                          variant={attendance[student.id] === "absent" ? "destructive" : "outline"}
                          size="sm"
                          className="text-xs py-1 h-7"
                          onClick={() => updateAttendance(student.id, "absent")}
                        >
                          {t('status.absent')}
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
              title={t('prompt.title')}
              description={t('prompt.description')}
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
            <AlertDialogTitle>{t('deleteDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteDialog.description', { eventName: eventToDelete?.name || "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteEvent}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteEventMutation.isPending}
            >
              {deleteEventMutation.isPending ? t('deleteDialog.deleting') : t('deleteDialog.deleteButton')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageLayout>
  );
}