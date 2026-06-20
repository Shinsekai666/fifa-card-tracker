import { Check, Minus, Plus, Sparkles } from "lucide-react";
import type { Sticker } from "@/lib/sticker-types";

interface Props {
  sticker: Sticker;
  onCycle: () => void;
  onAdjust: (delta: number) => void;
}

export function StickerSlot({ sticker, onCycle, onAdjust }: Props) {
  const owned = sticker.status !== "missing";
  const isDouble = sticker.status === "double";
  const num = extractNum(sticker.number, sticker.team_code);

  return (
    <div className="flex flex-col items-stretch">
      <button
        onClick={onCycle}
        title={owned ? (isDouble ? "Cliquer pour repasser en manquant" : "Cliquer pour marquer en double") : "Cliquer pour ajouter à l'album"}
        className={[
          "relative aspect-[3/4] w-full overflow-hidden rounded-xl text-left transition-all duration-150 active:scale-95",
          "flex flex-col items-center justify-center border-2 shadow-sm",
          owned
            ? isDouble
              ? "border-accent bg-gradient-to-br from-accent/25 to-accent/5"
              : "border-primary bg-gradient-to-br from-primary/25 to-primary/5"
            : "border-dashed border-border bg-muted/40 hover:border-primary/40 hover:bg-muted/60",
          sticker.is_foil ? "ring-2 ring-accent/70 ring-offset-1" : "",
        ].join(" ")}
      >
        {sticker.is_foil && (
          <Sparkles className="absolute right-1.5 top-1.5 h-3.5 w-3.5 text-accent" strokeWidth={2.5} />
        )}
        {isDouble && (
          <span className="absolute left-1.5 top-1.5 rounded-md bg-accent px-1.5 py-0.5 font-mono text-[10px] font-black text-accent-foreground shadow">
            ×{sticker.doubles_count + 1}
          </span>
        )}
        {owned && !isDouble && (
          <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
            <Check className="h-3 w-3" strokeWidth={3} />
          </span>
        )}

        {/* Gros numéro central style vignette Panini */}
        <div className="flex flex-col items-center justify-center px-1">
          <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-foreground/60">
            {sticker.team_code}
          </span>
          <span className="font-mono text-4xl font-black leading-none text-foreground md:text-5xl">
            {num}
          </span>
        </div>

        {sticker.name && (
          <p className="absolute inset-x-1 bottom-1 truncate text-center text-[9px] font-bold uppercase tracking-wide text-foreground/80">
            {sticker.name}
          </p>
        )}
      </button>

      {isDouble && (
        <div className="mt-1 flex items-center justify-between rounded-md border border-accent/40 bg-accent/10 px-2 py-1">
          <button
            onClick={() => onAdjust(-1)}
            className="flex h-6 w-6 items-center justify-center rounded text-foreground hover:bg-accent/20"
            aria-label="Moins"
          >
            <Minus className="h-3 w-3" />
          </button>
          <span className="font-mono text-xs font-bold tabular-nums">
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
