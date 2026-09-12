import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { Heart, MessageCircle, Share2, Plus } from "lucide-react";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { timeAgo } from "@/lib/utils";
import { auth } from "@/lib/auth";
import { PAGINATION } from "@/lib/constants";

export const metadata: Metadata = { title: "Community Feed — Plant lovers unite 🌿" };

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageStr } = await searchParams;
  const page  = Math.max(1, parseInt(pageStr ?? "1", 10));
  const limit = 12;
  const skip  = (page - 1) * limit;

  const session = await auth();

  const [posts, total] = await Promise.all([
    db.post.findMany({
      where: { isRemoved: false },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        author: { select: { id: true, name: true, avatarUrl: true, role: true } },
        _count: { select: { likes: true, comments: true } },
      },
    }),
    db.post.count({ where: { isRemoved: false } }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="py-8">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-primary-dark">Community 🌿</h1>
            <p className="text-[var(--color-sage)] mt-1">Share your plant journey with the world</p>
          </div>
          {session?.user ? (
            <Link href="/buyer/community/create">
              <Button leftIcon={<Plus className="h-4 w-4" />}>New Post</Button>
            </Link>
          ) : (
            <Link href="/register">
              <Button>Join to Post</Button>
            </Link>
          )}
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4" aria-hidden="true">🌱</p>
            <h2 className="text-xl font-semibold text-primary-dark">No posts yet</h2>
            <p className="text-[var(--color-sage)] mt-2">Be the first to share your plant story!</p>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
            {posts.map((post) => (
              <article key={post.id} className="break-inside-avoid bg-white rounded-2xl shadow-card border border-[var(--border)] overflow-hidden">
                {post.imageUrl && (
                  <div className="relative w-full">
                    <Image
                      src={post.imageUrl}
                      alt={post.caption.slice(0, 60)}
                      width={800}
                      height={600}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="w-full h-auto object-cover"
                      loading="lazy"
                    />
                  </div>
                )}
                <div className="p-4">
                  {/* Author */}
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold overflow-hidden">
                      {post.author.avatarUrl ? (
                        <Image src={post.author.avatarUrl} alt={post.author.name} width={32} height={32} className="object-cover" />
                      ) : post.author.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-primary-dark">{post.author.name}</p>
                      <p className="text-xs text-[var(--color-sage)]">{timeAgo(post.createdAt)}</p>
                    </div>
                    {post.author.role === "SELLER" && (
                      <span className="ml-auto text-xs bg-earth/10 text-earth rounded-full px-2 py-0.5">Seller</span>
                    )}
                  </div>

                  <p className="text-sm text-primary-dark leading-relaxed line-clamp-3">{post.caption}</p>

                  {(post.plantTag || post.categoryTag) && (
                    <div className="flex gap-1.5 mt-2">
                      {post.plantTag && <span className="text-xs text-primary bg-primary/10 rounded-full px-2 py-0.5">🌿 {post.plantTag}</span>}
                      {post.categoryTag && <span className="text-xs text-earth bg-earth/10 rounded-full px-2 py-0.5">{post.categoryTag}</span>}
                    </div>
                  )}

                  {post.careTip && (
                    <p className="mt-2 text-xs text-success bg-success/5 rounded-lg p-2">💡 {post.careTip}</p>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[var(--border)]">
                    <button
                      className="flex items-center gap-1.5 text-sm text-[var(--color-sage)] hover:text-red-500 transition-colors"
                      aria-label={`Like post (${post._count.likes} likes)`}
                    >
                      <Heart className="h-4 w-4" aria-hidden="true" />
                      <span>{post._count.likes}</span>
                    </button>
                    <button className="flex items-center gap-1.5 text-sm text-[var(--color-sage)] hover:text-primary transition-colors" aria-label={`${post._count.comments} comments`}>
                      <MessageCircle className="h-4 w-4" aria-hidden="true" />
                      <span>{post._count.comments}</span>
                    </button>
                    <button className="flex items-center gap-1.5 text-sm text-[var(--color-sage)] hover:text-primary transition-colors ml-auto" aria-label="Share">
                      <Share2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <nav className="flex justify-center gap-2 mt-10" aria-label="Pagination">
            {page > 1 && (
              <Link href={`/community?page=${page - 1}`} className="rounded-lg border px-4 py-2 text-sm hover:bg-primary/5">← Prev</Link>
            )}
            <span className="rounded-lg bg-primary px-4 py-2 text-sm text-white">{page} of {totalPages}</span>
            {page < totalPages && (
              <Link href={`/community?page=${page + 1}`} className="rounded-lg border px-4 py-2 text-sm hover:bg-primary/5">Next →</Link>
            )}
          </nav>
        )}
      </div>
    </div>
  );
}
