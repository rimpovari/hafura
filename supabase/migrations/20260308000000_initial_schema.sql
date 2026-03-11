-- ============================================================
-- HAFU Web App - Initial Schema
-- Supabase / PostgreSQL Migration
-- ============================================================

-- ============================================================
-- 1. LOOKUP TABLOLARI (bağımlılık yok)
-- ============================================================

CREATE TABLE parca_durumlari (
  parca_durum_id   TEXT PRIMARY KEY,
  kod              TEXT NOT NULL UNIQUE,
  ad               TEXT NOT NULL,
  aciklama         TEXT,
  sepete_eklenebilir BOOLEAN NOT NULL DEFAULT false,
  fiyat_goster     BOOLEAN NOT NULL DEFAULT false,
  teklif_zorunlu   BOOLEAN NOT NULL DEFAULT false,
  arsiv_mi         BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE ana_grup (
  ana_grup_id   TEXT PRIMARY KEY,
  ana_grup_kod  TEXT NOT NULL UNIQUE,
  ana_grup_adi  TEXT NOT NULL,
  aciklama      TEXT,
  aktif         BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE marka (
  marka_id   TEXT PRIMARY KEY,
  marka_kod  TEXT NOT NULL UNIQUE,
  marka_adi  TEXT NOT NULL,
  aciklama   TEXT,
  aktif      BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE makine_tipi (
  makine_tip_id   TEXT PRIMARY KEY,
  makine_tip_kod  TEXT NOT NULL UNIQUE,
  makine_tip_adi  TEXT NOT NULL,
  aciklama        TEXT,
  aktif           BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE bakim_periyotlari (
  period_id   TEXT PRIMARY KEY,
  period_kod  TEXT NOT NULL UNIQUE,
  saat        INTEGER NOT NULL,
  aktif       BOOLEAN NOT NULL DEFAULT true,
  aciklama    TEXT
);

CREATE TABLE fiyat_tipi (
  fiyat_tip_id  TEXT PRIMARY KEY,
  kod           TEXT NOT NULL UNIQUE,
  ad            TEXT NOT NULL,
  aciklama      TEXT,
  aktif         BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE fiyat_durum (
  fiyat_durum_id   TEXT PRIMARY KEY,
  kod              TEXT NOT NULL UNIQUE,
  ad               TEXT NOT NULL,
  aciklama         TEXT,
  kullanilabilir_mi BOOLEAN NOT NULL DEFAULT false,
  sira_no          INTEGER
);

-- ============================================================
-- 2. ALT GRUP (ana_grup'a bağlı)
-- ============================================================

CREATE TABLE alt_grup (
  alt_grup_id   TEXT PRIMARY KEY,
  ana_grup_id   TEXT NOT NULL REFERENCES ana_grup(ana_grup_id),
  alt_grup_kod  TEXT NOT NULL,
  alt_grup_adi  TEXT NOT NULL,
  aciklama      TEXT,
  aktif         BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX idx_alt_grup_ana_grup ON alt_grup(ana_grup_id);

-- ============================================================
-- 3. PARÇA LİSTESİ
-- ============================================================

CREATE TABLE parca_listesi (
  parca_id      TEXT PRIMARY KEY,
  hafu_kod      TEXT NOT NULL,              -- unique değil, aynı kod farklı parçalarda kullanılabilir
  oem_kod       TEXT NOT NULL,               -- TEXT! unique değil, farklı parçalar aynı OEM kodunu paylaşabilir
  parca_adi     TEXT NOT NULL,
  ana_grup_id   TEXT NOT NULL REFERENCES ana_grup(ana_grup_id),
  alt_grup_id   TEXT NOT NULL REFERENCES alt_grup(alt_grup_id),
  parca_durum_id TEXT NOT NULL REFERENCES parca_durumlari(parca_durum_id),
  aciklama      TEXT,
  rule_notu     TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_parca_oem_kod      ON parca_listesi(oem_kod);
CREATE INDEX idx_parca_alt_grup     ON parca_listesi(alt_grup_id);
CREATE INDEX idx_parca_ana_grup     ON parca_listesi(ana_grup_id);
CREATE INDEX idx_parca_durum        ON parca_listesi(parca_durum_id);
CREATE INDEX idx_parca_adi_search   ON parca_listesi USING gin(to_tsvector('turkish', parca_adi));

-- ============================================================
-- 4. MODEL (marka + makine_tipi'ne bağlı)
-- ============================================================

CREATE TABLE model (
  model_id       TEXT PRIMARY KEY,
  marka_id       TEXT NOT NULL REFERENCES marka(marka_id),
  makine_tip_id  TEXT NOT NULL REFERENCES makine_tipi(makine_tip_id),
  model_adi      TEXT NOT NULL,
  aktif          BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX idx_model_marka      ON model(marka_id);
CREATE INDEX idx_model_tip        ON model(makine_tip_id);

-- ============================================================
-- 5. MODEL VARYANT (model'e bağlı)
-- ============================================================

CREATE TABLE model_varyant (
  varyant_id                    TEXT PRIMARY KEY,
  model_id                      TEXT NOT NULL REFERENCES model(model_id),
  varyant_adi                   TEXT NOT NULL,
  kullanici_soru_etiketi        TEXT,           -- "Şasi Numarasını Giriniz" gibi
  kullaniciya_gosterilen_aciklama TEXT,
  varsayilan_mi                 BOOLEAN NOT NULL DEFAULT false,
  aktif                         BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX idx_varyant_model ON model_varyant(model_id);

-- ============================================================
-- 6. MODEL VARYANT KURAL (varyant'a bağlı)
-- ============================================================

CREATE TABLE model_varyant_kural (
  kural_id           TEXT PRIMARY KEY,
  varyant_id         TEXT NOT NULL REFERENCES model_varyant(varyant_id),
  alan_kod           TEXT,           -- 'SASI_NO' gibi
  operator           TEXT,           -- '<', '>=', 'BETWEEN'
  deger1             NUMERIC,
  deger2             NUMERIC,        -- BETWEEN için üst sınır
  grup_no            INTEGER,
  mantik             TEXT,           -- 'AND' / 'OR'
  varsayilan_kural_mi BOOLEAN DEFAULT false
);

CREATE INDEX idx_kural_varyant ON model_varyant_kural(varyant_id);

-- ============================================================
-- 7. USAGE MATRIX (model + bakim_periyotlari + parca_listesi)
-- ============================================================

CREATE TABLE usage_matrix (
  usage_id    TEXT PRIMARY KEY,
  model_id    TEXT NOT NULL REFERENCES model(model_id),
  config_id   TEXT,                  -- ileride varyant bazlı konfigürasyon için
  period_id   TEXT NOT NULL REFERENCES bakim_periyotlari(period_id),
  parca_id    TEXT NOT NULL REFERENCES parca_listesi(parca_id),
  qty         NUMERIC(8,2) NOT NULL DEFAULT 1,
  zorunlu_mu  BOOLEAN NOT NULL DEFAULT true,
  aktif       BOOLEAN NOT NULL DEFAULT true,
  aciklama    TEXT
);

CREATE INDEX idx_usage_model   ON usage_matrix(model_id);
CREATE INDEX idx_usage_parca   ON usage_matrix(parca_id);
CREATE INDEX idx_usage_period  ON usage_matrix(period_id);
CREATE UNIQUE INDEX idx_usage_unique ON usage_matrix(model_id, period_id, parca_id);

-- ============================================================
-- 8. FİYAT LİSTESİ
-- ============================================================

CREATE TABLE fiyat_listesi (
  fiyat_id                  TEXT PRIMARY KEY,
  parca_id                  TEXT NOT NULL REFERENCES parca_listesi(parca_id),
  fiyat_tip_id              TEXT NOT NULL REFERENCES fiyat_tipi(fiyat_tip_id),
  fiyat_durum_id            TEXT NOT NULL REFERENCES fiyat_durum(fiyat_durum_id),
  para_birimi               TEXT NOT NULL DEFAULT 'TRY',
  birim_fiyat               NUMERIC(12,2) NOT NULL,
  gecerlilik_baslangic      DATE,
  gecerlilik_bitis          DATE,
  min_adet                  INTEGER DEFAULT 1,
  musteri_id                TEXT,              -- belirli müşteriye özel fiyat için
  kaynak_tedarikci_fiyat_id TEXT,
  not_                      TEXT,
  olusturma_tarihi          TIMESTAMPTZ NOT NULL DEFAULT now(),
  guncelleme_tarihi         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_fiyat_parca       ON fiyat_listesi(parca_id);
CREATE INDEX idx_fiyat_tip         ON fiyat_listesi(fiyat_tip_id);
CREATE INDEX idx_fiyat_durum       ON fiyat_listesi(fiyat_durum_id);
CREATE INDEX idx_fiyat_musteri     ON fiyat_listesi(musteri_id);
CREATE INDEX idx_fiyat_gecerlilik  ON fiyat_listesi(gecerlilik_baslangic, gecerlilik_bitis);

-- ============================================================
-- 9. TEDARİKÇİLER
-- ============================================================

CREATE TABLE tedarikciler (
  tedarikci_id    TEXT PRIMARY KEY,
  tedarikci_kod   TEXT NOT NULL UNIQUE,
  tedarikci_adi   TEXT NOT NULL,
  yetkili_kisi    TEXT,
  telefon         TEXT,
  email           TEXT,
  ulke            TEXT,
  sehir           TEXT,
  adres           TEXT,
  aktif           BOOLEAN NOT NULL DEFAULT true,
  not_            TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 10. TEDARİKÇİ PARÇALARI
-- ============================================================

CREATE TABLE tedarikci_parcalari (
  tedarikci_parca_id    TEXT PRIMARY KEY,
  tedarikci_id          TEXT NOT NULL REFERENCES tedarikciler(tedarikci_id),
  parca_id              TEXT NOT NULL REFERENCES parca_listesi(parca_id),
  tedarikci_parca_kodu  TEXT,
  tedarikci_parca_adi   TEXT,
  varsayilan_mi         BOOLEAN NOT NULL DEFAULT false,
  temin_suresi_gun      INTEGER,
  min_siparis_adedi     INTEGER DEFAULT 1,
  aktif                 BOOLEAN NOT NULL DEFAULT true,
  not_                  TEXT
);

CREATE INDEX idx_ted_parca_tedarikci ON tedarikci_parcalari(tedarikci_id);
CREATE INDEX idx_ted_parca_parca     ON tedarikci_parcalari(parca_id);

-- ============================================================
-- 11. TEDARİKÇİ FİYATLARI
-- ============================================================

CREATE TABLE tedarikci_fiyatlari (
  tedarikci_fiyat_id    TEXT PRIMARY KEY,
  tedarikci_id          TEXT NOT NULL REFERENCES tedarikciler(tedarikci_id),
  parca_id              TEXT NOT NULL REFERENCES parca_listesi(parca_id),
  tedarikci_parca_kodu  TEXT,
  para_birimi           TEXT NOT NULL DEFAULT 'TRY',
  birim_fiyat           NUMERIC(12,2) NOT NULL,
  min_adet              INTEGER DEFAULT 1,
  gecerlilik_baslangic  DATE,
  gecerlilik_bitis      DATE,
  temin_suresi_gun      INTEGER,
  aktif                 BOOLEAN NOT NULL DEFAULT true,
  not_                  TEXT
);

CREATE INDEX idx_ted_fiyat_tedarikci ON tedarikci_fiyatlari(tedarikci_id);
CREATE INDEX idx_ted_fiyat_parca     ON tedarikci_fiyatlari(parca_id);

-- ============================================================
-- 12. DEPOLAR
-- ============================================================

CREATE TABLE depolar (
  depo_id       TEXT PRIMARY KEY,
  depo_adi      TEXT NOT NULL,
  depo_tipi     TEXT,
  konum         TEXT,
  tedarikci_id  TEXT REFERENCES tedarikciler(tedarikci_id),
  aktif         BOOLEAN NOT NULL DEFAULT true,
  aciklama      TEXT
);

-- ============================================================
-- 13. STOK
-- ============================================================

CREATE TABLE stok (
  stok_id               TEXT PRIMARY KEY,
  parca_id              TEXT NOT NULL REFERENCES parca_listesi(parca_id),
  depo_id               TEXT NOT NULL REFERENCES depolar(depo_id),
  toplam_miktar         NUMERIC(12,2) NOT NULL DEFAULT 0,
  rezerve_miktar        NUMERIC(12,2) NOT NULL DEFAULT 0,
  kullanilabilir_miktar NUMERIC(12,2) GENERATED ALWAYS AS (toplam_miktar - rezerve_miktar) STORED,
  uretimde_miktar       NUMERIC(12,2) NOT NULL DEFAULT 0,
  yolda_miktar          NUMERIC(12,2) NOT NULL DEFAULT 0,
  min_stok              NUMERIC(12,2),
  hedef_stok            NUMERIC(12,2),
  son_guncelleme        TIMESTAMPTZ NOT NULL DEFAULT now(),
  aktif                 BOOLEAN NOT NULL DEFAULT true,
  not_                  TEXT,
  UNIQUE(parca_id, depo_id)
);

CREATE INDEX idx_stok_parca ON stok(parca_id);
CREATE INDEX idx_stok_depo  ON stok(depo_id);

-- ============================================================
-- 14. STOK HAREKETLERİ
-- ============================================================

CREATE TABLE stok_hareketleri (
  stok_hareket_id     TEXT PRIMARY KEY,
  parca_id            TEXT NOT NULL REFERENCES parca_listesi(parca_id),
  depo_id             TEXT NOT NULL REFERENCES depolar(depo_id),
  hareket_tarihi      TIMESTAMPTZ NOT NULL DEFAULT now(),
  hareket_tipi        TEXT NOT NULL,  -- 'GIRIS','CIKIS','REZERVE','REZERVE_IPTAL'
  miktar              NUMERIC(12,2) NOT NULL,
  ilgili_belge_tipi   TEXT,           -- 'SIPARIS','TEDARIK_SIPARIS' vb.
  ilgili_belge_id     TEXT,
  aciklama            TEXT,
  olusturan           TEXT
);

CREATE INDEX idx_stok_har_parca ON stok_hareketleri(parca_id);
CREATE INDEX idx_stok_har_depo  ON stok_hareketleri(depo_id);
CREATE INDEX idx_stok_har_tarih ON stok_hareketleri(hareket_tarihi);

-- ============================================================
-- 15. TEDARİK SİPARİŞLERİ
-- ============================================================

CREATE TABLE tedarik_siparisleri (
  tedarik_siparis_id        TEXT PRIMARY KEY,
  tedarikci_id              TEXT NOT NULL REFERENCES tedarikciler(tedarikci_id),
  tedarik_siparis_no        TEXT NOT NULL UNIQUE,
  durum                     TEXT NOT NULL DEFAULT 'TASLAK',
  siparis_tarihi            TIMESTAMPTZ,
  beklenen_teslim_tarihi    DATE,
  onay_tarihi               TIMESTAMPTZ,
  gonderim_tarihi           TIMESTAMPTZ,
  takip_no                  TEXT,
  kargo_firmasi             TEXT,
  teslim_durumu             TEXT,
  para_birimi               TEXT NOT NULL DEFAULT 'TRY',
  toplam_tutar              NUMERIC(12,2),
  not_                      TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tedarik_sip_tedarikci ON tedarik_siparisleri(tedarikci_id);

-- ============================================================
-- 16. TEDARİK SİPARİŞ KALEMLERİ
-- ============================================================

CREATE TABLE tedarik_siparis_kalemleri (
  tedarik_siparis_kalem_id  TEXT PRIMARY KEY,
  tedarik_siparis_id        TEXT NOT NULL REFERENCES tedarik_siparisleri(tedarik_siparis_id),
  parca_id                  TEXT NOT NULL REFERENCES parca_listesi(parca_id),
  tedarikci_parca_kodu      TEXT,
  miktar                    NUMERIC(12,2) NOT NULL,
  birim_fiyat               NUMERIC(12,2),
  para_birimi               TEXT NOT NULL DEFAULT 'TRY',
  durum                     TEXT,
  not_                      TEXT
);

CREATE INDEX idx_tedarik_kalem_siparis ON tedarik_siparis_kalemleri(tedarik_siparis_id);
CREATE INDEX idx_tedarik_kalem_parca   ON tedarik_siparis_kalemleri(parca_id);

-- ============================================================
-- 17. MÜŞTERİLER
-- ============================================================

CREATE TABLE musteriler (
  musteri_id       TEXT PRIMARY KEY,
  musteri_tipi     TEXT NOT NULL DEFAULT 'BIREYSEL',  -- 'BIREYSEL','KURUMSAL'
  unvan_ad_soyad   TEXT NOT NULL,
  vergi_no_tckn    TEXT,
  vergi_dairesi    TEXT,
  yetkili_kisi     TEXT,
  telefon          TEXT,
  eposta           TEXT,
  il               TEXT,
  ilce             TEXT,
  adres            TEXT,
  aktif            BOOLEAN NOT NULL DEFAULT true,
  not_             TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_musteri_eposta   ON musteriler(eposta);
CREATE INDEX idx_musteri_vergi_no ON musteriler(vergi_no_tckn);

-- ============================================================
-- 18. MÜŞTERİ MAKİNELERİ
-- ============================================================

CREATE TABLE musteri_makineleri (
  musteri_makine_id   TEXT PRIMARY KEY,
  musteri_id          TEXT NOT NULL REFERENCES musteriler(musteri_id),
  model_id            TEXT NOT NULL REFERENCES model(model_id),
  varyant_id          TEXT REFERENCES model_varyant(varyant_id),
  makine_etiketi      TEXT,          -- müşterinin kendi verdiği isim
  sasi_no             TEXT,
  seri_no             TEXT,
  calisma_saati       NUMERIC(10,1),
  son_bakim_saati     NUMERIC(10,1),
  son_bakim_periyot_id TEXT REFERENCES bakim_periyotlari(period_id),
  son_bakim_tarihi    DATE,
  kayit_tarihi        TIMESTAMPTZ NOT NULL DEFAULT now(),
  aktif               BOOLEAN NOT NULL DEFAULT true,
  not_                TEXT
);

CREATE INDEX idx_musteri_makine_musteri ON musteri_makineleri(musteri_id);
CREATE INDEX idx_musteri_makine_model   ON musteri_makineleri(model_id);
CREATE INDEX idx_musteri_makine_sasi    ON musteri_makineleri(sasi_no);

-- ============================================================
-- 19. SİPARİŞLER
-- ============================================================

CREATE TABLE siparisler (
  siparis_id     TEXT PRIMARY KEY,
  musteri_id     TEXT NOT NULL REFERENCES musteriler(musteri_id),
  siparis_tarihi TIMESTAMPTZ NOT NULL DEFAULT now(),
  siparis_tipi   TEXT NOT NULL DEFAULT 'SIPARIS',  -- 'SIPARIS','TEKLIF'
  durum          TEXT NOT NULL DEFAULT 'TASLAK',
  para_birimi    TEXT NOT NULL DEFAULT 'TRY',
  ara_toplam     NUMERIC(12,2),
  kdv_toplam     NUMERIC(12,2),
  genel_toplam   NUMERIC(12,2),
  musteri_notu   TEXT,
  ic_not         TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_siparis_musteri ON siparisler(musteri_id);
CREATE INDEX idx_siparis_durum   ON siparisler(durum);
CREATE INDEX idx_siparis_tarih   ON siparisler(siparis_tarihi);

-- ============================================================
-- 20. SİPARİŞ KALEMLERİ
-- ============================================================

CREATE TABLE siparis_kalemleri (
  siparis_kalem_id    TEXT PRIMARY KEY,
  siparis_id          TEXT NOT NULL REFERENCES siparisler(siparis_id),
  parca_id            TEXT NOT NULL REFERENCES parca_listesi(parca_id),
  musteri_makine_id   TEXT REFERENCES musteri_makineleri(musteri_makine_id),
  qty                 NUMERIC(8,2) NOT NULL DEFAULT 1,
  birim_fiyat         NUMERIC(12,2) NOT NULL,
  indirim_oran        NUMERIC(5,2) DEFAULT 0,
  kdv_oran            NUMERIC(5,2) DEFAULT 20,
  satir_toplam        NUMERIC(12,2),
  not_                TEXT
);

CREATE INDEX idx_kalem_siparis ON siparis_kalemleri(siparis_id);
CREATE INDEX idx_kalem_parca   ON siparis_kalemleri(parca_id);

-- ============================================================
-- UPDATED_AT TETİKLEYİCİSİ (otomatik güncelleme)
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_parca_updated_at
  BEFORE UPDATE ON parca_listesi
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_fiyat_updated_at
  BEFORE UPDATE ON fiyat_listesi
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_tedarik_sip_updated_at
  BEFORE UPDATE ON tedarik_siparisleri
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_siparis_updated_at
  BEFORE UPDATE ON siparisler
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- SEED DATA — LOOKUP TABLOLARI
-- ============================================================

INSERT INTO parca_durumlari VALUES
  ('PDUR1', 'AKTIF',      'Aktif',          'Normal satışta',                     true,  true,  false, false),
  ('PDUR2', 'TEKLIF',     'Teklif Üzerine', 'Fiyat yerine teklif alınır',         false, false, true,  false),
  ('PDUR3', 'SATIS_DISI', 'Satış Dışı',     'Satışı kapalı',                      false, false, false, false),
  ('PDUR4', 'ARSIV',      'Arşiv',          'Eski kayıt',                         false, false, false, true);

INSERT INTO ana_grup VALUES
  ('G001', 'F', 'Filtre', 'Filtrasyon sistem parçaları', true);

INSERT INTO alt_grup VALUES
  ('A101', 'G001', 'D', 'Dizel Filtre',       'Dizel ve yakıt filtreleri',       true),
  ('A102', 'G001', 'Y', 'Yağ Filtre',         'Yağ ve hidrolik filtreleri',       true),
  ('A103', 'G001', 'H', 'Hava Filtre',        'Hava ve emniyet filtreleri',       true),
  ('A104', 'G001', 'P', 'Pilot Filtre',       'Pilot sistem filtreleri',          true),
  ('A105', 'G001', 'S', 'Su Ayırıcı Filtre',  'Yağ-su ayırıcı filtreler',         true),
  ('A106', 'G001', 'U', 'Belirsiz',           'Kategori belirlenemeyen filtreler', true);

INSERT INTO marka VALUES
  ('B001', 'ZM', 'Zoomlion', 'Ana hizmet verilen marka', true);

INSERT INTO makine_tipi VALUES
  ('MT01', 'EX', 'Excavator',     'Paletli ekskavator makineleri',   true),
  ('MT02', 'WL', 'Wheel Loader',  'Lastik yükleyici makineler',      true),
  ('MT03', 'CR', 'Mobile Crane',  'Mobil vincler',                   true),
  ('MT04', 'TC', 'Tower Crane',   'Kule vincler',                    true),
  ('MT05', 'CP', 'Concrete Pump', 'Beton pompası makineleri',        true),
  ('MT06', 'AW', 'AWP',           'Yüksekte çalışma platformları',   true),
  ('MT07', 'FL', 'Forklift',      'Forklift makineleri',             true),
  ('MT08', 'OT', 'Other',         'Diğer makineler',                 true);

INSERT INTO bakim_periyotlari VALUES
  ('MP0250', '250H',  250,  true, '250 saat bakımı'),
  ('MP0500', '500H',  500,  true, '500 saat bakımı'),
  ('MP1000', '1000H', 1000, true, '1000 saat bakımı'),
  ('MP2000', '2000H', 2000, true, '2000 saat bakımı'),
  ('MP4000', '4000H', 4000, true, '4000 saat bakımı');

INSERT INTO fiyat_tipi VALUES
  ('FIYT1', 'LISTE',    'Liste Fiyatı',          'Genel standart satış fiyatı',                          true),
  ('FIYT2', 'BAYI',     'Bayi Fiyatı',           'Bayiler için tanımlanan özel fiyat',                   true),
  ('FIYT3', 'SERVIS',   'Servis Fiyatı',         'Servis ve bakım işlemleri için kullanılan fiyat',      true),
  ('FIYT4', 'KAMPANYA', 'Kampanya Fiyatı',       'Belirli dönem veya koşullarda geçerli indirimli fiyat', true),
  ('FIYT5', 'OZEL',     'Müşteri Özel Fiyatı',  'Belirli müşteri veya teklif bazlı özel fiyat',         true),
  ('FIYT6', 'PTK',      'Perakende Fiyatı',      'Son kullanıcıya uygulanan perakende fiyat',            true),
  ('FIYT7', 'TOPTAN',   'Toptan Fiyatı',         'Yüksek adetli satışlarda kullanılan fiyat',            true);

INSERT INTO fiyat_durum VALUES
  ('FYDRM1', 'GECERLI',       'Geçerli',        'Fiyat şu anda aktif olarak kullanılabilir',               true,  1),
  ('FYDRM2', 'TASLAK',        'Taslak',         'Oluşturulmuş ancak henüz kullanıma açılmamış',            false, 2),
  ('FYDRM3', 'ONAY_BEKLIYOR', 'Onay Bekliyor',  'Kontrol veya yönetici onayı beklemektedir',               false, 3),
  ('FYDRM4', 'PLANLANDI',     'Planlandı',      'Tanımlanmış ancak başlangıç tarihi henüz gelmemiş',       false, 4),
  ('FYDRM6', 'IPTAL',         'İptal',          'İptal edilmiş, kullanılmaz',                              false, 6),
  ('FYDRM7', 'ASKIDA',        'Askıda',         'Geçici olarak durdurulmuş',                               false, 7);

INSERT INTO model VALUES
  ('M001',  'B001', 'MT01', 'ZE500E-10', true),
  ('M002',  'B001', 'MT01', 'ZE370E-10', true),
  ('M003',  'B001', 'MT01', 'ZE330E-10', true),
  ('M004',  'B001', 'MT01', 'ZE215E-10', true),
  ('M005',  'B001', 'MT01', 'ZE135E-10', true),
  ('M006',  'B001', 'MT01', 'ZE75E-10',  true),
  ('M007',  'B001', 'MT01', 'ZE60E-10',  true),
  ('M008',  'B001', 'MT06', 'ZS090V',    true),
  ('M009',  'B001', 'MT01', 'ZE18GU',    true),
  ('M010',  'B001', 'MT01', 'ZE26GU',    true),
  ('M011',  'B001', 'MT01', 'ZE35GU',    true),
  ('M012',  'B001', 'MT01', 'ZE75G',     true),
  ('M013',  'B001', 'MT01', 'ZE135G',    true),
  ('M014',  'B001', 'MT01', 'ZE215G',    true),
  ('M015',  'B001', 'MT01', 'ZE335G',    true),
  ('M016',  'B001', 'MT01', 'ZE375G',    true),
  ('M017',  'B001', 'MT01', 'ZE500G',    true);

INSERT INTO model_varyant (varyant_id, model_id, varyant_adi, kullanici_soru_etiketi, kullaniciya_gosterilen_aciklama, varsayilan_mi, aktif) VALUES
  ('V001', 'M001', 'Standard',       NULL,                       'Standart',                        true,  true),
  ('V002', 'M002', 'Standard',       NULL,                       'Standart',                        true,  true),
  ('V003', 'M003', 'Standard',       NULL,                       'Standart',                        true,  true),
  ('V004', 'M004', 'Old Series',     'Şasi Numarasını Giriniz', 'Eski Seri (<2222 veya 0197-0223)', false, true),
  ('V005', 'M004', 'New Series',     'Şasi Numarasını Giriniz', 'Yeni Seri (Standart / Diğerleri)', true,  true),
  ('V006', 'M005', 'Series 1 (Old)', 'Şasi Numarasını Giriniz', '1. Seri (1945 Öncesi)',            false, true),
  ('V007', 'M005', 'Series 2 (New)', 'Şasi Numarasını Giriniz', '2. Seri (1945 ve Sonrası)',        false, true),
  ('V008', 'M006', 'Standard',       NULL,                       'Standart',                        true,  true),
  ('V009', 'M007', 'Standard',       NULL,                       'Standart',                        true,  true),
  ('V010', 'M008', 'Standard',       NULL,                       'Standart',                        true,  true),
  ('V011', 'M009', 'Standard',       NULL,                       'Standart',                        true,  true),
  ('V012', 'M010', 'Standard',       NULL,                       'Standart',                        true,  true),
  ('V013', 'M011', 'Standard',       NULL,                       'Standart',                        true,  true),
  ('V014', 'M012', 'Standard',       NULL,                       'Standart',                        true,  true),
  ('V015', 'M013', 'Standard',       NULL,                       'Standart',                        true,  true),
  ('V016', 'M014', 'Standard',       NULL,                       'Standart',                        true,  true),
  ('V017', 'M015', 'Standard',       NULL,                       'Standart',                        true,  true),
  ('V018', 'M016', 'Standard',       NULL,                       'Standart',                        true,  true),
  ('V019', 'M017', 'Standard',       NULL,                       'Standart',                        true,  true);

INSERT INTO model_varyant_kural (kural_id, varyant_id, alan_kod, operator, deger1, deger2, grup_no, mantik, varsayilan_kural_mi) VALUES
  ('K0001', 'V004', 'SASI_NO', '<',       2222, NULL, 1, 'OR',  false),
  ('K0002', 'V004', 'SASI_NO', 'BETWEEN', 197,  223,  1, 'OR',  false),
  ('K0003', 'V005', NULL,       NULL,      NULL, NULL, NULL, NULL, true),
  ('K0004', 'V006', 'SASI_NO', '<',       1945, NULL, 1, 'AND', false),
  ('K0005', 'V007', 'SASI_NO', '>=',      1945, NULL, 1, 'AND', false);
