import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useRef, useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FileDown, LayoutGrid, List, ListChecks, Loader2, LogOut, Search, Sparkles, Upload, Trash2 } from "lucide-react";
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
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>(() => {
    if (typeof window === "undefined") return "album";
    return (localStorage.getItem("panini-view") as ViewMode) || "album";
  });

  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("panini-view", view);
  }, [view]);

  const { data: stickers = [], isLoading, refetch } = useQuery({
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

  async function handleImport(file: File) {
    const loading = toast.loading("Import en cours…");
    try {
      const res = await importStickersFromFile(file);
      toast.success(`${res.inserted} stickers importés !`, { id: loading });
      refetch();
    } catch (e) {
      toast.error((e as Error).message, { id: loading });
    }
  }

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
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.json,text/csv,application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleImport(f);
              e.target.value = "";
            }}
          />
          <Button variant="outline" onClick={() => fileRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" /> Importer JSON
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

      {/* View toggle */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">
          {view === "album" ? `${teams.length} équipe${teams.length > 1 ? "s" : ""}` : "Liste complète"}
        </h2>
        <div className="inline-flex rounded-lg border border-border bg-card p-1">
          <ViewBtn active={view === "album"} onClick={() => setView("album")} icon={<LayoutGrid className="h-4 w-4" />}>
            Album
          </ViewBtn>
          <ViewBtn active={view === "list"} onClick={() => setView("list")} icon={<List className="h-4 w-4" />}>
            Liste
          </ViewBtn>
        </div>
      </div>

      {/* Body */}
      {isLoading ? (
        <Loader />
      ) : stickers.length === 0 ? (
        <EmptyState onImport={() => fileRef.current?.click()} />
      ) : view === "album" ? (
        <AlbumView teams={teams} onSelect={setSelectedTeam} />
      ) : (
        <ListView stickers={stickers} />
      )}

      <TeamAlbumDialog teams={teams} selectedCode={selectedTeam} onSelect={setSelectedTeam} />

      <footer className="mt-12 border-t border-border pt-6 text-center text-xs text-muted-foreground">
        Tes modifications sont sauvegardées automatiquement.
      </footer>
    </div>
  );
}

function AlbumView({ teams, onSelect }: { teams: ReturnType<typeof groupByTeam>; onSelect: (code: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {teams.map((t) => <TeamCard key={t.code} group={t} onClick={() => onSelect(t.code)} />)}
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
