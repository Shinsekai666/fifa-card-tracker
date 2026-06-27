import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import QRCode from "qrcode";
import { ArrowLeftRight, ArrowLeft, Check, Copy, Loader2, Minus, Plus, QrCode, Share2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

import { fetchAllStickers, useStickerMutations } from "@/lib/sticker-hooks";
import type { Sticker } from "@/lib/sticker-types";
import {
  buildDoublesList,
  buildMissingList,
  compareWithOther,
  parseNumbers,
  randomToken,
  toShareText,
  type TradeItem,
} from "@/lib/trade";

export const Route = createFileRoute("/_authenticated/echange")({
  head: () => ({ meta: [{ title: "Mode échange · Panini FIFA 2026" }] }),
  component: TradePage,
});

function TradePage() {
  const { data: stickers = [], isLoading } = useQuery({ queryKey: ["stickers"], queryFn: fetchAllStickers });

  return (
    <div className="min-h-screen bg-background">
      <Toaster richColors position="top-center" />
      <div className="mx-auto max-w-5xl px-4 py-6 md:py-10">
        <header className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-accent">Mode échange</p>
            <h1 className="text-2xl font-black tracking-tight md:text-3xl">Échanger mes stickers</h1>
          </div>
          <Button variant="outline" asChild>
            <Link to="/"><ArrowLeft className="mr-2 h-4 w-4" /> Retour</Link>
          </Button>
        </header>

        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <Tabs defaultValue="share">
            <TabsList className="mb-6 grid w-full grid-cols-3">
              <TabsTrigger value="share"><Share2 className="mr-1 h-3.5 w-3.5" /> Mes listes</TabsTrigger>
              <TabsTrigger value="compare"><ArrowLeftRight className="mr-1 h-3.5 w-3.5" /> Comparer</TabsTrigger>
              <TabsTrigger value="trade"><Check className="mr-1 h-3.5 w-3.5" /> Échanger</TabsTrigger>
            </TabsList>

            <TabsContent value="share"><ShareTab stickers={stickers} /></TabsContent>
            <TabsContent value="compare"><CompareTab stickers={stickers} /></TabsContent>
            <TabsContent value="trade"><TradeTab stickers={stickers} /></TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}

/* --------------------------------------- Onglet 1 : Mes listes --------------------------------------- */

function ShareTab({ stickers }: { stickers: Sticker[] }) {
  const doubles = useMemo(() => buildDoublesList(stickers), [stickers]);
  const missing = useMemo(() => buildMissingList(stickers), [stickers]);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  async function generateLink() {
    setGenerating(true);
    try {
      const token = randomToken();
      const { error } = await supabase.from("share_links").insert({
        token,
        kind: "both",
        payload: { doubles, missing, owner: "Lionel" },
      });
      if (error) throw error;
      const url = `${window.location.origin}/partage/${token}`;
      setShareUrl(url);
      setQr(await QRCode.toDataURL(url, { width: 320, margin: 1 }));
      toast.success("Lien généré");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <ListCard title="Mes doubles" items={doubles} withQty subtitle="à proposer à l'échange" />
      <ListCard title="Mes manquants" items={missing} subtitle="à chercher" />

      <Card className="md:col-span-2">
        <CardContent className="p-5">
          <h3 className="text-sm font-bold uppercase tracking-wider">Partager les deux listes</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Génère un lien public (lecture seule) : montre-le, envoie-le ou fais-le scanner.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={generateLink} disabled={generating}>
              {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Share2 className="mr-2 h-4 w-4" />}
              Générer un lien
            </Button>
          </div>

          {shareUrl && (
            <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto]">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Input readOnly value={shareUrl} />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      await navigator.clipboard.writeText(shareUrl);
                      toast.success("Lien copié");
                    }}
                  >
                    <Copy className="mr-1 h-3 w-3" /> Copier
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    if (navigator.share) {
                      await navigator.share({ title: "Mes stickers Panini", url: shareUrl }).catch(() => {});
                    } else {
                      await navigator.clipboard.writeText(shareUrl);
                      toast.success("Lien copié");
                    }
                  }}
                >
                  <Share2 className="mr-1 h-3 w-3" /> Partager via…
                </Button>
                <p className="text-xs text-muted-foreground">
                  Le lien reste valide tant que tu ne le supprimes pas.
                </p>
              </div>
              {qr && (
                <div className="flex flex-col items-center gap-1">
                  <img src={qr} alt="QR code" className="h-32 w-32 rounded border border-border" />
                  <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground"><QrCode className="h-3 w-3" /> Scanne-moi</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ListCard({ title, items, subtitle, withQty }: { title: string; items: TradeItem[]; subtitle: string; withQty?: boolean }) {
  const text = useMemo(() => toShareText(items, { withQty }), [items, withQty]);
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-baseline justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider">
            {title} <span className="text-muted-foreground">({items.length})</span>
          </h3>
          <Button
            size="sm"
            variant="outline"
            disabled={!items.length}
            onClick={async () => {
              await navigator.clipboard.writeText(text);
              toast.success("Liste copiée");
            }}
          >
            <Copy className="mr-1 h-3 w-3" /> Copier
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
        <Textarea readOnly value={text} className="mt-3 h-32 font-mono text-xs" placeholder="Aucun sticker." />
      </CardContent>
    </Card>
  );
}

/* --------------------------------------- Onglet 2 : Comparer --------------------------------------- */

function CompareTab({ stickers }: { stickers: Sticker[] }) {
  const [theirDoublesRaw, setTheirDoublesRaw] = useState("");
  const [theirMissingRaw, setTheirMissingRaw] = useState("");
  const [loadingFromLink, setLoadingFromLink] = useState(false);

  const result = useMemo(() => {
    const td = new Set(parseNumbers(theirDoublesRaw));
    const tm = new Set(parseNumbers(theirMissingRaw));
    return compareWithOther(stickers, td, tm);
  }, [stickers, theirDoublesRaw, theirMissingRaw]);

  async function loadFromLink(value: string) {
    const m = value.match(/\/partage\/([A-Z0-9]+)/i);
    const token = (m ? m[1] : value).trim();
    if (!token) return;
    setLoadingFromLink(true);
    try {
      const { data, error } = await supabase
        .from("share_links")
        .select("payload")
        .eq("token", token.toUpperCase())
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Lien introuvable");
      const p = data.payload as { doubles?: TradeItem[]; missing?: TradeItem[] };
      setTheirDoublesRaw(toShareText(p.doubles ?? []));
      setTheirMissingRaw(toShareText(p.missing ?? []));
      toast.success("Listes importées");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoadingFromLink(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-5">
          <h3 className="mb-2 text-sm font-bold uppercase tracking-wider">Importer la liste de l'autre</h3>
          <p className="mb-3 text-xs text-muted-foreground">
            Colle son lien <code className="rounded bg-muted px-1">/partage/XXXX</code> ou un token.
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="Coller un lien ou un token…"
              onKeyDown={(e) => {
                if (e.key === "Enter") loadFromLink((e.target as HTMLInputElement).value);
              }}
              disabled={loadingFromLink}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-4">
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wider">Ses doubles</h4>
            <Textarea
              value={theirDoublesRaw}
              onChange={(e) => setTheirDoublesRaw(e.target.value)}
              placeholder="MEX2, MEX5, FRA8…"
              className="h-32 font-mono text-xs"
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wider">Ses manquants</h4>
            <Textarea
              value={theirMissingRaw}
              onChange={(e) => setTheirMissingRaw(e.target.value)}
              placeholder="MEX1, ARG3, BRA7…"
              className="h-32 font-mono text-xs"
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <MatchBlock
          title="Je veux"
          subtitle="Il/elle l'a en double, je l'ai pas"
          tone="primary"
          items={result.iWant}
        />
        <MatchBlock
          title="Il/elle veut"
          subtitle="J'en ai en double, il/elle l'a pas"
          tone="accent"
          items={result.theyWant}
        />
      </div>
    </div>
  );
}

function MatchBlock({ title, subtitle, items, tone }: { title: string; subtitle: string; items: Sticker[]; tone: "primary" | "accent" }) {
  const text = useMemo(() => items.map((s) => s.number).join(", "), [items]);
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-baseline justify-between">
          <h4 className="text-sm font-bold uppercase tracking-wider">
            {title} <span className="text-muted-foreground">({items.length})</span>
          </h4>
          <Button
            size="sm"
            variant="outline"
            disabled={!items.length}
            onClick={async () => {
              await navigator.clipboard.writeText(text);
              toast.success("Liste copiée");
            }}
          >
            <Copy className="mr-1 h-3 w-3" /> Copier
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">{subtitle}</p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune correspondance.</p>
          ) : (
            items.map((s) => (
              <span
                key={s.id}
                title={s.name ?? ""}
                className={`rounded-md px-2 py-1 font-mono text-xs font-bold ${
                  tone === "primary"
                    ? "border border-primary/40 bg-primary/15"
                    : "border border-accent/40 bg-accent/15"
                }`}
              >
                {s.number}
              </span>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* --------------------------------------- Onglet 3 : Échanger --------------------------------------- */

function TradeTab({ stickers }: { stickers: Sticker[] }) {
  const { cycle, adjustDoubles } = useStickerMutations();
  const [given, setGiven] = useState<Set<string>>(new Set()); // ids of doubles I'm giving away
  const [received, setReceived] = useState<Set<string>>(new Set()); // ids of missing I'm receiving
  const [confirmOpen, setConfirmOpen] = useState(false);

  const doubles = useMemo(
    () => stickers.filter((s) => s.status === "double" && s.doubles_count > 0),
    [stickers],
  );
  const missing = useMemo(() => stickers.filter((s) => s.status === "missing"), [stickers]);

  function toggle(set: Set<string>, setter: (s: Set<string>) => void, id: string) {
    const n = new Set(set);
    if (n.has(id)) n.delete(id);
    else n.add(id);
    setter(n);
  }

  async function commit() {
    const giveStickers = doubles.filter((s) => given.has(s.id));
    const recvStickers = missing.filter((s) => received.has(s.id));
    // Donnés : -1 (passe à owned si compteur tombe à 0)
    for (const s of giveStickers) adjustDoubles(s, -1);
    // Reçus : missing → owned
    for (const s of recvStickers) cycle(s);
    toast.success(`Échange enregistré · -${giveStickers.length} / +${recvStickers.length}`);
    setGiven(new Set());
    setReceived(new Set());
    setConfirmOpen(false);
  }

  const totalActions = given.size + received.size;

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-2 p-4">
          <p className="text-sm">
            Coche ce que tu <span className="font-bold text-accent">donnes</span> et ce que tu{" "}
            <span className="font-bold text-primary">reçois</span>, puis valide pour mettre à jour l'album.
          </p>
          <Button disabled={totalActions === 0} onClick={() => setConfirmOpen(true)}>
            Valider l'échange ({totalActions})
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <TradeColumn
          title="Je donne (mes doubles)"
          tone="accent"
          empty="Aucun double à proposer."
          items={doubles}
          selected={given}
          onToggle={(id) => toggle(given, setGiven, id)}
          extra={(s) => (
            <span className="font-mono text-[10px] text-muted-foreground">×{s.doubles_count}</span>
          )}
        />
        <TradeColumn
          title="Je reçois (mes manquants)"
          tone="primary"
          empty="Plus aucun manquant !"
          items={missing}
          selected={received}
          onToggle={(id) => toggle(received, setReceived, id)}
        />
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogTitle>Confirmer l'échange</DialogTitle>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-accent">Donnés ({given.size})</p>
              <p className="font-mono text-xs text-muted-foreground">
                {doubles.filter((s) => given.has(s.id)).map((s) => s.number).join(", ") || "—"}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-primary">Reçus ({received.size})</p>
              <p className="font-mono text-xs text-muted-foreground">
                {missing.filter((s) => received.has(s.id)).map((s) => s.number).join(", ") || "—"}
              </p>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>Annuler</Button>
            <Button onClick={commit}>Confirmer</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TradeColumn({
  title,
  items,
  selected,
  onToggle,
  empty,
  tone,
  extra,
}: {
  title: string;
  items: Sticker[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  empty: string;
  tone: "primary" | "accent";
  extra?: (s: Sticker) => React.ReactNode;
}) {
  // group by team for readability
  const groups = useMemo(() => {
    const m = new Map<string, Sticker[]>();
    for (const s of items) {
      const k = s.team_code ?? "—";
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(s);
    }
    return Array.from(m.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [items]);

  return (
    <Card>
      <CardContent className="p-4">
        <h4 className="mb-3 text-sm font-bold uppercase tracking-wider">
          {title} <span className="text-muted-foreground">({items.length})</span>
        </h4>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{empty}</p>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {groups.map(([code, list]) => (
              <div key={code}>
                <p className="mb-1 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{code}</p>
                <div className="flex flex-wrap gap-1.5">
                  {list.map((s) => {
                    const sel = selected.has(s.id);
                    return (
                      <button
                        key={s.id}
                        onClick={() => onToggle(s.id)}
                        title={s.name ?? ""}
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-1 font-mono text-xs font-bold transition active:scale-95 ${
                          sel
                            ? tone === "primary"
                              ? "border border-primary bg-primary text-primary-foreground"
                              : "border border-accent bg-accent text-accent-foreground"
                            : "border border-border bg-muted/40 hover:bg-muted"
                        }`}
                      >
                        {sel && <Check className="h-3 w-3" />}
                        {s.number}
                        {extra && <span className="ml-0.5 opacity-70">{extra(s)}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// unused-import guards
void Minus; void Plus;
