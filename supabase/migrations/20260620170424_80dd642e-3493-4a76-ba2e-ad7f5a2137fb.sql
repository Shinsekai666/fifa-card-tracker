CREATE TABLE public.stickers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  number TEXT NOT NULL UNIQUE,
  name TEXT,
  category TEXT,
  status TEXT NOT NULL DEFAULT 'missing' CHECK (status IN ('missing','owned','double')),
  doubles_count INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.stickers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stickers TO authenticated;
GRANT ALL ON public.stickers TO service_role;

ALTER TABLE public.stickers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read stickers" ON public.stickers FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public insert stickers" ON public.stickers FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Public update stickers" ON public.stickers FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public delete stickers" ON public.stickers FOR DELETE TO anon, authenticated USING (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_stickers_updated_at BEFORE UPDATE ON public.stickers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_stickers_status ON public.stickers(status);
CREATE INDEX idx_stickers_category ON public.stickers(category);
CREATE INDEX idx_stickers_sort ON public.stickers(sort_order);