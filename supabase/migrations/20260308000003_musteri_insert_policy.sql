-- musteriler için INSERT policy (uygulama tarafından kayıt oluşturabilsin)
CREATE POLICY "musteri_insert_own"
  ON musteriler FOR INSERT
  WITH CHECK (auth.uid() = auth_user_id);
