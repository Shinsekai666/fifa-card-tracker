import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ArrowLeft, Loader2, Minus, Plus } from "lucide-react";
import { toast } from "sonner";

import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

import { fetchAllStickers, useStickerMutations } from "@/lib/sticker-hooks";
import type { Sticker } from "@/lib/sticker-types";
import { parseNumbers } from "@/lib/trade";

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
          <TradeTab stickers={stickers} />
        )}
      </div>
    </div>
  );
}


/* --------------------------------------- Échanger --------------------------------------- */


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

      {/* Saisie rapide de nouveaux doubles */}
      <Card>
        <CardContent className="p-5">
          <h3 className="text-sm font-bold uppercase tracking-wider">J'ai reçu de nouveaux doubles</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Tape les codes des doubles reçus (ex&nbsp;: <code className="rounded bg-muted px-1">FRA10, MEX2</code>). Chaque code ajoute&nbsp;+1 à ta pile de doubles.
          </p>
          <div className="mt-3 flex gap-2">
            <Input
              value={doubleInput}
              onChange={(e) => setDoubleInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => { if (e.key === "Enter") addDoubles(); }}
              placeholder="FRA10"
              className="font-mono uppercase"
            />
            <Button variant="secondary" onClick={addDoubles} disabled={!doubleInput.trim()}>
              <Plus className="mr-1 h-4 w-4" /> Ajouter en double
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



