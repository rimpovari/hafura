-- Anon ve authenticated rollerine public tablolarda okuma izni ver
GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT ON marka TO anon, authenticated;
GRANT SELECT ON model TO anon, authenticated;
GRANT SELECT ON makine_tipi TO anon, authenticated;
GRANT SELECT ON parca_listesi TO anon, authenticated;
GRANT SELECT ON parca_durumlari TO anon, authenticated;
GRANT SELECT ON ana_grup TO anon, authenticated;
GRANT SELECT ON alt_grup TO anon, authenticated;
GRANT SELECT ON bakim_periyotlari TO anon, authenticated;
GRANT SELECT ON usage_matrix TO anon, authenticated;

-- Siparişler için authenticated kullanıcılara yazma izni
GRANT INSERT, SELECT ON siparisler TO authenticated;
GRANT INSERT, SELECT ON siparis_kalemleri TO authenticated;
