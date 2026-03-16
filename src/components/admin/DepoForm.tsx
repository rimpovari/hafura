"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function DepoForm({ initialData, isEdit }: { initialData?: any; isEdit?: boolean }) {
  const supabase = createClient();
  const router = useRouter();
  const [tedarikciler, setTedarikciler] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ depo_adi: initialData?.depo_adi ?? "", depo_tipi: initialData?.depo_tipi ?? "", konum: initialData?.konum ?? "", tedarikci_id: initialData?.tedarikci_id ?? "", aktif: initialData?.aktif ?? true, aciklama: initialData?.aciklama ?? "" });

  useEffect(() => { supabase.from("tedarikciler").select("tedarikci_id, tedarikci_adi").eq("aktif", true).order("tedarikci_adi").then(({ data }) => setTedarikciler(data ?? [])); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError("");
    const payload = { ...form, tedarikci_id: form.tedarikci_id || null };
    if (isEdit) {
      const { error } = await supabase.from("depolar").update(payload).eq("depo_id", initialData.depo_id);
      if (error) { setError(error.message); setLoading(false); return; }
    } else {
      const { error } = await supabase.from("depolar").insert({ depo_id: "DPO" + Date.now().toString(36).toUpperCase(), ...payload });
      if (error) { setError(error.message); setLoading(false); return; }
    }
    router.push("/admin/depolar"); router.refresh();
  }

  async function handleDelete() {
    if (!confirm("Silmek istediğinizden emin misiniz?")) return;
    await supabase.from("depolar").delete().eq("depo_id", initialData.depo_id);
    router.push("/admin/depolar"); router.refresh();
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-slate-900">{isEdit ? "Depo Düzenle" : "Yeni Depo"}</h2>
        <button onClick={() => router.back()} className="text-sm text-slate-500 hover:text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg">← Geri</button>
      </div>
      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-8 space-y-5 shadow-sm">
        {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg border border-red-200">{error}</div>}
        <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Depo Adı</label><input required value={form.depo_adi} onChange={(e) => setForm(f => ({ ...f, depo_adi: e.target.value }))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Depo Tipi</label><input value={form.depo_tipi} onChange={(e) => setForm(f => ({ ...f, depo_tipi: e.target.value }))} placeholder="ANA / SAHALAR" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Konum</label><input value={form.konum} onChange={(e) => setForm(f => ({ ...f, konum: e.target.value }))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
        </div>
        <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Tedarikçi (opsiyonel)</label>
          <select value={form.tedarikci_id} onChange={(e) => setForm(f => ({ ...f, tedarikci_id: e.target.value }))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="">— Seçiniz —</option>
            {tedarikciler.map(t => <option key={t.tedarikci_id} value={t.tedarikci_id}>{t.tedarikci_adi}</option>)}
          </select>
        </div>
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
