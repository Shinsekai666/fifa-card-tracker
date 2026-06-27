import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useRef, useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeftRight, FileDown, LayoutGrid, List, ListChecks, Loader2, LogOut, Search, Sparkles, Upload, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

import { fetchAllStickers, useStickerMutations } from "@/lib/sticker-hooks";
import { groupByTeam, STATUS_LABEL, type Sticker, type StickerStatus } from "@/lib/sticker-types";
import { exportDoublesPdf, exportMissingPdf } from "@/lib/sticker-pdf";
import { importStickersFromFile } from "@/lib/sticker-import";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Toaster } from "@/components/ui/sonner";
import { TeamCard } from "@/components/sticker-album/team-card";
import { TeamAlbumDialog } from "@/components/sticker-album/team-album-dialog";
import { GROUP_LETTERS, groupOf } from "@/lib/wc-groups";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Mon Classeur Panini FIFA 2026" },
      { name: "description", content: "Gère ton album Panini FIFA 2026 par équipe : possédés, doubles, manquants, avec export PDF." },
    ],
  }),
  component: HomePage,
});

type ViewMode = "album" | "list" | "missing";

function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Toaster richColors position="top-center" />
      <Home />
    </div>
  );
}

function Home() {
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);

  const { data: stickers = [], isLoading } = useQuery({
    queryKey: ["stickers"],
    queryFn: fetchAllStickers,
  });

  const teams = useMemo(() => groupByTeam(stickers), [stickers]);

  const stats = useMemo(() => {
    const total = stickers.length;
    const owned = stickers.filter((s) => s.status !== "missing").length;
    const missing = stickers.filter((s) => s.status === "missing").length;
    const doublesTotal = stickers.reduce((a, s) => a + (s.status === "double" ? s.doubles_count : 0), 0);
    const completeTeams = teams.filter((t) => t.pct === 100 && t.total > 0).length;
    const pct = total ? Math.round((owned / total) * 100) : 0;
    return { total, owned, missing, doublesTotal, completeTeams, pct };
  }, [stickers, teams]);


  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:py-10">
      {/* Header */}
      <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-accent">Panini · FIFA World Cup 2026</p>
          <h1 className="text-3xl font-black tracking-tight text-foreground md:text-4xl">Mon classeur</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Suis ta collection par équipe et exporte tes listes en un clic.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link to="/echange"><ArrowLeftRight className="mr-2 h-4 w-4" /> Mode échange</Link>
          </Button>
          <Button variant="outline" onClick={() => exportMissingPdf(stickers)} disabled={!stats.missing}>
            <FileDown className="mr-2 h-4 w-4" /> PDF manquants
          </Button>
          <Button variant="outline" onClick={() => exportDoublesPdf(stickers)} disabled={!stats.doublesTotal}>
            <FileDown className="mr-2 h-4 w-4" /> PDF doubles
          </Button>
          <LogoutButton />
        </div>

      </header>

      {/* Stats */}
      <section className="mb-6 grid grid-cols-2 gap-2 md:grid-cols-5">
        <StatCard label="Progression" value={`${stats.pct}%`} sub={`${stats.owned} / ${stats.total}`} highlight />
        <StatCard label="Possédés" value={String(stats.owned)} sub="dans l'album" />
        <StatCard label="Manquants" value={String(stats.missing)} sub="à trouver" />
        <StatCard label="Doubles" value={String(stats.doublesTotal)} sub="à échanger" />
        <StatCard label="Équipes" value={`${stats.completeTeams}/${teams.length}`} sub="complètes" />
      </section>

      {/* Recherche carte */}
      <CardLookup stickers={stickers} />



      <div className="mb-6">
        <h2 className="text-lg font-bold text-foreground">
          {teams.length} équipe{teams.length > 1 ? "s" : ""}
        </h2>
      </div>

      {/* Body */}
      {isLoading ? (
        <Loader />
      ) : stickers.length === 0 ? (
        <EmptyState />
      ) : (
        <AlbumView teams={teams} onSelect={setSelectedTeam} />
      )}


      <TeamAlbumDialog teams={teams} selectedCode={selectedTeam} onSelect={setSelectedTeam} />

      <footer className="mt-12 border-t border-border pt-6 text-center text-xs text-muted-foreground">
        Tes modifications sont sauvegardées automatiquement.
      </footer>
    </div>
  );
}

