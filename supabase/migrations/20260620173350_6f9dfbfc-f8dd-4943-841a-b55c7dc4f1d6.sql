
DROP POLICY IF EXISTS "Public delete stickers" ON public.stickers;
DROP POLICY IF EXISTS "Public insert stickers" ON public.stickers;
DROP POLICY IF EXISTS "Public read stickers" ON public.stickers;
DROP POLICY IF EXISTS "Public update stickers" ON public.stickers;

REVOKE ALL ON public.stickers FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stickers TO authenticated;
GRANT ALL ON public.stickers TO service_role;

CREATE POLICY "Authenticated read stickers" ON public.stickers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert stickers" ON public.stickers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update stickers" ON public.stickers FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated delete stickers" ON public.stickers FOR DELETE TO authenticated USING (true);
