import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Card, CardBody } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { Mail, Phone, MapPin, ShoppingBag, Heart, Star } from "lucide-react";

export const metadata: Metadata = { title: "Profile — GachAdda" };

export default async function BuyerProfilePage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "BUYER") redirect("/login");
  const userId = session.user.id;

  const [user, orderCount, wishlistCount, reviewCount] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        bio: true,
        location: true,
        avatarUrl: true,
        createdAt: true,
      },
    }),
    db.order.count({ where: { buyerId: userId } }),
    db.wishlist.count({ where: { userId } }),
    db.review.count({ where: { buyerId: userId } }),
  ]);

  if (!user) redirect("/login");

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-primary-dark">Profile</h1>
        <p className="text-sm text-[var(--color-sage)]">Your buyer profile</p>
      </div>

      <Card>
        <CardBody className="space-y-5">
          {/* Avatar + name */}
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-3xl font-bold text-primary shrink-0 overflow-hidden">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="h-full w-full rounded-full object-cover" />
              ) : (
                user.name[0]
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-primary-dark">{user.name}</h2>
              <p className="text-xs text-[var(--color-sage)]">Member since {formatDate(user.createdAt)}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: <ShoppingBag className="h-4 w-4" />, value: orderCount,    label: "Orders"   },
              { icon: <Heart        className="h-4 w-4" />, value: wishlistCount, label: "Wishlist" },
              { icon: <Star         className="h-4 w-4" />, value: reviewCount,   label: "Reviews"  },
            ].map((s) => (
              <div key={s.label} className="text-center bg-cream/50 rounded-lg p-3">
                <div className="flex justify-center text-primary mb-1">{s.icon}</div>
                <p className="text-xl font-bold text-primary-dark">{s.value}</p>
                <p className="text-xs text-[var(--color-sage)]">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Contact details */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-[var(--color-sage)]" />
              <span className="text-primary-dark">{user.email}</span>
            </div>
            {user.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-[var(--color-sage)]" />
                <span className="text-primary-dark">{user.phone}</span>
              </div>
            )}
            {user.location && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-[var(--color-sage)]" />
                <span className="text-primary-dark">{user.location}</span>
              </div>
            )}
          </div>

          {user.bio && (
            <div className="bg-cream/50 rounded-lg p-3">
              <p className="text-sm text-primary-dark">{user.bio}</p>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
