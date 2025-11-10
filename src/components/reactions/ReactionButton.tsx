"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ReactionPicker } from "./ReactionPicker";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type ReactionType = 'THUMBSUP' | 'CELEBRATE' | 'CARE' | 'HEART' | 'IDEA' | 'HAPPY';

export const REACTION_EMOJIS: Record<ReactionType, string> = {
  THUMBSUP: '👍',
  CELEBRATE: '🎉',
  CARE: '🤗',
  HEART: '❤️',
  IDEA: '💡',
  HAPPY: '😄',
};

export const REACTION_LABELS: Record<ReactionType, string> = {
  THUMBSUP: 'Like',
  CELEBRATE: 'Celebrate',
  CARE: 'Care',
  HEART: 'Love',
  IDEA: 'Insightful',
  HAPPY: 'Funny',
};

interface ReactionButtonProps {
  announcementId?: string;
  commentId?: string;
  classId: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'compact';
}

export function ReactionButton({
  announcementId,
  commentId,
  classId,
  size = 'md',
  variant = 'default',
}: ReactionButtonProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isHoldingRef = useRef(false);

  // Get reactions
  const { data: reactionData, refetch } = trpc.announcement.getReactions.useQuery(
    {
      announcementId,
      commentId,
      classId,
    },
    {
      enabled: !!(announcementId || commentId),
    }
  );

  // Add/Update reaction mutation
  const addReaction = trpc.announcement.addReaction.useMutation({
    onSuccess: () => {
      refetch();
    },
    onError: (error) => {
      console.error("Failed to add reaction:", error);
    },
  });

  // Remove reaction mutation
  const removeReaction = trpc.announcement.removeReaction.useMutation({
    onSuccess: () => {
      refetch();
    },
    onError: (error) => {
      console.error("Failed to remove reaction:", error);
    },
  });

  const handleClick = () => {
    if (isHoldingRef.current) {
      isHoldingRef.current = false;
      return;
    }

    if (reactionData?.userReaction) {
      // If user has a reaction, remove it
      removeReaction.mutate({
        announcementId,
        commentId,
      });
    } else {
      // Add default reaction (THUMBSUP)
      addReaction.mutate({
        announcementId,
        commentId,
        classId,
        type: 'THUMBSUP',
      });
    }
  };

  const handleMouseDown = () => {
    holdTimerRef.current = setTimeout(() => {
      isHoldingRef.current = true;
      setIsPickerOpen(true);
    }, 300); // 300ms hold time
  };

  const handleMouseUp = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  };

  const handleMouseLeave = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    isHoldingRef.current = false;
  };

  useEffect(() => {
    return () => {
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
      }
    };
  }, []);

  const handleSelectReaction = (type: ReactionType) => {
    if (reactionData?.userReaction === type) {
      // Remove if clicking same reaction
      removeReaction.mutate({
        announcementId,
        commentId,
      });
    } else {
      // Add/update reaction
      addReaction.mutate({
        announcementId,
        commentId,
        classId,
        type,
      });
    }
    setIsPickerOpen(false);
    isHoldingRef.current = false;
  };

  const isLoading = addReaction.isPending || removeReaction.isPending;
  const userReaction = reactionData?.userReaction;
  const total = reactionData?.total || 0;
  const hasReaction = !!userReaction;

  const buttonSize = size === 'sm' ? 'h-7 px-2 text-xs' : size === 'lg' ? 'h-10 px-4' : 'h-8 px-3 text-sm';
  const emojiSize = size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-lg' : 'text-base';

  return (
    <Popover open={isPickerOpen} onOpenChange={setIsPickerOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            buttonSize,
            "gap-1.5 rounded-full transition-colors",
            hasReaction && "bg-primary/10 hover:bg-primary/20 text-primary"
          )}
          onClick={handleClick}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <>
              <span className={emojiSize}>
                {userReaction ? REACTION_EMOJIS[userReaction] : '👍'}
              </span>
              {total > 0 && (
                <span className="text-xs font-medium">{total}</span>
              )}
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        className="w-auto p-2"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <ReactionPicker
          currentReaction={userReaction || null}
          onSelect={handleSelectReaction}
        />
      </PopoverContent>
    </Popover>
  );
}

