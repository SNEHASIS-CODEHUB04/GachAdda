import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/api-helpers";

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/invoices/[id]">) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { id } = await ctx.params;

  const invoice = await db.invoice.findUnique({
    where: { id },
    include: {
      order: {
        include: {
          items:   true,
          buyer:   { select: { name: true, email: true, phone: true } },
          address: true,
          payment: { select: { status: true, verifiedAt: true } },
        },
      },
    },
  });

  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const order = invoice.order;
  if (order.buyerId !== user!.id && order.sellerId !== user!.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Get seller info
  const seller = await db.user.findUnique({
    where: { id: order.sellerId },
    select: { name: true, sellerProfile: { select: { shopName: true } } },
  });
  const shopName = seller?.sellerProfile?.shopName ?? seller?.name ?? "GachAdda Seller";
  const addr = order.address;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Invoice ${invoice.invoiceNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #fff; color: #1a2e1a; padding: 40px; max-width: 700px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 2px solid #2d5a27; }
    .brand { font-size: 28px; font-weight: 800; color: #2d5a27; }
    .brand span { color: #7ab648; }
    .invoice-meta { text-align: right; }
    .invoice-meta h2 { font-size: 22px; font-weight: 700; color: #2d5a27; }
    .invoice-meta p { font-size: 13px; color: #6b7c6b; margin-top: 2px; }
    .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 32px; }
    .party h3 { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #7ab648; margin-bottom: 8px; }
    .party p { font-size: 13px; color: #3a4a3a; line-height: 1.6; }
    .party strong { color: #1a2e1a; font-size: 15px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    thead tr { background: #2d5a27; color: white; }
    thead th { padding: 10px 14px; font-size: 12px; font-weight: 600; text-align: left; }
    thead th:last-child { text-align: right; }
    tbody tr { border-bottom: 1px solid #e8f0e8; }
    tbody tr:hover { background: #f4f9f4; }
    tbody td { padding: 10px 14px; font-size: 13px; }
    tbody td:last-child { text-align: right; font-weight: 600; color: #2d5a27; }
    .totals { margin-left: auto; width: 260px; }
    .totals-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; border-bottom: 1px solid #e8f0e8; }
    .totals-row.grand { font-size: 16px; font-weight: 800; color: #2d5a27; border-top: 2px solid #2d5a27; border-bottom: none; padding-top: 10px; margin-top: 4px; }
    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; background: #e8f5e0; color: #2d5a27; }
    .footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #e8f0e8; text-align: center; font-size: 11px; color: #9aaa9a; }
    @media print { body { padding: 20px; } .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom:20px;text-align:right">
    <button onclick="window.print()" style="background:#2d5a27;color:white;border:none;padding:10px 24px;border-radius:8px;cursor:pointer;font-size:14px;font-weight:600">🖨️ Print / Download PDF</button>
  </div>

  <div class="header">
    <div>
      <div class="brand">Gach<span>Adda</span> 🌿</div>
      <p style="font-size:12px;color:#6b7c6b;margin-top:4px">botanomaniac.i.am</p>
    </div>
    <div class="invoice-meta">
      <h2>INVOICE</h2>
      <p><strong>${invoice.invoiceNumber}</strong></p>
      <p>Issued: ${new Date(invoice.issuedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</p>
      <p style="margin-top:6px"><span class="status-badge">✅ PAID</span></p>
    </div>
  </div>

  <div class="parties">
    <div class="party">
      <h3>From (Seller)</h3>
      <p><strong>${shopName} — Botanomaniac</strong></p>
      <p>Suman Paul</p>
      <p>Kapasdanga, Gayeshpur, PO: Gayespur</p>
      <p>Burwan, Murshidabad, West Bengal — 742147</p>
      <p>📞 +91 70012 74562</p>
      <p>✉️ suman.paul.botanomaniac@gmail.com</p>
      <p>Instagram: @botanomaniac.i.am</p>
    </div>
    <div class="party">
      <h3>Bill To (Buyer)</h3>
      <p><strong>${order.buyer.name}</strong></p>
      <p>${order.buyer.email}</p>
      ${order.buyer.phone ? `<p>📞 ${order.buyer.phone}</p>` : ""}
      ${addr ? `<p style="margin-top:4px">${addr.fullName}<br/>${addr.line1}<br/>${addr.city}, ${addr.state} — ${addr.pincode}<br/>📞 ${addr.phone}</p>` : ""}
    </div>
  </div>

  <div style="margin-bottom:12px;display:flex;justify-content:space-between;align-items:center">
    <span style="font-size:12px;color:#6b7c6b">Order: <strong style="color:#2d5a27">${order.orderNumber}</strong></span>
    <span style="font-size:12px;color:#6b7c6b">Payment: <strong style="color:#2d5a27">${order.payment?.status ?? "—"}</strong></span>
  </div>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Product</th>
        <th>Qty</th>
        <th>Unit Price</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      ${order.items.map((item: { productName: string; quantity: number; unitPrice: number; total: number }, i: number) => `
      <tr>
        <td>${i + 1}</td>
        <td>${item.productName}</td>
        <td>${item.quantity}</td>
        <td>₹${item.unitPrice.toFixed(2)}</td>
        <td>₹${item.total.toFixed(2)}</td>
      </tr>`).join("")}
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-row"><span>Subtotal</span><span>₹${order.subtotal.toFixed(2)}</span></div>
    <div class="totals-row"><span>Delivery</span><span>${order.deliveryCharge > 0 ? `₹${order.deliveryCharge.toFixed(2)}` : "Free"}</span></div>
    ${order.discount > 0 ? `<div class="totals-row"><span>Discount</span><span>−₹${order.discount.toFixed(2)}</span></div>` : ""}
    <div class="totals-row grand"><span>Total</span><span>₹${order.total.toFixed(2)}</span></div>
  </div>

  <div class="footer">
    <p>Thank you for your purchase from GachAdda 🌿</p>
    <p style="margin-top:4px"><strong>Botanomaniac by Suman Paul</strong></p>
    <p style="margin-top:2px">Kapasdanga, Gayeshpur, Burwan, Murshidabad, West Bengal — 742147</p>
    <p style="margin-top:2px">📞 +91 70012 74562 · ✉️ suman.paul.botanomaniac@gmail.com</p>
    <p style="margin-top:2px">Instagram: @botanomaniac.i.am · Facebook: Botanomaniac</p>
    <p style="margin-top:6px;font-size:10px">This is a computer-generated invoice. No signature required.</p>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `inline; filename="${invoice.invoiceNumber}.html"`,
    },
  });
}
