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
    <div className="relative overflow-hidden bg-[var(--panini-paper)] p-4 md:p-6">
      {/* Bande verte décorative en haut */}
      <div className="absolute inset-x-0 top-0 h-4 bg-[var(--panini-green)]" />
      {/* Bande verte décorative en bas */}
      <div className="absolute inset-x-0 bottom-0 h-4 bg-[var(--panini-green)]" />

      <div className="relative mt-4 mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4">
        {/* Panneau "WE ARE" */}
        <div className="col-span-2 flex flex-col justify-between rounded-md bg-white/40 p-4 ring-1 ring-white/60 sm:col-span-1 md:row-span-2">
          <div>
            <p
              className="font-serif text-3xl font-black uppercase italic leading-[0.95] tracking-tight text-[var(--panini-title)] md:text-4xl"
              style={{ letterSpacing: "-0.02em" }}
            >
              We are
              <br />
              {team.name}
            </p>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-3xl">{team.flag || "🏳️"}</span>
            <p className="font-sans text-[11px] font-bold uppercase tracking-wide text-[var(--panini-title)]/80">
              {team.code} · Federation
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
