-- Criar bucket para banners de espaços se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('space-banners', 'space-banners', true)
ON CONFLICT (id) DO NOTHING;

-- Criar políticas para o bucket space-banners
CREATE POLICY "Membros de espaços podem fazer upload de banners"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'space-banners' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Usuários podem visualizar banners de espaços"
ON storage.objects FOR SELECT
USING (bucket_id = 'space-banners');

CREATE POLICY "Membros de espaços podem deletar banners"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'space-banners' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Membros de espaços podem atualizar banners"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'space-banners' 
  AND auth.uid() IS NOT NULL
);