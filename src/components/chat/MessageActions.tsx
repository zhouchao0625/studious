"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageActionsProps {
  messageId: string;
  currentUserId: string;
  senderId: string;
  onEdit: () => void;
  onDelete: (messageId: string) => void;
  isDeleting?: boolean;
}

export function MessageActions({
  messageId,
  currentUserId,
  senderId,
  onEdit,
  onDelete,
  isDeleting = false,
}: MessageActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Only show actions if the current user is the sender
  if (currentUserId !== senderId) {
    return null;
  }

  const handleDelete = () => {
    onDelete(messageId);
    setShowDeleteDialog(false);
    setDropdownOpen(false);
  };

  const handleEdit = () => {
    onEdit();
    setDropdownOpen(false);
  };

  return (
    <>
      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity",
              dropdownOpen && "opacity-100"
            )}
          >
            <MoreHorizontal className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={handleEdit} className="cursor-pointer">
            <Edit className="h-4 w-4 mr-2" />
            Edit message
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="cursor-pointer text-destructive focus:text-destructive"
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete message
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Message</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this message? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
