"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Plus, Search, MessageSquare, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConversationListOutput } from "@/lib/trpc";
import { ConversationListSkeleton } from "./ChatSkeletons";
import { EmptyState } from "@/components/ui/empty-state";

type Conversation = ConversationListOutput[number];

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversationId?: string;
  onSelectConversation: (conversationId: string) => void;
  onCreateConversation: () => void;
  currentUserId: string;
  isLoading?: boolean;
}

const getConversationDisplayName = (conversation: Conversation, currentUserId: string): string => {
  if (conversation.type === 'GROUP') {
    return conversation.name || 'Unnamed Group';
  }
  
  // For DMs, find the other user
  const otherMember = conversation.members.find(member => member.userId !== currentUserId);
  return otherMember?.user.profile?.displayName || otherMember?.user.username || 'Unknown User';
};

const getConversationAvatar = (conversation: Conversation, currentUserId: string): string => {
  if (conversation.type === 'GROUP') {
    return conversation.name?.charAt(0).toUpperCase() || 'G';
  }
  
  const otherMember = conversation.members.find(member => member.userId !== currentUserId);
  return otherMember?.user.profile?.displayName?.charAt(0).toUpperCase() || 
         otherMember?.user.username.charAt(0).toUpperCase() || 'U';
};

const formatLastMessageTime = (date: Date): string => {
  const now = new Date();
  const messageDate = new Date(date);
  const diffInMinutes = Math.floor((now.getTime() - messageDate.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'now';
  if (diffInMinutes < 60) return `${diffInMinutes}m`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d`;
  
  return messageDate.toLocaleDateString();
};

export function ConversationList({
  conversations,
  selectedConversationId,
  onSelectConversation,
  onCreateConversation,
  currentUserId,
  isLoading = false,
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredConversations = conversations.filter(conversation => {
    const displayName = getConversationDisplayName(conversation, currentUserId);
    return displayName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (isLoading) {
    return <ConversationListSkeleton />;
  }

  return (
    <div className="h-screen flex flex-col bg-background w-full">
      {/* Header */}
      <div className="px-2 py-3 border-b border-border/40">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-medium text-sm text-foreground/90 px-2">Direct Messages</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCreateConversation}
            className="h-6 w-6 p-0 hover:bg-accent/50"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
        
        {/* Search */}
        <div className="relative px-2">
          <Input
            placeholder="Find or start a conversation"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-7 text-xs bg-background border-border/40 placeholder:text-muted-foreground/60"
          />
          <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground/40" />
        </div>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1">

        <div className="px-2 py-1 w-full">
          {filteredConversations.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title={searchQuery ? 'No conversations found' : 'No conversations yet'}
              description={searchQuery ? 'Try different search terms' : 'Start chatting with someone'}
              className="py-8"
            />
          ) : (
            filteredConversations.map((conversation) => {
              const displayName = getConversationDisplayName(conversation, currentUserId);
              const avatarText = getConversationAvatar(conversation, currentUserId);
              const isSelected = selectedConversationId === conversation.id;
              
              return (
                <div
                  key={conversation.id}
                  className={cn(
                    "flex items-center px-2 py-1 mx-1 rounded cursor-pointer group transition-colors duration-75 overflow-hidden",
                    isSelected 
                      ? "bg-accent/60 text-foreground" 
                      : "hover:bg-accent/30 text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => onSelectConversation(conversation.id)}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="relative flex-shrink-0">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={conversation.type === 'DM' ? 
                          conversation.members.find(m => m.userId !== currentUserId)?.user.profile?.profilePicture 
                          : `https://api.dicebear.com/7.x/avataaars/svg?seed=${conversation.members.find(m => m.userId !== currentUserId)?.user.username}`
                        } />
                        <AvatarFallback className={cn(
                          "text-xs font-medium",
                          conversation.type === 'GROUP' ? "bg-primary/10 text-primary" : "bg-muted/50 text-muted-foreground"
                        )}>
                          {conversation.type === 'GROUP' ? (
                            <Users className="h-3.5 w-3.5" />
                          ) : (
                            avatarText
                          )}
                        </AvatarFallback>
                      </Avatar>
                      {conversation.unreadCount > 0 && (
                        <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-destructive rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-destructive-foreground">
                            {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0 max-w-full overflow-hidden">
                      <div className="flex items-center justify-between gap-2">
                        <span className={cn(
                          "text-sm font-medium truncate flex-1 min-w-0",
                          conversation.unreadCount > 0 && "text-foreground font-semibold"
                        )}>
                          {displayName}
                        </span>
                        {conversation.lastMessage && (
                          <span className="text-xs text-muted-foreground/60 flex-shrink-0">
                            {formatLastMessageTime(conversation.lastMessage.createdAt)}
                          </span>
                        )}
                      </div>
                      
                      {conversation.lastMessage && (
                        <p className="text-xs text-muted-foreground/80 truncate mt-0.5 overflow-hidden">
                          {conversation.lastMessage.content}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
