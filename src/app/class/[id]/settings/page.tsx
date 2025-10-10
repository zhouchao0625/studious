"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageLayout } from "@/components/ui/page-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import ColorPicker from "@/components/ui/color-picker";
import { 
  Save, 
  Trash2,
  Loader2,
  AlertTriangle
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function ClassSettings() {
  const { id: classId } = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    section: "",
    subject: "",
    // description: "",
    color: "#3b82f6",
    // semester: "",
    // credits: "",
    // meetingTime: "",
    // location: ""
  });

  // Get class data
  const { data: classData, isLoading: classLoading, refetch } = trpc.class.get.useQuery({ 
    classId: classId as string 
  });

  // Mutations
  const updateClassMutation = trpc.class.update.useMutation();
  const deleteClassMutation = trpc.class.delete.useMutation();

  // Initialize form data when class data loads
  useEffect(() => {
    if (classData?.class) {
      const classInfo = classData.class;
      setFormData({
        name: classInfo.name || "",
        section: classInfo.section || "",
        subject: classInfo.subject || "",
        // description: classInfo.description || "",
        color: classInfo.color || "#3b82f6",
        // semester: classInfo.semester || "",
        // credits: classInfo.credits?.toString() || "",
        // meetingTime: classInfo.meetingTime || "",
        // location: classInfo.location || ""
      });
    }
  }, [classData]);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    if (!classId) return;

    try {
      setIsLoading(true);
      
      await updateClassMutation.mutateAsync({
        classId: classId as string,
        name: formData.name,
        section: formData.section,
        subject: formData.subject,
        // description: formData.description || undefined,
        color: formData.color,
        // semester: formData.semester || undefined,
        // credits: formData.credits ? parseInt(formData.credits) : undefined,
        // meetingTime: formData.meetingTime || undefined,
        // location: formData.location || undefined
      });

      await refetch();
      setHasUnsavedChanges(false);
      
      toast.success("Class Updated", {
        description: "Class settings have been saved successfully."
      });
    } catch (error) {
      console.error("Failed to update class:", error);
      toast.error("Update Failed", {
        description: "Failed to save class settings. Please try again."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!classId) return;

    try {
      setIsDeleting(true);
      
      await deleteClassMutation.mutateAsync({
        classId: classId as string,
        id: classId as string // API expects both parameters
      });
      
      toast.success("Class Deleted", {
        description: "The class has been permanently deleted."
      });
      
      // Redirect to classes page
      router.push("/classes");
    } catch (error) {
      console.error("Failed to delete class:", error);
      toast.error("Delete Failed", {
        description: "Failed to delete the class. Please try again."
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (classLoading) {
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

  return (
    <PageLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">Class Settings</h1>
          <p className="text-muted-foreground">Configure class details and preferences</p>
        </div>
        
        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <span className="text-sm text-orange-600">Unsaved changes</span>
          )}
          <Button 
            onClick={handleSave}
            disabled={isLoading || !hasUnsavedChanges}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="className" className="text-sm">Class Name *</Label>
                <Input 
                  id="className" 
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="e.g., Advanced Physics"
                  className="text-sm"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="section" className="text-sm">Section *</Label>
                <Input 
                  id="section" 
                  value={formData.section}
                  onChange={(e) => handleInputChange("section", e.target.value)}
                  placeholder="e.g., AP-101"
                  className="text-sm"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subject" className="text-sm">Subject *</Label>
                <Input 
                  id="subject" 
                  value={formData.subject}
                  onChange={(e) => handleInputChange("subject", e.target.value)}
                  placeholder="e.g., Physics"
                  className="text-sm"
                  required
                />
              </div>
              {/* <div className="space-y-2">
                <Label htmlFor="semester" className="text-sm">Semester</Label>
                <Input 
                  id="semester" 
                  value={formData.semester || ""}
                  onChange={(e) => handleInputChange("semester", e.target.value)}
                  placeholder="e.g., Spring 2025"
                  className="text-sm"
                />
              </div> */}
            </div>
            {/* <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="credits" className="text-sm">Credits</Label>
                <Input 
                  id="credits" 
                  value={formData.credits}
                  onChange={(e) => handleInputChange("credits", e.target.value)}
                  placeholder="e.g., 3"
                  type="number"
                  className="text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="meetingTime" className="text-sm">Meeting Time</Label>
                <Input 
                  id="meetingTime" 
                  value={formData.meetingTime}
                  onChange={(e) => handleInputChange("meetingTime", e.target.value)}
                  placeholder="e.g., MWF 10:00-11:00 AM"
                  className="text-sm"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location" className="text-sm">Location</Label>
              <Input 
                id="location" 
                value={formData.location}
                onChange={(e) => handleInputChange("location", e.target.value)}
                placeholder="e.g., Room 205, Science Building"
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm">Description</Label>
              <Textarea 
                id="description" 
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Describe the class content and objectives..."
                rows={3}
                className="text-sm"
              />
            </div> */}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Class Theme</CardTitle>
          </CardHeader>
          <CardContent>
            <ColorPicker
              value={formData.color}
              onChange={(color) => handleInputChange("color", color)}
              label=""
              description="Choose a theme color for this class"
            />
          </CardContent>
        </Card>

        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Once you delete a class, there is no going back. This will permanently delete all assignments, 
                grades, attendance records, and remove all students from the class.
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={isDeleting}>
                    {isDeleting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Class
                      </>
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the class 
                      "{formData.name}" and remove all associated data including:
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>All assignments and submissions</li>
                        <li>All grades and attendance records</li>
                        <li>All students will be removed from the class</li>
                        <li>All class events and announcements</li>
                      </ul>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Yes, delete class
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}