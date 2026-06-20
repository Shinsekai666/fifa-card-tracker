import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, Download, FileDown, Loader2, Plus, Search, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import type { Sticker, StickerStatus } from "@/lib/sticker-types";
import { STATUS_LABEL } from "@/lib/sticker-types";
import { exportDoublesPdf, exportMissingPdf } from "@/lib/sticker-pdf";
import { importStickersFromCsv } from "@/lib/sticker-import";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mon Classeur Panini FIFA 2026" },
      { name: "description", content: "Gère ton album Panini FIFA 2026 : stickers possédés, doubles, manquants, avec export PDF." },
    ],
  }),
  component: AlbumPage,
});

function AlbumPage() {
  return (
    <div className="min-h-screen bg-background">
      <Toaster richColors position="top-center" />
      <Album />
    </div>
  );
}

function Album() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | StickerStatus>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [addOpen, setAddOpen] = useState(false);

  const { data: stickers = [], isLoading } = useQuery({
    queryKey: ["stickers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stickers")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("number", { ascending: true });
      if (error) throw error;
      return data as Sticker[];
    },
  });

  const categories = useMemo(() => {
    const set = new Set<string>();
    stickers.forEach((s) => s.category && set.add(s.category));
    return Array.from(set).sort();
  }, [stickers]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return stickers.filter((s) => {
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      if (categoryFilter !== "all" && s.category !== categoryFilter) return false;
      if (q) {
        const hay = `${s.number} ${s.name ?? ""} ${s.category ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [stickers, search, statusFilter, categoryFilter]);

  const stats = useMemo(() => {
    const total = stickers.length;
    const owned = stickers.filter((s) => s.status !== "missing").length;
    const missing = stickers.filter((s) => s.status === "missing").length;
    const doublesTotal = stickers.reduce((acc, s) => acc + (s.status === "double" ? s.doubles_count : 0), 0);
    const pct = total ? Math.round((owned / total) * 100) : 0;
    return { total, owned, missing, doublesTotal, pct };
  }, [stickers]);

  const updateMut = useMutation({
    mutationFn: async (p: { id: string; patch: Partial<Sticker> }) => {
      const { error } = await supabase.from("stickers").update(p.patch).eq("id", p.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["stickers"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("stickers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stickers"] });
      toast.success("Sticker supprimé");
    },
  });

  function setStatus(s: Sticker, status: StickerStatus) {
    const patch: Partial<Sticker> = { status };
    if (status === "missing") patch.doubles_count = 0;
    if (status === "owned") patch.doubles_count = 0;
    if (status === "double" && s.doubles_count < 1) patch.doubles_count = 1;
    updateMut.mutate({ id: s.id, patch });
  }

  function adjustDoubles(s: Sticker, delta: number) {
    const next = Math.max(0, s.doubles_count + delta);
    const status: StickerStatus = next === 0 ? "owned" : "double";
    updateMut.mutate({ id: s.id, patch: { doubles_count: next, status } });
  }

  async function handleImport(file: File) {
    try {
      const res = await importStickersFromCsv(file);
      toast.success(`${res.inserted} stickers importés / mis à jour`);
      qc.invalidateQueries({ queryKey: ["stickers"] });
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:py-12">
      {/* Header */}
      <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-accent">Panini · FIFA 2026</p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">Mon classeur</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Suis ta collection, gère tes doubles et exporte tes listes en un clic.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleImport(f);
              e.target.value = "";
            }}
          />
          <Button variant="outline" onClick={() => fileRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" /> Importer CSV
          </Button>
          <Button variant="outline" onClick={() => exportMissingPdf(stickers)} disabled={!stats.missing}>
            <FileDown className="mr-2 h-4 w-4" /> PDF manquants
          </Button>
          <Button variant="outline" onClick={() => exportDoublesPdf(stickers)} disabled={!stats.doublesTotal}>
            <FileDown className="mr-2 h-4 w-4" /> PDF doubles
          </Button>
          <AddDialog open={addOpen} setOpen={setAddOpen} maxOrder={stickers.length} />
        </div>
      </header>

      {/* Stats */}
      <section className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Progression" value={`${stats.pct}%`} sub={`${stats.owned} / ${stats.total}`} highlight />
        <StatCard label="Possédés" value={String(stats.owned)} sub="dans l'album" />
        <StatCard label="Manquants" value={String(stats.missing)} sub="à trouver" />
        <StatCard label="Doubles" value={String(stats.doublesTotal)} sub="à échanger" />
      </section>

      {/* Filters */}
      <section className="mb-6 flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par numéro, nom ou équipe…"
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
          <SelectTrigger className="md:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="missing">Manquants</SelectItem>
            <SelectItem value="owned">Possédés</SelectItem>
            <SelectItem value="double">Doubles</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="md:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les équipes</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </section>

      {/* Grid */}
      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : stickers.length === 0 ? (
        <EmptyState onAdd={() => setAddOpen(true)} onImport={() => fileRef.current?.click()} />
      ) : filtered.length === 0 ? (
        <p className="py-20 text-center text-sm text-muted-foreground">Aucun sticker ne correspond aux filtres.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((s) => (
            <StickerCard
              key={s.id}
              sticker={s}
              onStatus={(st) => setStatus(s, st)}
              onAdjust={(d) => adjustDoubles(s, d)}
              onDelete={() => deleteMut.mutate(s.id)}
            />
          ))}
        </div>
      )}

      <footer className="mt-12 border-t border-border pt-6 text-center text-xs text-muted-foreground">
        Les modifications sont sauvegardées automatiquement dans la base.
      </footer>
    </div>
  );
}

function StatCard({ label, value, sub, highlight }: { label: string; value: string; sub: string; highlight?: boolean }) {
  return (
    <Card className={highlight ? "border-accent/50 bg-gradient-to-br from-accent/10 to-transparent" : ""}>
      <CardContent className="p-4">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </CardContent>
    </Card>
  );
}

function StickerCard({
  sticker,
  onStatus,
  onAdjust,
  onDelete,
}: {
  sticker: Sticker;
  onStatus: (s: StickerStatus) => void;
  onAdjust: (delta: number) => void;
  onDelete: () => void;
}) {
  const bg =
    sticker.status === "missing"
      ? "bg-card"
      : sticker.status === "owned"
      ? "bg-[color-mix(in_oklch,var(--success)_8%,var(--card))]"
      : "bg-[color-mix(in_oklch,var(--accent)_15%,var(--card))]";

  return (
    <Card className={`group relative overflow-hidden transition ${bg}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-lg font-bold text-primary">#{sticker.number}</span>
              {sticker.status === "double" && (
                <Badge className="bg-accent text-accent-foreground hover:bg-accent">×{sticker.doubles_count + 1}</Badge>
              )}
            </div>
            <p className="mt-1 truncate text-sm font-semibold text-foreground">{sticker.name || "—"}</p>
            {sticker.category && <p className="truncate text-xs text-muted-foreground">{sticker.category}</p>}
          </div>
          <button
            onClick={onDelete}
            className="rounded-md p-1 text-muted-foreground opacity-0 transition hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
            aria-label="Supprimer"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-1">
          <StatusBtn active={sticker.status === "missing"} onClick={() => onStatus("missing")} title={STATUS_LABEL.missing}>
            <X className="h-4 w-4" />
          </StatusBtn>
          <StatusBtn active={sticker.status === "owned"} onClick={() => onStatus("owned")} title={STATUS_LABEL.owned}>
            <Check className="h-4 w-4" />
          </StatusBtn>
          <StatusBtn active={sticker.status === "double"} onClick={() => onStatus("double")} title={STATUS_LABEL.double}>
            <Copy className="h-4 w-4" />
          </StatusBtn>
        </div>

        {sticker.status === "double" && (
          <div className="mt-2 flex items-center justify-between rounded-md bg-background/60 px-2 py-1.5">
            <span className="text-xs text-muted-foreground">Doubles :</span>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => onAdjust(-1)}>−</Button>
              <span className="w-6 text-center font-mono text-sm font-bold">{sticker.doubles_count}</span>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => onAdjust(1)}>+</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatusBtn({
  active,
  onClick,
  title,
  children,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`flex h-9 items-center justify-center rounded-md border text-sm transition ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function EmptyState({ onAdd, onImport }: { onAdd: () => void; onImport: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-20 text-center">
      <Download className="mb-3 h-10 w-10 text-muted-foreground" />
      <h3 className="text-lg font-semibold">Ton classeur est vide</h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        Importe un fichier CSV avec tes stickers (colonnes : <code className="rounded bg-muted px-1">number</code>,
        <code className="ml-1 rounded bg-muted px-1">name</code>,
        <code className="ml-1 rounded bg-muted px-1">category</code>) ou ajoute-les un par un.
      </p>
      <div className="mt-4 flex gap-2">
        <Button onClick={onImport}><Upload className="mr-2 h-4 w-4" /> Importer CSV</Button>
        <Button variant="outline" onClick={onAdd}><Plus className="mr-2 h-4 w-4" /> Ajouter un sticker</Button>
      </div>
    </div>
  );
}

function AddDialog({ open, setOpen, maxOrder }: { open: boolean; setOpen: (v: boolean) => void; maxOrder: number }) {
  const qc = useQueryClient();
  const [number, setNumber] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");

  const addMut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("stickers").insert({
        number: number.trim(),
        name: name.trim() || null,
        category: category.trim() || null,
        sort_order: maxOrder,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Sticker ajouté");
      qc.invalidateQueries({ queryKey: ["stickers"] });
      setNumber(""); setName(""); setCategory("");
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="mr-2 h-4 w-4" /> Ajouter</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter un sticker</DialogTitle>
          <DialogDescription>Saisis au minimum le numéro.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="num">Numéro *</Label>
            <Input id="num" value={number} onChange={(e) => setNumber(e.target.value)} placeholder="ex. 12, FWC1, FRA3" />
          </div>
          <div>
            <Label htmlFor="nom">Nom</Label>
            <Input id="nom" value={name} onChange={(e) => setName(e.target.value)} placeholder="ex. Mbappé" />
          </div>
          <div>
            <Label htmlFor="cat">Équipe / Catégorie</Label>
            <Input id="cat" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="ex. France" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
          <Button onClick={() => addMut.mutate()} disabled={!number.trim() || addMut.isPending}>
            {addMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Ajouter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
