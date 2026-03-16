"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Search } from "lucide-react";

interface FiyatFormProps {
  initialData?: any;
  isEdit?: boolean;
}

export function FiyatForm({ initialData, isEdit }: FiyatFormProps) {
  const supabase = createClient();
  const router = useRouter();

  const [fiyatTipleri, setFiyatTipleri] = useState<any[]>([]);
  const [fiyatDurumlari, setFiyatDurumlari] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Parça arama
  const [parcaQuery, setParcaQuery] = useState(initialData?.parca_listesi?.parca_adi ?? "");
  const [parcaResults, setParcaResults] = useState<any[]>([]);
  const [selectedParca, setSelectedParca] = useState<any>(
    initialData ? { parca_id: initialData.parca_id, parca_adi: initialData.parca_listesi?.parca_adi, hafu_kod: initialData.parca_listesi?.hafu_kod } : null
  );

  const [form, setForm] = useState({
    fiyat_tip_id: initialData?.fiyat_tip_id ?? "FIYT1",
    fiyat_durum_id: initialData?.fiyat_durum_id ?? "FYDRM1",
    para_birimi: initialData?.para_birimi ?? "TRY",
    birim_fiyat: initialData?.birim_fiyat?.toString() ?? "",
    gecerlilik_baslangic: initialData?.gecerlilik_baslangic ?? "",
    gecerlilik_bitis: initialData?.gecerlilik_bitis ?? "",
    min_adet: initialData?.min_adet?.toString() ?? "1",
    not_: initialData?.not_ ?? "",
  });

  useEffect(() => {
    Promise.all([
      supabase.from("fiyat_tipi").select("*").eq("aktif", true).order("ad"),
      supabase.from("fiyat_durum").select("*").order("sira_no"),
    ]).then(([tip, dur]) => {
      setFiyatTipleri(tip.data ?? []);
      setFiyatDurumlari(dur.data ?? []);
    });
  }, []);

  async function searchParca(q: string) {
    setParcaQuery(q);
    setSelectedParca(null);
    if (!q.trim()) { setParcaResults([]); return; }
    const { data } = await supabase
      .from("parca_listesi")
      .select("parca_id, parca_adi, hafu_kod")
      .or(`parca_adi.ilike.%${q}%,hafu_kod.ilike.%${q}%,oem_kod.ilike.%${q}%`)
      .limit(8);
    setParcaResults(data ?? []);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedParca && !isEdit) { setError("Parça seçiniz."); return; }
    setLoading(true);
    setError("");

    const payload = {
      parca_id: selectedParca?.parca_id ?? initialData?.parca_id,
      fiyat_tip_id: form.fiyat_tip_id,
      fiyat_durum_id: form.fiyat_durum_id,
      para_birimi: form.para_birimi,
      birim_fiyat: parseFloat(form.birim_fiyat),
      gecerlilik_baslangic: form.gecerlilik_baslangic || null,
      gecerlilik_bitis: form.gecerlilik_bitis || null,
      min_adet: parseInt(form.min_adet) || 1,
      not_: form.not_ || null,
    };

    if (isEdit) {
      const { error } = await supabase.from("fiyat_listesi").update(payload).eq("fiyat_id", initialData.fiyat_id);
      if (error) { setError(error.message); setLoading(false); return; }
    } else {
      const fiyat_id = "FYT" + Date.now().toString(36).toUpperCase();
      const { error } = await supabase.from("fiyat_listesi").insert({ fiyat_id, ...payload });
      if (error) { setError(error.message); setLoading(false); return; }
    }

    router.push("/admin/fiyatlar");
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm("Bu fiyatı silmek istediğinizden emin misiniz?")) return;
    await supabase.from("fiyat_listesi").delete().eq("fiyat_id", initialData.fiyat_id);
    router.push("/admin/fiyatlar");
    router.refresh();
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{isEdit ? "Fiyat Düzenle" : "Yeni Fiyat"}</h2>
          <p className="text-slate-500 mt-1">{isEdit ? `ID: ${initialData?.fiyat_id}` : "Parça için fiyat tanımlayın."}</p>
        </div>
        <button onClick={() => router.back()} className="text-sm text-slate-500 hover:text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg">
          ← Geri
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-8 space-y-5 shadow-sm">
        {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg border border-red-200">{error}</div>}

        {/* Parça seçimi */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Parça</label>
          {selectedParca ? (
            <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-blue-900">{selectedParca.parca_adi}</p>
                <p className="text-xs text-blue-600 font-mono mt-0.5">{selectedParca.hafu_kod}</p>
              </div>
              {!isEdit && <button type="button" onClick={() => { setSelectedParca(null); setParcaQuery(""); }} className="text-blue-400 hover:text-blue-600 text-xs">Değiştir</button>}
            </div>
          ) : isEdit ? (
            <p className="text-sm text-slate-600 bg-slate-50 border rounded-lg px-3 py-2">{initialData?.parca_listesi?.parca_adi}</p>
          ) : (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={parcaQuery}
                onChange={(e) => searchParca(e.target.value)}
                placeholder="Parça adı, HAFU kodu veya OEM kodu..."
                className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {parcaResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                  {parcaResults.map((p) => (
                    <button key={p.parca_id} type="button"
                      onClick={() => { setSelectedParca(p); setParcaResults([]); setParcaQuery(p.parca_adi); }}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 border-b border-slate-50 last:border-0 transition-colors"
                    >
                      <span className="font-medium text-slate-800">{p.parca_adi}</span>
                      <span className="text-slate-400 ml-2 font-mono text-xs">{p.hafu_kod}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Fiyat Tipi</label>
            <select value={form.fiyat_tip_id} onChange={(e) => setForm((f) => ({ ...f, fiyat_tip_id: e.target.value }))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              {fiyatTipleri.map((t) => <option key={t.fiyat_tip_id} value={t.fiyat_tip_id}>{t.ad}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Durum</label>
            <select value={form.fiyat_durum_id} onChange={(e) => setForm((f) => ({ ...f, fiyat_durum_id: e.target.value }))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              {fiyatDurumlari.map((d) => <option key={d.fiyat_durum_id} value={d.fiyat_durum_id}>{d.ad}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Birim Fiyat</label>
            <div className="flex">
              <select value={form.para_birimi} onChange={(e) => setForm((f) => ({ ...f, para_birimi: e.target.value }))}
                className="border border-r-0 border-slate-200 rounded-l-lg px-2 py-2 text-sm bg-slate-50 focus:outline-none">
                <option>TRY</option><option>USD</option><option>EUR</option>
              </select>
              <input required type="number" min={0} step={0.01} value={form.birim_fiyat}
                onChange={(e) => setForm((f) => ({ ...f, birim_fiyat: e.target.value }))}
                placeholder="0.00"
                className="flex-1 border border-slate-200 rounded-r-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Min. Adet</label>
            <input type="number" min={1} value={form.min_adet}
              onChange={(e) => setForm((f) => ({ ...f, min_adet: e.target.value }))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Geçerlilik Başlangıç</label>
            <input type="date" value={form.gecerlilik_baslangic}
              onChange={(e) => setForm((f) => ({ ...f, gecerlilik_baslangic: e.target.value }))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Geçerlilik Bitiş</label>
            <input type="date" value={form.gecerlilik_bitis}
              onChange={(e) => setForm((f) => ({ ...f, gecerlilik_bitis: e.target.value }))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Not</label>
          <textarea value={form.not_} onChange={(e) => setForm((f) => ({ ...f, not_: e.target.value }))}
            rows={2} placeholder="Opsiyonel not"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
        </div>

        <div className="flex items-center justify-between pt-2">
          {isEdit && (
            <button type="button" onClick={handleDelete} className="text-sm text-red-600 hover:text-red-700 font-medium">Sil</button>
          )}
          <button type="submit" disabled={loading}
            className="ml-auto bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors">
            {loading ? "Kaydediliyor..." : isEdit ? "Güncelle" : "Kaydet"}
          </button>
        </div>
      </form>
    </div>
  );
}
