"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations('settings');
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
      
      toast.success(t('toasts.updated.title'), {
        description: t('toasts.updated.description')
      });
    } catch (error) {
      console.error("Failed to update class:", error);
      toast.error(t('errors.updateFailed.title'), {
        description: t('errors.updateFailed.description')
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
      
      toast.success(t('toasts.deleted.title'), {
        description: t('toasts.deleted.description')
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
          <h1 className="text-xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>
        
        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <span className="text-sm text-orange-600">{t('labels.unsavedChanges')}</span>
          )}
          <Button 
            onClick={handleSave}
            disabled={isLoading || !hasUnsavedChanges}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('actions.saving')}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {t('actions.saveChanges')}
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle> {t('sections.basicInfo.title')} </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="className" className="text-sm">{t('fields.className')} *</Label>
                <Input 
                  id="className" 
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder={t('placeholders.className')}
                  className="text-sm"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="section" className="text-sm">{t('fields.section')} *</Label>
                <Input 
                  id="section" 
                  value={formData.section}
                  onChange={(e) => handleInputChange("section", e.target.value)}
                  placeholder={t('placeholders.section')}
                  className="text-sm"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subject" className="text-sm">{t('fields.subject')} *</Label>
                <Input 
                  id="subject" 
                  value={formData.subject}
                  onChange={(e) => handleInputChange("subject", e.target.value)}
                  placeholder={t('placeholders.subject')}
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
            <CardTitle>{t('sections.theme.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ColorPicker
              value={formData.color}
              onChange={(color) => handleInputChange("color", color)}
              label=""
              description={t('sections.theme.description')}
            />
          </CardContent>
        </Card>

        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              {t('sections.danger.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t('sections.danger.description')}
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={isDeleting}>
                    {isDeleting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {t('actions.deleting')}
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        {t('actions.deleteClass')}
                      </>
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('confirm.title')}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t('confirm.description', { name: formData.name })}
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>{t('confirm.items.assignments')}</li>
                        <li>{t('confirm.items.records')}</li>
                        <li>{t('confirm.items.students')}</li>
                        <li>{t('confirm.items.events')}</li>
                      </ul>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('actions.cancel')}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {t('confirm.confirmDelete')}
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