"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Save, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";

interface Props {
  initialData?: { marka_id: string; marka_kod: string; marka_adi: string; aciklama: string; aktif: boolean };
  isEdit?: boolean;
}

export function MarkaForm({ initialData, isEdit = false }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    marka_kod: initialData?.marka_kod ?? "",
    marka_adi: initialData?.marka_adi ?? "",
    aciklama: initialData?.aciklama ?? "",
    aktif: initialData?.aktif ?? true,
  });

  function set(field: string, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isEdit && initialData) {
        const { error } = await supabase.from("marka").update(form).eq("marka_id", initialData.marka_id);
        if (error) throw error;
      } else {
        const newId = "MRK" + Date.now().toString(36).toUpperCase();
        const { error } = await supabase.from("marka").insert({ ...form, marka_id: newId });
        if (error) throw error;
      }
      router.push("/admin/markalar");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8 flex items-center gap-4">
        <Link href="/admin/markalar" className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{isEdit ? "Marka Düzenle" : "Yeni Marka Tanımla"}</h2>
          <p className="text-slate-500">Marka bilgilerini {isEdit ? "güncelleyin" : "kaydedin"}.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 space-y-6">
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-lg flex items-center gap-3 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" /> {error}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Marka Kodu</label>
              <input required placeholder="Örn: ZM" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm uppercase"
                value={form.marka_kod} onChange={(e) => set("marka_kod", e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Marka Adı</label>
              <input required placeholder="Örn: Zoomlion" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                value={form.marka_adi} onChange={(e) => set("marka_adi", e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Açıklama</label>
            <textarea rows={3} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm resize-none"
              value={form.aciklama} onChange={(e) => set("aciklama", e.target.value)} />
          </div>
          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
            <input type="checkbox" id="aktif" className="w-4 h-4 text-blue-600 rounded border-slate-300"
              checked={form.aktif} onChange={(e) => set("aktif", e.target.checked)} />
            <label htmlFor="aktif" className="text-sm font-medium text-slate-700 cursor-pointer select-none">
              Bu marka sistemde aktif olarak kullanılsın
            </label>
          </div>
        </div>
        <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <Link href="/admin/markalar" className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">İptal</Link>
          <button disabled={loading} type="submit" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Kaydet
          </button>
        </div>
      </form>
    </div>
  );
}
