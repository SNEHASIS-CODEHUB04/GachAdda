"use client";

import Link from "next/link";
import Image from "next/image";
import { MessageCircle } from "lucide-react";
import { timeAgo } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";

interface ConversationListProps {
  conversations: {
    id: string;
    updatedAt: Date;
    participants: {
      user: { id: string; name: string; avatarUrl: string | null; role: string };
    }[];
    messages: { body: string; senderId: string; createdAt: Date }[];
  }[];
  currentUserId: string;
}

export function ConversationList({ conversations, currentUserId }: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <EmptyState
        icon={<MessageCircle className="h-12 w-12 text-[var(--color-sage)]" />}
        title="Your plant conversations will appear here."
        description="Chat with sellers about products, requests, or orders."
      />
    );
  }

  return (
    <div className="space-y-2">
      {conversations.map((conv) => {
        const other = conv.participants.find((p) => p.user.id !== currentUserId)?.user;
        if (!other) return null;
        const lastMsg = conv.messages[0];
        const isMyMsg = lastMsg?.senderId === currentUserId;

        return (
          <Link
            key={conv.id}
            href={`/buyer/messages/${conv.id}`}
            className="flex items-center gap-3 bg-white rounded-xl shadow-card border border-[var(--border)] p-4 hover:shadow-card-md transition-shadow"
          >
            <div className="relative h-12 w-12 rounded-full bg-primary flex items-center justify-center text-white font-bold text-lg overflow-hidden flex-shrink-0">
              {other.avatarUrl ? (
                <Image src={other.avatarUrl} alt={other.name} fill sizes="48px" className="object-cover" />
              ) : other.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-primary-dark text-sm">{other.name}</p>
                {lastMsg && <p className="text-xs text-[var(--color-sage)]">{timeAgo(lastMsg.createdAt)}</p>}
              </div>
              {lastMsg && (
                <p className="text-xs text-[var(--color-sage)] truncate mt-0.5">
                  {isMyMsg ? "You: " : ""}{lastMsg.body}
                </p>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
