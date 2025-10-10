import { FileHandlers, FileItem } from "./types/file";

/**
 * Base file handler implementation with default no-op handlers
 * Can be extended or overridden as needed
 */
export const baseFileHandler: FileHandlers = {
  onFolderClick: (folderName: string) => {
    console.log("Folder clicked:", folderName);
  },

  onDownload: async (item: FileItem) => {
    if (item.type === "folder") {
      throw new Error("Cannot download folders directly");
    }
    
    try {
      // Fetch the file blob
      const response = await fetch(`/api/files/${item.id}/download`);
      if (!response.ok) throw new Error("Download failed");
      
      const blob = await response.blob();
      
      // Create a temporary URL and trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = item.name;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
      throw error;
    }
  },

  onShare: async (item: FileItem) => {
    try {
      // Generate shareable link
      const shareUrl = `${window.location.origin}/shared/${item.id}`;
      
      // Try to use native share API if available
      if (navigator.share) {
        await navigator.share({
          title: item.name,
          text: `Check out this ${item.type}: ${item.name}`,
          url: shareUrl,
        });
      } else {
        // Fallback: Copy to clipboard
        await navigator.clipboard.writeText(shareUrl);
        // You could show a toast notification here
        console.log("Share link copied to clipboard:", shareUrl);
      }
    } catch (error) {
      console.error("Share failed:", error);
      throw error;
    }
  },

  onRename: async (item: FileItem, newName: string, color?: string) => {
    console.log("Rename:", item.name, "to", newName, color ? `with color ${color}` : "");
    // TODO: Implement rename logic
  },

  onDelete: async (item: FileItem) => {
    console.log("Delete:", item.name);
    // TODO: Implement delete logic
  },

  onMove: async (draggedItemId: string, targetFolderId: string, draggedItemType: string) => {
    console.log("Move:", draggedItemId, "to", targetFolderId, `(${draggedItemType})`);
    // TODO: Implement move logic
  },

  onFileClick: (file: FileItem) => {
    console.log("File clicked:", file.name);
  },

  onStar: async (item: FileItem) => {
    console.log("Star:", item.name);
    // TODO: Implement star/favorite logic
  },

  onPreview: (file: FileItem) => {
    console.log("Preview:", file.name);
  },

  onRefresh: () => {
    console.log("Refresh requested");
    // TODO: Implement refresh logic
  },
};
