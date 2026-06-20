import { Check, Minus, Plus, Sparkles } from "lucide-react";
import type { Sticker } from "@/lib/sticker-types";

interface Props {
  sticker: Sticker;
  onCycle: () => void;
  onAdjust: (delta: number) => void;
}

export function PaniniSlot({ sticker, onCycle, onAdjust }: Props) {
  const owned = sticker.status !== "missing";
  const isDouble = sticker.status === "double";
  const num = extractNum(sticker.number, sticker.team_code);

  return (
    <div className="flex flex-col items-stretch">
      <button
        onClick={onCycle}
        title={
          owned
            ? isDouble
              ? "Cliquer pour repasser en manquant"
              : "Cliquer pour marquer en double"
            : "Cliquer pour coller le sticker"
        }
        className={[
          "relative aspect-[3/4] w-full overflow-hidden rounded-md text-left transition active:scale-95",
          owned
            ? "bg-[var(--panini-owned)] text-[var(--panini-owned-foreground)] shadow-md"
            : "bg-[var(--panini-slot)] hover:brightness-105",
        ].join(" ")}
      >



        {sticker.is_foil && (
          <Sparkles
            className={`absolute right-1.5 top-1.5 h-3.5 w-3.5 ${owned ? "text-[var(--panini-owned-foreground)]" : "text-amber-700"}`}
            strokeWidth={2.5}
          />
        )}

        {/* Contenu vide : CODE + numéro centrés */}
        {!owned && (
          <div className="absolute inset-0 flex flex-col items-center justify-center px-1">
            <span className="font-sans text-[10px] font-black uppercase tracking-[0.18em] text-[var(--panini-slot-ink)]">
              {sticker.team_code}
            </span>
            <span className="font-sans text-3xl font-black leading-none text-[var(--panini-slot-ink)] md:text-4xl">
              {num}
            </span>
          </div>
        )}

        {/* Contenu collé : vignette bleu ciel */}
        {owned && (
          <>
            <div className="absolute inset-0 flex flex-col items-center justify-center px-1">
              <span className="font-sans text-[10px] font-black uppercase tracking-[0.18em] opacity-70">
                {sticker.team_code}
              </span>
              <span className="font-sans text-4xl font-black leading-none md:text-5xl">{num}</span>
            </div>
            {isDouble ? (
              <span className="absolute left-1.5 top-1.5 rounded-md bg-accent px-1.5 py-0.5 font-mono text-[10px] font-black text-accent-foreground shadow">
                ×{sticker.doubles_count + 1}
              </span>
            ) : (
              <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--panini-owned-foreground)] text-[var(--panini-owned)] shadow">
                <Check className="h-3 w-3" strokeWidth={3} />
              </span>
            )}
          </>
        )}

        {/* Nom du joueur (toujours visible, style album) */}
        {sticker.name && (
          <p
            className={`absolute inset-x-1 bottom-1 truncate text-center text-[9px] font-black uppercase tracking-wide ${
              owned ? "text-[var(--panini-owned-foreground)]" : "text-[var(--panini-slot-ink)]"
            }`}
          >
            {sticker.name}
          </p>
        )}
      </button>

      {isDouble && (
        <div className="mt-1 flex items-center justify-between rounded-md border border-accent/40 bg-accent/15 px-2 py-1">
          <button
            onClick={() => onAdjust(-1)}
            className="flex h-6 w-6 items-center justify-center rounded text-foreground hover:bg-accent/20"
            aria-label="Moins"
          >
            <Minus className="h-3 w-3" />
          </button>
          <span className="font-mono text-xs font-bold tabular-nums text-foreground">
            +{sticker.doubles_count}
          </span>
          <button
            onClick={() => onAdjust(1)}
            className="flex h-6 w-6 items-center justify-center rounded text-foreground hover:bg-accent/20"
            aria-label="Plus"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}

function extractNum(number: string, teamCode: string | null): string {
  if (!teamCode) return number;
  const stripped = number.replace(new RegExp(`^${teamCode}`, "i"), "");
  return stripped || number;
}
