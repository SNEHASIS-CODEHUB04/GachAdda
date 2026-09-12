import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Card, CardBody } from "@/components/ui/card";
import Link from "next/link";
import { MessageCircle } from "lucide-react";

export const metadata: Metadata = { title: "Messages — GachAdda" };

export default async function SellerMessagesPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SELLER") redirect("/login");
  const userId = session.user.id;

  const conversations = await db.conversation.findMany({
    where: { participants: { some: { userId } } },
    orderBy: { updatedAt: "desc" },
    include: {
      participants: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary-dark">Messages</h1>
        <p className="text-sm text-[var(--color-sage)]">Your conversations with buyers</p>
      </div>

      {conversations.length === 0 ? (
        <Card>
          <CardBody className="text-center py-16">
            <MessageCircle className="h-12 w-12 text-[var(--color-sage)] mx-auto mb-3" />
            <p className="font-semibold text-primary-dark">No messages yet</p>
            <p className="text-sm text-[var(--color-sage)] mt-1">Buyers will message you when they are interested</p>
          </CardBody>
        </Card>
      ) : (
        <Card padding="none">
          <div className="divide-y divide-[var(--border)]">
            {conversations.map((conv) => {
              const other = conv.participants.find((p) => p.userId !== userId)?.user;
              const lastMsg = conv.messages[0];
              return (
                <Link
                  key={conv.id}
                  href={`/seller/messages/${conv.id}`}
                  className="flex items-center gap-3 p-4 hover:bg-cream/40 transition-colors"
                >
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold shrink-0">
                    {other?.name?.[0] ?? "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-primary-dark">{other?.name ?? "Unknown"}</p>
                    <p className="text-sm text-[var(--color-sage)] truncate">{lastMsg?.body ?? "No messages yet"}</p>
                  </div>
                  <p className="text-xs text-[var(--color-sage)] shrink-0">
                    {lastMsg ? new Date(lastMsg.createdAt).toLocaleDateString("en-IN") : ""}
                  </p>
                </Link>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
