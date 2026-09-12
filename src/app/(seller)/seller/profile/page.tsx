import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Card, CardBody } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { Mail, MapPin, Phone, Store, Star } from "lucide-react";

export const metadata: Metadata = { title: "Profile — GachAdda" };

export default async function SellerProfilePage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SELLER") redirect("/login");
  const userId = session.user.id;

  const [user, sellerProfile] = await Promise.all([
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
    db.sellerProfile.findUnique({ where: { userId } }),
  ]);

  if (!user) redirect("/login");

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-primary-dark">Profile</h1>
        <p className="text-sm text-[var(--color-sage)]">Your seller profile information</p>
      </div>

      <Card>
        <CardBody className="space-y-5">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-3xl font-bold text-primary shrink-0 overflow-hidden">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
              ) : (
                user.name[0]
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-primary-dark">{user.name}</h2>
              {sellerProfile?.shopName && (
                <p className="text-sm text-primary flex items-center gap-1">
                  <Store className="h-3.5 w-3.5" /> {sellerProfile.shopName}
                </p>
              )}
              <p className="text-xs text-[var(--color-sage)]">Member since {formatDate(user.createdAt)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            {sellerProfile && (
              <div className="flex items-center gap-2 text-sm">
                <Star className="h-4 w-4 text-gold" />
                <span className="text-primary-dark">
                  {sellerProfile.averageRating.toFixed(1)} avg rating · {sellerProfile.reviewCount} reviews
                </span>
              </div>
            )}
          </div>

          {(user.bio || sellerProfile?.shopBio) && (
            <div className="bg-cream/50 rounded-lg p-3">
              <p className="text-sm text-primary-dark">{sellerProfile?.shopBio ?? user.bio}</p>
            </div>
          )}

          {sellerProfile?.upiId && (
            <div className="bg-cream/50 rounded-lg p-3">
              <p className="text-xs text-[var(--color-sage)] mb-1">UPI ID</p>
              <p className="text-sm font-mono text-primary-dark">{sellerProfile.upiId}</p>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
