import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cycleStatus, type Sticker, type StickerStatus } from "@/lib/sticker-types";
import { toast } from "sonner";

export function useStickerMutations() {
  const qc = useQueryClient();

  const update = useMutation({
    mutationFn: async (p: { id: string; patch: Partial<Sticker> }) => {
      const { error } = await supabase.from("stickers").update(p.patch).eq("id", p.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["stickers"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  return {
    cycle: (s: Sticker) => update.mutate({ id: s.id, patch: cycleStatus(s) }),
    setStatus: (s: Sticker, status: StickerStatus) => {
      const patch: Partial<Sticker> = { status };
      if (status === "missing" || status === "owned") patch.doubles_count = 0;
      if (status === "double" && s.doubles_count < 1) patch.doubles_count = 1;
      update.mutate({ id: s.id, patch });
    },
    adjustDoubles: (s: Sticker, delta: number) => {
      const next = Math.max(0, s.doubles_count + delta);
      const status: StickerStatus = next === 0 ? "owned" : "double";
      update.mutate({ id: s.id, patch: { doubles_count: next, status } });
    },
    isPending: update.isPending,
  };
}

export async function fetchAllStickers(): Promise<Sticker[]> {
  const { data, error } = await supabase
    .from("stickers")
    .select("*")
    .order("team_order", { ascending: true })
    .order("position", { ascending: true })
    .order("number", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Sticker[];
}
