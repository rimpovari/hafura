"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function TedarikciForm({ initialData, isEdit }: { initialData?: any; isEdit?: boolean }) {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    tedarikci_kod: initialData?.tedarikci_kod ?? "",
    tedarikci_adi: initialData?.tedarikci_adi ?? "",
    yetkili_kisi: initialData?.yetkili_kisi ?? "",
    telefon: initialData?.telefon ?? "",
    email: initialData?.email ?? "",
    ulke: initialData?.ulke ?? "",
    sehir: initialData?.sehir ?? "",
    adres: initialData?.adres ?? "",
    not_: initialData?.not_ ?? "",
    aktif: initialData?.aktif ?? true,
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError("");
    if (isEdit) {
      const { error } = await supabase.from("tedarikciler").update(form).eq("tedarikci_id", initialData.tedarikci_id);
      if (error) { setError(error.message); setLoading(false); return; }
    } else {
      const { error } = await supabase.from("tedarikciler").insert({ tedarikci_id: "TDR" + Date.now().toString(36).toUpperCase(), ...form });
      if (error) { setError(error.message); setLoading(false); return; }
    }
    router.push("/admin/tedarikciler"); router.refresh();
  }

  async function handleDelete() {
    if (!confirm("Silmek istediğinizden emin misiniz?")) return;
    await supabase.from("tedarikciler").delete().eq("tedarikci_id", initialData.tedarikci_id);
    router.push("/admin/tedarikciler"); router.refresh();
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-slate-900">{isEdit ? "Tedarikçi Düzenle" : "Yeni Tedarikçi"}</h2>
        <button onClick={() => router.back()} className="text-sm text-slate-500 hover:text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg">← Geri</button>
      </div>
      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-8 space-y-5 shadow-sm">
        {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg border border-red-200">{error}</div>}
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Kod</label><input required value={form.tedarikci_kod} onChange={set("tedarikci_kod")} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="TDR001" /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Tedarikçi Adı</label><input required value={form.tedarikci_adi} onChange={set("tedarikci_adi")} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Yetkili Kişi</label><input value={form.yetkili_kisi} onChange={set("yetkili_kisi")} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Telefon</label><input value={form.telefon} onChange={set("telefon")} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-slate-700 mb-1.5">E-posta</label><input type="email" value={form.email} onChange={set("email")} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Ülke</label><input value={form.ulke} onChange={set("ulke")} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Şehir</label><input value={form.sehir} onChange={set("sehir")} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
          <div className="flex items-end pb-1"><label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer"><input type="checkbox" checked={form.aktif} onChange={(e) => setForm(f => ({ ...f, aktif: e.target.checked }))} className="w-4 h-4 text-blue-600 rounded border-slate-300" />Aktif</label></div>
        </div>
        <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Adres</label><textarea value={form.adres} onChange={set("adres")} rows={2} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" /></div>
        <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Not</label><textarea value={form.not_} onChange={set("not_")} rows={2} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" /></div>
        <div className="flex items-center justify-between pt-2">
          {isEdit && <button type="button" onClick={handleDelete} className="text-sm text-red-600 hover:text-red-700 font-medium">Sil</button>}
          <button type="submit" disabled={loading} className="ml-auto bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors">{loading ? "Kaydediliyor..." : isEdit ? "Güncelle" : "Kaydet"}</button>
        </div>
      </form>
    </div>
  );
}
