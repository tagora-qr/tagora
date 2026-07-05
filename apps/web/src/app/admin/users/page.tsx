/**
 * Admin — Users list.
 *
 * Table + search + tier filter + role filter.
 * Actions: admin toggle, KVKK export, soft-delete (per row).
 */
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { UsersFilters } from "./filters";
import { UserActions } from "./actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const PAGE_SIZE = 25;

type SearchParams = Promise<{
  q?: string;
  tier?: string;
  role?: string;
  deleted?: string;
  page?: string;
}>;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const tier = params.tier && params.tier !== "all" ? params.tier : null;
  const role = params.role && params.role !== "all" ? params.role : null; // "admin" | "user"
  const showDeleted = params.deleted === "true";
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);

  const supabase = createSupabaseServiceClient();

  let query = supabase
    .from("users")
    .select("id, email, display_name, tier, is_admin, locale, created_at, deleted_at", {
      count: "exact",
    })
    .order("created_at", { ascending: false });

  if (!showDeleted) query = query.is("deleted_at", null);
  if (q) {
    // email veya display_name ilike search
    query = query.or(`email.ilike.%${q}%,display_name.ilike.%${q}%`);
  }
  if (tier) query = query.eq("tier", tier);
  if (role === "admin") query = query.eq("is_admin", true);
  if (role === "user") query = query.eq("is_admin", false);

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  query = query.range(from, to);

  const { data: users, count } = await query;

  // Her user için sticker sayısı (ayrı sorgu)
  const withStickerCounts = await Promise.all(
    (users ?? []).map(async (u) => {
      const row = u as UserRow;
      const { count: stickerCount } = await supabase
        .from("stickers")
        .select("id", { count: "exact", head: true })
        .eq("owner_id", row.id);
      return { ...row, sticker_count: stickerCount ?? 0 };
    }),
  );

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-navy">Kullanıcılar</h1>
        <p className="mt-1 text-sm text-charcoal/60">
          {(count ?? 0).toLocaleString("tr-TR")} kullanıcı · Sayfa {page}/{totalPages}
        </p>
      </div>

      <UsersFilters
        currentQ={q}
        currentTier={tier ?? "all"}
        currentRole={role ?? "all"}
        showDeleted={showDeleted}
      />

      <div className="overflow-x-auto rounded-2xl border border-navy/10 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-navy/10 bg-navy/[0.02]">
            <tr>
              <Th>Email / Ad</Th>
              <Th>Tier</Th>
              <Th>Role</Th>
              <Th align="right">Sticker</Th>
              <Th>Dil</Th>
              <Th>Kayıt</Th>
              <Th>Durum</Th>
              <Th align="right">İşlemler</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/5">
            {withStickerCounts.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-charcoal/50">
                  Filtreye uyan kullanıcı yok.
                </td>
              </tr>
            ) : (
              withStickerCounts.map((u) => (
                <tr key={u.id} className="transition hover:bg-navy/[0.02]">
                  <Td>
                    <div>
                      <p className="font-medium text-navy">{u.email}</p>
                      {u.display_name && (
                        <p className="text-xs text-charcoal/60">{u.display_name}</p>
                      )}
                    </div>
                  </Td>
                  <Td>
                    <span className="rounded-full bg-navy/5 px-2 py-0.5 text-xs font-medium text-charcoal/70">
                      {u.tier}
                    </span>
                  </Td>
                  <Td>
                    {u.is_admin ? (
                      <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-navy">
                        ADMIN
                      </span>
                    ) : (
                      <span className="text-xs text-charcoal/50">user</span>
                    )}
                  </Td>
                  <Td align="right">
                    <span className="tabular-nums">{u.sticker_count}</span>
                  </Td>
                  <Td>{u.locale.toUpperCase()}</Td>
                  <Td>
                    <span className="text-xs">
                      {new Date(u.created_at).toLocaleDateString("tr-TR")}
                    </span>
                  </Td>
                  <Td>
                    {u.deleted_at ? (
                      <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                        Silindi
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        Aktif
                      </span>
                    )}
                  </Td>
                  <Td align="right">
                    <UserActions
                      userId={u.id}
                      email={u.email}
                      isAdmin={u.is_admin}
                      isDeleted={Boolean(u.deleted_at)}
                    />
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} params={params} />
      )}
    </div>
  );
}

interface UserRow {
  id: string;
  email: string;
  display_name: string | null;
  tier: string;
  is_admin: boolean;
  locale: string;
  created_at: string;
  deleted_at: string | null;
}

function Th({ children, align }: { children: React.ReactNode; align?: "left" | "right" }) {
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
function Td({ children, align }: { children: React.ReactNode; align?: "left" | "right" }) {
  return (
    <td className={`px-3 py-2.5 text-charcoal ${align === "right" ? "text-right" : ""}`}>
      {children}
    </td>
  );
}

function Pagination({
  page,
  totalPages,
  params,
}: {
  page: number;
  totalPages: number;
  params: Record<string, string | undefined>;
}) {
  const build = (p: number) => {
    const usp = new URLSearchParams();
    if (params.q) usp.set("q", params.q);
    if (params.tier) usp.set("tier", params.tier);
    if (params.role) usp.set("role", params.role);
    if (params.deleted) usp.set("deleted", params.deleted);
    usp.set("page", String(p));
    return `/admin/users?${usp.toString()}`;
  };
  return (
    <div className="flex items-center justify-center gap-2">
      {page > 1 ? (
        <a
          href={build(page - 1)}
          className="rounded-lg border border-navy/10 bg-white px-3 py-1.5 text-sm text-charcoal hover:bg-navy/[0.02]"
        >
          ← Önceki
        </a>
      ) : (
        <span className="rounded-lg border border-navy/10 bg-white px-3 py-1.5 text-sm text-charcoal/30">
          ← Önceki
        </span>
      )}
      <span className="px-3 text-sm text-charcoal/60">
        {page} / {totalPages}
      </span>
      {page < totalPages ? (
        <a
          href={build(page + 1)}
          className="rounded-lg border border-navy/10 bg-white px-3 py-1.5 text-sm text-charcoal hover:bg-navy/[0.02]"
        >
          Sonraki →
        </a>
      ) : (
        <span className="rounded-lg border border-navy/10 bg-white px-3 py-1.5 text-sm text-charcoal/30">
          Sonraki →
        </span>
      )}
    </div>
  );
}
