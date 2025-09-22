"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import ColorPicker from "@/components/ui/color-picker";
import { Plus, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface CreateClassModalProps {
  children?: React.ReactNode;
  onClassCreated?: (classData: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export function CreateClassModal({ children, onClassCreated }: CreateClassModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    section: "",
    subject: "",
    description: "",
    color: "#3b82f6",
    semester: "",
    credits: "",
    meetingTime: "",
    location: ""
  });
  const createClassMutation = trpc.class.create.useMutation();


  console.log(formData);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.title || !formData.section || !formData.subject) {
      toast.error("Please fill in all required fields.");
      return;
    }

    try {
      setLoading(true);
      
      // Create class using API
      const newClass = await createClassMutation.mutateAsync({
        name: formData.title,
        section: formData.section,
        subject: formData.subject,
        color: formData.color
      });

      onClassCreated?.(newClass);
      
      toast.success(`Class ${formData.title} has been created successfully.`);

      // Reset form
      setFormData({
        title: "",
        section: "",
        subject: "",
        description: "",
        color: "#3b82f6",
        semester: "",
        credits: "",
        meetingTime: "",
        location: ""
      });
      setOpen(false);
    } catch (error) {
      console.error("Failed to create class:", error);
      toast.error("Failed to create class. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Class
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Class</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Class Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Advanced Physics"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="section">Section *</Label>
              <Input
                id="section"
                value={formData.section}
                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                placeholder="e.g., AP-101"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="e.g., Physics"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="semester">Semester</Label>
              <Input
                id="semester"
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                placeholder="e.g., Spring 2025"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="credits">Credits</Label>
              <Input
                id="credits"
                type="number"
                value={formData.credits}
                onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
                placeholder="e.g., 3"
              />
            </div>
            <div className="space-y-2">
              <ColorPicker
                value={formData.color}
                onChange={(color) => setFormData({ ...formData, color })}
                label="Theme Color"
                description="Choose a color for this class"
                size="sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="meetingTime">Meeting Time</Label>
            <Input
              id="meetingTime"
              value={formData.meetingTime}
              onChange={(e) => setFormData({ ...formData, meetingTime: e.target.value })}
              placeholder="e.g., MWF 10:00-11:00 AM"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g., Room 205, Science Building"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the class content and objectives..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Class"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}