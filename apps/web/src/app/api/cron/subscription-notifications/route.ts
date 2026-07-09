/**
 * GET /api/cron/subscription-notifications
 *
 * Günlük cron. Süresi yaklaşan / dolmuş kullanıcılara email gönderir.
 * Vercel Cron ile tetiklenir (vercel.json'da).
 *
 * Idempotent: subscription_notifications tablosunda (user_id, kind, period_end)
 * unique olduğu için aynı period için aynı kind bir kez gönderilir.
 */
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://tagora.com.tr";

// Kaç gün kala uyarı at
const REMINDER_DAYS = [30, 7, 1] as const;

interface UserRow {
  id: string;
  email: string | null;
  display_name: string | null;
  subscription_expires_at: string | null;
}

export async function GET(req: NextRequest) {
  // Vercel Cron güvenliği: CRON_SECRET header veya query
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  if (cronSecret) {
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
  }

  const service = createSupabaseServiceClient();
  const now = new Date();

  // Aboneliği başlamış tüm kullanıcıları çek
  const { data: usersData } = await service
    .from("users")
    .select("id, email, display_name, subscription_expires_at")
    .not("subscription_expires_at", "is", null);

  const users = (usersData ?? []) as UserRow[];

  const sent: Array<{ user_id: string; kind: string }> = [];
  const errors: string[] = [];

  for (const u of users) {
    if (!u.email || !u.subscription_expires_at) continue;
    const expires = new Date(u.subscription_expires_at);
    const graceEnd = new Date(expires.getTime() + 30 * 24 * 60 * 60 * 1000);
    const daysUntilExpires = Math.ceil(
      (expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    // 1) Aktif ama yaklaşıyor
    if (daysUntilExpires > 0) {
      const reminderDay = REMINDER_DAYS.find((d) => daysUntilExpires === d);
      if (reminderDay) {
        const kind = `reminder_${reminderDay}d`;
        const ok = await maybeNotify(
          service,
          u,
          kind,
          u.subscription_expires_at,
        );
        if (ok) sent.push({ user_id: u.id, kind });
      }
    }
    // 2) Süre bitti, grace period başlıyor (bugün)
    else if (daysUntilExpires === 0 || daysUntilExpires === -1) {
      const kind = "grace_started";
      const ok = await maybeNotify(
        service,
        u,
        kind,
        u.subscription_expires_at,
      );
      if (ok) sent.push({ user_id: u.id, kind });
    }
    // 3) Grace de bitti, read-only başladı
    else {
      const daysAfterGrace = Math.floor(
        (now.getTime() - graceEnd.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (daysAfterGrace === 0 || daysAfterGrace === 1) {
        const kind = "readonly_started";
        const ok = await maybeNotify(
          service,
          u,
          kind,
          u.subscription_expires_at,
        );
        if (ok) sent.push({ user_id: u.id, kind });
      }
    }
  }

  return NextResponse.json({
    ok: true,
    checked: users.length,
    sent: sent.length,
    details: sent,
    errors,
  });
}

/**
 * Idempotent notify: subscription_notifications'da kayıt varsa atla,
 * yoksa email gönder + kayıt at.
 */
async function maybeNotify(
  service: ReturnType<typeof createSupabaseServiceClient>,
  user: UserRow,
  kind: string,
  periodEnd: string,
): Promise<boolean> {
  if (!user.email) return false;

  // Zaten gönderildi mi?
  const { data: existing } = await service
    .from("subscription_notifications")
    .select("id")
    .eq("user_id", user.id)
    .eq("kind", kind)
    .eq("period_end", periodEnd)
    .maybeSingle();

  if (existing) return false;

  // Email gönder
  try {
    const { subject, html } = buildEmail(kind, user);
    await sendEmail({
      to: user.email,
      subject,
      html,
    });

    // Kayıt at
    await service.from("subscription_notifications").insert({
      user_id: user.id,
      kind,
      period_end: periodEnd,
    });
    return true;
  } catch (e) {
    console.error(
      `[cron/subscription-notifications] ${kind} → ${user.email} hata:`,
      (e as Error).message,
    );
    return false;
  }
}

function buildEmail(kind: string, user: UserRow): { subject: string; html: string } {
  const name = user.display_name?.split(" ")[0] ?? "Merhaba";
  const renewUrl = `${APP_URL}/dashboard/subscription`;

  const templates: Record<
    string,
    { subject: string; heading: string; body: string; cta: string }
  > = {
    reminder_30d: {
      subject: "🎯 Tagora aboneliğin 30 gün sonra bitiyor",
      heading: "Aboneliğin yaklaşıyor",
      body: `Merhaba ${name}, Tagora aboneliğin <strong>30 gün</strong> sonra dolacak. Kesintisiz kullanım için şimdi yenileyebilirsin — sadece <strong>99 TL/yıl</strong>.`,
      cta: "Şimdi Yenile",
    },
    reminder_7d: {
      subject: "⏰ Tagora aboneliğin 7 gün sonra bitiyor",
      heading: "Aboneliğin bitmek üzere",
      body: `Merhaba ${name}, Tagora aboneliğin <strong>7 gün</strong> sonra dolacak. Kaçırmamak için hemen yenile — <strong>99 TL/yıl</strong>.`,
      cta: "Şimdi Yenile",
    },
    reminder_1d: {
      subject: "🚨 Tagora aboneliğin YARIN bitiyor",
      heading: "Son 24 saat",
      body: `Merhaba ${name}, Tagora aboneliğin <strong>yarın</strong> dolacak. Şimdi yenile ve sisteme kesintisiz devam et — <strong>99 TL/yıl</strong>.`,
      cta: "Yarına Kalmadan Yenile",
    },
    grace_started: {
      subject: "🟠 Tagora aboneliğin sona erdi — 30 gün ek süre",
      heading: "Aboneliğin sona erdi",
      body: `Merhaba ${name}, Tagora aboneliğinin süresi doldu. Sana <strong>30 gün ek süre</strong> tanıdık — bu sürede sistem normal çalışmaya devam ediyor. 30 gün sonra mesaj cevaplama özelliği kapanacak.`,
      cta: "Aboneliğini Yenile — 99 TL",
    },
    readonly_started: {
      subject: "🔒 Tagora — cevap yazma özelliği kapatıldı",
      heading: "Cevap yazma kapalı",
      body: `Merhaba ${name}, aboneliğin uzun süredir yenilenmediği için mesaj cevaplama özelliği kapatıldı. Gelen mesajları görebilirsin ama cevap yazamıyorsun. Yenile ve sistemin tam özelliklerine devam et.`,
      cta: "Şimdi Aktif Et — 99 TL",
    },
  };

  const t = templates[kind] ?? {
    subject: "Tagora bildirim",
    heading: "Bildirim",
    body: "",
    cta: "Dashboard'a Git",
  };

  const html = `<!doctype html><html><body style="font-family:-apple-system,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#F9F7F1;color:#0F1B3D;">
  <div style="background:#FFFFFF;border-radius:16px;padding:32px;border:1px solid rgba(15,27,61,0.1);">
    <h1 style="margin:0 0 16px 0;font-size:22px;font-weight:700;">${t.heading}</h1>
    <p style="margin:0 0 24px 0;line-height:1.6;color:#0F1B3D;">${t.body}</p>
    <a href="${renewUrl}" style="display:inline-block;background:#0F1B3D;color:#D4F36A;padding:14px 28px;border-radius:12px;text-decoration:none;font-weight:700;">${t.cta} →</a>
    <p style="margin:32px 0 0 0;font-size:12px;color:#0F1B3D;opacity:0.5;">Bu email <a href="${APP_URL}" style="color:#0F1B3D;">Tagora</a> aboneliğinle ilgili otomatik bilgilendirmedir.</p>
  </div>
</body></html>`;

  return { subject: t.subject, html };
}
