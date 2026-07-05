import { loadLegalMarkdown, markdownToHtml } from "@/lib/legal-md";

export const metadata = {
  title: "KVKK Aydınlatma Metni",
  description:
    "Tagora'nın kişisel verilerinizi hangi kategorilerde, hangi amaçlarla ve nasıl işlediği hakkında KVKK m.10 kapsamında aydınlatma metni.",
};

export default async function KvkkPage() {
  const md = await loadLegalMarkdown("kvkk-aydinlatma-metni.md");
  const html = markdownToHtml(md);
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
