"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Camera,
  Upload,
  Check,
  RefreshCw,
  User,
  Sparkles,
  Palette,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AvatarSelectorProps {
  currentAvatar?: string;
  onAvatarSelect: (avatarUrl: string, isCustom: boolean, fileName?: string, fileType?: string, file?: File) => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
}

// DiceBear avatar styles
const avatarStyles = [
  { name: "Adventurer", value: "adventurer", seed: "adventurer" },
  { name: "Avataaars", value: "avataaars", seed: "avataaars" },
  { name: "Big Smile", value: "big-smile", seed: "big-smile" },
  { name: "Bottts", value: "bottts", seed: "bottts" },
  { name: "Fun-emoji", value: "fun-emoji", seed: "fun-emoji" },
  { name: "Icons", value: "icons", seed: "icons" },
  { name: "Lorelei", value: "lorelei", seed: "lorelei" },
  { name: "Micah", value: "micah", seed: "micah" },
  { name: "Miniavs", value: "miniavs", seed: "miniavs" },
  { name: "Open Peeps", value: "open-peeps", seed: "open-peeps" },
  { name: "Personas", value: "personas", seed: "personas" },
  { name: "Pixel Art", value: "pixel-art", seed: "pixel-art" },
];

// Generate random seeds for variety
const generateRandomSeed = () => {
  const adjectives = ["happy", "cool", "smart", "brave", "kind", "creative", "funny", "wise"];
  const nouns = ["tiger", "eagle", "dolphin", "fox", "bear", "wolf", "lion", "panda"];
  const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  const randomNum = Math.floor(Math.random() * 1000);
  return `${randomAdj}-${randomNoun}-${randomNum}`;
};

export function AvatarSelector({
  currentAvatar,
  onAvatarSelect,
  disabled = false,
  size = "md",
}: AvatarSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState("avataaars");
  const [selectedSeed, setSelectedSeed] = useState(generateRandomSeed());
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: "h-12 w-12",
    md: "h-20 w-20",
    lg: "h-24 w-24",
  };

  const generateAvatarUrl = (style: string, seed: string) => {
    return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed)}`;
  };

  const handleStyleChange = (style: string) => {
    setSelectedStyle(style);
    setSelectedSeed(generateRandomSeed());
  };

  const handleSeedChange = () => {
    setSelectedSeed(generateRandomSeed());
  };

  const handleAvatarSelect = () => {
    const avatarUrl = generateAvatarUrl(selectedStyle, selectedSeed);
    onAvatarSelect(avatarUrl, false);
    setIsOpen(false);
  };

  const handleCustomUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload a valid image (JPEG, PNG, GIF, or WebP)");
      input.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Profile picture must be less than 5MB");
      input.value = "";
      return;
    }

    // Store the file for later use
    setSelectedFile(file);

    // Show preview first
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setPreviewImage(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmUpload = async () => {
    if (!previewImage || !selectedFile) return;

    setIsProcessing(true);
    try {
      onAvatarSelect(previewImage, true, selectedFile.name, selectedFile.type, selectedFile);
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to upload image:", error);
      toast.error("Failed to process the image. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Reset preview when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      setPreviewImage(null);
      setSelectedFile(null);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "relative rounded-full p-0 hover:bg-accent",
            sizeClasses[size],
            disabled && "opacity-50 cursor-not-allowed"
          )}
          disabled={disabled}
          aria-label="Change profile picture"
        >
          <Avatar className={cn("h-full w-full", sizeClasses[size])}>
            <AvatarImage src={currentAvatar} alt="Profile" />
            <AvatarFallback className="text-lg">
              <User className="h-6 w-6" />
            </AvatarFallback>
          </Avatar>
          <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <Camera className="h-4 w-4 text-white" />
          </div>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Palette className="h-5 w-5" />
            <span>Choose Your Avatar</span>
          </DialogTitle>
          <DialogDescription>
            Select from our avatar collection or upload your own profile picture.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="avatars" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="avatars" className="flex items-center space-x-2">
              <Sparkles className="h-4 w-4" />
              <span>Avatars</span>
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center space-x-2">
              <Upload className="h-4 w-4" />
              <span>Upload</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="avatars" className="space-y-4">
            {/* Style Selection */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Choose Style</h4>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-48 overflow-y-auto">
                {avatarStyles.map((style) => (
                  <Button
                    key={style.value}
                    variant={selectedStyle === style.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleStyleChange(style.value)}
                    className={cn(
                      "flex flex-col items-center space-y-1 h-auto py-2 px-2",
                      selectedStyle === style.value && "ring-2 ring-primary ring-offset-2"
                    )}
                  >
                    <Avatar className="w-6 h-6">
                      <AvatarImage 
                        src={generateAvatarUrl(style.value, style.seed)} 
                        alt={style.name}
                        className="object-cover"
                      />
                      <AvatarFallback className="text-xs bg-muted">
                        {style.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs leading-tight">{style.name}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Current Selection Preview */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Preview</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSeedChange}
                  className="flex items-center space-x-1"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>Randomize</span>
                </Button>
              </div>
              
              <Card className="p-4">
                <CardContent className="flex items-center justify-center p-4">
                  <Avatar className="h-24 w-24">
                    <AvatarImage 
                      src={generateAvatarUrl(selectedStyle, selectedSeed)} 
                      alt="Avatar preview" 
                    />
                    <AvatarFallback>
                      <User className="h-8 w-8" />
                    </AvatarFallback>
                  </Avatar>
                </CardContent>
              </Card>

              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  Seed: <code className="bg-muted px-1 rounded">{selectedSeed}</code>
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAvatarSelect} className="flex items-center space-x-2">
                <Check className="h-4 w-4" />
                <span>Use This Avatar</span>
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="upload" className="space-y-4">
            <div className="space-y-4">
              {!previewImage ? (
                <div 
                  className="text-center cursor-pointer hover:bg-muted/50 transition-colors rounded-lg p-6 border-2 border-dashed border-muted-foreground/25 hover:border-primary/50"
                  onClick={handleUploadClick}
                >
                  <div className="mx-auto w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h4 className="text-sm font-medium mb-2">Upload Custom Picture</h4>
                  <p className="text-xs text-muted-foreground mb-4">
                    Upload a JPG, PNG, GIF, or WebP file. Maximum size 5MB.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Click here to choose a file
                  </p>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    onChange={handleCustomUpload}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Preview</h4>
                    <div className="p-4 border-2 border-dashed border-primary/25 rounded-lg bg-primary/5">
                      <Avatar className="h-24 w-24 mx-auto">
                        <AvatarImage src={previewImage} alt="Preview" />
                        <AvatarFallback>
                          <User className="h-8 w-8" />
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </div>
                  
                  <div className="flex justify-center space-x-2">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setPreviewImage(null);
                        setSelectedFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="flex items-center space-x-2"
                    >
                      <X className="h-4 w-4" />
                      <span>Choose Different</span>
                    </Button>
                    <Button
                      onClick={handleConfirmUpload}
                      disabled={isProcessing}
                      aria-busy={isProcessing}
                      className="flex items-center space-x-2"
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4" />
                          <span>Use This Picture</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
