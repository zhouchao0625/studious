"use client";
import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { Upload as UploadIcon, X as XIcon, File as FileIcon, Image as ImageIcon, FileVideo, FileText } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { fixUploadUrl } from "@/lib/directUpload";
import { Skeleton } from "../ui/skeleton";


interface ApiFile {
  id: string;
  name: string;
  type: string;
  size: number;
  fileId?: string;
}

interface UploadFileModalProps {
  children?: React.ReactNode;
  onFilesUploaded?: (files: ApiFile[]) => void;
  currentFolder?: string;
  classId?: string;
  folderId?: string;
}

interface FileUpload {
  id: string;
  file: File;
  name: string;
  description: string;
  category: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
}


export function UploadFileModal({ children, onFilesUploaded, currentFolder = "/", classId, folderId }: UploadFileModalProps) {
  const t = useTranslations('uploadFiles');
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<FileUpload[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const appState = useSelector((state: RootState) => state.app);

  const  { data: folderInformation, isLoading: folderInformationLoading }  = trpc.folder.get.useQuery({ classId: classId!, folderId: currentFolder! }, { enabled: !!currentFolder && !!classId });

  // Overall upload progress state
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentUploadStatus, setCurrentUploadStatus] = useState('');
  const [uploadedFilesCount, setUploadedFilesCount] = useState(0);

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <ImageIcon className="h-4 w-4" />;
      case 'mp4':
      case 'avi':
      case 'mov':
        return <FileVideo className="h-4 w-4" />;
      case 'pdf':
      case 'doc':
      case 'docx':
      case 'txt':
        return <FileText className="h-4 w-4" />;
      default:
        return <FileIcon className="h-4 w-4" />;
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const newFiles: FileUpload[] = selectedFiles.map(file => ({
      id: Date.now().toString() + Math.random(),
      file,
      name: file.name,
      description: "",
      category: "other",
      progress: 0,
      status: 'pending'
    }));

    setFiles(prev => [...prev, ...newFiles]);
  };

  const updateFile = (id: string, updates: Partial<FileUpload>) => {
    setFiles(prev => prev.map(file =>
      file.id === id ? { ...file, ...updates } : file
    ));
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(file => file.id !== id));
  };


  // Direct upload functions using proper TRPC hooks
  // Using type assertion until backend types are regenerated
  const getUploadUrls = (trpc.folder as any).getFolderUploadUrls.useMutation();
  const confirmUpload = (trpc.folder as any).confirmFolderUpload.useMutation();

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error(t('noFilesSelected'));
      return;
    }

    // Validate required parameters
    if (!classId) {
      toast.error(t('classIdMissing'));
      return;
    }

    if (!folderId) {
      toast.error(t('folderIdMissing'));
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setCurrentUploadStatus(t('preparing'));
    setUploadedFilesCount(0);

    try {
      // Get upload URLs from backend (returns direct array)
      setCurrentUploadStatus(t('gettingUrls'));
      setUploadProgress(10);

      const uploadFilesResponse = await getUploadUrls.mutateAsync({
        classId,
        folderId,
        files: files.map(f => ({
          name: f.file.name,
          type: f.file.type,
          size: f.file.size
        }))
      });

      setUploadProgress(20);

      // Upload each file to its uploadUrl
      for (let i = 0; i < files.length; i++) {
        const fileData = files[i];
        const uploadFile = uploadFilesResponse[i];  // Direct array access

        try {
          // Update overall status
          setCurrentUploadStatus(t('uploadingFile', { name: fileData.name }));
          const overallProgress = 20 + ((i / files.length) * 60); // 20-80% for uploads
          setUploadProgress(overallProgress);

          // Update UI status
          updateFile(fileData.id, { status: 'uploading', progress: 0 });

          // Fix upload URL to use correct API base URL from environment
          const uploadUrl = fixUploadUrl(uploadFile.uploadUrl);

          // Upload to backend proxy endpoint (resolves CORS issues)
          const response = await fetch(uploadUrl, {
            method: 'POST', // Backend proxy uses POST
            body: fileData.file,
            headers: {
              'Content-Type': fileData.file.type,
            },
          });

          if (!response.ok) {
            throw new Error(`Upload failed: ${response.statusText}`);
          }

          // Confirm upload to backend
          setCurrentUploadStatus(t('confirming', { name: fileData.name }));
          await confirmUpload.mutateAsync({
            classId,
            fileId: uploadFile.id,
            uploadSuccess: true
          });

          // Update UI status
          updateFile(fileData.id, { status: 'completed', progress: 100 });
          setUploadedFilesCount(i + 1);
        } catch (error) {
          // Report error to backend
          await confirmUpload.mutateAsync({
            classId,
            fileId: uploadFile.id,
            uploadSuccess: false
          });

          // Update UI status
          updateFile(fileData.id, { status: 'error', progress: 0 });
          toast.error(t('errorFile', { name: fileData.name }));
        }
      }

      // Final steps
      setCurrentUploadStatus(t('finalizing'));
      setUploadProgress(90);

      // Callback with uploaded files
      if (onFilesUploaded) {
        onFilesUploaded(uploadFilesResponse.map(file => ({
          id: file.id,
          name: file.name,
          type: file.type,
          size: file.size,
          fileId: file.id
        })));
      }

      setUploadProgress(100);
      setCurrentUploadStatus(t('success'));
      toast.success(t('success'));
      
      // Reset after delay
      setTimeout(() => {
      setOpen(false);
        setFiles([]);
        setUploading(false);
        setUploadProgress(0);
        setCurrentUploadStatus('');
        setUploadedFilesCount(0);
      }, 1000);
    } catch (error) {
      toast.error(t('errorMessage', { message: error instanceof Error ? error.message : 'Unknown error' }));
      setUploading(false);
      setUploadProgress(0);
      setCurrentUploadStatus('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <UploadIcon className="h-4 w-4 mr-2" />
            {t('title')}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Overall Upload Progress */}
          {uploading && (
            <div className="space-y-2 p-4 bg-muted rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{currentUploadStatus}</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
              {files.length > 0 && (
                <p className="text-xs text-muted-foreground text-center">
                  {t('filesUploaded', { uploaded: uploadedFilesCount, total: files.length })}
                </p>
              )}
            </div>
          )}

          {/* File Selection */}
          <div
            className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">{t('dropZone')}</p>
            <p className="text-sm text-muted-foreground">
              {t('dropZoneHint')}
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileSelect}
              accept="*/*"
              disabled={uploading}
            />
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium">{t('selectedFiles', { count: files.length })}</h4>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {files.map((file) => (
                  <div key={file.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        {getFileIcon(file.name)}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{file.file.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {(file.file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(file.id)}
                        disabled={uploading}
                      >
                        <XIcon className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Progress Bar */}
                    {file.status !== 'pending' && (
                      <div className="space-y-2 mt-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            {t(`status.${file.status}`)}
                          </span>
                          <span className="text-muted-foreground">{Math.round(file.progress)}%</span>
                        </div>
                        <Progress value={file.progress} className="h-2" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Info */}
          {currentFolder !== "/" && (
            <div className="flex items-center gap-2 p-3 bg-muted/50 border border-border rounded-lg">
            <UploadIcon className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="text-sm flex-1 min-w-0 items-center flex gap-2">
              <span className="text-muted-foreground">{t('uploadingTo')}</span>
              {folderInformationLoading ? (
                <Skeleton className="inline-block w-24 h-4" />
              ) : (
                <span className="font-medium">{folderInformation?.name || t('homeDirectory')}</span>
              )}
            </div>
          </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={uploading}>
              {t('cancel')}
            </Button>
            <Button onClick={handleUpload} disabled={files.length === 0 || uploading}>
              {uploading ? t('uploading') : t('upload', { count: files.length })}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}