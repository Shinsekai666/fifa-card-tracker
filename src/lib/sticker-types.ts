export type StickerStatus = "missing" | "owned" | "double";

export interface Sticker {
  id: string;
  number: string;
  name: string | null;
  category: string | null;
  status: StickerStatus;
  doubles_count: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export const STATUS_LABEL: Record<StickerStatus, string> = {
  missing: "Manquant",
  owned: "J'en ai 1",
  double: "J'en ai plusieurs",
};
