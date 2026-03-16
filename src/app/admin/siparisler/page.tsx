"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Eye } from "lucide-react";

const DURUM_BADGE: Record<string, string> = {
  TASLAK: "bg-slate-100 text-slate-600",
  ONAY_BEKLIYOR: "bg-yellow-50 text-yellow-700",
  ONAYLANDI: "bg-blue-50 text-blue-700",
  HAZIRLANIYOR: "bg-purple-50 text-purple-700",
  KARGODA: "bg-indigo-50 text-indigo-700",
  TESLIM_EDILDI: "bg-emerald-50 text-emerald-700",
  IPTAL: "bg-red-50 text-red-600",
};

export default function SiparislerPage() {
  const supabase = createClient();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDurum, setFilterDurum] = useState("");

  useEffect(() => { fetchData(); }, [filterDurum]);

  async function fetchData() {
    setLoading(true);
    let req = supabase.from("siparisler").select("siparis_id, siparis_tarihi, siparis_tipi, durum, musteri_notu, musteriler(unvan_ad_soyad, eposta)").order("siparis_tarihi", { ascending: false }).limit(200);
    if (filterDurum) req = req.eq("durum", filterDurum);
    const { data } = await req;
    setRows(data ?? []); setLoading(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div><h2 className="text-2xl font-bold text-slate-900">Siparişler / Talepler</h2><p className="text-slate-500 mt-1">{rows.length} kayıt</p></div>
      </div>
      <div className="mb-6 flex gap-2 flex-wrap">
        {["", "TASLAK", "ONAY_BEKLIYOR", "ONAYLANDI", "HAZIRLANIYOR", "KARGODA", "TESLIM_EDILDI", "IPTAL"].map((d) => (
          <button key={d} onClick={() => setFilterDurum(d)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${filterDurum === d ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"}`}>
            {d || "Tümü"}
          </button>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-slate-100 bg-slate-50"><th className="text-left px-4 py-3 font-semibold text-slate-600">Sipariş ID</th><th className="text-left px-4 py-3 font-semibold text-slate-600">Müşteri</th><th className="text-left px-4 py-3 font-semibold text-slate-600">Tarih</th><th className="text-left px-4 py-3 font-semibold text-slate-600">Tip</th><th className="text-left px-4 py-3 font-semibold text-slate-600">Durum</th><th className="px-4 py-3"></th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={6} className="text-center py-12 text-slate-400">Yükleniyor...</td></tr>
              : rows.length === 0 ? <tr><td colSpan={6} className="text-center py-12 text-slate-400">Kayıt yok</td></tr>
              : rows.map((r) => (
                <tr key={r.siparis_id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">{r.siparis_id}</td>
                  <td className="px-4 py-3"><p className="font-medium text-slate-800">{(r.musteriler as any)?.unvan_ad_soyad ?? "—"}</p><p className="text-xs text-slate-400">{(r.musteriler as any)?.eposta}</p></td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{new Date(r.siparis_tarihi).toLocaleDateString("tr-TR")}</td>
                  <td className="px-4 py-3"><span className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-full font-medium">{r.siparis_tipi}</span></td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full font-medium ${DURUM_BADGE[r.durum] ?? "bg-slate-100 text-slate-600"}`}>{r.durum}</span></td>
                  <td className="px-4 py-3 text-right"><Link href={`/admin/siparisler/${r.siparis_id}`} className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"><Eye className="w-3 h-3" /> Detay</Link></td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
