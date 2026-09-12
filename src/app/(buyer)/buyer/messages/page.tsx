import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { ConversationList } from "@/components/chat/conversation-list";

export const metadata: Metadata = { title: "Messages" };

export default async function BuyerMessagesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const conversations = await db.conversation.findMany({
    where: { participants: { some: { userId: session.user.id } } },
    orderBy: { updatedAt: "desc" },
    include: {
      participants: {
        include: { user: { select: { id: true, name: true, avatarUrl: true, role: true } } },
      },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-primary-dark">Messages 💬</h1>
      <ConversationList conversations={conversations} currentUserId={session.user.id} />
    </div>
  );
}
