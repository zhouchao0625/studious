import Pusher from 'pusher-js';

// Initialize Pusher client
const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY || '', {
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'us2',
  // encrypted: true,
});

// Chat event types
export interface NewMessageEvent {
  id: string;
  content: string;
  senderId: string;
  conversationId: string;
  createdAt: Date;
  sender: {
    id: string;
    username: string;
    profile?: {
      displayName?: string;
      profilePicture?: string;
    };
  };
  mentionedUserIds: string[];
}

export interface ConversationViewedEvent {
  userId: string;
  viewedAt: Date;
}

export interface MentionsViewedEvent {
  userId: string;
  viewedAt: Date;
}

export interface MessageUpdatedEvent {
  id: string;
  content: string;
  senderId: string;
  conversationId: string;
  createdAt: Date;
  sender: {
    id: string;
    username: string;
    profile?: {
      displayName?: string;
      profilePicture?: string;
    };
  };
  mentionedUserIds: string[];
}

export interface MessageDeletedEvent {
  messageId: string;
  conversationId: string;
  senderId: string;
}

// Channel subscription helper
export const subscribeToConversation = (conversationId: string) => {
  return pusher.subscribe(`conversation-${conversationId}`);
};

// Unsubscribe helper
export const unsubscribeFromConversation = (conversationId: string) => {
  pusher.unsubscribe(`conversation-${conversationId}`);
};

// Event binding helpers
export const bindNewMessage = (
  channel: any,
  callback: (data: NewMessageEvent) => void
) => {
  channel.bind('new-message', callback);
};

export const bindConversationViewed = (
  channel: any,
  callback: (data: ConversationViewedEvent) => void
) => {
  channel.bind('conversation-viewed', callback);
};

export const bindMentionsViewed = (
  channel: any,
  callback: (data: MentionsViewedEvent) => void
) => {
  channel.bind('mentions-viewed', callback);
};

export const bindMessageUpdated = (
  channel: any,
  callback: (data: MessageUpdatedEvent) => void
) => {
  channel.bind('message-updated', callback);
};

export const bindMessageDeleted = (
  channel: any,
  callback: (data: MessageDeletedEvent) => void
) => {
  channel.bind('message-deleted', callback);
};

// Cleanup helper
export const unbindAllEvents = (channel: any) => {
  channel.unbind_all();
};

export default pusher;
