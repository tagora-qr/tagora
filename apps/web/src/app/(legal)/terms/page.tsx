import { loadLegalMarkdown, markdownToHtml } from "@/lib/legal-md";

export const metadata = {
  title: "Kullanım Şartları",
  description:
    "Tagora hizmetlerini kullanırken uyulması gereken kurallar, sipariş süreçleri, iade politikası, sorumluluklar ve yasal koşullar.",
};

export default async function TermsPage() {
  const md = await loadLegalMarkdown("kullanim-sartlari.md");
  const html = markdownToHtml(md);
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
