-- ============================================================
-- Auth: musteriler tablosuna auth_user_id ekle + RLS + trigger
-- ============================================================

ALTER TABLE musteriler
  ADD COLUMN IF NOT EXISTS auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL;

-- RLS aç
ALTER TABLE musteriler         ENABLE ROW LEVEL SECURITY;
ALTER TABLE musteri_makineleri ENABLE ROW LEVEL SECURITY;

-- musteriler policies
CREATE POLICY "musteri_select_own"
  ON musteriler FOR SELECT
  USING (auth.uid() = auth_user_id);

CREATE POLICY "musteri_update_own"
  ON musteriler FOR UPDATE
  USING (auth.uid() = auth_user_id);

-- musteri_makineleri policies
CREATE POLICY "makine_select_own"
  ON musteri_makineleri FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM musteriler
    WHERE musteri_id = musteri_makineleri.musteri_id
      AND auth_user_id = auth.uid()
  ));

CREATE POLICY "makine_insert_own"
  ON musteri_makineleri FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM musteriler
    WHERE musteri_id = musteri_makineleri.musteri_id
      AND auth_user_id = auth.uid()
  ));

CREATE POLICY "makine_update_own"
  ON musteri_makineleri FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM musteriler
    WHERE musteri_id = musteri_makineleri.musteri_id
      AND auth_user_id = auth.uid()
  ));

-- ============================================================
-- Yeni kullanıcı kaydolduğunda otomatik müşteri kaydı oluştur
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.musteriler (musteri_id, unvan_ad_soyad, eposta, auth_user_id)
  VALUES (
    'MST' || upper(substr(replace(new.id::text, '-', ''), 1, 10)),
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    new.id
  )
  ON CONFLICT DO NOTHING;
  RETURN new;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
