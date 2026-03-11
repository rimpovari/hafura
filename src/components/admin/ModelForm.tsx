"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Save, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";

interface Props {
  initialData?: { model_id: string; marka_id: string; makine_tip_id: string; model_adi: string; aktif: boolean };
  isEdit?: boolean;
}

export function ModelForm({ initialData, isEdit = false }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [fetchingRefs, setFetchingRefs] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markalar, setMarkalar] = useState<any[]>([]);
  const [tipler, setTipler] = useState<any[]>([]);
  const [form, setForm] = useState({
    marka_id: initialData?.marka_id ?? "",
    makine_tip_id: initialData?.makine_tip_id ?? "",
    model_adi: initialData?.model_adi ?? "",
    aktif: initialData?.aktif ?? true,
  });

  function set(field: string, value: unknown) { setForm(p => ({ ...p, [field]: value })); }

  useEffect(() => {
    async function load() {
      const [mRes, tRes] = await Promise.all([
        supabase.from("marka").select("marka_id, marka_adi").order("marka_adi"),
        supabase.from("makine_tipi").select("makine_tip_id, makine_tip_adi").order("makine_tip_adi"),
      ]);
      setMarkalar(mRes.data ?? []);
      setTipler(tRes.data ?? []);
      if (!isEdit) {
        if (mRes.data?.length) set("marka_id", mRes.data[0].marka_id);
        if (tRes.data?.length) set("makine_tip_id", tRes.data[0].makine_tip_id);
      }
      setFetchingRefs(false);
    }
    load();
  }, [isEdit]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isEdit && initialData) {
        const { error } = await supabase.from("model").update(form).eq("model_id", initialData.model_id);
        if (error) throw error;
      } else {
        const newId = "MDL" + Date.now().toString(36).toUpperCase();
        const { error } = await supabase.from("model").insert({ ...form, model_id: newId });
        if (error) throw error;
      }
      router.push("/admin/modeller");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (fetchingRefs) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8 flex items-center gap-4">
        <Link href="/admin/modeller" className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"><ArrowLeft className="w-5 h-5" /></Link>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{isEdit ? "Model Düzenle" : "Yeni Model Tanımla"}</h2>
          <p className="text-slate-500">Model bilgilerini ve ilişkili marka/tipi seçin.</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 space-y-6">
          {error && <div className="p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-lg flex items-center gap-3 text-sm"><AlertCircle className="w-5 h-5 flex-shrink-0" />{error}</div>}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Model Adı</label>
            <input required placeholder="Örn: ZE500E-10" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
              value={form.model_adi} onChange={e => set("model_adi", e.target.value)} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Marka</label>
              <select required className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm bg-white"
                value={form.marka_id} onChange={e => set("marka_id", e.target.value)}>
                {markalar.map(m => <option key={m.marka_id} value={m.marka_id}>{m.marka_adi}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Makine Tipi</label>
              <select required className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm bg-white"
                value={form.makine_tip_id} onChange={e => set("makine_tip_id", e.target.value)}>
                {tipler.map(t => <option key={t.makine_tip_id} value={t.makine_tip_id}>{t.makine_tip_adi}</option>)}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
            <input type="checkbox" id="aktif" className="w-4 h-4 text-blue-600 rounded border-slate-300"
              checked={form.aktif} onChange={e => set("aktif", e.target.checked)} />
            <label htmlFor="aktif" className="text-sm font-medium text-slate-700 cursor-pointer select-none">Bu model sistemde aktif olarak kullanılsın</label>
          </div>
        </div>
        <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <Link href="/admin/modeller" className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">İptal</Link>
          <button disabled={loading} type="submit" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Kaydet
          </button>
        </div>
      </form>
    </div>
  );
}
