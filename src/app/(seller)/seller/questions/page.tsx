import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Card, CardBody } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { MessageSquare } from "lucide-react";
import { AnswerForm } from "./_components/answer-form";

export const metadata: Metadata = { title: "Product Questions — GachAdda" };

export default async function SellerQuestionsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SELLER") redirect("/login");
  const sellerId = session.user.id;

  const { filter } = await searchParams;
  const unansweredOnly = filter === "unanswered";

  const questions = await db.productQuestion.findMany({
    where: {
      sellerId,
      ...(unansweredOnly ? { answer: null } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      buyer:   { select: { name: true } },
      product: { select: { name: true, slug: true } },
    },
  });

  const unansweredCount = questions.filter((q) => !q.answer).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary-dark flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" />
            Product Questions
          </h1>
          <p className="text-sm text-[var(--color-sage)]">
            {unansweredCount} unanswered · {questions.length} total
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href="/seller/questions"
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              !unansweredOnly
                ? "bg-primary text-white"
                : "bg-cream text-[var(--color-sage)] hover:text-primary"
            }`}
          >
            All
          </a>
          <a
            href="/seller/questions?filter=unanswered"
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              unansweredOnly
                ? "bg-primary text-white"
                : "bg-cream text-[var(--color-sage)] hover:text-primary"
            }`}
          >
            Unanswered {unansweredCount > 0 && `(${unansweredCount})`}
          </a>
        </div>
      </div>

      {questions.length === 0 ? (
        <Card>
          <CardBody className="text-center py-16">
            <MessageSquare className="h-12 w-12 text-[var(--color-sage)] mx-auto mb-3" />
            <p className="font-semibold text-primary-dark">No questions yet</p>
            <p className="text-sm text-[var(--color-sage)] mt-1">
              Questions from buyers will appear here
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {questions.map((q) => (
            <Card key={q.id}>
              <CardBody className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-xs text-primary font-medium mb-1">{q.product.name}</p>
                    <div className="flex items-start gap-2">
                      <span className="text-primary font-bold text-base leading-none shrink-0">Q</span>
                      <p className="text-sm font-medium text-primary-dark">{q.question}</p>
                    </div>
                    <p className="text-xs text-[var(--color-sage)] mt-1">
                      from {q.buyer.name} · {formatDate(q.createdAt)}
                    </p>
                  </div>
                  {!q.answer && (
                    <span className="text-xs bg-warning/10 text-warning px-2 py-0.5 rounded-full shrink-0 font-medium">
                      Unanswered
                    </span>
                  )}
                </div>

                {q.answer ? (
                  <div className="flex items-start gap-2 pl-4 border-l-2 border-success/40">
                    <span className="text-success font-bold text-base leading-none shrink-0">A</span>
                    <div>
                      <p className="text-sm text-primary-dark">{q.answer}</p>
                      <p className="text-xs text-[var(--color-sage)] mt-0.5">
                        Answered {q.answeredAt ? formatDate(q.answeredAt) : ""}
                      </p>
                    </div>
                  </div>
                ) : (
                  <AnswerForm questionId={q.id} />
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
