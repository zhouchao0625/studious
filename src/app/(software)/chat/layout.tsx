"use client";

import { useState } from "react";
import { useSelector } from "react-redux";
import { useRouter, usePathname } from "next/navigation";
import { RootState } from "@/store/store";
import { useChat } from "@/hooks/useChat";
import { ConversationList, CreateConversationModal } from "@/components/chat";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const appState = useSelector((state: RootState) => state.app);
  const user = appState.user;

  // Always call hooks - useChat handles the case when user is not logged in
  const {
    conversations,
    createConversation,
    isLoadingConversations,
  } = useChat(user.loggedIn ? user.id : "");

  const handleSelectConversation = (conversationId: string) => {
    router.push(`/chat/${conversationId}`);
  };

  // Extract conversation ID from pathname for highlighting
  const currentConversationId = pathname.startsWith('/chat/') && pathname !== '/chat' 
    ? pathname.split('/chat/')[1] 
    : null;

  if (!user.loggedIn) {
    return children; // Let individual pages handle auth
  }

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      {/* Conversation List Sidebar */}
      <div className="w-80 bg-sidebar-background border-r border-sidebar-border">
        <ConversationList
          conversations={conversations}
          selectedConversationId={currentConversationId || ''}
          onSelectConversation={handleSelectConversation}
          onCreateConversation={() => setShowCreateModal(true)}
          currentUserId={user.id}
          isLoading={isLoadingConversations}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-background">
        {children}
      </div>

      {/* Create Conversation Modal */}
      <CreateConversationModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onCreateConversation={createConversation}
        availableUsers={[]} // No user list for privacy
        isLoading={false}
      />
    </div>
  );
}
