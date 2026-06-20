import { Check, Minus, Plus, Sparkles, X } from "lucide-react";
import type { Sticker } from "@/lib/sticker-types";

interface Props {
  sticker: Sticker;
  onCycle: () => void;
  onAdjust: (delta: number) => void;
}

export function StickerSlot({ sticker, onCycle, onAdjust }: Props) {
  const owned = sticker.status !== "missing";
  const isDouble = sticker.status === "double";

  return (
    <div className="flex flex-col items-stretch">
      <button
        onClick={onCycle}
        className={[
          "relative aspect-[3/4] w-full rounded-lg p-2 text-left transition-all duration-150 active:scale-95",
          "flex flex-col justify-between border-2",
          owned
            ? "border-primary/40 bg-gradient-to-br from-primary/15 to-primary/5 shadow-sm"
            : "border-dashed border-border bg-muted/40 hover:border-primary/40",
          sticker.is_foil ? "ring-2 ring-accent/60 ring-offset-1" : "",
        ].join(" ")}
      >
        {sticker.is_foil && (
          <Sparkles className="absolute right-1 top-1 h-3.5 w-3.5 text-accent" strokeWidth={2.5} />
        )}
        {isDouble && (
          <span className="absolute left-1 top-1 rounded-md bg-accent px-1.5 py-0.5 font-mono text-[10px] font-bold text-accent-foreground shadow-sm">
            ×{sticker.doubles_count + 1}
          </span>
        )}
        <div className="mt-3 text-center">
          <div className="font-mono text-[11px] font-bold text-primary/70">{sticker.team_code}</div>
          <div className="font-mono text-lg font-black leading-none text-primary">
            {extractNum(sticker.number, sticker.team_code)}
          </div>
        </div>
        <div className="flex min-h-[28px] items-end justify-center">
          {owned ? (
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
              <Check className="h-4 w-4" strokeWidth={3} />
            </div>
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-background/60 text-muted-foreground">
              <X className="h-3.5 w-3.5" />
            </div>
          )}
        </div>
        {sticker.name && (
          <p className="truncate text-center text-[10px] font-medium uppercase tracking-wide text-foreground/80">
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
            {sticker.doubles_count} double{sticker.doubles_count > 1 ? "s" : ""}
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
