import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Copy, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import type { TradeItem } from "@/lib/trade";
import { toShareText } from "@/lib/trade";

export const Route = createFileRoute("/partage/$token")({
  ssr: false,
  head: () => ({ meta: [{ title: "Liste partagée · Panini FIFA 2026" }] }),
  component: SharePage,
});

interface SharePayload {
  owner?: string;
  doubles?: TradeItem[];
  missing?: TradeItem[];
}

function SharePage() {
  const { token } = Route.useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ["share", token],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("share_links")
        .select("kind, payload, created_at, expires_at")
        .eq("token", token)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Lien introuvable ou expiré.");
      return data;
    },
  });

  const payload = (data?.payload ?? {}) as SharePayload;
  const doubles = payload.doubles ?? [];
  const missing = payload.missing ?? [];

  return (
    <div className="min-h-screen bg-background">
      <Toaster richColors position="top-center" />
      <div className="mx-auto max-w-3xl px-4 py-8">
        <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-accent">Panini · FIFA World Cup 2026</p>
        <h1 className="text-2xl font-black tracking-tight md:text-3xl">
          Liste partagée{payload.owner ? ` de ${payload.owner}` : ""}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Utilise cette liste pour proposer un échange. Aucun compte requis.
        </p>

        {isLoading && (
          <div className="mt-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        )}
        {error && (
          <p className="mt-10 rounded-md border border-destructive/40 bg-destructive/10 p-4 text-center text-sm text-destructive">
            {(error as Error).message}
          </p>
        )}

        {data && (
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {doubles.length > 0 && <ListBlock title="Doubles à échanger" items={doubles} withQty tone="accent" />}
            {missing.length > 0 && <ListBlock title="Stickers manquants" items={missing} tone="muted" />}
          </div>
        )}
      </div>
    </div>
  );
}

function ListBlock({ title, items, tone, withQty }: { title: string; items: TradeItem[]; tone: "accent" | "muted"; withQty?: boolean }) {
  const [copied, setCopied] = useState(false);
  const text = useMemo(() => toShareText(items, { withQty }), [items, withQty]);
  const byTeam = useMemo(() => {
    const m = new Map<string, TradeItem[]>();
    for (const it of items) {
      const k = it.code ?? "—";
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(it);
    }
    return Array.from(m.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [items]);

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold uppercase tracking-wider">
          {title} <span className="text-muted-foreground">({items.length})</span>
        </h2>
        <Button
          size="sm"
          variant="outline"
          onClick={async () => {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            toast.success("Liste copiée");
            setTimeout(() => setCopied(false), 1500);
          }}
        >
          <Copy className="mr-1 h-3 w-3" /> {copied ? "Copié" : "Copier"}
        </Button>
      </div>
      <div className="space-y-3">
        {byTeam.map(([code, list]) => (
          <div key={code}>
            <p className="mb-1 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{code}</p>
            <div className="flex flex-wrap gap-1.5">
              {list.map((it) => (
                <span
                  key={it.number}
                  className={`inline-flex items-center rounded-md px-2 py-1 font-mono text-xs font-bold ${
                    tone === "accent"
                      ? "border border-accent/40 bg-accent/15 text-foreground"
                      : "border border-dashed border-border bg-muted/40 text-foreground"
                  }`}
                >
                  {it.number}
                  {withQty && it.qty && it.qty > 1 ? <span className="ml-1 text-accent">×{it.qty}</span> : null}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
