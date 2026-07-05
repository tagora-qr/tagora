/**
 * POST /api/checkout/callback
 * (iyzico bir POST atar, token body'de gelir)
 *
 * 1) Token ile checkout form'u retrieve et (server-side, güvenli)
 * 2) status=success ise order.status='paid' + paid_at
 * 3) Kullanıcıyı success sayfasına yönlendir
 */
import { NextResponse, type NextRequest } from "next/server";
import { retrieveCheckoutForm } from "@/lib/iyzico";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { renderOrderConfirmationEmail, sendTransactionalEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  // iyzico form-encoded POST atar
  const fd = await req.formData();
  const token = fd.get("token") as string | null;

  if (!token) {
    return NextResponse.redirect(new URL("/shop?error=no_token", req.url));
  }

  try {
    const result = await retrieveCheckoutForm(token);
    const service = createSupabaseServiceClient();

    if (result.status !== "success" || result.paymentStatus !== "SUCCESS") {
      // Ödeme başarısız → order'ı failed işaretle
      if (result.basketId) {
        await service
          .from("orders")
          .update({
            status: "failed",
            iyzico_raw_response: result as unknown,
          })
          .eq("id", result.basketId);
      }
      const errMsg = encodeURIComponent(
        result.errorMessage ?? "Ödeme başarısız",
      );
      return NextResponse.redirect(
        new URL(`/shop/failed?message=${errMsg}`, req.url),
      );
    }

    // Başarılı: order'ı paid işaretle
    const orderId = result.basketId!;
    const { data: order } = await service
      .from("orders")
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
        iyzico_payment_id: result.paymentId ?? null,
        iyzico_raw_response: result as unknown,
      })
      .eq("id", orderId)
      .select(
        "order_no, buyer_name, buyer_email, total_try, shipping_address, shipping_city",
      )
      .single();

    const orderRow = order as {
      order_no: string;
      buyer_name: string;
      buyer_email: string;
      total_try: number;
      shipping_address: string;
      shipping_city: string;
    } | null;
    const orderNo = orderRow?.order_no ?? "";

    // Onay email'i — fire & forget, hataysa akış bozulmasın
    if (orderRow?.buyer_email) {
      const { data: items } = await service
        .from("order_items")
        .select("package_name, quantity, line_total_try")
        .eq("order_id", orderId);
      const itemsList = ((items ?? []) as { package_name: string; quantity: number; line_total_try: number }[])
        .map((i) => ({ name: i.package_name, quantity: i.quantity, lineTotal: Number(i.line_total_try) }));

      const origin = new URL(req.url).origin;
      const email = renderOrderConfirmationEmail({
        orderNo,
        buyerName: orderRow.buyer_name,
        totalTry: Number(orderRow.total_try),
        shippingAddress: orderRow.shipping_address,
        shippingCity: orderRow.shipping_city,
        trackUrl: `${origin}/dashboard/orders/${orderNo}`,
        items: itemsList,
      });
      // Await ile bekle ama sonucunu umursama — email fail sipariş success'ini bozmaz
      const emailRes = await sendTransactionalEmail({
        to: orderRow.buyer_email,
        subject: email.subject,
        html: email.html,
        text: email.text,
        tags: [{ name: "type", value: "order_confirmation" }, { name: "order_no", value: orderNo }],
      });
      if (!emailRes.ok) {
        console.error("[callback] Order confirmation email failed:", emailRes.error);
      }
    }

    return NextResponse.redirect(
      new URL(`/shop/success/${orderNo}`, req.url),
    );
  } catch (e) {
    return NextResponse.redirect(
      new URL(
        `/shop/failed?message=${encodeURIComponent((e as Error).message)}`,
        req.url,
      ),
    );
  }
}

// iyzico sadece POST atmayacak durumlarda GET fallback (test için)
export async function GET(req: NextRequest) {
  return NextResponse.redirect(new URL("/shop", req.url));
}
