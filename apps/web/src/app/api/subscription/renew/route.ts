/**
 * POST /api/subscription/renew
 *
 * Kullanıcı aboneliğini 1 yıl uzatır. iyzico Checkout Form Initialize çağırıp
 * ödeme sayfasına yönlendirir.
 */
import { NextResponse, type NextRequest } from "next/server";
import {
  createSupabaseServerClient,
  createSupabaseServiceClient,
} from "@/lib/supabase/server";
import { createCheckoutForm } from "@/lib/iyzico";

const YEARLY_FEE_TRY = 99;

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Giriş yapmalısın" },
      { status: 401 },
    );
  }

  const service = createSupabaseServiceClient();
  const { data: profileRaw } = await service
    .from("users")
    .select(
      "id, email, display_name, phone, subscription_expires_at",
    )
    .eq("auth_user_id", user.id)
    .maybeSingle();

  const profile = profileRaw as {
    id: string;
    email: string | null;
    display_name: string | null;
    phone: string | null;
    subscription_expires_at: string | null;
  } | null;

  if (!profile) {
    return NextResponse.json(
      { ok: false, error: "Profil bulunamadı" },
      { status: 500 },
    );
  }

  // Yeni period: mevcut expires'ten sonraysa +1 yıl, geçmişte kaldıysa now+1 yıl
  const now = new Date();
  const currentExpires = profile.subscription_expires_at
    ? new Date(profile.subscription_expires_at)
    : null;
  const periodStart =
    currentExpires && currentExpires > now ? currentExpires : now;
  const periodEnd = new Date(periodStart);
  periodEnd.setFullYear(periodEnd.getFullYear() + 1);

  // subscription_payments — pending kayıt
  const { data: paymentRaw, error: payErr } = await service
    .from("subscription_payments")
    .insert({
      user_id: profile.id,
      amount_try: YEARLY_FEE_TRY,
      period_start: periodStart.toISOString(),
      period_end: periodEnd.toISOString(),
      status: "pending",
    })
    .select("id")
    .single();

  if (payErr || !paymentRaw) {
    return NextResponse.json(
      { ok: false, error: "Ödeme kaydı oluşturulamadı: " + (payErr?.message ?? "unknown") },
      { status: 500 },
    );
  }

  const payment = paymentRaw as { id: string };

  // iyzico
  const origin = new URL(req.url).origin;
  const buyerEmail = profile.email ?? user.email ?? "unknown@tagora.com.tr";
  const buyerName = profile.display_name ?? "Tagora Kullanıcısı";
  const [firstName, ...rest] = buyerName.split(" ");
  const surname = rest.length > 0 ? rest.join(" ") : firstName;
  const buyerPhone = profile.phone ?? "+905000000000";

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "127.0.0.1";

  try {
    const iyzicoResult = await createCheckoutForm({
      price: YEARLY_FEE_TRY.toFixed(2),
      paidPrice: YEARLY_FEE_TRY.toFixed(2),
      currency: "TRY",
      basketId: payment.id,
      conversationId: payment.id,
      callbackUrl: `${origin}/api/subscription/callback`,
      buyer: {
        id: profile.id,
        name: firstName ?? "Kullanici",
        surname,
        email: buyerEmail,
        identityNumber: "11111111111",
        registrationAddress: "Tagora",
        ip,
        city: "İstanbul",
        country: "Turkey",
        gsmNumber: buyerPhone,
      },
      shippingAddress: {
        contactName: buyerName,
        city: "İstanbul",
        country: "Turkey",
        address: "Dijital hizmet",
      },
      billingAddress: {
        contactName: buyerName,
        city: "İstanbul",
        country: "Turkey",
        address: "Dijital hizmet",
      },
      basketItems: [
        {
          id: "TAGORA_ANNUAL",
          name: "Tagora Yıllık Abonelik",
          category1: "Subscription",
          itemType: "VIRTUAL",
          price: YEARLY_FEE_TRY.toFixed(2),
        },
      ],
    });

    if (iyzicoResult.status !== "success" || !iyzicoResult.paymentPageUrl) {
      await service
        .from("subscription_payments")
        .update({
          status: "failed",
        })
        .eq("id", payment.id);
      return NextResponse.json(
        {
          ok: false,
          error: iyzicoResult.errorMessage ?? "iyzico başlatılamadı",
        },
        { status: 500 },
      );
    }

    await service
      .from("subscription_payments")
      .update({
        iyzico_conversation_id: payment.id,
      })
      .eq("id", payment.id);

    return NextResponse.json({
      ok: true,
      payment_page_url: iyzicoResult.paymentPageUrl,
    });
  } catch (e) {
    await service
      .from("subscription_payments")
      .update({ status: "failed" })
      .eq("id", payment.id);
    return NextResponse.json(
      { ok: false, error: (e as Error).message },
      { status: 500 },
    );
  }
}
