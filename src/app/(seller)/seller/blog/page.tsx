import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Image as ImageIcon } from "lucide-react";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Blog & Gallery — GachAdda" };

export default async function SellerBlogPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SELLER") redirect("/login");
  const userId = session.user.id;

  const [posts, photos] = await Promise.all([
    db.blogPost.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    db.galleryPhoto.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary-dark">Blog & Gallery</h1>
          <p className="text-sm text-[var(--color-sage)]">Share your plant stories and photos</p>
        </div>
        <Button leftIcon={<BookOpen className="h-4 w-4" />}>+ New Post</Button>
      </div>

      {/* Blog Posts */}
      <div>
        <h2 className="text-lg font-semibold text-primary-dark mb-3">Blog Posts ({posts.length})</h2>
        {posts.length === 0 ? (
          <Card>
            <CardBody className="text-center py-10">
              <BookOpen className="h-10 w-10 text-[var(--color-sage)] mx-auto mb-2" />
              <p className="font-medium text-primary-dark">No blog posts yet</p>
              <p className="text-sm text-[var(--color-sage)]">Share your plant care tips and stories</p>
            </CardBody>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {posts.map((p) => (
              <Card key={p.id} hover>
                <CardBody className="space-y-2">
                  {p.coverImage && (
                    <img src={p.coverImage} alt={p.title} className="w-full h-32 object-cover rounded-lg" />
                  )}
                  <h3 className="font-semibold text-primary-dark">{p.title}</h3>
                  <p className="text-sm text-[var(--color-sage)] line-clamp-2">{p.excerpt}</p>
                  <div className="flex items-center justify-between text-xs text-[var(--color-sage)]">
                    <span
                      className={`px-2 py-0.5 rounded-full font-medium ${
                        p.status === "PUBLISHED" ? "bg-success/10 text-success" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {p.status}
                    </span>
                    <span>{formatDate(p.createdAt)}</span>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Gallery */}
      <div>
        <h2 className="text-lg font-semibold text-primary-dark mb-3">Gallery ({photos.length})</h2>
        {photos.length === 0 ? (
          <Card>
            <CardBody className="text-center py-10">
              <ImageIcon className="h-10 w-10 text-[var(--color-sage)] mx-auto mb-2" />
              <p className="font-medium text-primary-dark">No photos yet</p>
              <p className="text-sm text-[var(--color-sage)]">Upload photos of your plants</p>
            </CardBody>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {photos.map((ph) => (
              <div key={ph.id} className="aspect-square rounded-lg overflow-hidden bg-cream">
                <img
                  src={ph.imageUrl}
                  alt={ph.caption ?? "Plant photo"}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
