"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Smile, AtSign as At, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface MentionSuggestion {
  userId: string;
  username: string;
  displayName?: string;
  profilePicture?: string;
}

interface MessageInputProps {
  onSend: (content: string, mentionedUserIds: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
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
}

export function MessageInput({
  onSend,
  placeholder = "Type a message...",
  disabled = false,
  conversationMembers,
  currentUserId,
}: MessageInputProps) {
  const [content, setContent] = useState("");
  const [mentionedUsers, setMentionedUsers] = useState<string[]>([]);
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionSuggestions, setMentionSuggestions] = useState<MentionSuggestion[]>([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (!content.trim() || disabled) return;

    // Extract mentioned usernames from content and map to user IDs
    const mentionMatches = content.match(/@(\w+)/g) || [];
    const actualMentionedUserIds = mentionMatches
      .map(match => {
        const username = match.slice(1); // Remove @
        const user = availableMembers.find(member => member.username === username);
        return user?.userId;
      })
      .filter((userId): userId is string => Boolean(userId));

    onSend(content, actualMentionedUserIds);
    setContent("");
    setMentionedUsers([]);
    setShowMentionSuggestions(false);
  };

  const removeMentionedUser = (userId: string) => {
    setMentionedUsers(prev => prev.filter(id => id !== userId));
  };

  return (
    <div className="p-4 border-t border-border bg-background relative">
      {/* Mention Suggestions */}
      {showMentionSuggestions && mentionSuggestions.length > 0 && (
        <div className="absolute bottom-full left-4 right-4 mb-2 bg-popover border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto z-50">
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
        <div className="flex flex-wrap gap-2 mb-3">
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

      {/* Input Area */}
      <div className="flex space-x-3">
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            placeholder={placeholder}
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            className="min-h-[44px] max-h-32 resize-none pr-20 bg-muted/50 border-muted text-foreground placeholder:text-muted-foreground focus:bg-background"
            rows={1}
          />
          <div className="absolute right-3 bottom-2 flex space-x-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/80"
              disabled={disabled}
            >
              <Smile className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              className="h-7 px-3 bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={handleSend}
              disabled={!content.trim() || disabled}
            >
              <Send className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
