import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ChevronLeft, ChevronRight, FileDown, Loader2, Sparkles } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";

import { fetchAllStickers, useStickerMutations } from "@/lib/sticker-hooks";
import { groupByTeam } from "@/lib/sticker-types";
import { StickerSlot } from "@/components/sticker-album/sticker-slot";
import { exportMissingPdf, exportDoublesPdf } from "@/lib/sticker-pdf";

export const Route = createFileRoute("/team/$teamCode")({
  head: () => ({
    meta: [{ title: "Équipe — Mon Classeur Panini" }],
  }),
  component: TeamPage,
  notFoundComponent: () => (
    <div className="p-10 text-center">
      <p>Équipe introuvable.</p>
      <Link to="/" className="text-primary underline">Retour au sommaire</Link>
    </div>
  ),
});

function TeamPage() {
  const { teamCode } = Route.useParams();
  const router = useRouter();
  const { cycle, adjustDoubles } = useStickerMutations();

  const { data: stickers = [], isLoading } = useQuery({
    queryKey: ["stickers"],
    queryFn: fetchAllStickers,
  });

  const teams = useMemo(() => groupByTeam(stickers), [stickers]);
  const idx = teams.findIndex((t) => t.code === teamCode);
  const team = idx >= 0 ? teams[idx] : null;
  const prev = idx > 0 ? teams[idx - 1] : null;
  const next = idx >= 0 && idx < teams.length - 1 ? teams[idx + 1] : null;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center">
        <p className="mb-4 text-muted-foreground">Équipe « {teamCode} » introuvable.</p>
        <Button onClick={() => router.navigate({ to: "/" })}>Retour au sommaire</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Toaster richColors position="top-center" />
      <div className="mx-auto max-w-5xl px-4 py-6 md:py-10">
        <Link to="/" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Retour aux équipes
        </Link>

        {/* Team header */}
        <header
          className={`mb-6 rounded-2xl border-2 p-5 ${
            team.pct === 100 ? "border-accent bg-gradient-to-br from-accent/20 to-transparent" : "border-border bg-card"
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="text-5xl md:text-6xl">{team.flag || "🏳️"}</div>
            <div className="min-w-0 flex-1">
              <p className="font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground">{team.code}</p>
              <h1 className="flex items-center gap-2 text-2xl font-black text-foreground md:text-3xl">
                {team.name}
                {team.isSpecial && <Sparkles className="h-5 w-5 text-accent" />}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                <span className="font-bold text-foreground">{team.owned}</span> / {team.total} possédés
                {team.doubles > 0 && <> · <span className="font-bold text-accent">{team.doubles}</span> double{team.doubles > 1 ? "s" : ""}</>}
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-black tabular-nums text-primary md:text-4xl">{team.pct}%</p>
            </div>
          </div>
          <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-muted">
            <div
              className={team.pct === 100 ? "h-full bg-accent" : "h-full bg-primary"}
              style={{ width: `${team.pct}%` }}
            />
          </div>
        </header>

        {/* Stickers grid - 4 cols like an album page */}
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 md:gap-4">
          {team.stickers.map((s) => (
            <StickerSlot key={s.id} sticker={s} onCycle={() => cycle(s)} onAdjust={(d) => adjustDoubles(s, d)} />
          ))}
        </div>

        {/* Navigation prev / next */}
        <nav className="mt-8 flex items-center justify-between gap-3">
          {prev ? (
            <Link
              to="/team/$teamCode"
              params={{ teamCode: prev.code }}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm hover:bg-muted"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="text-base">{prev.flag}</span>
              <span className="font-medium">{prev.name}</span>
            </Link>
          ) : <span />}
          {next ? (
            <Link
              to="/team/$teamCode"
              params={{ teamCode: next.code }}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm hover:bg-muted"
            >
              <span className="font-medium">{next.name}</span>
              <span className="text-base">{next.flag}</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          ) : <span />}
        </nav>

        <div className="mt-8 flex flex-wrap justify-center gap-2 border-t border-border pt-6">
          <Button variant="outline" size="sm" onClick={() => exportMissingPdf(stickers)}>
            <FileDown className="mr-2 h-4 w-4" /> PDF manquants (tout l'album)
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportDoublesPdf(stickers)}>
            <FileDown className="mr-2 h-4 w-4" /> PDF doubles (tout l'album)
          </Button>
        </div>
      </div>
    </div>
  );
}
