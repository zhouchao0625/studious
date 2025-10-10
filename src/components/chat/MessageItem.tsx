"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { MessageListOutput } from "@/lib/trpc";
import { MessageActions } from "./MessageActions";
import { MessageEdit } from "./MessageEdit";
import { AIMarkdown } from "./AIMarkdown";
import { Sparkles } from "lucide-react";
import Image from "next/image";

type Message = MessageListOutput['messages'][number];

interface MessageItemProps {
  message: Message;
  currentUserId: string;
  showAvatar?: boolean;
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
  onUpdateMessage?: (messageId: string, content: string, mentionedUserIds: string[]) => void;
  onDeleteMessage?: (messageId: string) => void;
  isUpdatingMessage?: boolean;
  isDeletingMessage?: boolean;
}

const formatMessageTime = (date: Date): string => {
  const now = new Date();
  const messageDate = new Date(date);
  const isToday = messageDate.toDateString() === now.toDateString();
  
  if (isToday) {
    return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  const isThisWeek = (now.getTime() - messageDate.getTime()) < (7 * 24 * 60 * 60 * 1000);
  if (isThisWeek) {
    return messageDate.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
  }
  
  return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const renderMessageContent = (content: string, mentions: Message['mentions']) => {
  if (!mentions || mentions.length === 0) {
    return content;
  }

  let renderedContent = content;
  
  // Replace @mentions with styled spans
  mentions.forEach(mention => {
    const mentionText = `@${mention.user.username}`;
    const displayName = mention.user.profile?.displayName || mention.user.username;
    
    renderedContent = renderedContent.replace(
      new RegExp(mentionText, 'g'),
      `<span class="bg-primary/20 hover:bg-primary/30 text-primary cursor-pointer px-1.5 py-0.5 rounded font-medium">@${displayName}</span>`
    );
  });

  return <span dangerouslySetInnerHTML={{ __html: renderedContent }} />;
};

export function MessageItem({
  message,
  currentUserId,
  showAvatar = true,
  conversationMembers,
  onUpdateMessage,
  onDeleteMessage,
  isUpdatingMessage = false,
  isDeletingMessage = false,
}: MessageItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const isMentioned = message.mentionsMe;
  const isAIAssistant = message.senderId === 'AI_ASSISTANT';
  
  const senderDisplayName = message.sender.profile?.displayName || message.sender.username;
  const senderAvatar = message.sender.profile?.profilePicture || "";

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSaveEdit = (content: string, mentionedUserIds: string[]) => {
    if (onUpdateMessage) {
      onUpdateMessage(message.id, content, mentionedUserIds);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleDelete = (messageId: string) => {
    if (onDeleteMessage) {
      onDeleteMessage(messageId);
    }
  };

  return (
    <div
      className={cn(
        "flex space-x-3 group relative hover:bg-muted px-4 py-1 transition-colors",
        isMentioned && "bg-yellow-500/10 hover:bg-yellow-500/20 border-l-2 border-yellow-500",
        isAIAssistant && "bg-primary/5 hover:bg-primary/10 border-l-2 border-primary/30",
      )}
    >
      {/* Avatar */}
      <Avatar className={`h-10 w-10 flex-shrink-0 mt-0.5 ${!showAvatar && "opacity-0 h-0"}`}>
        <AvatarImage src={senderAvatar} />
        <AvatarFallback className={cn(
          "text-sm",
          isAIAssistant 
            ? "bg-primary text-primary-foreground" 
            : "bg-secondary text-secondary-foreground"
        )}>
          {isAIAssistant ? (
            <Image
              src="/ai-icon.svg"
              alt="AI Assistant"
              width={20}
              height={20}
              className="h-5 w-5"
            />
          ) : (
            senderDisplayName.charAt(0).toUpperCase()
          )}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        {/* Message Header */}
        {showAvatar && (
          <div className="flex items-baseline space-x-2 mb-0.5">
            <span className={cn(
              "font-semibold text-sm hover:underline cursor-pointer",
              isAIAssistant ? "text-primary" : "text-foreground"
            )}>
              {senderDisplayName}
            </span>
            {isAIAssistant && (
              <Badge variant="outline" className="text-xs h-4 px-1 bg-primary/10 text-primary border-primary/20">
                <Sparkles className="h-2 w-2 mr-1" />
                AI
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {formatMessageTime(new Date(message.createdAt))}
            </span>
            {isMentioned && (
              <Badge variant="secondary" className="text-xs h-4 px-1 bg-yellow-500/20 text-yellow-700 border-yellow-500/30">
                mentioned you
              </Badge>
            )}
          </div>
        )}
        
        {/* Message Content */}
        {isEditing && !isAIAssistant ? (
          <MessageEdit
            initialContent={message.content}
            onSave={handleSaveEdit}
            onCancel={handleCancelEdit}
            conversationMembers={conversationMembers}
            currentUserId={currentUserId}
            isUpdating={isUpdatingMessage}
          />
        ) : (
          <div className="flex items-start justify-between w-full">
            <div className={cn(
              "text-sm leading-relaxed text-foreground flex-1 min-w-0 pr-2",
            )}>
              {isAIAssistant ? (
                <AIMarkdown content={message.content} />
              ) : (
                renderMessageContent(message.content, message.mentions)
              )}
            </div>
            
            {/* Message Actions and Timestamp */}
            <div className="flex items-center space-x-1 flex-shrink-0">
              {/* Timestamp for grouped messages */}
              {!showAvatar && (
                <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                  {formatMessageTime(new Date(message.createdAt))}
                </span>
              )}
              
              {/* Message Actions */}
              {!isAIAssistant && (
                <MessageActions
                  messageId={message.id}
                  currentUserId={currentUserId}
                  senderId={message.senderId}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  isDeleting={isDeletingMessage}
                />
              )}
            </div>
          </div>
        )}
        
        {/* Mentions List (if any) @note: i don't think this is necessary */}
        {/* {message.mentions && message.mentions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {message.mentions.map((mention) => (
              <Badge
                key={mention.user.id}
                variant="outline"
                className="text-xs h-4 px-1 bg-primary/10 text-primary border-primary/20"
              >
                @{mention.user.profile?.displayName || mention.user.username}
              </Badge>
            ))}
          </div>
        )} */}
      </div>
      
    </div>
  );
}
