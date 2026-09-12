"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Send } from "lucide-react";
import Link from "next/link";

interface Message {
  id: string;
  body: string;
  senderId: string;
  createdAt: string;
  sender: { id: string; name: string };
}

export default function BuyerChatPage() {
  const { data: session } = useSession();
  const params = useParams();
  const conversationId = params.id as string;
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [otherName, setOtherName] = useState("Seller");
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async () => {
    const r = await fetch(`/api/conversations/${conversationId}/messages`);
    if (r.ok) { const d = await r.json(); setMessages(d.messages ?? []); }
  }, [conversationId]);

  useEffect(() => {
    fetchMessages();
    // Get other person's name
    fetch("/api/conversations").then((r) => r.json()).then((d) => {
      const conv = (d.conversations ?? []).find((c: { id: string; participants: { user: { id: string; name: string } }[] }) => c.id === conversationId);
      if (conv && session?.user) {
        const other = conv.participants.find((p: { user: { id: string; name: string } }) => p.user.id !== session.user.id);
        if (other) setOtherName(other.user.name);
      }
    });
    // Poll every 4 seconds
    const t = setInterval(fetchMessages, 4000);
    return () => clearInterval(t);
  }, [conversationId, session?.user?.id, fetchMessages]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    const res = await fetch(`/api/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: text.trim() }),
    });
    const data = await res.json();
    setSending(false);
    if (res.ok) { setMessages((prev) => [...prev, data.message]); setText(""); }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-[var(--border)] mb-2 shrink-0">
        <Link href="/buyer/messages" className="text-[var(--color-sage)] hover:text-primary p-1">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm shrink-0">
          {otherName[0]}
        </div>
        <div>
          <p className="font-semibold text-primary-dark">{otherName}</p>
          <p className="text-xs text-[var(--color-sage)]">GachAdda Seller</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 py-2 pr-1">
        {messages.length === 0 && (
          <p className="text-center text-sm text-[var(--color-sage)] py-12">No messages yet. Say hello! 👋</p>
        )}
        {messages.map((msg) => {
          const isMe = msg.senderId === session?.user?.id;
          return (
            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                isMe ? "bg-primary text-white rounded-br-sm" : "bg-white border border-[var(--border)] text-primary-dark rounded-bl-sm"
              }`}>
                <p className="leading-relaxed">{msg.body}</p>
                <p className={`text-[10px] mt-1 ${isMe ? "text-white/60 text-right" : "text-[var(--color-sage)]"}`}>
                  {new Date(msg.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex gap-2 pt-3 border-t border-[var(--border)] mt-2 shrink-0">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message…"
          className="flex-1 border border-[var(--border)] rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
          disabled={sending}
          autoFocus
        />
        <Button type="submit" size="icon" disabled={!text.trim() || sending} aria-label="Send">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
