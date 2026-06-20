import { ChevronLeft, ChevronRight, Sparkles, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StickerSlot } from "./sticker-slot";
import { TeamAlbumSpread } from "./team-album-spread";
import { useStickerMutations } from "@/lib/sticker-hooks";
import type { TeamGroup } from "@/lib/sticker-types";

interface Props {
  teams: TeamGroup[];
  selectedCode: string | null;
  onSelect: (code: string | null) => void;
}

export function TeamAlbumDialog({ teams, selectedCode, onSelect }: Props) {
  const { cycle, adjustDoubles } = useStickerMutations();
  const idx = selectedCode ? teams.findIndex((t) => t.code === selectedCode) : -1;
  const team = idx >= 0 ? teams[idx] : null;
  const prev = idx > 0 ? teams[idx - 1] : null;
  const next = idx >= 0 && idx < teams.length - 1 ? teams[idx + 1] : null;

  const extractNum = (number: string, teamCode: string | null) => {
    if (!teamCode) return number;
    return number.replace(new RegExp(`^${teamCode}`, "i"), "") || number;
  };
  const isBadge = (n: string) => n === "1" || n === "13";

  const badgeStickers = team ? team.stickers.filter((s) => isBadge(extractNum(s.number, s.team_code))) : [];
  const gridStickers = team ? team.stickers.filter((s) => !isBadge(extractNum(s.number, s.team_code))) : [];

  return (
    <Dialog open={!!team} onOpenChange={(o) => !o && onSelect(null)}>
      <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto p-0 gap-0">
        {team && (
          <>
            <DialogTitle className="sr-only">Équipe {team.name}</DialogTitle>

            {/* En-tête style album */}
            <div
              className={`relative rounded-t-lg border-b-2 p-5 ${
                team.pct === 100
                  ? "border-accent bg-gradient-to-br from-accent/20 to-transparent"
                  : "border-border bg-gradient-to-br from-primary/10 to-transparent"
              }`}
            >
              <button
                onClick={() => onSelect(null)}
                className="absolute right-3 top-3 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Fermer"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-4 pr-8">
                <div className="text-5xl md:text-6xl">{team.flag || "🏳️"}</div>
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {team.code}
                  </p>
                  <h2 className="flex items-center gap-2 text-2xl font-black text-foreground md:text-3xl">
                    {team.name}
                    {team.isSpecial && <Sparkles className="h-5 w-5 text-accent" />}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    <span className="font-bold text-foreground">{team.owned}</span> / {team.total} possédés
                    {team.doubles > 0 && (
                      <>
                        {" · "}
                        <span className="font-bold text-accent">{team.doubles}</span> double
                        {team.doubles > 1 ? "s" : ""}
                      </>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {badgeStickers.length > 0 && (
                    <div className="flex gap-2">
                      {badgeStickers.map((s) => (
                        <div key={s.id} className="w-14 md:w-16">
                          <StickerSlot
                            sticker={s}
                            onCycle={() => cycle(s)}
                            onAdjust={(d) => adjustDoubles(s, d)}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-3xl font-black tabular-nums text-primary md:text-4xl">{team.pct}%</p>
                </div>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={team.pct === 100 ? "h-full bg-accent" : "h-full bg-primary"}
                  style={{ width: `${team.pct}%` }}
                />
              </div>
            </div>

            {/* Grille style page d'album */}
            {team.isSpecial ? (
              <div className="bg-muted/30 p-4 md:p-6">
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 md:gap-4">
                  {gridStickers.map((s) => (
                    <StickerSlot
                      key={s.id}
                      sticker={s}
                      onCycle={() => cycle(s)}
                      onAdjust={(d) => adjustDoubles(s, d)}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <TeamAlbumSpread
                team={team}
                stickers={gridStickers}
                onCycle={(s) => cycle(s)}
                onAdjust={(s, d) => adjustDoubles(s, d)}
              />
            )}

            {/* Navigation entre équipes */}
            <div className="flex items-center justify-between gap-2 border-t border-border bg-background p-3">
              <Button
                variant="outline"
                size="sm"
                disabled={!prev}
                onClick={() => prev && onSelect(prev.code)}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                <span className="mr-1">{prev?.flag}</span>
                <span className="hidden truncate sm:inline">{prev?.name ?? "—"}</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onSelect(null)}>
                Fermer
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!next}
                onClick={() => next && onSelect(next.code)}
              >
                <span className="hidden truncate sm:inline">{next?.name ?? "—"}</span>
                <span className="ml-1">{next?.flag}</span>
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
