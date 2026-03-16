"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function PeriyotForm({ initialData, isEdit }: { initialData?: any; isEdit?: boolean }) {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ period_kod: initialData?.period_kod ?? "", saat: initialData?.saat?.toString() ?? "", aciklama: initialData?.aciklama ?? "", aktif: initialData?.aktif ?? true });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError("");
    const payload = { ...form, saat: parseInt(form.saat) };
    if (isEdit) {
      const { error } = await supabase.from("bakim_periyotlari").update(payload).eq("period_id", initialData.period_id);
      if (error) { setError(error.message); setLoading(false); return; }
    } else {
      const { error } = await supabase.from("bakim_periyotlari").insert({ period_id: "PRD" + Date.now().toString(36).toUpperCase(), ...payload });
      if (error) { setError(error.message); setLoading(false); return; }
    }
    router.push("/admin/periyotlar"); router.refresh();
  }

  async function handleDelete() {
    if (!confirm("Silmek istediğinizden emin misiniz?")) return;
    await supabase.from("bakim_periyotlari").delete().eq("period_id", initialData.period_id);
    router.push("/admin/periyotlar"); router.refresh();
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-slate-900">{isEdit ? "Periyot Düzenle" : "Yeni Bakım Periyodu"}</h2>
        <button onClick={() => router.back()} className="text-sm text-slate-500 hover:text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg">← Geri</button>
      </div>
      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-8 space-y-5 shadow-sm">
        {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg border border-red-200">{error}</div>}
        <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Kod</label><input required value={form.period_kod} onChange={(e) => setForm(f => ({ ...f, period_kod: e.target.value }))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="örn. 250H" /></div>
        <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Saat</label><input required type="number" min={1} value={form.saat} onChange={(e) => setForm(f => ({ ...f, saat: e.target.value }))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="250" /></div>
        <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Açıklama</label><textarea value={form.aciklama} onChange={(e) => setForm(f => ({ ...f, aciklama: e.target.value }))} rows={2} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" /></div>
        <div className="flex items-center gap-3"><input type="checkbox" id="aktif" checked={form.aktif} onChange={(e) => setForm(f => ({ ...f, aktif: e.target.checked }))} className="w-4 h-4 text-blue-600 rounded border-slate-300" /><label htmlFor="aktif" className="text-sm font-medium text-slate-700">Aktif</label></div>
        <div className="flex items-center justify-between pt-2">
          {isEdit && <button type="button" onClick={handleDelete} className="text-sm text-red-600 hover:text-red-700 font-medium">Sil</button>}
          <button type="submit" disabled={loading} className="ml-auto bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors">{loading ? "Kaydediliyor..." : isEdit ? "Güncelle" : "Kaydet"}</button>
        </div>
      </form>
    </div>
  );
}
