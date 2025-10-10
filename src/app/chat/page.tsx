"use client";

import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { MessageSquare, LogIn } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

export default function Chat() {
  const appState = useSelector((state: RootState) => state.app);
  const user = appState.user;

  if (!user.loggedIn) {
    return (
      <div className="h-full bg-background flex items-center justify-center">
        <EmptyState
          icon={LogIn}
          title="Please sign in"
          description="You need to be signed in to access chat."
        />
      </div>
    );
  }

  // Welcome screen when no conversation is selected
  return (
    <div className="h-full bg-background flex items-center justify-center">
      <EmptyState
        icon={MessageSquare}
        title="Welcome to Chat"
        description="Select a conversation from the sidebar to start chatting."
      />
    </div>
  );
}