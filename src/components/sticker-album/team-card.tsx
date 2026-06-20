import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import type { TeamGroup } from "@/lib/sticker-types";

export function TeamCard({ group }: { group: TeamGroup }) {
  const complete = group.pct === 100;
  return (
    <Link
      to="/team/$teamCode"
      params={{ teamCode: group.code }}
      className={[
        "group relative flex flex-col rounded-xl border-2 bg-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg",
        complete ? "border-accent bg-gradient-to-br from-accent/15 to-transparent" : "border-border hover:border-primary/40",
        group.isSpecial ? "ring-2 ring-accent/40" : "",
      ].join(" ")}
    >
      {group.isSpecial && (
        <Sparkles className="absolute right-3 top-3 h-4 w-4 text-accent" strokeWidth={2.5} />
      )}

      <div className="mb-3 flex items-start gap-3">
        <span className="text-3xl leading-none">{group.flag || "🏳️"}</span>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {group.code}
          </p>
          <h3 className="truncate text-sm font-bold leading-tight text-foreground">{group.name}</h3>
        </div>
      </div>

      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-2xl font-black tabular-nums text-primary">
          {group.owned}<span className="text-sm font-normal text-muted-foreground">/{group.total}</span>
        </span>
        <span className={`font-mono text-xs font-bold ${complete ? "text-accent" : "text-muted-foreground"}`}>
          {group.pct}%
        </span>
      </div>

      <div className="flex h-2 overflow-hidden rounded-full bg-muted">
        {group.total > 0 && (
          <>
            <div className="bg-primary" style={{ width: `${((group.owned - (group.doubles > 0 ? 1 : 0)) / group.total) * 100}%` }} />
            <div className="bg-accent" style={{ width: `${(Math.min(group.doubles, group.owned) / group.total) * 100}%` }} />
          </>
        )}
      </div>

      {group.doubles > 0 && (
        <p className="mt-2 text-[10px] text-muted-foreground">
          {group.doubles} double{group.doubles > 1 ? "s" : ""} à échanger
        </p>
      )}
    </Link>
  );
}