type AlbumSort = "default" | "alpha" | "progress" | "missing";
type AlbumFilter = "all" | "specials" | "by-group" | `group-${string}`;

function AlbumView({ teams, onSelect }: { teams: ReturnType<typeof groupByTeam>; onSelect: (code: string) => void }) {
  const [sort, setSort] = useState<AlbumSort>("default");
  const [filter, setFilter] = useState<AlbumFilter>("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let list = teams.slice();
    if (filter === "specials") list = list.filter((t) => t.isSpecial);
    else if (filter.startsWith("group-")) {
      const letter = filter.replace("group-", "");
      list = list.filter((t) => groupOf(t.code) === letter);
    } else if (filter === "all") {
      // garde tout (spéciaux + équipes)
    }
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((t) =>
        t.name.toLowerCase().includes(q) || t.code.toLowerCase().includes(q),
      );
    }
    // tri (les spéciaux restent en tête sauf si on demande un tri explicite)
    const cmp: Record<AlbumSort, (a: typeof teams[number], b: typeof teams[number]) => number> = {
      default: (a, b) => (a.isSpecial === b.isSpecial ? a.order - b.order : a.isSpecial ? -1 : 1),
      alpha: (a, b) => a.name.localeCompare(b.name, "fr"),
      progress: (a, b) => b.pct - a.pct || a.name.localeCompare(b.name, "fr"),
      missing: (a, b) => b.missing - a.missing || a.name.localeCompare(b.name, "fr"),
    };
    return list.sort(cmp[sort]);
  }, [teams, filter, sort, search]);

  const groupedByLetter = useMemo(() => {
    if (filter !== "by-group") return null;
    const map = new Map<string, typeof teams>();
    const specials: typeof teams = [];
    for (const t of filtered) {
      if (t.isSpecial) { specials.push(t); continue; }
      const g = groupOf(t.code) ?? "?";
      if (!map.has(g)) map.set(g, [] as unknown as typeof teams);
      (map.get(g) as typeof teams).push(t);
    }
    const ordered: { letter: string; teams: typeof teams }[] = [];
    if (specials.length) ordered.push({ letter: "Spéciaux", teams: specials });
    for (const l of GROUP_LETTERS) {
      const g = map.get(l);
      if (g && g.length) ordered.push({ letter: `Groupe ${l}`, teams: g });
    }
    return ordered;
  }, [filtered, filter]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative min-w-0 flex-1 sm:flex-none sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une équipe…"
            className="pl-9"
          />
        </div>
        <Select value={filter} onValueChange={(v) => setFilter(v as AlbumFilter)}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les équipes</SelectItem>
            <SelectItem value="specials">Spéciaux uniquement</SelectItem>
            <SelectItem value="by-group">Grouper par poule FIFA</SelectItem>
            {GROUP_LETTERS.map((l) => (
              <SelectItem key={l} value={`group-${l}`}>Groupe {l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v) => setSort(v as AlbumSort)}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Ordre du cahier</SelectItem>
            <SelectItem value="alpha">Ordre alphabétique</SelectItem>
            <SelectItem value="progress">Progression (↓)</SelectItem>
            <SelectItem value="missing">Manquants (↓)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {groupedByLetter ? (
        <div className="space-y-6">
          {groupedByLetter.map((g) => (
            <section key={g.letter}>
              <h3 className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
                {g.letter}
              </h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {g.teams.map((t) => (
                  <TeamCard key={t.code} group={t} onClick={() => onSelect(t.code)} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {filtered.map((t) => <TeamCard key={t.code} group={t} onClick={() => onSelect(t.code)} />)}
        </div>
      )}
    </div>
  );
}

function MissingView({
  teams,
  onSelectTeam,
}: {
  teams: ReturnType<typeof groupByTeam>;
  onSelectTeam: (code: string) => void;
}) {
  const groups = useMemo(
    () =>
      teams
        .map((t) => ({ ...t, missing: t.stickers.filter((s) => s.status === "missing") }))
        .filter((t) => t.missing.length > 0),
    [teams],
  );

  if (groups.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card py-16 text-center">
        <div className="mb-2 text-4xl">🎉</div>
        <p className="text-lg font-bold">Aucun sticker manquant !</p>
        <p className="mt-1 text-sm text-muted-foreground">Ton album est complet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {groups.map((t) => (
        <Card key={t.code}>
          <CardContent className="p-4">
            <button
              onClick={() => onSelectTeam(t.code)}
              className="mb-3 flex w-full items-center gap-2 text-left hover:opacity-80"
            >
              <span className="text-2xl">{t.flag}</span>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-bold text-foreground">{t.name}</h3>
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{t.code}</p>
              </div>
              <Badge variant="outline" className="font-mono">
                {t.missing.length} / {t.total}
              </Badge>
            </button>
            <div className="flex flex-wrap gap-1.5">
              {t.missing.map((s) => (
                <span
                  key={s.id}
                  title={s.name ?? ""}
                  className="inline-flex items-center gap-1 rounded-md border border-dashed border-border bg-muted/40 px-2 py-1 font-mono text-xs font-bold text-foreground"
                >
                  {s.number}
                  {s.is_foil && <Sparkles className="h-3 w-3 text-accent" />}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ListView({ stickers }: { stickers: Sticker[] }) {
  const { setStatus, adjustDoubles } = useStickerMutations();
  const [search, setSearch] = useState("");
  const [status, setStatus_] = useState<"all" | StickerStatus>("all");
  const [team, setTeam] = useState<string>("all");

  const teams = useMemo(() => groupByTeam(stickers), [stickers]);
  const teamOptions = useMemo(() => teams.map((t) => ({ code: t.code, label: `${t.flag} ${t.name}` })), [teams]);

  const filteredTeams = useMemo(() => {
    const q = search.trim().toLowerCase();
    return teams
      .filter((t) => team === "all" || t.code === team)
      .map((t) => ({
        ...t,
        stickers: t.stickers.filter((s) => {
          if (status !== "all" && s.status !== status) return false;
          if (q) {
            const hay = `${s.number} ${s.name ?? ""} ${s.team_name ?? ""}`.toLowerCase();
            if (!hay.includes(q)) return false;
          }
          return true;
        }),
      }))
      .filter((t) => t.stickers.length > 0);
  }, [teams, search, status, team]);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-2 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher…" className="pl-9" />
        </div>
        <Select value={status} onValueChange={(v) => setStatus_(v as typeof status)}>
          <SelectTrigger className="md:w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous statuts</SelectItem>
            <SelectItem value="missing">Manquants</SelectItem>
            <SelectItem value="owned">Possédés</SelectItem>
            <SelectItem value="double">Doubles</SelectItem>
          </SelectContent>
        </Select>
        <Select value={team} onValueChange={setTeam}>
          <SelectTrigger className="md:w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les équipes</SelectItem>
            {teamOptions.map((t) => <SelectItem key={t.code} value={t.code}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filteredTeams.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">Aucun sticker ne correspond.</p>
      ) : (
        <div className="space-y-6">
          {filteredTeams.map((t) => (
            <div key={t.code}>
              <div className="sticky top-0 z-10 mb-2 flex items-center gap-2 bg-background/95 py-2 backdrop-blur">
                <span className="text-xl">{t.flag}</span>
                <h3 className="text-sm font-bold">{t.name}</h3>
                <span className="font-mono text-xs text-muted-foreground">{t.code}</span>
                <Badge variant="outline" className="ml-auto">{t.stickers.length}</Badge>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {t.stickers.map((s) => (
                  <CompactRow key={s.id} sticker={s} onStatus={setStatus} onAdjust={adjustDoubles} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CompactRow({ sticker, onStatus, onAdjust }: { sticker: Sticker; onStatus: (s: Sticker, st: StickerStatus) => void; onAdjust: (s: Sticker, d: number) => void }) {
  return (
    <Card className={sticker.status === "missing" ? "" : "border-primary/30 bg-primary/5"}>
      <CardContent className="flex items-center gap-2 p-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-sm font-bold text-primary">{sticker.number}</span>
            {sticker.is_foil && <Sparkles className="h-3 w-3 text-accent" />}
            {sticker.status === "double" && <Badge className="bg-accent text-accent-foreground hover:bg-accent">×{sticker.doubles_count + 1}</Badge>}
          </div>
          <p className="truncate text-xs text-foreground">{sticker.name ?? "—"}</p>
        </div>
        <div className="flex gap-1">
          {(["missing", "owned", "double"] as StickerStatus[]).map((st) => (
            <button
              key={st}
              onClick={() => onStatus(sticker, st)}
              title={STATUS_LABEL[st]}
              className={`flex h-7 w-7 items-center justify-center rounded text-xs font-bold ${
                sticker.status === st ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"
              }`}
            >
              {st === "missing" ? "✕" : st === "owned" ? "✓" : "×N"}
            </button>
          ))}
          {sticker.status === "double" && (
            <div className="ml-1 flex items-center gap-0.5">
              <button onClick={() => onAdjust(sticker, -1)} className="h-7 w-6 rounded bg-muted text-sm hover:bg-muted/70">−</button>
              <button onClick={() => onAdjust(sticker, 1)} className="h-7 w-6 rounded bg-muted text-sm hover:bg-muted/70">+</button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function StatCard({ label, value, sub, highlight }: { label: string; value: string; sub: string; highlight?: boolean }) {
  return (
    <Card className={highlight ? "border-accent/50 bg-gradient-to-br from-accent/10 to-transparent" : ""}>
      <CardContent className="p-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-xl font-black tabular-nums text-foreground">{value}</p>
        <p className="text-[10px] text-muted-foreground">{sub}</p>
      </CardContent>
    </Card>
  );
}

function ViewBtn({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${
        active ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon} {children}
    </button>
  );
}

function Loader() {
  return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
}

function CardLookup({ stickers }: { stickers: Sticker[] }) {
  const [q, setQ] = useState("");
  const { setStatus, adjustDoubles } = useStickerMutations();

  const matches = useMemo(() => {
    const needle = q.trim().toUpperCase();
    if (!needle) return [] as Sticker[];
    return stickers
      .filter((s) => {
        const n = s.number.toUpperCase();
        const name = (s.name ?? "").toUpperCase();
        return n === needle || n.includes(needle) || name.includes(needle);
      })
      .sort((a, b) => {
        const an = a.number.toUpperCase();
        const bn = b.number.toUpperCase();
        if (an === needle) return -1;
        if (bn === needle) return 1;
        return an.localeCompare(bn, "fr", { numeric: true });
      })
      .slice(0, 12);
  }, [stickers, q]);

  const exact = matches.find((s) => s.number.toUpperCase() === q.trim().toUpperCase());

  return (
    <section className="mb-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value.toUpperCase())}
                placeholder="Recherche une carte (ex. CIV5, FRA10, nom du joueur…)"
                className="pl-9 font-mono uppercase"
              />
            </div>
            {q && (
              <p className="text-xs text-muted-foreground">
                {matches.length === 0
                  ? "Aucun résultat."
                  : `${matches.length} résultat${matches.length > 1 ? "s" : ""}`}
              </p>
            )}
          </div>

          {q && matches.length > 0 && (
            <div className="mt-3 space-y-2">
              {(exact ? [exact, ...matches.filter((m) => m.id !== exact.id)] : matches).map((s) => (
                <LookupRow key={s.id} sticker={s} setStatus={setStatus} adjustDoubles={adjustDoubles} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

function LookupRow({
  sticker,
  setStatus,
  adjustDoubles,
}: {
  sticker: Sticker;
  setStatus: (s: Sticker, st: StickerStatus) => void;
  adjustDoubles: (s: Sticker, d: number) => void;
}) {
  const s = sticker;
  const tone =
    s.status === "missing"
      ? "border-destructive/40 bg-destructive/10"
      : s.status === "double"
      ? "border-accent/40 bg-accent/10"
      : "border-primary/40 bg-primary/10";
  const dot =
    s.status === "missing" ? "bg-destructive" : s.status === "double" ? "bg-accent" : "bg-primary";

  return (
    <div className={`flex flex-wrap items-center gap-2 rounded-lg border p-2 ${tone}`}>
      <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />
      <span className="text-xl">{s.team_flag}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-bold">{s.number}</span>
          {s.is_foil && <Sparkles className="h-3 w-3 text-accent" />}
          <Badge variant="outline" className="text-[10px]">{STATUS_LABEL[s.status]}{s.status === "double" ? ` ×${s.doubles_count}` : ""}</Badge>
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {s.team_name ?? "—"}{s.name ? ` · ${s.name}` : ""}
        </p>
      </div>
      <div className="flex flex-wrap gap-1">
        {s.status !== "owned" && (
          <Button size="sm" variant="outline" onClick={() => setStatus(s, "owned")}>
            Je l'ai
          </Button>
        )}
        {s.status !== "missing" && (
          <Button size="sm" variant="outline" onClick={() => setStatus(s, "missing")}>
            Pas eu
          </Button>
        )}
        <Button size="sm" onClick={() => adjustDoubles(s, +1)}>+1 double</Button>
        {s.status === "double" && s.doubles_count > 0 && (
          <Button size="sm" variant="outline" onClick={() => adjustDoubles(s, -1)}>−1</Button>
        )}
      </div>
    </div>
  );
}

function EmptyState({ onImport }: { onImport: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-card py-16 text-center">
      <div className="mb-3 text-5xl">📘</div>
      <h3 className="text-xl font-bold">Ton classeur est vide</h3>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Importe ton fichier JSON officiel (équipes + spéciaux) pour démarrer ton album.
      </p>
      <Button className="mt-4" onClick={onImport}>
        <Upload className="mr-2 h-4 w-4" /> Importer le JSON
      </Button>
      <p className="mt-3 text-xs text-muted-foreground">
        Structure reconnue : <code className="rounded bg-muted px-1.5 py-0.5">{`{ teams: [{ code, name, items: [...] }], special_stickers: { items: [...] } }`}</code>
      </p>
      <DangerZone />
    </div>
  );
}

function DangerZone() {
  const { refetch } = useQuery({ queryKey: ["stickers"], queryFn: fetchAllStickers });
  async function wipe() {
    if (!confirm("Supprimer TOUS les stickers ? Cette action est définitive.")) return;
    const { error } = await import("@/integrations/supabase/client").then((m) =>
      m.supabase.from("stickers").delete().neq("id", "00000000-0000-0000-0000-000000000000"),
    );
    if (error) toast.error(error.message);
    else { toast.success("Album vidé"); refetch(); }
  }
  return (
    <button onClick={wipe} className="mt-6 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive">
      <Trash2 className="h-3 w-3" /> Vider l'album
    </button>
  );
}

function LogoutButton() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  async function logout() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }
  return (
    <Button variant="ghost" size="sm" onClick={logout} title="Se déconnecter">
      <LogOut className="h-4 w-4" />
    </Button>
  );
}
