"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { MessageSquare } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Question {
  id: string;
  question: string;
  answer: string | null;
  answeredAt: string | null;
  createdAt: string;
  buyer: { name: string };
}

interface AskQuestionProps {
  productId: string;
  productSlug: string;
  sellerId?: string;
  initialQuestions: Question[];
}

export function AskQuestion({ productId, productSlug, initialQuestions }: AskQuestionProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { success, error: showError } = useToast();
  const [questions, setQuestions] = useState(initialQuestions);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    if (!session?.user) { router.push(`/login?callbackUrl=/products/${productSlug}`); return; }
    setLoading(true);
    const res = await fetch("/api/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, question: text.trim() }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { showError(data.error ?? "Failed to submit"); return; }
    success("Question sent! Seller will be notified 🌿");
    setQuestions((prev) => [{ ...data.question, buyer: { name: session!.user.name } }, ...prev]);
    setText("");
    setShowForm(false);
  }

  return (
    <section className="mt-10" aria-labelledby="qa-heading">
      <div className="flex items-center justify-between mb-5">
        <h2 id="qa-heading" className="text-xl font-bold text-primary-dark flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          Questions & Answers
          {questions.length > 0 && <span className="text-base font-normal text-[var(--color-sage)]">({questions.length})</span>}
        </h2>
        {session?.user?.role === "BUYER" && (
          <Button size="sm" variant="outline" onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Cancel" : "Ask a Question"}
          </Button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 bg-cream/50 rounded-xl p-4 space-y-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ask about size, care, availability, colour…"
            rows={3}
            className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            maxLength={500}
            required
          />
          <div className="flex gap-2 justify-end">
            <Button type="submit" size="sm" loading={loading}>Send Question</Button>
          </div>
        </form>
      )}

      {!session?.user && (
        <p className="text-sm text-center text-[var(--color-sage)] mb-5 bg-cream/50 rounded-lg p-3">
          <a href={`/login?callbackUrl=/products/${productSlug}`} className="text-primary font-medium hover:underline">Sign in</a> to ask a question
        </p>
      )}

      {questions.length === 0 ? (
        <p className="text-center py-8 text-[var(--color-sage)]">No questions yet. Be the first to ask!</p>
      ) : (
        <div className="space-y-4">
          {questions.map((q) => (
            <div key={q.id} className="bg-white rounded-xl border border-[var(--border)] shadow-card p-4">
              <div className="flex items-start gap-2 mb-2">
                <span className="text-primary font-bold text-lg leading-none shrink-0">Q</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-primary-dark">{q.question}</p>
                  <p className="text-xs text-[var(--color-sage)] mt-0.5">{q.buyer.name} · {formatDate(new Date(q.createdAt))}</p>
                </div>
              </div>
              {q.answer ? (
                <div className="flex items-start gap-2 mt-3 pl-4 border-l-2 border-primary/30">
                  <span className="text-success font-bold text-lg leading-none shrink-0">A</span>
                  <div>
                    <p className="text-sm text-primary-dark">{q.answer}</p>
                    <p className="text-xs text-[var(--color-sage)] mt-0.5">Seller · {q.answeredAt ? formatDate(new Date(q.answeredAt)) : ""}</p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[var(--color-sage)] mt-2 pl-4 italic">Awaiting seller response…</p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
