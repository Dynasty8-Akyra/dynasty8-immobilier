-- IMPORTANT : Exécuter UNIQUEMENT après déploiement et test des fonctions Netlify.
-- Retire toutes les policies INSERT/UPDATE/DELETE sur properties.
-- Les fonctions Netlify utilisent service_role et vérifient les rôles Discord à chaque écriture.
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
DO $$
DECLARE p record;
BEGIN
 FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='properties' AND cmd IN ('INSERT','UPDATE','DELETE','ALL') LOOP
   EXECUTE format('DROP POLICY IF EXISTS %I ON public.properties',p.policyname);
 END LOOP;
END $$;
-- Conserver une lecture publique du catalogue.
DROP POLICY IF EXISTS "Dynasty public read" ON public.properties;
CREATE POLICY "Dynasty public read" ON public.properties FOR SELECT TO anon, authenticated USING (true);
-- Important : vérifier que les privilèges de table n'ont pas été accordés à PUBLIC.
REVOKE INSERT, UPDATE, DELETE ON public.properties FROM anon, authenticated;
