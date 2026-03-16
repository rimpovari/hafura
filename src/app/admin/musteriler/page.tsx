"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Search } from "lucide-react";

export default function MusterilerPage() {
  const supabase = createClient();
  const [rows, setRows] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  async function fetchData(q?: string) {
    setLoading(true);
    let req = supabase.from("musteriler").select("musteri_id, unvan_ad_soyad, eposta, telefon, il, musteri_tipi, aktif, created_at").order("created_at", { ascending: false }).limit(200);
    if (q?.trim()) req = req.ilike("unvan_ad_soyad", `%${q}%`);
    const { data } = await req;
    setRows(data ?? []); setLoading(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div><h2 className="text-2xl font-bold text-slate-900">Müşteriler</h2><p className="text-slate-500 mt-1">{rows.length} kayıt</p></div>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); fetchData(query); }} className="mb-6 flex gap-2">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ad soyad ara..." className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
        <button type="submit" className="px-4 py-2.5 bg-slate-800 text-white text-sm font-medium rounded-xl hover:bg-slate-700 transition-colors">Ara</button>
      </form>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-slate-100 bg-slate-50"><th className="text-left px-4 py-3 font-semibold text-slate-600">Ad / Unvan</th><th className="text-left px-4 py-3 font-semibold text-slate-600">E-posta</th><th className="text-left px-4 py-3 font-semibold text-slate-600">Telefon</th><th className="text-left px-4 py-3 font-semibold text-slate-600">İl</th><th className="text-left px-4 py-3 font-semibold text-slate-600">Tip</th><th className="text-left px-4 py-3 font-semibold text-slate-600">Durum</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={6} className="text-center py-12 text-slate-400">Yükleniyor...</td></tr>
              : rows.length === 0 ? <tr><td colSpan={6} className="text-center py-12 text-slate-400">Kayıt yok</td></tr>
              : rows.map((r) => (
                <tr key={r.musteri_id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{r.unvan_ad_soyad}</td>
                  <td className="px-4 py-3 text-slate-600">{r.eposta ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{r.telefon ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-500">{r.il ?? "—"}</td>
                  <td className="px-4 py-3"><span className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-full font-medium">{r.musteri_tipi}</span></td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full font-medium ${r.aktif ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{r.aktif ? "Aktif" : "Pasif"}</span></td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
