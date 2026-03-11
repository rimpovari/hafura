"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface AltGrupFormProps {
  initialData?: any;
  isEdit?: boolean;
}

export function AltGrupForm({ initialData, isEdit }: AltGrupFormProps) {
  const supabase = createClient();
  const router = useRouter();
  const [anaGruplar, setAnaGruplar] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    ana_grup_id: initialData?.ana_grup_id ?? "",
    alt_grup_kod: initialData?.alt_grup_kod ?? "",
    alt_grup_adi: initialData?.alt_grup_adi ?? "",
    aciklama: initialData?.aciklama ?? "",
    aktif: initialData?.aktif ?? true,
  });

  useEffect(() => {
    supabase.from("ana_grup").select("ana_grup_id, ana_grup_adi").eq("aktif", true).order("ana_grup_adi").then(({ data }) => setAnaGruplar(data ?? []));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (isEdit) {
      const { error } = await supabase.from("alt_grup").update(form).eq("alt_grup_id", initialData.alt_grup_id);
      if (error) { setError(error.message); setLoading(false); return; }
    } else {
      const alt_grup_id = "ALT" + Date.now().toString(36).toUpperCase();
      const { error } = await supabase.from("alt_grup").insert({ alt_grup_id, ...form });
      if (error) { setError(error.message); setLoading(false); return; }
    }

    router.push("/admin/alt-gruplar");
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm("Bu alt grubu silmek istediğinizden emin misiniz?")) return;
    await supabase.from("alt_grup").delete().eq("alt_grup_id", initialData.alt_grup_id);
    router.push("/admin/alt-gruplar");
    router.refresh();
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{isEdit ? "Alt Grup Düzenle" : "Yeni Alt Grup"}</h2>
          <p className="text-slate-500 mt-1">{isEdit ? `ID: ${initialData?.alt_grup_id}` : "Yeni alt grup kaydı oluşturun."}</p>
        </div>
        <button onClick={() => router.back()} className="text-sm text-slate-500 hover:text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg">
          ← Geri
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-8 space-y-5 shadow-sm">
        {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg border border-red-200">{error}</div>}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Ana Grup</label>
          <select
            required
            value={form.ana_grup_id}
            onChange={(e) => setForm((f) => ({ ...f, ana_grup_id: e.target.value }))}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">Seçiniz...</option>
            {anaGruplar.map((g) => (
              <option key={g.ana_grup_id} value={g.ana_grup_id}>{g.ana_grup_adi}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Kod</label>
          <input
            required
            value={form.alt_grup_kod}
            onChange={(e) => setForm((f) => ({ ...f, alt_grup_kod: e.target.value }))}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="örn. ALT01"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Alt Grup Adı</label>
          <input
            required
            value={form.alt_grup_adi}
            onChange={(e) => setForm((f) => ({ ...f, alt_grup_adi: e.target.value }))}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Alt grup adını girin"
          />
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

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="aktif"
            checked={form.aktif}
            onChange={(e) => setForm((f) => ({ ...f, aktif: e.target.checked }))}
            className="w-4 h-4 text-blue-600 rounded border-slate-300"
          />
          <label htmlFor="aktif" className="text-sm font-medium text-slate-700">Aktif</label>
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
