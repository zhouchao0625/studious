"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PageLayout, PageHeader } from "@/components/ui/page-layout";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  User,
  Mail,
  Calendar,
  GraduationCap,
  Save,
  Edit,
  Check,
  X,
} from "lucide-react";
import { RouterOutputs, trpc, type RouterInputs } from "@/lib/trpc";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { AvatarSelector } from "@/components/AvatarSelector";
import { useDispatch, useSelector } from "react-redux";
import { setAuth } from "@/store/appSlice";
import { RootState } from "@/store/store";
import { useTranslations } from 'next-intl';

// Profile form schema
const profileFormSchema = z.object({
  displayName: z.string().min(2, "Display name must be at least 2 characters").optional(),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  location: z.string().optional(),
  website: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function Profile() {
  const t = useTranslations('profile');
  const tPersonal = useTranslations('profile.personalInformation');
  const tAccount = useTranslations('profile.accountInformation');
  const tMessages = useTranslations('profile.messages');
  const tCommon = useTranslations('common');

  const dispatch  = useDispatch();
  const appState = useSelector((state: RootState) => state.app);
  
  const [isEditing, setIsEditing] = useState(false);
  const [pendingProfilePicture, setPendingProfilePicture] = useState<{
    name: string;
    type: string;
    size: number;
    file: File;
  } | null>(null);
  const [pendingDicebearAvatar, setPendingDicebearAvatar] = useState<string | null>(null);

  // Memoized preview URL for pending file & cleanup on change
  const profilePicturePreviewUrl = React.useMemo(() => {
    return pendingProfilePicture ? URL.createObjectURL(pendingProfilePicture.file) : null;
  }, [pendingProfilePicture]);

  React.useEffect(() => {
    return () => {
      if (profilePicturePreviewUrl) URL.revokeObjectURL(profilePicturePreviewUrl);
    };
  }, [profilePicturePreviewUrl]);

  // API hooks
  const { data: profile, isLoading, error } = trpc.user.getProfile.useQuery();
  const updateProfileMutation = trpc.user.updateProfile.useMutation({
    onSuccess: (response: RouterOutputs['user']['updateProfile']) => {
      dispatch(setAuth({
        ...appState.user,
        ...response.profile,
      }));
    }
  });
  const getUploadUrlMutation = trpc.user.getUploadUrl.useMutation();
  const utils = trpc.useUtils();

  // Form setup
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: "",
      bio: "",
      location: "",
      website: "",
    },
  });

  // Update form when profile data loads
  React.useEffect(() => {
    if (profile) {
      form.reset({
        displayName: (profile.profile as any)?.displayName || "",
        bio: (profile.profile as any)?.bio || "",
        location: (profile.profile as any)?.location || "",
        website: (profile.profile as any)?.website || "",
      });
    }
  }, [profile, form]);

  const handleSave = async (values: ProfileFormValues) => {
    try {
      const updateData: RouterInputs['user']['updateProfile'] = {
        profile: values,
      };

      if (pendingProfilePicture) {
        // Handle custom uploaded image - upload to GCS first
        try {
          // 1. Get signed URL for direct upload
          const uploadData = await getUploadUrlMutation.mutateAsync({
            fileName: pendingProfilePicture.name,
            fileType: pendingProfilePicture.type,
          });

          // 2. Upload file directly to GCS
          const ac = new AbortController();
          const t = setTimeout(() => ac.abort(), 15000);
          let uploadResponse: Response;
          try {
            uploadResponse = await fetch(uploadData.uploadUrl, {
              method: 'PUT',
              body: pendingProfilePicture.file,
              headers: { 'Content-Type': pendingProfilePicture.type },
              signal: ac.signal,
            });
          } finally {
            clearTimeout(t);
          }

          if (!uploadResponse.ok) {
            throw new Error('Failed to upload file to storage');
          }

          // 3. Update profile with file path
          updateData.profilePicture = {
            filePath: uploadData.filePath,
            fileName: uploadData.fileName,
            fileType: pendingProfilePicture.type,
            fileSize: pendingProfilePicture.size,
          };
        } catch (uploadError) {
          console.error("Failed to upload profile picture:", uploadError);
          toast.error(tMessages('profilePictureUploadFailed'));
          return;
        }
      } else if (pendingDicebearAvatar) {
        // Handle DiceBear avatar - use dicebearAvatar field
        updateData.dicebearAvatar = {
          url: pendingDicebearAvatar,
        };
      }

      await updateProfileMutation.mutateAsync(updateData);
      
      // Invalidate and refetch the profile query to update the UI immediately
      await utils.user.getProfile.invalidate();
      
      toast.success(tMessages('profileUpdated'));
      setIsEditing(false);
      setPendingProfilePicture(null);
      setPendingDicebearAvatar(null);
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast.error(tMessages('profileUpdateFailed'));
    }
  };

  const handleCancel = () => {
    form.reset({
      displayName: (profile?.profile as any)?.displayName || "",
      bio: (profile?.profile as any)?.bio || "",
      location: (profile?.profile as any)?.location || "",
      website: (profile?.profile as any)?.website || "",
    });
    setIsEditing(false);
    setPendingProfilePicture(null);
    setPendingDicebearAvatar(null);
  };

  const handleAvatarSelect = async (avatarUrl: string, isCustom: boolean, fileName?: string, fileType?: string, file?: File) => {
    try {
      if (isCustom && file) {
        // Store file object for direct upload (no base64)
        setPendingProfilePicture({
          name: fileName || "custom-avatar",
          type: fileType || "image/png",
          size: file.size,
          file: file,
        });
        setPendingDicebearAvatar(null); // Clear any pending DiceBear avatar
        toast.success(tMessages('profilePictureSelected'));
      } else if (!isCustom) {
        // Handle DiceBear avatar - store URL
        setPendingDicebearAvatar(avatarUrl);
        setPendingProfilePicture(null); // Clear any pending file upload
        toast.success(tMessages('avatarSelected'));
      }
    } catch (error: any) {
      console.error("Failed to select profile picture:", error);
      toast.error(tMessages('profilePictureSelectFailed'));
    }
  };

  if (isLoading) {
    return (
      <PageLayout>
        <PageHeader
          title={t('title')}
          description={t('description')}
        />
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-4">
                <Skeleton className="h-20 w-20 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout>
        <PageHeader
          title={t('title')}
          description={t('description')}
        />
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-destructive">{tMessages('failedToLoadProfile')}</p>
          </CardContent>
        </Card>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageHeader
        title={t('title')}
        description={t('description')}
      >
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)} className="flex items-center space-x-2">
            <Edit className="h-4 w-4" />
            <span>{t('editProfile')}</span>
          </Button>
        ) : (
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="flex items-center space-x-2"
            >
              <X className="h-4 w-4" />
              <span>{tCommon('cancel')}</span>
            </Button>
            <Button
              onClick={form.handleSubmit(handleSave)}
              disabled={
                form.formState.isSubmitting ||
                updateProfileMutation.isPending ||
                getUploadUrlMutation.isPending
              }
              className="flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>{t('saveChanges')}</span>
            </Button>
          </div>
        )}
      </PageHeader>

      <div className="space-y-6">
        {/* Profile Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <AvatarSelector
                  currentAvatar={
                    pendingProfilePicture 
                      ? (profilePicturePreviewUrl ?? undefined)
                      : pendingDicebearAvatar 
                        ? pendingDicebearAvatar
                        : (profile?.profile as any)?.profilePicture || appState.user.profilePicture
                  }
                  onAvatarSelect={handleAvatarSelect}
                  disabled={!isEditing}
                  size="lg"
                />
                {(pendingProfilePicture || pendingDicebearAvatar) && (
                  <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs">
                    ✓
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <h2 className="text-2xl font-bold">
                    {(profile?.profile as any)?.displayName || profile?.username}
                  </h2>
                  <Badge variant="secondary" className="flex items-center space-x-1">
                    <GraduationCap className="h-3 w-3" />
                    <span>{t('student')}</span>
                  </Badge>
                </div>
                <p className="text-muted-foreground">@{profile?.username}</p>
                {(profile?.profile as any)?.bio && (
                  <p className="text-sm">{(profile?.profile as any)?.bio}</p>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>{tPersonal('title')}</span>
            </CardTitle>
            <CardDescription>
              {tPersonal('description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form className="space-y-6" onSubmit={form.handleSubmit(handleSave)}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="displayName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{tPersonal('displayName')}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder={tPersonal('displayNamePlaceholder')}
                            disabled={!isEditing}
                          />
                        </FormControl>
                        <FormDescription>
                          {tPersonal('displayNameDescription')}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{tPersonal('location')}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder={tPersonal('locationPlaceholder')}
                            disabled={!isEditing}
                          />
                        </FormControl>
                        <FormDescription>
                          {tPersonal('locationDescription')}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{tPersonal('bio')}</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder={tPersonal('bioPlaceholder')}
                          className="min-h-[100px]"
                          disabled={!isEditing}
                        />
                      </FormControl>
                      <FormDescription>
                        {tPersonal('bioDescription')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{tPersonal('website')}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={tPersonal('websitePlaceholder')}
                          disabled={!isEditing}
                        />
                      </FormControl>
                      <FormDescription>
                        {tPersonal('websiteDescription')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Hidden submit to allow Enter key to submit from inputs */}
                <button type="submit" className="hidden" aria-hidden />
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>{tAccount('title')}</span>
            </CardTitle>
            <CardDescription>
              {tAccount('description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">{tAccount('username')}</Label>
                <div className="p-3 bg-muted/50 rounded-md">
                  <span className="text-sm font-medium">{profile?.username || "N/A"}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {tAccount('usernameNote')}
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">{tAccount('email')}</Label>
                <div className="p-3 bg-muted/50 rounded-md">
                  <span className="text-sm font-medium">user@example.com</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {tAccount('emailNote')}
                </p>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">{tAccount('memberSince')}</Label>
              <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-md">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {new Date().toLocaleDateString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
