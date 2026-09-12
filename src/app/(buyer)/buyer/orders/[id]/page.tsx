import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CheckCircle, Clock, XCircle, Truck, Package } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/card";
import { OrderStatusBadge, Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { DELIVERY_TIMELINE } from "@/lib/constants";

export const metadata: Metadata = { title: "Order Details" };

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const order = await db.order.findUnique({
    where: { id },
    include: {
      items: { include: { product: { select: { name: true, slug: true, images: true } } } },
      payment: { include: { proof: true } },
      delivery: true,
      invoice: true,
      address: true,
    },
  });

  if (!order) notFound();
  if (order.buyerId !== session.user.id && order.sellerId !== session.user.id) redirect("/buyer/orders");

  const timeline = Array.isArray(order.delivery?.timeline)
    ? (order.delivery.timeline as { status: string; timestamp: string; note?: string }[])
    : [];

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-primary-dark">{order.orderNumber}</h1>
          <p className="text-sm text-[var(--color-sage)]">Placed {formatDate(order.createdAt)}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {/* Delivery Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Delivery Progress</CardTitle>
        </CardHeader>
        <CardBody>
          <ol className="relative border-l-2 border-[var(--border)] ml-3 space-y-5">
            {DELIVERY_TIMELINE.map((status) => {
              const timelineEntry = timeline.find((t) => t.status === status);
              const isCompleted = timelineEntry != null;
              const isCurrent   = order.status === status;
              return (
                <li key={status} className="ml-5 relative">
                  <span
                    className={`absolute -left-8 flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                      isCompleted ? "bg-success border-success text-white"
                      : isCurrent  ? "bg-primary border-primary text-white animate-pulse"
                      :              "bg-white border-[var(--border)]"
                    }`}
                    aria-hidden="true"
                  >
                    {isCompleted ? <CheckCircle className="h-3 w-3" /> : isCurrent ? <Clock className="h-3 w-3" /> : null}
                  </span>
                  <p className={`text-sm font-semibold ${isCompleted || isCurrent ? "text-primary-dark" : "text-[var(--color-sage)]"}`}>
                    {status.replace(/_/g, " ")}
                  </p>
                  {timelineEntry && (
                    <p className="text-xs text-[var(--color-sage)]">{formatDate(timelineEntry.timestamp)}</p>
                  )}
                </li>
              );
            })}
          </ol>
        </CardBody>
      </Card>

      {/* Items */}
      <Card>
        <CardHeader><CardTitle>Order Items</CardTitle></CardHeader>
        <CardBody className="space-y-4">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-lg overflow-hidden bg-cream flex-shrink-0">
                {item.product.images[0] ? (
                  <Image src={item.product.images[0]} alt={item.productName} width={56} height={56} className="object-cover" />
                ) : <div className="h-full w-full flex items-center justify-center text-2xl">🌿</div>}
              </div>
              <div className="flex-1 min-w-0">
                <Link href={`/products/${item.product.slug}`} className="text-sm font-semibold text-primary-dark hover:text-primary line-clamp-1">
                  {item.productName}
                </Link>
                <p className="text-xs text-[var(--color-sage)]">Qty: {item.quantity} × {formatCurrency(item.unitPrice)}</p>
              </div>
              <p className="text-sm font-bold text-primary shrink-0">{formatCurrency(item.total)}</p>
            </div>
          ))}

          {/* Totals */}
          <div className="border-t border-[var(--border)] pt-3 space-y-1.5">
            <div className="flex justify-between text-sm"><span className="text-[var(--color-sage)]">Subtotal</span><span>{formatCurrency(order.subtotal)}</span></div>
            {order.deliveryCharge > 0 && (
              <div className="flex justify-between text-sm"><span className="text-[var(--color-sage)]">Delivery</span><span>{formatCurrency(order.deliveryCharge)}</span></div>
            )}
            {order.discount > 0 && (
              <div className="flex justify-between text-sm text-success"><span>Discount</span><span>−{formatCurrency(order.discount)}</span></div>
            )}
            <div className="flex justify-between font-bold text-base border-t pt-2"><span>Total</span><span className="text-primary">{formatCurrency(order.total)}</span></div>
          </div>
        </CardBody>
      </Card>

      {/* Payment */}
      <Card>
        <CardHeader><CardTitle>Payment</CardTitle></CardHeader>
        <CardBody className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-[var(--color-sage)]">Status</span>
            {order.payment && (
              <Badge variant={order.payment.status === "VERIFIED" ? "success" : order.payment.status === "REJECTED" ? "error" : "warning"}>
                {order.payment.status}
              </Badge>
            )}
          </div>
          {(order.status === "PAYMENT_PENDING" || !order.payment?.proof) && order.payment?.status === "PENDING" && (
            <Link href={`/buyer/orders/${order.id}/pay`}>
              <Button className="w-full" size="sm">💳 Pay Now via PhonePe QR</Button>
            </Link>
          )}
          {order.payment?.status === "SUBMITTED" && (
            <p className="text-xs text-amber-600 bg-amber-50 rounded-lg p-2">⏳ Payment proof submitted. Awaiting seller verification.</p>
          )}
          {order.payment?.status === "VERIFIED" && (
            <p className="text-xs text-success bg-success/5 rounded-lg p-2">✅ Payment verified by Suman. Your order is being processed.</p>
          )}
          {order.payment?.status === "REJECTED" && (
            <div className="space-y-2">
              <p className="text-xs text-error bg-error/5 rounded-lg p-2">❌ Payment rejected. Please re-submit proof.</p>
              <Link href={`/buyer/orders/${order.id}/pay`}>
                <Button className="w-full" size="sm" variant="outline">Re-submit Payment</Button>
              </Link>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Delivery address */}
      {order.address && (
        <Card>
          <CardHeader><CardTitle>Delivery Address</CardTitle></CardHeader>
          <CardBody>
            <address className="not-italic text-sm text-primary-dark space-y-0.5">
              <p className="font-semibold">{order.address.fullName}</p>
              <p>{order.address.line1}</p>
              {order.address.line2 && <p>{order.address.line2}</p>}
              <p>{order.address.city}, {order.address.state} — {order.address.pincode}</p>
              <p>📞 {order.address.phone}</p>
            </address>
          </CardBody>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-3 flex-wrap">
        {order.invoice && (
          <Link href={`/api/invoices/${order.invoice.id}`} target="_blank">
            <Button variant="outline" leftIcon={<span>📄</span>}>Download Invoice</Button>
          </Link>
        )}
        {order.payment?.status === "PENDING" && (
          <Link href={`/buyer/orders/${order.id}/pay`}>
            <Button leftIcon={<span>💳</span>}>Pay Now</Button>
          </Link>
        )}
        {(order.status === "DELIVERED" || order.status === "COMPLETED") && (
          <Link href={`/buyer/reviews?orderId=${order.id}`}>
            <Button variant="outline">⭐ Write Review</Button>
          </Link>
        )}
      </div>
    </div>
  );
}
