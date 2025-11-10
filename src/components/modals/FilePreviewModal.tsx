"use client";
import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Download,
  Share,
  X,
  FileText,
  Image,
  FileVideo,
  Music,
  Archive,
  FileSpreadsheet,
  Presentation,
  File,
  Calendar,
  User,
  HardDrive,
  Eye,
  Maximize,
  Minimize
} from "lucide-react";

interface FileItem {
  id: string;
  name: string;
  type: "file" | "folder";
  fileType?: string;
  size?: string;
  uploadedBy?: string;
  uploadedAt?: string;
}

interface FilePreviewModalProps {
  file: FileItem | null;
  isOpen: boolean;
  onClose: () => void;
  onAction: (action: string, file: FileItem) => void;
  getPreviewUrl?: (fileId: string) => Promise<string>;
}

export function FilePreviewModal({ file, isOpen, onClose, onAction, getPreviewUrl }: FilePreviewModalProps) {

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Generate preview URL when file changes
  useEffect(() => {
    if (file && isOpen) {
      generatePreviewUrl();
    }
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [file?.id, isOpen]);

  // Handle escape key for fullscreen
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    if (isFullscreen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isFullscreen]);
  
  if (!file) return null;

  const getFileIcon = (fileType: string) => {
    const iconSize = "h-12 w-12";
    
    switch (fileType) {
      case "pdf":
        return <FileText className={`${iconSize} text-red-500`} />;
      case "docx":
        return <FileText className={`${iconSize} text-blue-500`} />;
      case "pptx":
        return <Presentation className={`${iconSize} text-orange-500`} />;
      case "xlsx":
        return <FileSpreadsheet className={`${iconSize} text-green-500`} />;
      case "mp4":
        return <FileVideo className={`${iconSize} text-purple-500`} />;
      case "mp3":
        return <Music className={`${iconSize} text-pink-500`} />;
      case "zip":
        return <Archive className={`${iconSize} text-gray-500`} />;
      case "jpg":
      case "png":
      case "gif":
        return <Image className={`${iconSize} text-emerald-500`} />;
      default:
        return <File className={`${iconSize} text-slate-500`} />;
    }
  };

  const getFileTypeLabel = (fileType: string) => {
    const types: Record<string, string> = {
      pdf: "PDF Document",
      docx: "Word Document",
      pptx: "PowerPoint Presentation",
      xlsx: "Excel Spreadsheet",
      mp4: "Video File",
      mp3: "Audio File",
      zip: "Archive File",
      jpg: "JPEG Image",
      png: "PNG Image",
      gif: "GIF Image"
    };
    return types[fileType] || "File";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const generatePreviewUrl = async () => {
    if (!file) return;
    
    setIsLoadingPreview(true);
    setPreviewError(null);
    
    try {
      if (getPreviewUrl) {
        // Use the provided function to get the actual preview URL
        const url = await getPreviewUrl(file.id);
        setPreviewUrl(url);
      } else {
        // Fallback to placeholder for demo
        const mockUrl = `https://via.placeholder.com/800x600/e5e7eb/6b7280?text=${encodeURIComponent(file.name)}`;
        setPreviewUrl(mockUrl);
      }
    } catch (error) {
      setPreviewError("Failed to load preview");
    } finally {
      setIsLoadingPreview(false);
    }
  };

  // Reusable preview container component
  const PreviewContainer = ({ 
    aspectRatio = "aspect-video", 
    allowFullscreen = true, 
    children 
  }: { 
    aspectRatio?: string; 
    allowFullscreen?: boolean; 
    children: React.ReactNode;
  }) => {
    const containerClass = isFullscreen 
      ? "fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 h-screen"
      : `relative w-full max-w-2xl mx-auto bg-muted rounded-lg mb-4 ${aspectRatio} overflow-hidden h-[30rem]`;

    return (
      <div className={containerClass}>
        {children}
        {allowFullscreen && (
          <Button
            variant="ghost"
            size="sm"
            className={`absolute top-2 right-2 ${isFullscreen ? 'text-white hover:bg-white/20' : 'hover:bg-black/10'}`}
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </Button>
        )}
      </div>
    );
  };

  const renderPreview = () => {
    if (!file.fileType) return null;

    if (isLoadingPreview) {
      return (
        <PreviewContainer>
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Loading preview...</p>
            </div>
          </div>
        </PreviewContainer>
      );
    }

    if (previewError) {
      return (
        <PreviewContainer>
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <X className="h-16 w-16 text-red-500 mx-auto mb-2" />
              <p className="text-sm text-red-500">{previewError}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={generatePreviewUrl}
              >
                Retry
              </Button>
            </div>
          </div>
        </PreviewContainer>
      );
    }

    switch (file.fileType) {
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
      case "webp":
        return (
          <PreviewContainer>
            {previewUrl ? (
              <img
                src={previewUrl}
                alt={file.name}
                className="w-full h-full object-contain"
                onError={() => setPreviewError("Failed to load image")}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <Image className="h-16 w-16 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Image preview loading...</p>
                </div>
              </div>
            )}
          </PreviewContainer>
        );
      
      case "mp4":
      case "webm":
      case "ogg":
        return (
          <PreviewContainer>
            {previewUrl ? (
              <video
                src={previewUrl}
                controls
                className="w-full h-full"
                onError={() => setPreviewError("Failed to load video")}
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <FileVideo className="h-16 w-16 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Video preview loading...</p>
                </div>
              </div>
            )}
          </PreviewContainer>
        );
      
      case "mp3":
      case "wav":
      case "ogg":
        return (
          <PreviewContainer allowFullscreen={false}>
            <div className="w-full h-full flex items-center justify-center p-6">
              {previewUrl ? (
                <div className="text-center">
                  <Music className="h-16 w-16 text-primary mx-auto mb-4" />
                  <audio
                    src={previewUrl}
                    controls
                    className="w-full max-w-md mx-auto"
                    onError={() => setPreviewError("Failed to load audio")}
                  >
                    Your browser does not support the audio tag.
                  </audio>
                </div>
              ) : (
                <div className="text-center">
                  <Music className="h-16 w-16 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Audio preview loading...</p>
                </div>
              )}
            </div>
          </PreviewContainer>
        );
      
      case "pdf":
        return (
          <PreviewContainer aspectRatio="aspect-[3/4]">
            {previewUrl ? (
              <iframe
                src={`${previewUrl}#toolbar=0`}
                className="w-full h-full rounded-lg"
                title={file.name}
                onError={() => setPreviewError("Failed to load PDF")}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">PDF preview loading...</p>
                </div>
              </div>
            )}
          </PreviewContainer>
        );
      
      case "txt":
      case "md":
      case "json":
      case "xml":
      case "csv":
        return (
          <PreviewContainer>
            <div className={`${isFullscreen ? 'h-full' : 'max-h-96'} overflow-y-auto p-4`}>
              {previewUrl ? (
                <div className="font-mono text-sm whitespace-pre-wrap">
                  {/* In a real implementation, you'd fetch and display the text content */}
                  <div className="text-center text-muted-foreground py-8">
                    <FileText className="h-16 w-16 mx-auto mb-2" />
                    <p>Text preview would show file contents here</p>
                    <p className="text-xs mt-2">Click download to view full content</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Text preview loading...</p>
                </div>
              )}
            </div>
          </PreviewContainer>
        );
      
      default:
        return (
          <PreviewContainer allowFullscreen={false}>
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center flex justify-center items-center flex-col">
                {getFileIcon(file.fileType)}
                <p className="text-sm text-muted-foreground mt-4">Preview not available for this file type</p>
                <p className="text-xs text-muted-foreground mt-1">Click download to view the file</p>
              </div>
            </div>
          </PreviewContainer>
        );
    }
  };

  return (
    <>
      <Dialog open={isOpen && !isFullscreen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {getFileIcon(file.fileType!)}
              <div>
                <div className="flex items-center gap-2">
                  <span>{file.name}</span>
                </div>
                <Badge variant="secondary" className="text-xs mt-1">
                  {getFileTypeLabel(file.fileType!)}
                </Badge>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Preview Area */}
            {renderPreview()}

            {/* File Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">File Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Size:</span>
                    <span>{file.size}</span>
                  </div>
                  {file.uploadedBy && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Uploaded by:</span>
                      <span>{file.uploadedBy}</span>
                    </div>
                  )}
                  {file.uploadedAt && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Uploaded:</span>
                      <span>{formatDate(file.uploadedAt)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-sm">Actions</h3>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onAction("download", file)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onAction("share", file)}
                  >
                    <Share className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Fullscreen overlay - rendered outside dialog */}
      {isFullscreen && (
        <div className="fixed inset-0 z-[100]">
          {renderPreview()}
        </div>
      )}
    </>
  );
}