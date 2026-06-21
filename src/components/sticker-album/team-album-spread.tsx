import type { Sticker, TeamGroup } from "@/lib/sticker-types";
import { PaniniSlot } from "./panini-slot";

interface Props {
  team: TeamGroup;
  stickers: Sticker[];
  onCycle: (s: Sticker) => void;
  onAdjust: (s: Sticker, delta: number) => void;
}

export function TeamAlbumSpread({ team, stickers, onCycle, onAdjust }: Props) {
  return (
    <div className="relative overflow-hidden bg-[var(--panini-paper)] p-2 sm:p-6">
      {/* Bande verte décorative en haut */}
      <div className="absolute inset-x-0 top-0 h-3 sm:h-4 bg-[var(--panini-green)]" />
      {/* Bande verte décorative en bas */}
      <div className="absolute inset-x-0 bottom-0 h-3 sm:h-4 bg-[var(--panini-green)]" />

      <div className="relative mt-3 mb-3 grid grid-cols-2 gap-2 sm:mt-4 sm:mb-4 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 md:gap-4">
        {/* Panneau "WE ARE" */}
        <div className="col-span-2 flex items-center justify-between rounded-md bg-white/40 p-2 ring-1 ring-white/60 sm:col-span-1 sm:flex-col sm:items-stretch sm:justify-between sm:p-3">
          <p
            className="font-serif text-lg font-black uppercase italic leading-[0.95] tracking-tight text-[var(--panini-title)] sm:text-xl md:text-2xl"
            style={{ letterSpacing: "-0.02em" }}
          >
            We are
            <br className="hidden sm:inline" />
            <span className="sm:hidden"> </span>
            {team.name}
          </p>
          <div className="flex items-center gap-2 sm:mt-2">
            <span className="text-2xl">{team.flag || "🏳️"}</span>
            <p className="font-sans text-[10px] font-bold uppercase tracking-wide text-[var(--panini-title)]/80">
              {team.code}
            </p>
          </div>
        </div>

        {stickers.map((s) => (
          <PaniniSlot
            key={s.id}
            sticker={s}
            onCycle={() => onCycle(s)}
            onAdjust={(d) => onAdjust(s, d)}
          />
        ))}
      </div>
    </div>
  );
}
