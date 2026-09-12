import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/card";
import { OrderStatusBadge, Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { DELIVERY_TIMELINE, ORDER_STATUS_LABELS } from "@/lib/constants";
import { CheckCircle, Clock } from "lucide-react";
import { SellerOrderActions } from "./_components/order-actions";

export const metadata: Metadata = { title: "Order Details" };

export default async function SellerOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SELLER") redirect("/login");

  const { id } = await params;
  const order = await db.order.findUnique({
    where: { id },
    include: {
      items: { include: { product: { select: { name: true, slug: true, images: true } } } },
      buyer: { select: { name: true, email: true, phone: true } },
      payment: { include: { proof: true } },
      delivery: true,
      invoice: true,
      address: true,
    },
  });

  if (!order || order.sellerId !== session.user.id) notFound();

  const timeline = Array.isArray(order.delivery?.timeline)
    ? (order.delivery.timeline as { status: string; timestamp: string; note?: string }[])
    : [];

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/seller/orders" className="text-sm text-[var(--color-sage)] hover:text-primary mb-1 block">← All Orders</Link>
          <h1 className="text-xl font-bold text-primary-dark">{order.orderNumber}</h1>
          <p className="text-sm text-[var(--color-sage)]">Placed {formatDate(order.createdAt)}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {/* Status management */}
      <SellerOrderActions orderId={order.id} currentStatus={order.status} />

      {/* Delivery progress */}
      <Card>
        <CardHeader><CardTitle>Delivery Progress</CardTitle></CardHeader>
        <CardBody>
          <ol className="relative border-l-2 border-[var(--border)] ml-3 space-y-5">
            {DELIVERY_TIMELINE.map((status) => {
              const entry = timeline.find((t) => t.status === status);
              const isCompleted = !!entry;
              const isCurrent   = order.status === status;
              return (
                <li key={status} className="ml-5 relative">
                  <span className={`absolute -left-8 flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                    isCompleted ? "bg-success border-success text-white"
                    : isCurrent  ? "bg-primary border-primary text-white animate-pulse"
                    :              "bg-white border-[var(--border)]"
                  }`}>
                    {isCompleted ? <CheckCircle className="h-3 w-3" /> : isCurrent ? <Clock className="h-3 w-3" /> : null}
                  </span>
                  <p className={`text-sm font-semibold ${isCompleted || isCurrent ? "text-primary-dark" : "text-[var(--color-sage)]"}`}>
                    {ORDER_STATUS_LABELS[status]}
                  </p>
                  {entry && <p className="text-xs text-[var(--color-sage)]">{formatDate(entry.timestamp)}</p>}
                </li>
              );
            })}
          </ol>
        </CardBody>
      </Card>

      {/* Buyer info */}
      <Card>
        <CardHeader><CardTitle>Buyer</CardTitle></CardHeader>
        <CardBody className="text-sm space-y-1">
          <p className="font-semibold text-primary-dark">{order.buyer.name}</p>
          <p className="text-[var(--color-sage)]">{order.buyer.email}</p>
          {order.buyer.phone && <p className="text-[var(--color-sage)]">📞 {order.buyer.phone}</p>}
        </CardBody>
      </Card>

      {/* Items */}
      <Card>
        <CardHeader><CardTitle>Items</CardTitle></CardHeader>
        <CardBody className="space-y-4">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-lg overflow-hidden bg-cream shrink-0">
                {item.product.images[0]
                  ? <Image src={item.product.images[0]} alt={item.productName} width={56} height={56} className="object-cover" />
                  : <div className="h-full w-full flex items-center justify-center text-2xl">🌿</div>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-primary-dark line-clamp-1">{item.productName}</p>
                <p className="text-xs text-[var(--color-sage)]">Qty: {item.quantity} × {formatCurrency(item.unitPrice)}</p>
              </div>
              <p className="text-sm font-bold text-primary shrink-0">{formatCurrency(item.total)}</p>
            </div>
          ))}
          <div className="border-t border-[var(--border)] pt-3 space-y-1">
            <div className="flex justify-between text-sm"><span className="text-[var(--color-sage)]">Subtotal</span><span>{formatCurrency(order.subtotal)}</span></div>
            {order.deliveryCharge > 0 && <div className="flex justify-between text-sm"><span className="text-[var(--color-sage)]">Delivery</span><span>{formatCurrency(order.deliveryCharge)}</span></div>}
            <div className="flex justify-between font-bold text-base border-t pt-2"><span>Total</span><span className="text-primary">{formatCurrency(order.total)}</span></div>
          </div>
        </CardBody>
      </Card>

      {/* Payment */}
      {order.payment && (
        <Card>
          <CardHeader><CardTitle>Payment</CardTitle></CardHeader>
          <CardBody className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--color-sage)]">Status</span>
              <Badge variant={order.payment.status === "VERIFIED" ? "success" : order.payment.status === "REJECTED" ? "error" : "warning"}>
                {order.payment.status}
              </Badge>
            </div>
            {order.payment.proof && (
              <>
                <div className="flex justify-between">
                  <span className="text-[var(--color-sage)]">UTR</span>
                  <span className="font-mono">{order.payment.proof.transactionId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-sage)]">Amount claimed</span>
                  <span>{formatCurrency(order.payment.proof.amount)}</span>
                </div>
              </>
            )}
            {order.payment.status !== "VERIFIED" && (
              <Link href="/seller/payment-verification">
                <div className="mt-2 text-xs text-primary hover:underline cursor-pointer">→ Go to Payment Verification</div>
              </Link>
            )}
          </CardBody>
        </Card>
      )}

      {/* Delivery address */}
      {order.address && (
        <Card>
          <CardHeader><CardTitle>Ship To</CardTitle></CardHeader>
          <CardBody>
            <address className="not-italic text-sm text-primary-dark space-y-0.5">
              <p className="font-semibold">{order.address.fullName}</p>
              <p>{order.address.line1}</p>
              <p>{order.address.city}, {order.address.state} — {order.address.pincode}</p>
              <p>📞 {order.address.phone}</p>
            </address>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
