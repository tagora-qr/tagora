/**
 * POST /api/subscription/callback
 *
 * iyzico ödeme başarılı → subscription_payments güncelle + users.expires_at uzat.
 * Form-encoded body ile token gelir (iyzico callback formatı).
 */
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { retrieveCheckoutForm } from "@/lib/iyzico";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const token = formData.get("token") as string | null;

  if (!token) {
    return NextResponse.redirect(new URL("/dashboard/subscription?error=missing_token", req.url));
  }

  const service = createSupabaseServiceClient();

  try {
    const result = await retrieveCheckoutForm({ token });

    if (result.status !== "success" || result.paymentStatus !== "SUCCESS") {
      // basketId (conversationId) subscription_payments.id
      const paymentId = result.basketId;
      if (paymentId) {
        await service
          .from("subscription_payments")
          .update({
            status: "failed",
            iyzico_payment_id: result.paymentId,
          })
          .eq("id", paymentId);
      }
      return NextResponse.redirect(
        new URL(
          "/dashboard/subscription?error=" +
            encodeURIComponent(result.errorMessage ?? "Ödeme başarısız"),
          req.url,
        ),
      );
    }

    const paymentId = result.basketId;
    if (!paymentId) {
      return NextResponse.redirect(
        new URL("/dashboard/subscription?error=missing_basket_id", req.url),
      );
    }

    // Payment kaydını çek
    const { data: paymentRaw } = await service
      .from("subscription_payments")
      .select("id, user_id, period_start, period_end, status")
      .eq("id", paymentId)
      .maybeSingle();

    const payment = paymentRaw as {
      id: string;
      user_id: string;
      period_start: string;
      period_end: string;
      status: string;
    } | null;

    if (!payment) {
      return NextResponse.redirect(
        new URL("/dashboard/subscription?error=payment_not_found", req.url),
      );
    }

    // Zaten paid ise idempotent — direkt success sayfasına
    if (payment.status === "paid") {
      return NextResponse.redirect(
        new URL("/dashboard/subscription?success=1", req.url),
      );
    }

    // Payment status paid'e çek
    await service
      .from("subscription_payments")
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
        iyzico_payment_id: result.paymentId,
      })
      .eq("id", payment.id);

    // Kullanıcının expires_at'ini uzat (period_end)
    await service
      .from("users")
      .update({
        subscription_expires_at: payment.period_end,
        subscription_status: "active",
      })
      .eq("id", payment.user_id);

    return NextResponse.redirect(
      new URL("/dashboard/subscription?success=1", req.url),
    );
  } catch (e) {
    console.error("[subscription/callback] hata:", (e as Error).message);
    return NextResponse.redirect(
      new URL(
        "/dashboard/subscription?error=" +
          encodeURIComponent((e as Error).message),
        req.url,
      ),
    );
  }
}

export async function GET(req: NextRequest) {
  // iyzico bazen GET ile callback yapabilir
  return POST(req);
}
