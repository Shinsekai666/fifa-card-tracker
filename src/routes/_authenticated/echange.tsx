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
        payload: { doubles, missing, owner: "Lionel" } as never,
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
  const { adjustDoubles, setStatus } = useStickerMutations();
  const [input, setInput] = useState("");
  const [doubleInput, setDoubleInput] = useState("");
  const [search, setSearch] = useState("");


  const doubles = useMemo(
    () => stickers.filter((s) => s.status === "double" && s.doubles_count > 0),
    [stickers],
  );

  const byNumber = useMemo(() => {
    const m = new Map<string, Sticker>();
    for (const s of stickers) m.set(s.number.toUpperCase(), s);
    return m;
  }, [stickers]);

  function giveOne(s: Sticker) {
    adjustDoubles(s, -1);
    const reste = s.doubles_count - 1;
    toast.success(reste > 0 ? `${s.number} donné (reste ×${reste})` : `${s.number} donné`);
  }

  function addReceived() {
    const codes = parseNumbers(input);
    if (codes.length === 0) return;
    let added = 0;
    const unknown: string[] = [];
    for (const code of codes) {
      const s = byNumber.get(code);
      if (!s) { unknown.push(code); continue; }
      if (s.status === "missing") {
        setStatus(s, "owned");
      } else {
        // déjà possédé → devient un double (ou +1)
        adjustDoubles(s, +1);
      }
      added++;
    }
    setInput("");
    if (added) toast.success(`${added} carte${added > 1 ? "s" : ""} ajoutée${added > 1 ? "s" : ""}`);
    if (unknown.length) toast.error(`Inconnu : ${unknown.join(", ")}`);
  }

  function addDoubles() {
    const codes = parseNumbers(doubleInput);
    if (codes.length === 0) return;
    let added = 0;
    const unknown: string[] = [];
    for (const code of codes) {
      const s = byNumber.get(code);
      if (!s) { unknown.push(code); continue; }
      if (s.status === "missing") {
        // d'abord owned puis +1 double
        setStatus(s, "owned");
        adjustDoubles({ ...s, status: "owned", doubles_count: 0 }, +1);
      } else {
        adjustDoubles(s, +1);
      }
      added++;
    }
    setDoubleInput("");
    if (added) toast.success(`${added} double${added > 1 ? "s" : ""} ajouté${added > 1 ? "s" : ""}`);
    if (unknown.length) toast.error(`Inconnu : ${unknown.join(", ")}`);
  }

  // filtered + grouped doubles
  const filteredDoubles = useMemo(() => {
    const q = search.trim().toUpperCase();
    if (!q) return doubles;
    return doubles.filter(
      (s) => s.number.toUpperCase().includes(q) || (s.name ?? "").toUpperCase().includes(q),
    );
  }, [doubles, search]);

  const groups = useMemo(() => {
    const m = new Map<string, Sticker[]>();
    for (const s of filteredDoubles) {
      const k = s.team_code ?? "—";
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(s);
    }
    return Array.from(m.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filteredDoubles]);


  return (
    <div className="space-y-4">
      {/* Saisie rapide des cartes reçues */}
      <Card>
        <CardContent className="p-5">
          <h3 className="text-sm font-bold uppercase tracking-wider">J'ai reçu de nouvelles cartes</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Tape un ou plusieurs codes (ex&nbsp;: <code className="rounded bg-muted px-1">FRA10</code>,{" "}
            <code className="rounded bg-muted px-1">MEX2, BRA7</code>) puis valide. Si tu l'avais déjà, elle passe en double.
          </p>
          <div className="mt-3 flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => { if (e.key === "Enter") addReceived(); }}
              placeholder="FRA10"
              className="font-mono uppercase"
              autoFocus
            />
            <Button onClick={addReceived} disabled={!input.trim()}>
              <Plus className="mr-1 h-4 w-4" /> Valider
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Doubles à donner — un clic = donné */}
      <Card>
        <CardContent className="p-5">
          <h3 className="text-sm font-bold uppercase tracking-wider">
            Mes doubles à donner <span className="text-muted-foreground">({doubles.length})</span>
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Clique sur une carte quand tu la donnes : elle disparaît de tes doubles.
          </p>

          <div className="mt-3">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher (ex. FRA, MEX10, nom du joueur…)"
              className="font-mono"
            />
          </div>

          {doubles.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">Aucun double à donner.</p>
          ) : filteredDoubles.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">Aucun résultat pour « {search} ».</p>
          ) : (
            <div className="mt-4 space-y-3 max-h-[65vh] overflow-y-auto pr-1">
              {groups.map(([code, list]) => (

                <div key={code}>
                  <p className="mb-1 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{code}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {list.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => giveOne(s)}
                        title={`${s.name ?? ""} — clic pour donner`}
                        className="inline-flex items-center gap-1 rounded-md border border-accent/40 bg-accent/15 px-2 py-1 font-mono text-xs font-bold transition hover:bg-accent hover:text-accent-foreground active:scale-95"
                      >
                        <Minus className="h-3 w-3" />
                        {s.number}
                        {s.doubles_count > 1 && <span className="ml-0.5 opacity-70">×{s.doubles_count}</span>}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// unused-import guards
void Check;

