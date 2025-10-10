"use client";
import { useState, useRef } from "react";
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


interface ApiFile {
  id: string;
  name: string;
  type: string;
  size: number;
  data: string;
}

interface UploadFileModalProps {
  children?: React.ReactNode;
  onFilesUploaded?: (files: ApiFile[]) => void;
  currentFolder?: string;
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

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = reader.result as string;
      resolve(base64.split(',')[1]);
    };
    reader.onerror = (error) => reject(error);
  });
}

export function UploadFileModal({ children, onFilesUploaded, currentFolder = "/" }: UploadFileModalProps) {
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<FileUpload[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const appState = useSelector((state: RootState) => state.app);


  const categories = [
    { label: "Lecture Materials", value: "lectures" },
    { label: "Assignments", value: "assignments" },
    { label: "Lab Resources", value: "labs" },
    { label: "Reading Materials", value: "readings" },
    { label: "Exam Resources", value: "exams" },
    { label: "Project Files", value: "projects" },
    { label: "Multimedia", value: "multimedia" },
    { label: "Other", value: "other" }
  ];

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

  const simulateUpload = (file: FileUpload): Promise<void> => {
    return new Promise((resolve, reject) => {
      updateFile(file.id, { status: 'uploading', progress: 0 });

      const interval = setInterval(() => {
        setFiles(prev => prev.map(f => {
          if (f.id === file.id) {
            const newProgress = f.progress + Math.random() * 30;

            if (newProgress >= 100) {
              clearInterval(interval);
              updateFile(file.id, { status: 'completed', progress: 100 });
              resolve();
              return { ...f, progress: 100 };
            }

            return { ...f, progress: newProgress };
          }
          return f;
        }));
      }, 200);

      // Simulate occasional failures
      if (Math.random() < 0.1) {
        setTimeout(() => {
          clearInterval(interval);
          updateFile(file.id, { status: 'error' });
          reject(new Error('Upload failed'));
        }, 1000);
      }
    });
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error("No Files Selected");
      return;
    }

    setUploading(true);

    try {
      await Promise.all(files.map(file => simulateUpload(file)));

      // get base64

      const uploadedFiles = await Promise.all(files.map(async file => {

        const base64Data = await fileToBase64(file.file);

        return {
        id: file.id,
        name: file.name,
        description: file.description,
        category: file.category,
        size: file.file.size,
        type: file.file.type,
        uploadedAt: new Date().toISOString(),
        folder: currentFolder,
        data: base64Data,
        // Prisma-aligned fields
        path: `${currentFolder}/${file.name}`,
        userId: appState.user.id
        }
      }));

      onFilesUploaded?.(uploadedFiles);

      toast.success(`Successfully uploaded ${files.length} file(s).`);

      setFiles([]);
      setOpen(false);
    } catch (error) {
      toast.error("Upload Failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <UploadIcon className="h-4 w-4 mr-2" />
            Upload Files
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Files</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Selection */}
          <div
            className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">Drop files here or click to browse</p>
            <p className="text-sm text-muted-foreground">
              Support for images, documents, videos, and more
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileSelect}
              accept="*/*"
            />
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium">Selected Files ({files.length})</h4>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {files.map((file) => (
                  <div key={file.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
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

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Display Name</Label>
                        <Input
                          value={file.name}
                          onChange={(e) => updateFile(file.id, { name: e.target.value })}
                          className="h-8 text-sm"
                          disabled={uploading}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Category</Label>
                        <Select
                          value={file.category}
                          onValueChange={(value) => updateFile(file.id, { category: value })}
                          disabled={uploading}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.value} value={category.value}>
                                {category.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-1 mb-3">
                      <Label className="text-xs">Description (Optional)</Label>
                      <Textarea
                        value={file.description}
                        onChange={(e) => updateFile(file.id, { description: e.target.value })}
                        className="h-16 text-sm"
                        placeholder="Add a description for this file..."
                        disabled={uploading}
                      />
                    </div>

                    {/* Progress Bar */}
                    {file.status !== 'pending' && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className={`capitalize ${file.status === 'completed' ? 'text-green-600' :
                              file.status === 'error' ? 'text-red-600' :
                                'text-blue-600'
                            }`}>
                            {file.status}
                          </span>
                          <span>{Math.round(file.progress)}%</span>
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
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm">
                <strong>Uploading to:</strong> {currentFolder}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={uploading}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={files.length === 0 || uploading}>
              {uploading ? "Uploading..." : `Upload ${files.length} File(s)`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}