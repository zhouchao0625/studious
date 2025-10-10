"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useChat } from "@/hooks/useChat";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MessageList, 
  MessageInput 
} from "@/components/chat";
import { 
  ArrowLeft, 
  Wand2
} from "lucide-react";



export default function AILabChatPage() {
  const params = useParams();
  const router = useRouter();
  const appState = useSelector((state: RootState) => state.app);
  
  const classId = params.id as string;
  const labChatId = params.chatId as string;

  // Initialize chat hook
  const chat = useChat(appState.user.id);

  // Fetch lab chat data
  const { data: labChat, isLoading: isLoadingLabChat } = trpc.labChat.get.useQuery({
    labChatId
  });

  // Send message mutation for lab chats (uses labChat.postToLabChat instead of regular message.send)
  const sendLabMessageMutation = trpc.labChat.postToLabChat.useMutation({
    onSuccess: () => {
      // Message will be updated via real-time events through useChat hook
    },
    onError: (error) => {
      toast.error('Failed to send message: ' + error.message);
    }
  });

  // Select the lab chat conversation when it loads
  useEffect(() => {
    if (labChat?.conversationId && labChat.conversationId !== chat.selectedConversationId) {
      chat.selectConversation(labChat.conversationId);
    }
  }, [labChat?.conversationId, chat.selectedConversationId, chat.selectConversation]);

  // Parse lab chat context
  const labContext = labChat ? (() => {
    try {
      return JSON.parse(labChat.context);
    } catch {
      return { topic: 'AI Lab', subject: 'General', difficulty: 'intermediate' };
    }
  })() : null;
  
  const [isGenerating, setIsGenerating] = useState(false);

  // Mock conversation members for the chat components
  const conversationMembers = [
    {
      userId: appState.user.id,
      user: {
        id: appState.user.id,
        username: appState.user.username || 'You',
        profile: {
          displayName: appState.user.displayName || undefined,
          profilePicture: appState.user.profilePicture || undefined
        }
      }
    },
    {
      userId: 'AI_ASSISTANT',
      user: {
        id: 'AI_ASSISTANT',
        username: 'AI Assistant',
        profile: {
          displayName: 'AI Assistant',
          profilePicture: "/ai-icon.svg"
        }
      }
    }
  ];

  const handleSendMessage = (content: string, mentionedUserIds: string[]) => {
    if (!content.trim() || !labChatId) return;

    // Use lab chat specific mutation instead of regular chat
    sendLabMessageMutation.mutate({
      labChatId,
      content,
      mentionedUserIds
    });
  };


  if (isLoadingLabChat) {
    return (
      <div className="h-screen bg-background flex flex-col overflow-hidden">
        <div className="px-6 py-3 border-b border-border bg-background flex-shrink-0">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => router.push(`/class/${classId}/ai-labs`)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to AI Labs
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-2">
            <div className="h-6 w-32 bg-muted rounded mx-auto" />
            <div className="h-4 w-24 bg-muted rounded mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  if (!labChat) {
    return (
      <div className="h-screen bg-background flex flex-col overflow-hidden">
        <div className="px-6 py-3 border-b border-border bg-background flex-shrink-0">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => router.push(`/class/${classId}/ai-labs`)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to AI Labs
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-2">
            <h2 className="text-lg font-semibold text-muted-foreground">Lab Chat Not Found</h2>
            <p className="text-sm text-muted-foreground">This AI Lab may have been deleted or you don't have access to it.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Back Button */}
      <div className="px-6 py-3 border-b border-border bg-background flex-shrink-0">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => router.push(`/class/${classId}/ai-labs`)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to AI Labs
        </Button>
      </div>

      {/* Chat Header */}
      <div className="px-6 py-4 border-b border-border bg-background flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">{labChat?.title || 'Loading...'}</h1>
            {labContext && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <Badge variant="outline">{labContext.topic}</Badge>
                <span>•</span>
                <Badge variant="outline">{labContext.subject}</Badge>
                <span>•</span>
                <Badge variant="outline">{labContext.difficulty}</Badge>
                {labContext.metadata?.gradeLevel && (
                  <>
                    <span>•</span>
                    <Badge variant="outline">Grade {labContext.metadata.gradeLevel}</Badge>
                  </>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button 
              onClick={() => setIsGenerating(!isGenerating)}
              disabled={isGenerating}
              className="bg-primary hover:bg-primary/90"
            >
              <Wand2 className="h-4 w-4 mr-2" />
              {isGenerating ? 'AI Thinking...' : 'Get AI Help'}
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <MessageList
        messages={chat.messages}
        currentUserId={appState.user.id}
        isLoading={chat.isLoadingMessages}
        hasNextPage={chat.hasMoreMessages}
        onLoadMore={chat.loadMoreMessages}
        conversationMembers={conversationMembers}
        onUpdateMessage={chat.updateMessage}
        onDeleteMessage={chat.deleteMessage}
        isUpdatingMessage={chat.isUpdatingMessage}
        isDeletingMessage={chat.isDeletingMessage}
      />

      {/* Message Input */}
      <div className="flex-shrink-0 border-t border-border">
        <MessageInput
          onSend={handleSendMessage}
          placeholder="Ask the AI assistant anything..."
          conversationMembers={conversationMembers}
          currentUserId={appState.user.id}
          disabled={sendLabMessageMutation.isPending || chat.isSendingMessage}
        />
      </div>
    </div>
  );
}
