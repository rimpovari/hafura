"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface ParcaFormProps {
  initialData?: any;
  isEdit?: boolean;
}

export function ParcaForm({ initialData, isEdit }: ParcaFormProps) {
  const supabase = createClient();
  const router = useRouter();

  const [anaGruplar, setAnaGruplar] = useState<any[]>([]);
  const [altGruplar, setAltGruplar] = useState<any[]>([]);
  const [filteredAltGruplar, setFilteredAltGruplar] = useState<any[]>([]);
  const [durumlar, setDurumlar] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    parca_adi: initialData?.parca_adi ?? "",
    hafu_kod: initialData?.hafu_kod ?? "",
    oem_kod: initialData?.oem_kod ?? "",
    ana_grup_id: initialData?.ana_grup_id ?? "",
    alt_grup_id: initialData?.alt_grup_id ?? "",
    parca_durum_id: initialData?.parca_durum_id ?? "",
    aciklama: initialData?.aciklama ?? "",
    rule_notu: initialData?.rule_notu ?? "",
  });

  useEffect(() => {
    Promise.all([
      supabase.from("ana_grup").select("*").order("ana_grup_adi"),
      supabase.from("alt_grup").select("*").order("alt_grup_adi"),
      supabase.from("parca_durumlari").select("*").order("ad"),
    ]).then(([ag, altg, dur]) => {
      setAnaGruplar(ag.data ?? []);
      setAltGruplar(altg.data ?? []);
      setDurumlar(dur.data ?? []);
      if (initialData?.ana_grup_id) {
        setFilteredAltGruplar((altg.data ?? []).filter((a: any) => a.ana_grup_id === initialData.ana_grup_id));
      }
    });
  }, []);

  function handleAnaGrupChange(id: string) {
    setForm((f) => ({ ...f, ana_grup_id: id, alt_grup_id: "" }));
    setFilteredAltGruplar(altGruplar.filter((a) => a.ana_grup_id === id));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (isEdit) {
      const { error } = await supabase
        .from("parca_listesi")
        .update(form)
        .eq("parca_id", initialData.parca_id);
      if (error) { setError(error.message); setLoading(false); return; }
    } else {
      const parca_id = "PRC" + Date.now().toString(36).toUpperCase();
      const { error } = await supabase.from("parca_listesi").insert({ parca_id, ...form });
      if (error) { setError(error.message); setLoading(false); return; }
    }

    router.push("/admin/parcalar");
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm("Bu parçayı silmek istediğinizden emin misiniz?")) return;
    await supabase.from("parca_listesi").delete().eq("parca_id", initialData.parca_id);
    router.push("/admin/parcalar");
    router.refresh();
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{isEdit ? "Parça Düzenle" : "Yeni Parça"}</h2>
          <p className="text-slate-500 mt-1">{isEdit ? `ID: ${initialData?.parca_id}` : "Yeni parça kaydı oluşturun."}</p>
        </div>
        <button onClick={() => router.back()} className="text-sm text-slate-500 hover:text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg">
          ← Geri
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-8 space-y-5 shadow-sm">
        {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg border border-red-200">{error}</div>}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">HAFU Kodu</label>
            <input
              required
              value={form.hafu_kod}
              onChange={(e) => setForm((f) => ({ ...f, hafu_kod: e.target.value }))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="örn. HF-001"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">OEM Kodu</label>
            <input
              required
              value={form.oem_kod}
              onChange={(e) => setForm((f) => ({ ...f, oem_kod: e.target.value }))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="örn. 123456"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Parça Adı</label>
          <input
            required
            value={form.parca_adi}
            onChange={(e) => setForm((f) => ({ ...f, parca_adi: e.target.value }))}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Parça adını girin"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Ana Grup</label>
            <select
              required
              value={form.ana_grup_id}
              onChange={(e) => handleAnaGrupChange(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Seçiniz...</option>
              {anaGruplar.map((g) => (
                <option key={g.ana_grup_id} value={g.ana_grup_id}>{g.ana_grup_adi}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Alt Grup</label>
            <select
              required
              value={form.alt_grup_id}
              onChange={(e) => setForm((f) => ({ ...f, alt_grup_id: e.target.value }))}
              disabled={!form.ana_grup_id}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:opacity-50"
            >
              <option value="">Seçiniz...</option>
              {filteredAltGruplar.map((g) => (
                <option key={g.alt_grup_id} value={g.alt_grup_id}>{g.alt_grup_adi}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Durum</label>
          <select
            required
            value={form.parca_durum_id}
            onChange={(e) => setForm((f) => ({ ...f, parca_durum_id: e.target.value }))}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">Seçiniz...</option>
            {durumlar.map((d) => (
              <option key={d.parca_durum_id} value={d.parca_durum_id}>{d.ad}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Açıklama</label>
          <textarea
            value={form.aciklama}
            onChange={(e) => setForm((f) => ({ ...f, aciklama: e.target.value }))}
            rows={3}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Opsiyonel açıklama"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Kural Notu</label>
          <textarea
            value={form.rule_notu}
            onChange={(e) => setForm((f) => ({ ...f, rule_notu: e.target.value }))}
            rows={2}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Opsiyonel kural notu"
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          {isEdit && (
            <button type="button" onClick={handleDelete} className="text-sm text-red-600 hover:text-red-700 font-medium">
              Sil
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="ml-auto bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors"
          >
            {loading ? "Kaydediliyor..." : isEdit ? "Güncelle" : "Kaydet"}
          </button>
        </div>
      </form>
    </div>
  );
}
