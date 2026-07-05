/**
 * Login sayfası — magic link (e-mail OTP) Supabase Auth.
 *
 * MVP'de SMS OTP yerine e-mail magic link kullanıyoruz çünkü
 * Netgsm/Twilio entegrasyonu Sprint 2'de.
 *
 * Kullanıcı e-mail girer → Supabase OTP linki yollar → tıklayınca giriş.
 */
import { LoginForm } from "./login-form";
import { Logo } from "@/components/logo";

export const metadata = {
  title: "Giriş Yap",
  description: "Tagora hesabına giriş yap.",
};

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 py-12">
      <Logo className="mb-8" />
      <div className="w-full rounded-2xl border border-navy/10 bg-white p-8 shadow-sm">
        <h1 className="mb-2 text-2xl font-bold text-navy">Hoş geldin</h1>
        <p className="mb-6 text-sm text-charcoal/70">
          E-postanı gir; sana sihirli bir giriş linki yollayalım.
        </p>
        <LoginForm />
      </div>
      <p className="mt-6 text-center text-xs text-charcoal/50">
        Devam ederek{" "}
        <a href="/terms" className="underline">
          Kullanım Şartları
        </a>{" "}
        ve{" "}
        <a href="/privacy" className="underline">
          KVKK Aydınlatma
        </a>
        &apos;yı kabul etmiş olursun.
      </p>
    </main>
  );
}
