"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Search, Edit2, Trash2, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";

interface Model { model_id: string; model_adi: string; aktif: boolean; marka: { marka_adi: string } | null; makine_tipi: { makine_tip_adi: string } | null }

export default function ModellerPage() {
  const supabase = createClient();
  const [modeller, setModeller] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => { fetchModeller() }, []);

  async function fetchModeller() {
    setLoading(true);
    const { data } = await supabase.from("model").select("model_id, model_adi, aktif, marka:marka_id(marka_adi), makine_tipi:makine_tip_id(makine_tip_adi)").order("model_adi");
    setModeller((data as any) ?? []);
    setLoading(false);
  }

  const filtered = modeller.filter(m =>
    m.model_adi.toLowerCase().includes(search.toLowerCase()) ||
    m.marka?.marka_adi.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Modeller</h2>
          <p className="text-slate-500">Makine modellerini ve marka ilişkilerini yönetin.</p>
        </div>
        <Link href="/admin/modeller/new" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm">
          <Plus className="w-5 h-5" /> Yeni Model Ekle
        </Link>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Model adı veya marka ile ara..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {["Model Adı", "Marka", "Makine Tipi", "Durum", "İşlemler"].map((h, i) => (
                  <th key={h} className={`px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider ${i === 4 ? "text-right" : ""}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center"><div className="flex items-center justify-center gap-2 text-slate-500"><Loader2 className="w-5 h-5 animate-spin" />Yükleniyor...</div></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">Sonuç bulunamadı.</td></tr>
              ) : filtered.map(m => (
                <tr key={m.model_id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900">{m.model_adi}</td>
                  <td className="px-6 py-4"><span className="px-2 py-1 bg-slate-100 rounded text-xs font-medium text-slate-700">{m.marka?.marka_adi || "-"}</span></td>
                  <td className="px-6 py-4 text-sm text-slate-600">{m.makine_tipi?.makine_tip_adi || "-"}</td>
                  <td className="px-6 py-4">
                    {m.aktif
                      ? <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium"><CheckCircle2 className="w-3.5 h-3.5" />Aktif</span>
                      : <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 text-rose-700 rounded-full text-xs font-medium"><XCircle className="w-3.5 h-3.5" />Pasif</span>
                    }
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/modeller/${m.model_id}`} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><Edit2 className="w-4 h-4" /></Link>
                      <button className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
