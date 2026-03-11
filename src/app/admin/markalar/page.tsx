"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Search, Edit2, Trash2, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";

interface Marka { marka_id: string; marka_kod: string; marka_adi: string; aciklama: string; aktif: boolean }

export default function MarkalarPage() {
  const supabase = createClient();
  const [markalar, setMarkalar] = useState<Marka[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => { fetchMarkalar() }, []);

  async function fetchMarkalar() {
    setLoading(true);
    const { data } = await supabase.from("marka").select("*").order("marka_adi");
    setMarkalar(data ?? []);
    setLoading(false);
  }

  const filtered = markalar.filter(m =>
    m.marka_adi.toLowerCase().includes(search.toLowerCase()) ||
    m.marka_kod.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Markalar</h2>
          <p className="text-slate-500">Sistemde tanımlı tüm makine markalarını yönetin.</p>
        </div>
        <Link href="/admin/markalar/new" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm">
          <Plus className="w-5 h-5" /> Yeni Marka Ekle
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Marka adı veya kod ile ara..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {["Kod", "Marka Adı", "Açıklama", "Durum", "İşlemler"].map((h, i) => (
                  <th key={h} className={`px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider ${i === 4 ? "text-right" : ""}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /> Yükleniyor...
                  </div>
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <AlertCircle className="w-10 h-10 stroke-1" /><p>Sonuç bulunamadı.</p>
                  </div>
                </td></tr>
              ) : filtered.map(m => (
                <tr key={m.marka_id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-mono text-sm text-slate-600">{m.marka_kod}</td>
                  <td className="px-6 py-4 font-medium text-slate-900">{m.marka_adi}</td>
                  <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate">{m.aciklama || "-"}</td>
                  <td className="px-6 py-4">
                    {m.aktif
                      ? <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium"><CheckCircle2 className="w-3.5 h-3.5" />Aktif</span>
                      : <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 text-rose-700 rounded-full text-xs font-medium"><XCircle className="w-3.5 h-3.5" />Pasif</span>
                    }
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/markalar/${m.marka_id}`} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><Edit2 className="w-4 h-4" /></Link>
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
