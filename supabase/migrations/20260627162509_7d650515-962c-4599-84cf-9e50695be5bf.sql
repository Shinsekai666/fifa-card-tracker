
CREATE TABLE public.share_links (
  id uuid not null default gen_random_uuid() primary key,
  token text not null unique,
  kind text not null check (kind in ('doubles','missing','both')),
  payload jsonb not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

GRANT SELECT ON public.share_links TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.share_links TO authenticated;
GRANT ALL ON public.share_links TO service_role;

ALTER TABLE public.share_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read share links by token" ON public.share_links
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Authenticated can create share links" ON public.share_links
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated can delete share links" ON public.share_links
  FOR DELETE TO authenticated USING (true);
