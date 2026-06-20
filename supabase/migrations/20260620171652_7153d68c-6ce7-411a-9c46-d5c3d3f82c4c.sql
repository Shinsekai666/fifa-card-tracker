ALTER TABLE public.stickers
  ADD COLUMN IF NOT EXISTS team_code TEXT,
  ADD COLUMN IF NOT EXISTS team_name TEXT,
  ADD COLUMN IF NOT EXISTS team_flag TEXT,
  ADD COLUMN IF NOT EXISTS team_order INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS position INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_special BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_foil BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_stickers_team ON public.stickers(team_order, position);
CREATE INDEX IF NOT EXISTS idx_stickers_team_code ON public.stickers(team_code);