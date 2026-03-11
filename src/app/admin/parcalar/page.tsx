"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Search, PlusCircle, Pencil } from "lucide-react";

export default function ParcalarPage() {
  const supabase = createClient();
  const [parcalar, setParcalar] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchParcalar();
  }, []);

  async function fetchParcalar(q?: string) {
    setLoading(true);
    let req = supabase
      .from("parca_listesi")
      .select("parca_id, parca_adi, hafu_kod, oem_kod, ana_grup(ana_grup_adi), alt_grup(alt_grup_adi), parca_durumlari(ad)")
      .order("parca_adi")
      .limit(200);

    if (q && q.trim()) {
      req = req.or(`parca_adi.ilike.%${q}%,hafu_kod.ilike.%${q}%,oem_kod.ilike.%${q}%`);
    }

    const { data } = await req;
    setParcalar(data ?? []);
    setLoading(false);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchParcalar(query);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Parça Listesi</h2>
          <p className="text-slate-500 mt-1">{parcalar.length} kayıt</p>
        </div>
        <Link
          href="/admin/parcalar/new"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors shadow-sm"
        >
          <PlusCircle className="w-4 h-4" /> Yeni Parça
        </Link>
      </div>

      <form onSubmit={handleSearch} className="mb-6 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Parça adı, HAFU kodu veya OEM kodu..."
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button type="submit" className="px-4 py-2.5 bg-slate-800 text-white text-sm font-medium rounded-xl hover:bg-slate-700 transition-colors">
          Ara
        </button>
      </form>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Parça Adı</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">HAFU Kodu</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">OEM Kodu</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Ana Grup</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Alt Grup</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Durum</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-slate-400">Yükleniyor...</td>
              </tr>
            ) : parcalar.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-slate-400">Kayıt bulunamadı</td>
              </tr>
            ) : (
              parcalar.map((p) => (
                <tr key={p.parca_id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-800">{p.parca_adi}</td>
                  <td className="px-4 py-3 text-slate-600 font-mono text-xs">{p.hafu_kod}</td>
                  <td className="px-4 py-3 text-slate-600 font-mono text-xs">{p.oem_kod}</td>
                  <td className="px-4 py-3 text-slate-500">{p.ana_grup?.ana_grup_adi ?? "-"}</td>
                  <td className="px-4 py-3 text-slate-500">{p.alt_grup?.alt_grup_adi ?? "-"}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-full font-medium">
                      {p.parca_durumlari?.ad ?? "-"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/parcalar/${p.parca_id}`}
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      <Pencil className="w-3 h-3" /> Düzenle
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
