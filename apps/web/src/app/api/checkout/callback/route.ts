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
      .select("order_no")
      .single();

    const orderNo = (order as { order_no: string } | null)?.order_no ?? "";
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
