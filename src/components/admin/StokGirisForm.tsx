"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export function StokGirisForm() {
  const supabase = createClient();
  const router = useRouter();

  const [depolar, setDepolar] = useState<any[]>([]);
  const [parcaQuery, setParcaQuery] = useState("");
  const [parcaResults, setParcaResults] = useState<any[]>([]);
  const [selectedParca, setSelectedParca] = useState<any>(null);
  const [depoId, setDepoId] = useState("");
  const [miktar, setMiktar] = useState("");
  const [minStok, setMinStok] = useState("");
  const [hedefStok, setHedefStok] = useState("");
  const [aciklama, setAciklama] = useState("");
  const [hareket, setHareket] = useState<"GIRIS" | "CIKIS">("GIRIS");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.from("depolar").select("depo_id, depo_adi").eq("aktif", true).then(({ data }) => {
      setDepolar(data ?? []);
      if (data?.length) setDepoId(data[0].depo_id);
    });
  }, []);

  async function searchParca(q: string) {
    setParcaQuery(q);
    setSelectedParca(null);
    if (!q.trim()) { setParcaResults([]); return; }
    const { data } = await supabase
      .from("parca_listesi")
      .select("parca_id, parca_adi, hafu_kod")
      .or(`parca_adi.ilike.%${q}%,hafu_kod.ilike.%${q}%`)
      .limit(8);
    setParcaResults(data ?? []);
  }

  function selectParca(p: any) {
    setSelectedParca(p);
    setParcaQuery(p.parca_adi);
    setParcaResults([]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!selectedParca) { setError("Lütfen bir parça seçin."); return; }
    if (!depoId) { setError("Lütfen depo seçin."); return; }
    if (!miktar || isNaN(Number(miktar)) || Number(miktar) <= 0) {
      setError("Geçerli bir miktar girin."); return;
    }

    setSaving(true);

    // Mevcut stok kaydını çek
    const { data: mevcut } = await supabase
      .from("stok")
      .select("stok_id, toplam_miktar")
      .eq("parca_id", selectedParca.parca_id)
      .eq("depo_id", depoId)
      .single();

    const yeniMiktar = hareket === "GIRIS"
      ? (Number(mevcut?.toplam_miktar ?? 0) + Number(miktar))
      : Math.max(0, Number(mevcut?.toplam_miktar ?? 0) - Number(miktar));

    const stokId = mevcut?.stok_id ?? ("STK" + Date.now().toString(36).toUpperCase());

    const upsertData: any = {
      stok_id: stokId,
      parca_id: selectedParca.parca_id,
      depo_id: depoId,
      toplam_miktar: yeniMiktar,
      son_guncelleme: new Date().toISOString(),
    };
    if (minStok) upsertData.min_stok = Number(minStok);
    if (hedefStok) upsertData.hedef_stok = Number(hedefStok);

    const { error: stokErr } = await supabase
      .from("stok")
      .upsert(upsertData, { onConflict: "parca_id,depo_id" });

    if (stokErr) { setError(stokErr.message); setSaving(false); return; }

    // Hareket kaydı
    await supabase.from("stok_hareketleri").insert({
      stok_hareket_id: "SH" + Date.now().toString(36).toUpperCase(),
      parca_id: selectedParca.parca_id,
      depo_id: depoId,
      hareket_tipi: hareket,
      miktar: Number(miktar),
      aciklama: aciklama || null,
    });

    setSaving(false);
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setSelectedParca(null);
      setParcaQuery("");
      setMiktar("");
      setAciklama("");
    }, 1500);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
      {/* Parça arama */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Parça</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={parcaQuery}
            onChange={(e) => searchParca(e.target.value)}
            placeholder="Parça adı veya HAFU kodu..."
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {parcaResults.length > 0 && (
          <div className="mt-1 border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            {parcaResults.map((p) => (
              <button
                key={p.parca_id}
                type="button"
                onClick={() => selectParca(p)}
                className="w-full text-left px-4 py-2.5 hover:bg-slate-50 border-b border-slate-100 last:border-0"
              >
                <p className="text-sm font-medium text-slate-800">{p.parca_adi}</p>
                <p className="text-xs font-mono text-slate-400">{p.hafu_kod}</p>
              </button>
            ))}
          </div>
        )}
        {selectedParca && (
          <p className="mt-1.5 text-xs text-emerald-600 font-medium">
            ✓ {selectedParca.parca_adi} ({selectedParca.hafu_kod})
          </p>
        )}
      </div>

      {/* Depo */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Depo</label>
        <select
          value={depoId}
          onChange={(e) => setDepoId(e.target.value)}
          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {depolar.map((d) => (
            <option key={d.depo_id} value={d.depo_id}>{d.depo_adi}</option>
          ))}
        </select>
      </div>

      {/* Hareket tipi */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Hareket Tipi</label>
        <div className="flex gap-3">
          {(["GIRIS", "CIKIS"] as const).map((h) => (
            <button
              key={h}
              type="button"
              onClick={() => setHareket(h)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all ${
                hareket === h
                  ? h === "GIRIS"
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-red-500 text-white border-red-500"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
              }`}
            >
              {h === "GIRIS" ? "▲ Giriş" : "▼ Çıkış"}
            </button>
          ))}
        </div>
      </div>

      {/* Miktar */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Miktar</label>
        <input
          type="number"
          min="0.01"
          step="0.01"
          value={miktar}
          onChange={(e) => setMiktar(e.target.value)}
          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Min / Hedef stok (opsiyonel) */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Min. Stok <span className="text-slate-400 font-normal">(opsiyonel)</span></label>
          <input
            type="number"
            min="0"
            step="1"
            value={minStok}
            onChange={(e) => setMinStok(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Hedef Stok <span className="text-slate-400 font-normal">(opsiyonel)</span></label>
          <input
            type="number"
            min="0"
            step="1"
            value={hedefStok}
            onChange={(e) => setHedefStok(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Açıklama */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Açıklama <span className="text-slate-400 font-normal">(opsiyonel)</span></label>
        <input
          value={aciklama}
          onChange={(e) => setAciklama(e.target.value)}
          placeholder="ör. İlk sayım girişi"
          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 px-4 py-2.5 rounded-xl">{error}</p>}
      {success && <p className="text-sm text-emerald-700 bg-emerald-50 px-4 py-2.5 rounded-xl font-medium">✓ Stok güncellendi!</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors"
        >
          {saving ? "Kaydediliyor..." : "Kaydet"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/stok")}
          className="border border-slate-200 text-slate-600 hover:border-slate-400 px-6 py-2.5 rounded-xl text-sm transition-colors"
        >
          İptal
        </button>
      </div>
    </form>
  );
}
