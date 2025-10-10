"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { X, Check, AtSign as At } from "lucide-react";
import { cn } from "@/lib/utils";

interface MentionSuggestion {
  userId: string;
  username: string;
  displayName?: string;
  profilePicture?: string;
}

interface MessageEditProps {
  initialContent: string;
  onSave: (content: string, mentionedUserIds: string[]) => void;
  onCancel: () => void;
  conversationMembers: Array<{
    userId: string;
    user: {
      id: string;
      username: string;
      profile?: {
        displayName?: string;
        profilePicture?: string;
      };
    };
  }>;
  currentUserId: string;
  isUpdating?: boolean;
}

export function MessageEdit({
  initialContent,
  onSave,
  onCancel,
  conversationMembers,
  currentUserId,
  isUpdating = false,
}: MessageEditProps) {
  const [content, setContent] = useState(initialContent);
  const [mentionedUsers, setMentionedUsers] = useState<string[]>([]);
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionSuggestions, setMentionSuggestions] = useState<MentionSuggestion[]>([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus textarea on mount
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(content.length, content.length);
    }
  }, []);

  // Get available members for mentions (excluding current user)
  const availableMembers = conversationMembers
    .filter(member => member.userId !== currentUserId)
    .map(member => ({
      userId: member.userId,
      username: member.user.username,
      displayName: member.user.profile?.displayName,
      profilePicture: member.user.profile?.profilePicture,
    }));

  const handleContentChange = useCallback((value: string) => {
    setContent(value);

    // Check for @ mentions
    const cursorPosition = textareaRef.current?.selectionStart || 0;
    const textBeforeCursor = value.slice(0, cursorPosition);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

    if (mentionMatch) {
      const query = mentionMatch[1].toLowerCase();
      const filteredSuggestions = availableMembers.filter(member =>
        member.username.toLowerCase().includes(query) ||
        member.displayName?.toLowerCase().includes(query)
      );

      setMentionSuggestions(filteredSuggestions);
      setShowMentionSuggestions(filteredSuggestions.length > 0);
      setActiveSuggestionIndex(0);
    } else {
      setShowMentionSuggestions(false);
    }
  }, [availableMembers]);

  const insertMention = useCallback((user: MentionSuggestion) => {
    const cursorPosition = textareaRef.current?.selectionStart || 0;
    const textBeforeCursor = content.slice(0, cursorPosition);
    const textAfterCursor = content.slice(cursorPosition);
    
    // Find the @ symbol position
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
    if (!mentionMatch) return;

    const mentionStart = textBeforeCursor.lastIndexOf('@');
    const newContent = 
      content.slice(0, mentionStart) + 
      `@${user.username} ` + 
      textAfterCursor;

    setContent(newContent);
    setShowMentionSuggestions(false);

    // Add to mentioned users if not already included
    if (!mentionedUsers.includes(user.userId)) {
      setMentionedUsers(prev => [...prev, user.userId]);
    }

    // Focus back to textarea
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPosition = mentionStart + user.username.length + 2; // +2 for "@ "
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
      }
    }, 0);
  }, [content, mentionedUsers]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showMentionSuggestions) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveSuggestionIndex(prev => 
          prev < mentionSuggestions.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : mentionSuggestions.length - 1
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (mentionSuggestions[activeSuggestionIndex]) {
          insertMention(mentionSuggestions[activeSuggestionIndex]);
        }
      } else if (e.key === 'Escape') {
        setShowMentionSuggestions(false);
      }
    } else {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSave();
      } else if (e.key === 'Escape') {
        onCancel();
      }
    }
  };

  const handleSave = () => {
    if (!content.trim() || isUpdating) return;

    // Extract mentioned usernames from content and map to user IDs
    const mentionMatches = content.match(/@(\w+)/g) || [];
    const actualMentionedUserIds = mentionMatches
      .map(match => {
        const username = match.slice(1); // Remove @
        const user = availableMembers.find(member => member.username === username);
        return user?.userId;
      })
      .filter((userId): userId is string => Boolean(userId));

    onSave(content, actualMentionedUserIds);
  };

  const removeMentionedUser = (userId: string) => {
    setMentionedUsers(prev => prev.filter(id => id !== userId));
  };

  return (
    <div className="relative">
      {/* Mention Suggestions */}
      {showMentionSuggestions && mentionSuggestions.length > 0 && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-popover border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto z-50">
          {mentionSuggestions.map((user, index) => (
            <button
              key={user.userId}
              className={cn(
                "w-full flex items-center space-x-3 p-3 text-left hover:bg-accent transition-colors first:rounded-t-lg last:rounded-b-lg",
                index === activeSuggestionIndex && "bg-accent"
              )}
              onClick={() => insertMention(user)}
            >
              <Avatar className="h-6 w-6">
                <AvatarImage src={user.profilePicture} />
                <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                  {(user.displayName || user.username).charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-foreground">
                  {user.displayName || user.username}
                </div>
                {user.displayName && (
                  <div className="text-xs text-muted-foreground">
                    @{user.username}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Mentioned Users Pills */}
      {mentionedUsers.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {mentionedUsers.map(userId => {
            const user = availableMembers.find(m => m.userId === userId);
            if (!user) return null;
            
            return (
              <Badge
                key={userId}
                variant="secondary"
                className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary border-primary/20"
              >
                <At className="h-3 w-3" />
                {user.displayName || user.username}
                <button
                  onClick={() => removeMentionedUser(userId)}
                  className="ml-1 hover:bg-destructive/20 rounded-full p-0.5 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}

      {/* Edit Input */}
      <div className="flex flex-col space-y-2">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isUpdating}
          className="min-h-[60px] max-h-32 resize-none bg-muted/50 border-muted text-foreground placeholder:text-muted-foreground focus:bg-background"
          placeholder="Edit your message..."
          rows={2}
        />
        
        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            Press Enter to save • Escape to cancel
          </div>
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              disabled={isUpdating}
              className="h-7 px-2"
            >
              <X className="h-3 w-3 mr-1" />
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!content.trim() || isUpdating}
              className="h-7 px-2 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Check className="h-3 w-3 mr-1" />
              {isUpdating ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
