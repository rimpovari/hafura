-- Admin (authenticated) kullanıcıların tüm müşteri ve sipariş kayıtlarını görmesi için
CREATE POLICY "admin_musteri_select" ON musteriler FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_siparis_select" ON siparisler FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_siparis_update" ON siparisler FOR UPDATE TO authenticated USING (true);
CREATE POLICY "admin_siparis_kalem_select" ON siparis_kalemleri FOR SELECT TO authenticated USING (true);

-- Diğer tablolara authenticated erişim
GRANT SELECT, INSERT, UPDATE, DELETE ON makine_tipi TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON bakim_periyotlari TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON tedarikciler TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON depolar TO authenticated;
GRANT SELECT, INSERT, UPDATE ON stok TO authenticated;
GRANT SELECT ON musteriler TO authenticated;
GRANT SELECT, UPDATE ON siparisler TO authenticated;
GRANT SELECT ON siparis_kalemleri TO authenticated;

-- Anon için lookup tablolar
GRANT SELECT ON makine_tipi TO anon;
GRANT SELECT ON bakim_periyotlari TO anon;
