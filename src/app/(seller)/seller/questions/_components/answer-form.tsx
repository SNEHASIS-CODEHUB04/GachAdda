"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";

export function AnswerForm({ questionId }: { questionId: string }) {
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { success, error: showError } = useToast();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!answer.trim()) return;
    setLoading(true);
    const res = await fetch("/api/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId, answer: answer.trim() }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      showError(data.error ?? "Failed to send answer");
      return;
    }
    success("Answer sent! Buyer has been notified 🌿");
    setSubmitted(true);
    router.refresh();
  }

  if (submitted) {
    return <p className="text-sm text-success pl-4">✓ Answer sent</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mt-1">
      <input
        type="text"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Type your answer..."
        className="flex-1 border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        required
      />
      <Button type="submit" size="sm" loading={loading}>
        Send Answer
      </Button>
    </form>
  );
}
