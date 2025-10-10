"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon, Clock, MapPin, Plus, School, User } from "lucide-react";
import ColorPicker from "@/components/ui/color-picker";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import type { RouterOutputs } from "@/lib/trpc";

type AttendanceRecord = RouterOutputs["attendance"]["get"][number];
type Event = NonNullable<AttendanceRecord["event"]> & { remarks: string }; // @WARNING: this should be double checked

interface EventFormData {
  name: string;
  startDate: Date | undefined;
  startTime: string;
  endDate: Date | undefined;
  endTime: string;
  location: string;
  remarks: string;
  color: string;
  isClassEvent: boolean;
  selectedClassId: string;
}

interface UniversalEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: Event | null; // Optional - if provided, we're editing; if not, we're creating
  defaultClassId?: string; // If provided, defaults to class event for this class
  onEventCreated?: (event: RouterOutputs["event"]["create"]) => void;
  onEventUpdated?: () => void;
  children?: React.ReactNode; // For trigger button when creating
}

const defaultFormData: EventFormData = {
  name: "",
  startDate: undefined,
  startTime: "09:00",
  endDate: undefined,
  endTime: "10:00",
  location: "",
  remarks: "",
  color: "#3B82F6",
  isClassEvent: false,
  selectedClassId: ""
};

export function UniversalEventModal({
  open,
  onOpenChange,
  event,
  defaultClassId,
  onEventCreated,
  onEventUpdated,
  children
}: UniversalEventModalProps) {
  const [formData, setFormData] = useState<EventFormData>(defaultFormData);

  const createEventMutation = trpc.event.create.useMutation();
  const updateEventMutation = trpc.event.update.useMutation();
  const { data: classesData } = trpc.class.getAll.useQuery();

  const isEditing = !!event;
  const isLoading = createEventMutation.isPending || updateEventMutation.isPending;

  // Get classes where user is a teacher
  const teacherClasses = classesData?.teacherInClass || [];

  // @fix-me: maximum update depth exceeded

  // Initialize form data
  useEffect(() => {
    if (event) {
      // Editing existing event
      const startDate = new Date(event.startTime);
      const endDate = new Date(event.endTime);
      
      setFormData({
        name: event.name || "",
        startDate: startDate,
        startTime: format(startDate, "HH:mm"),
        endDate: endDate,
        endTime: format(endDate, "HH:mm"),
        location: event.location || "",
        remarks: event.remarks || "",
        color: event.color || "#3B82F6",
        isClassEvent: true, // Assume existing events are class events
        selectedClassId: defaultClassId || ""
      });
    } else {
      // Creating new event
      setFormData({
        ...defaultFormData,
        isClassEvent: !!defaultClassId,
        selectedClassId: defaultClassId || (teacherClasses[0]?.id || "")
      });
    }
  }, [event, defaultClassId, teacherClasses]);

  const resetForm = () => {
    setFormData({
      ...defaultFormData,
      isClassEvent: !!defaultClassId,
      selectedClassId: defaultClassId || (teacherClasses[0]?.id || "")
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.startDate || !formData.endDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (formData.isClassEvent && !formData.selectedClassId) {
      toast.error("Please select a class for the class event");
      return;
    }

    try {
      // Combine date and time for start and end
      const startDateTime = new Date(formData.startDate);
      const [startHour, startMinute] = formData.startTime.split(':');
      startDateTime.setHours(parseInt(startHour), parseInt(startMinute));

      const endDateTime = new Date(formData.endDate);
      const [endHour, endMinute] = formData.endTime.split(':');
      endDateTime.setHours(parseInt(endHour), parseInt(endMinute));

      if (isEditing && event) {
        // Update existing event
        await updateEventMutation.mutateAsync({
          id: event.id,
          data: {
            name: formData.name,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          location: formData.location || undefined,
          remarks: formData.remarks || undefined,
          color: formData.color
          }
        });

        toast.success("Event updated successfully");
        onEventUpdated?.();
      } else {
        // Create new event
        const eventData = {
          name: formData.name,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          location: formData.location || undefined,
          remarks: formData.remarks || undefined,
          color: formData.color,
          ...(formData.isClassEvent ? { classId: formData.selectedClassId } : {})
        };

        const newEvent = await createEventMutation.mutateAsync(eventData);

        toast.success(`${formData.isClassEvent ? 'Class event' : 'Personal event'} created successfully`);
        onEventCreated?.(newEvent);
      }

      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error(`Failed to ${isEditing ? 'update' : 'create'} event:`, error);
      toast.error(`Failed to ${isEditing ? 'update' : 'create'} event`);
    }
  };

  const handleInputChange = (field: keyof EventFormData, value: string | Date | undefined | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
    if (!newOpen) {
      resetForm();
    }
  };

  const selectedClass = teacherClasses.find((c: RouterOutputs["class"]["getAll"]['teacherInClass'][number]) => c.id === formData.selectedClassId);

  return (
    <>
      {/* Render trigger button only when creating (not editing) */}
      {!isEditing && children && (
        <div onClick={() => onOpenChange(true)}>
          {children}
        </div>
      )}
      
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {/* {formData.isClassEvent ? <School className="h-5 w-5" /> : <User className="h-5 w-5" />} */}
                {isEditing ? "Edit Event" : "Create New Event"}
              </div>
              {formData.isClassEvent && selectedClass && (
                <div className="flex items-center gap-2 text-sm font-normal">
                  <div 
                    className="w-3 h-3 rounded-full border"
                    style={{ backgroundColor: selectedClass.color || '#3B82F6' }}
                  />
                  <span className="text-muted-foreground">
                    {selectedClass.name} • {selectedClass.section}
                  </span>
                </div>
              )}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Event Type Toggle */}
            {!isEditing && (
              <div className="flex items-center space-x-2 p-3 rounded-lg bg-muted">
                <Checkbox
                  id="isClassEvent"
                  checked={formData.isClassEvent}
                  onCheckedChange={(checked) => handleInputChange("isClassEvent", !!checked)}
                />
                <Label htmlFor="isClassEvent" className="text-sm font-medium">
                  This is a class event
                </Label>
                {formData.isClassEvent && (
                  <Badge variant="secondary" className="ml-2">
                    <School className="h-3 w-3 mr-1" />
                    Class Event
                  </Badge>
                )}
              </div>
            )}

            {/* Class Selection */}
            {formData.isClassEvent && !isEditing && (
              <div className="space-y-2">
                <Label>Select Class *</Label>
                <Select 
                  value={formData.selectedClassId} 
                  onValueChange={(value) => handleInputChange("selectedClassId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a class" />
                  </SelectTrigger>
                  <SelectContent>
                    {teacherClasses.map((classItem: RouterOutputs["class"]["getAll"]['teacherInClass'][number]) => (
                      <SelectItem key={classItem.id} value={classItem.id}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full border"
                            style={{ backgroundColor: classItem.color || '#3B82F6' }}
                          />
                          <span>{classItem.name}</span>
                          <span className="text-muted-foreground">• {classItem.section}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {teacherClasses.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    You don't have any classes where you're a teacher.
                  </p>
                )}
              </div>
            )}

            {/* Event Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Event Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter event name"
                required
              />
            </div>

            {/* Date and Time Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Start Date & Time */}
              <div className="space-y-2">
                <Label>Start Date & Time *</Label>
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          "flex-1 justify-start text-left font-normal",
                          !formData.startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.startDate ? format(formData.startDate, "PPP") : "Pick date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.startDate}
                        onSelect={(date) => handleInputChange("startDate", date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <Input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => handleInputChange("startTime", e.target.value)}
                      className="w-24"
                    />
                  </div>
                </div>
              </div>

              {/* End Date & Time */}
              <div className="space-y-2">
                <Label>End Date & Time *</Label>
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          "flex-1 justify-start text-left font-normal",
                          !formData.endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.endDate ? format(formData.endDate, "PPP") : "Pick date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.endDate}
                        onSelect={(date) => handleInputChange("endDate", date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <Input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => handleInputChange("endTime", e.target.value)}
                      className="w-24"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange("location", e.target.value)}
                  placeholder="Enter event location"
                  className="pl-10"
                />
              </div>
            </div>

            {/* Color */}
            <div className="space-y-2">
              <ColorPicker
                value={formData.color}
                onChange={(color) => handleInputChange("color", color)}
                label="Event Color"
                description="Choose a color for this event"
              />
            </div>

            {/* Remarks */}
            <div className="space-y-2">
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea
                id="remarks"
                value={formData.remarks}
                onChange={(e) => handleInputChange("remarks", e.target.value)}
                placeholder="Additional notes or remarks about the event"
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !formData.name || !formData.startDate || !formData.endDate || (formData.isClassEvent && !formData.selectedClassId)}
              >
                {isLoading 
                  ? (isEditing ? "Updating..." : "Creating...")
                  : (isEditing ? "Update Event" : `Create ${formData.isClassEvent ? 'Class' : 'Personal'} Event`)
                }
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Convenience wrapper for creating events with a default trigger button
interface CreateEventButtonProps {
  defaultClassId?: string; // If provided, defaults to class event
  onEventCreated?: (event: RouterOutputs["event"]["create"]) => void;
  children?: React.ReactNode;
}

export function CreateEventButton({ defaultClassId, onEventCreated, children }: CreateEventButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <UniversalEventModal
      open={open}
      onOpenChange={setOpen}
      defaultClassId={defaultClassId}
      onEventCreated={onEventCreated}
    >
      {children || (
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Event
        </Button>
      )}
    </UniversalEventModal>
  );
}
