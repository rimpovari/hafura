"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { PlusCircle, Pencil, Search } from "lucide-react";

const PARA_BIRIMI_BADGE: Record<string, string> = {
  TRY: "bg-emerald-50 text-emerald-700",
  USD: "bg-blue-50 text-blue-700",
  EUR: "bg-purple-50 text-purple-700",
};

export default function FiyatlarPage() {
  const supabase = createClient();
  const [fiyatlar, setFiyatlar] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchFiyatlar(); }, []);

  async function fetchFiyatlar(q?: string) {
    setLoading(true);
    let req = supabase
      .from("fiyat_listesi")
      .select("fiyat_id, birim_fiyat, para_birimi, gecerlilik_baslangic, gecerlilik_bitis, min_adet, parca_listesi(parca_adi, hafu_kod), fiyat_tipi(ad), fiyat_durum(ad)")
      .order("olusturma_tarihi", { ascending: false })
      .limit(200);

    if (q?.trim()) {
      const { data: parcaData } = await supabase
        .from("parca_listesi")
        .select("parca_id")
        .or(`parca_adi.ilike.%${q}%,hafu_kod.ilike.%${q}%`);
      const ids = (parcaData ?? []).map((p) => p.parca_id);
      if (ids.length > 0) req = req.in("parca_id", ids);
      else { setFiyatlar([]); setLoading(false); return; }
    }

    const { data } = await req;
    setFiyatlar(data ?? []);
    setLoading(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Fiyat Listesi</h2>
          <p className="text-slate-500 mt-1">{fiyatlar.length} kayıt</p>
        </div>
        <Link href="/admin/fiyatlar/new"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors shadow-sm">
          <PlusCircle className="w-4 h-4" /> Yeni Fiyat
        </Link>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); fetchFiyatlar(query); }} className="mb-6 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Parça adı veya HAFU kodu..."
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <button type="submit" className="px-4 py-2.5 bg-slate-800 text-white text-sm font-medium rounded-xl hover:bg-slate-700 transition-colors">Ara</button>
      </form>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Parça</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Fiyat Tipi</th>
              <th className="text-right px-4 py-3 font-semibold text-slate-600">Birim Fiyat</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Geçerlilik</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Durum</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-12 text-slate-400">Yükleniyor...</td></tr>
            ) : fiyatlar.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-slate-400">Kayıt bulunamadı</td></tr>
            ) : fiyatlar.map((f) => (
              <tr key={f.fiyat_id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-800">{f.parca_listesi?.parca_adi}</p>
                  <p className="text-xs font-mono text-slate-400 mt-0.5">{f.parca_listesi?.hafu_kod}</p>
                </td>
                <td className="px-4 py-3 text-slate-600">{f.fiyat_tipi?.ad}</td>
                <td className="px-4 py-3 text-right">
                  <span className={`text-xs font-semibold px-1.5 py-0.5 rounded mr-1 ${PARA_BIRIMI_BADGE[f.para_birimi] ?? "bg-slate-100 text-slate-600"}`}>
                    {f.para_birimi}
                  </span>
                  <span className="font-semibold text-slate-900">{Number(f.birim_fiyat).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">
                  {f.gecerlilik_baslangic && f.gecerlilik_bitis
                    ? `${f.gecerlilik_baslangic} – ${f.gecerlilik_bitis}`
                    : f.gecerlilik_baslangic ? `${f.gecerlilik_baslangic} →` : "—"}
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-full font-medium">{f.fiyat_durum?.ad}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/fiyatlar/${f.fiyat_id}`} className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
                    <Pencil className="w-3 h-3" /> Düzenle
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
