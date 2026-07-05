import { loadLegalMarkdown, markdownToHtml } from "@/lib/legal-md";

export const metadata = {
  title: "Çerez Politikası",
  description:
    "Tagora web sitesi ve mobil uygulamasında hangi çerezlerin, hangi amaçla kullanıldığı hakkında politika.",
};

export default async function CookiesPage() {
  const md = await loadLegalMarkdown("cerez-politikasi.md");
  const html = markdownToHtml(md);
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
