"use client";
import { useState } from "react";
import { CalendarDatePicker, type DateRange } from "./CalendarDatePicker";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarIcon, Plus, Clock, MapPin, Users } from "lucide-react";
import { CreateClassEventButton } from "@/components/modals";

// Mock events data
const mockEvents = [
  {
    id: "1",
    title: "Physics Lab Session",
    start: new Date(2025, 2, 15, 10, 0),
    end: new Date(2025, 2, 15, 12, 0),
    location: "Lab 101",
    description: "Advanced optics experiment",
    type: "lab",
    attendees: 24
  },
  {
    id: "2",
    title: "Quiz: Chapter 8",
    start: new Date(2025, 2, 18, 14, 0),
    end: new Date(2025, 2, 18, 15, 0),
    location: "Room 205",
    description: "Electromagnetic waves quiz",
    type: "quiz",
    attendees: 24
  },
  {
    id: "3",
    title: "Office Hours",
    start: new Date(2025, 2, 20, 16, 0),
    end: new Date(2025, 2, 20, 18, 0),
    location: "Office 315",
    description: "Drop-in help session",
    type: "office_hours",
    attendees: 8
  },
  {
    id: "4",
    title: "Midterm Exam",
    start: new Date(2025, 2, 22, 9, 0),
    end: new Date(2025, 2, 22, 11, 0),
    location: "Auditorium A",
    description: "Comprehensive midterm covering chapters 1-8",
    type: "exam",
    attendees: 120
  },
  {
    id: "5",
    title: "Guest Lecture: Quantum Computing",
    start: new Date(2025, 2, 25, 13, 0),
    end: new Date(2025, 2, 25, 14, 30),
    location: "Lecture Hall B",
    description: "Special presentation by Dr. Sarah Chen from MIT",
    type: "lecture",
    attendees: 200
  },
  {
    id: "6",
    title: "Study Group Session",
    start: new Date(2025, 2, 26, 15, 0),
    end: new Date(2025, 2, 26, 17, 0),
    location: "Library Room 302",
    description: "Peer-led study session for upcoming exam",
    type: "study_group",
    attendees: 12
  },
  {
    id: "7",
    title: "Lab Report Due",
    start: new Date(2025, 2, 28, 23, 59),
    end: new Date(2025, 2, 28, 23, 59),
    location: "Online Submission",
    description: "Submit your completed lab report via the course portal",
    type: "assignment",
    attendees: 24
  },
  {
    id: "8",
    title: "Field Trip: Science Museum",
    start: new Date(2025, 3, 2, 9, 0),
    end: new Date(2025, 3, 2, 16, 0),
    location: "City Science Museum",
    description: "Explore interactive physics exhibits and planetarium show",
    type: "field_trip",
    attendees: 30
  },
  {
    id: "9",
    title: "Project Presentations",
    start: new Date(2025, 3, 5, 10, 0),
    end: new Date(2025, 3, 5, 12, 0),
    location: "Conference Room C",
    description: "Student presentations on semester projects",
    type: "presentation",
    attendees: 24
  },
  {
    id: "10",
    title: "Final Exam Review",
    start: new Date(2025, 3, 8, 14, 0),
    end: new Date(2025, 3, 8, 16, 0),
    location: "Room 205",
    description: "Comprehensive review session for final exam",
    type: "review",
    attendees: 24
  },
  {
    id: "11",
    title: "Parent-Teacher Conference",
    start: new Date(2025, 3, 10, 18, 0),
    end: new Date(2025, 3, 10, 20, 0),
    location: "Virtual Meeting",
    description: "Discuss student progress with parents/guardians",
    type: "conference",
    attendees: 48
  },
  {
    id: "12",
    title: "Final Exam",
    start: new Date(2025, 3, 15, 9, 0),
    end: new Date(2025, 3, 15, 12, 0),
    location: "Auditorium A",
    description: "Comprehensive final examination",
    type: "exam",
    attendees: 120
  }
];

interface EventCalendarProps {
  classId: string;
}

export default function EventCalendar({ classId }: EventCalendarProps) {
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange>({
    from: new Date(),
    to: new Date()
  });

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "lab":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "quiz":
      case "exam":
        return "bg-red-100 text-red-800 border-red-300";
      case "office_hours":
        return "bg-green-100 text-green-800 border-green-300";
      case "lecture":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "study_group":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "assignment":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "field_trip":
        return "bg-teal-100 text-teal-800 border-teal-300";
      case "presentation":
        return "bg-pink-100 text-pink-800 border-pink-300";
      case "review":
        return "bg-indigo-100 text-indigo-800 border-indigo-300";
      case "conference":
        return "bg-cyan-100 text-cyan-800 border-cyan-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const formatEventTime = (start: Date, end: Date) => {
    const timeFormat: Intl.DateTimeFormatOptions = {
      hour: 'numeric',
      minute: '2-digit'
    };
    return `${start.toLocaleTimeString([], timeFormat)} - ${end.toLocaleTimeString([], timeFormat)}`;
  };

  // Filter events for selected date range
  const getEventsInRange = () => {
    return mockEvents.filter(event => {
      const eventDate = event.start;
      return eventDate >= selectedDateRange.from && eventDate <= selectedDateRange.to;
    });
  };

  const eventsInRange = getEventsInRange();

  return (
    <div className="space-y-6">
      {/* Calendar Date Picker */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <CalendarDatePicker
            date={selectedDateRange}
            onDateSelect={setSelectedDateRange}
            numberOfMonths={2}
          />
          <Button variant="outline" size="sm">
            <CalendarIcon className="h-4 w-4 mr-2" />
            Today
          </Button>
        </div>
        
        <CreateClassEventButton classId={classId}>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Class Event
          </Button>
        </CreateClassEventButton>
      </div>

      {/* Events List */}
      <div className="space-y-3">
        {eventsInRange.length > 0 ? (
          eventsInRange.map((event) => (
            <Card key={event.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-lg">{event.title}</h3>
                      <Badge className={getEventTypeColor(event.type)} variant="outline">
                        {event.type.replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{formatEventTime(event.start, event.end)}</span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4" />
                        <span>{event.location}</span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4" />
                        <span>{event.attendees} attendees</span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">{event.description}</p>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {event.start.toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {event.start.toLocaleDateString('en-US', { 
                        weekday: 'short' 
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No events found</h3>
              <p className="text-muted-foreground mb-4">
                No events scheduled for the selected date range.
              </p>
              <CreateClassEventButton classId={classId}>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Class Event
                </Button>
              </CreateClassEventButton>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}