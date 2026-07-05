import { loadLegalMarkdown, markdownToHtml } from "@/lib/legal-md";

export const metadata = {
  title: "Gizlilik Politikası",
  description:
    "Tagora'nın kişisel verilerinizi Privacy by Design ilkesiyle nasıl koruduğunu özetleyen politika. KVKK + GDPR uyumlu.",
};

export default async function PrivacyPage() {
  const md = await loadLegalMarkdown("gizlilik-politikasi.md");
  const html = markdownToHtml(md);
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
