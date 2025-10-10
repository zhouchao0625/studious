"use client";
"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Bell, Plus } from "lucide-react";
import { useParams } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";


interface CreateAnnouncementModalProps {
  children?: React.ReactNode;
  onAnnouncementCreated?: (announcementData: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export function CreateAnnouncementModal({ children, onAnnouncementCreated }: CreateAnnouncementModalProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    priority: "normal",
    urgent: false,
    pinned: false,
    notifyEmail: true,
    notifyPush: true,
    scheduledDate: "",
    scheduledTime: "",
    expiryDate: ""
  });
const appState = useSelector((state: RootState) => state.app);
const params = useParams();
const classId = params.id as string;


  const priorities = [
    { label: "Low", value: "low" },
    { label: "Normal", value: "normal" },
    { label: "High", value: "high" },
    { label: "Urgent", value: "urgent" }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.content) {
      toast.error("Please fill in all required fields.");
      return;
    }

    const publishDate = formData.scheduledDate && formData.scheduledTime
      ? new Date(`${formData.scheduledDate}T${formData.scheduledTime}`)
      : new Date();

    const newAnnouncement = {
      id: Date.now().toString(),
      title: formData.title,
      content: formData.content,
      priority: formData.priority,
      urgent: formData.urgent || formData.priority === "urgent",
      pinned: formData.pinned,
      publishedAt: publishDate.toISOString(),
      expiresAt: formData.expiryDate ? new Date(formData.expiryDate).toISOString() : null,
      notificationSettings: {
        email: formData.notifyEmail,
        push: formData.notifyPush
      },
      author: "Dr. Smith",
      readCount: 0,
      totalRecipients: 24,
      // Prisma-aligned fields
      remarks: formData.content,
      teacherId: appState.user.id,
      classId: classId ?? undefined
    };

    onAnnouncementCreated?.(newAnnouncement);
    
    toast.success("Announcement Created");

    setFormData({
      title: "",
      content: "",
      priority: "normal",
      urgent: false,
      pinned: false,
      notifyEmail: true,
      notifyPush: true,
      scheduledDate: "",
      scheduledTime: "",
      expiryDate: ""
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Bell className="h-4 w-4 mr-2" />
            Post Announcement
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Announcement</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Announcement Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Lab report due Friday"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content *</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Write your announcement content here..."
              rows={5}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority Level</Label>
              <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map((priority) => (
                    <SelectItem key={priority.value} value={priority.value}>
                      {priority.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiryDate">Expiry Date (Optional)</Label>
              <Input
                id="expiryDate"
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium">Settings</h4>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Pin to top</Label>
                <p className="text-sm text-muted-foreground">Keep this announcement at the top of the list</p>
              </div>
              <Switch
                checked={formData.pinned}
                onCheckedChange={(checked) => setFormData({ ...formData, pinned: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Mark as urgent</Label>
                <p className="text-sm text-muted-foreground">Highlight with urgent styling</p>
              </div>
              <Switch
                checked={formData.urgent}
                onCheckedChange={(checked) => setFormData({ ...formData, urgent: checked })}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium">Notifications</h4>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Send email notification</Label>
                <p className="text-sm text-muted-foreground">Notify students via email</p>
              </div>
              <Switch
                checked={formData.notifyEmail}
                onCheckedChange={(checked) => setFormData({ ...formData, notifyEmail: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Send push notification</Label>
                <p className="text-sm text-muted-foreground">Send mobile app notification</p>
              </div>
              <Switch
                checked={formData.notifyPush}
                onCheckedChange={(checked) => setFormData({ ...formData, notifyPush: checked })}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium">Schedule Publishing (Optional)</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="scheduledDate">Publish Date</Label>
                <Input
                  id="scheduledDate"
                  type="date"
                  value={formData.scheduledDate}
                  onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                  placeholder="Publish immediately if empty"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scheduledTime">Publish Time</Label>
                <Input
                  id="scheduledTime"
                  type="time"
                  value={formData.scheduledTime}
                  onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {formData.scheduledDate ? "Schedule Announcement" : "Publish Now"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}