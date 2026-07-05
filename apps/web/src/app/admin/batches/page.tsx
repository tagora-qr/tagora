/**
 * Admin — Üretim Batch'leri
 *
 * generate-print-batch.mjs script'i her --insert çağırdığında bir kayıt açar.
 * Burada tüm batch'leri listeler + basit metrikler.
 */
import { createSupabaseServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const USE_CASE_EMOJI: Record<string, string> = {
  vehicle: "🚗",
  door: "🚪",
  pet: "🐾",
  luggage: "🧳",
  bike: "🚲",
  other: "📌",
};

export default async function AdminBatchesPage() {
  const supabase = createSupabaseServiceClient();

  const { data: batches, count } = await supabase
    .from("print_batches")
    .select("id, name, use_case, sku, size, count, output_dir, notes, created_at", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = (batches ?? []) as BatchRow[];

  // Toplam kaç sticker basıldı (aggregate)
  const totals = rows.reduce(
    (acc, r) => {
      acc.total += r.count;
      acc.byUseCase[r.use_case] = (acc.byUseCase[r.use_case] || 0) + r.count;
      return acc;
    },
    { total: 0, byUseCase: {} as Record<string, number> },
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-navy">Üretim Batch'leri</h1>
        <p className="mt-1 text-sm text-charcoal/60">
          {(count ?? 0).toLocaleString("tr-TR")} batch · Toplam{" "}
          {totals.total.toLocaleString("tr-TR")} sticker üretildi
        </p>
      </div>

      {/* Aggregate */}
      {Object.keys(totals.byUseCase).length > 0 && (
        <div className="rounded-2xl border border-navy/10 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-charcoal/60">
            Use Case Dağılımı
          </h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(totals.byUseCase)
              .sort((a, b) => b[1] - a[1])
              .map(([uc, cnt]) => (
                <span
                  key={uc}
                  className="inline-flex items-center gap-2 rounded-lg border border-navy/10 bg-navy/[0.03] px-3 py-1.5 text-sm"
                >
                  <span className="text-lg">{USE_CASE_EMOJI[uc] ?? "📌"}</span>
                  <span className="font-medium text-charcoal">{uc}</span>
                  <span className="rounded-full bg-navy px-2 py-0.5 text-xs font-bold text-accent tabular-nums">
                    {cnt.toLocaleString("tr-TR")}
                  </span>
                </span>
              ))}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-navy/10 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-navy/10 bg-navy/[0.02]">
            <tr>
              <Th>Batch Adı</Th>
              <Th>Use Case</Th>
              <Th>SKU</Th>
              <Th>Boyut</Th>
              <Th align="right">Adet</Th>
              <Th>Tarih</Th>
              <Th>Output</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/5">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-charcoal/50">
                  Henüz batch yok. <code className="rounded bg-navy/5 px-1.5 py-0.5 text-xs">generate-print-batch.mjs --insert</code>{" "}
                  çalıştırınca burada gözükecek.
                </td>
              </tr>
            ) : (
              rows.map((b) => (
                <tr key={b.id} className="transition hover:bg-navy/[0.02]">
                  <Td>
                    <span className="font-mono text-xs">{b.name}</span>
                  </Td>
                  <Td>
                    <span className="inline-flex items-center gap-1.5">
                      <span>{USE_CASE_EMOJI[b.use_case] ?? "📌"}</span>
                      <span className="text-charcoal/70">{b.use_case}</span>
                    </span>
                  </Td>
                  <Td>
                    <span className="rounded-full bg-navy/5 px-2 py-0.5 text-xs font-medium text-charcoal/70">
                      {b.sku}
                    </span>
                  </Td>
                  <Td>{b.size}</Td>
                  <Td align="right">
                    <span className="tabular-nums font-medium">
                      {b.count.toLocaleString("tr-TR")}
                    </span>
                  </Td>
                  <Td>
                    <span className="text-xs">
                      {new Date(b.created_at).toLocaleString("tr-TR")}
                    </span>
                  </Td>
                  <Td>
                    {b.output_dir ? (
                      <span
                        title={b.output_dir}
                        className="font-mono text-[10px] text-charcoal/50"
                      >
                        …{b.output_dir.slice(-30)}
                      </span>
                    ) : (
                      <span className="text-charcoal/30">—</span>
                    )}
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface BatchRow {
  id: string;
  name: string;
  use_case: string;
  sku: string;
  size: string;
  count: number;
  output_dir: string | null;
  notes: string | null;
  created_at: string;
}

function Th({ children, align }: { children: React.ReactNode; align?: "right" }) {
  return (
    <th
      className={`px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-charcoal/60 ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}
function Td({ children, align }: { children: React.ReactNode; align?: "right" }) {
  return (
    <td className={`px-3 py-2.5 text-charcoal ${align === "right" ? "text-right" : ""}`}>
      {children}
    </td>
  );
}
