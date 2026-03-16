"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Search } from "lucide-react";

export default function StokPage() {
  const supabase = createClient();
  const [rows, setRows] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  async function fetchData(q?: string) {
    setLoading(true);
    let req = supabase.from("stok").select("stok_id, toplam_miktar, rezerve_miktar, kullanilabilir_miktar, min_stok, son_guncelleme, parca_listesi(parca_adi, hafu_kod), depolar(depo_adi)").order("son_guncelleme", { ascending: false }).limit(300);
    if (q?.trim()) {
      const { data: parcaData } = await supabase.from("parca_listesi").select("parca_id").or(`parca_adi.ilike.%${q}%,hafu_kod.ilike.%${q}%`);
      const ids = (parcaData ?? []).map(p => p.parca_id);
      if (ids.length) req = req.in("parca_id", ids); else { setRows([]); setLoading(false); return; }
    }
    const { data } = await req;
    setRows(data ?? []); setLoading(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div><h2 className="text-2xl font-bold text-slate-900">Stok Durumu</h2><p className="text-slate-500 mt-1">{rows.length} kayıt</p></div>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); fetchData(query); }} className="mb-6 flex gap-2">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Parça adı veya HAFU kodu..." className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
        <button type="submit" className="px-4 py-2.5 bg-slate-800 text-white text-sm font-medium rounded-xl hover:bg-slate-700 transition-colors">Ara</button>
      </form>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-slate-100 bg-slate-50"><th className="text-left px-4 py-3 font-semibold text-slate-600">Parça</th><th className="text-left px-4 py-3 font-semibold text-slate-600">Depo</th><th className="text-right px-4 py-3 font-semibold text-slate-600">Toplam</th><th className="text-right px-4 py-3 font-semibold text-slate-600">Rezerve</th><th className="text-right px-4 py-3 font-semibold text-slate-600">Kullanılabilir</th><th className="text-right px-4 py-3 font-semibold text-slate-600">Min. Stok</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={6} className="text-center py-12 text-slate-400">Yükleniyor...</td></tr>
              : rows.length === 0 ? <tr><td colSpan={6} className="text-center py-12 text-slate-400">Stok kaydı yok</td></tr>
              : rows.map((r) => {
                const kritik = r.min_stok && r.kullanilabilir_miktar <= r.min_stok;
                return (
                  <tr key={r.stok_id} className={`border-b border-slate-50 hover:bg-slate-50 ${kritik ? "bg-red-50/30" : ""}`}>
                    <td className="px-4 py-3"><p className="font-medium text-slate-800">{r.parca_listesi?.parca_adi}</p><p className="text-xs font-mono text-slate-400">{r.parca_listesi?.hafu_kod}</p></td>
                    <td className="px-4 py-3 text-slate-600">{r.depolar?.depo_adi}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-800">{r.toplam_miktar}</td>
                    <td className="px-4 py-3 text-right text-slate-500">{r.rezerve_miktar}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-semibold ${kritik ? "text-red-600" : "text-emerald-600"}`}>{r.kullanilabilir_miktar}</span>
                      {kritik && <span className="ml-1 text-xs text-red-500">⚠</span>}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-400">{r.min_stok ?? "—"}</td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
