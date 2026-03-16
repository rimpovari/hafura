"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { PlusCircle, Pencil } from "lucide-react";

export default function TedarikcilerPage() {
  const supabase = createClient();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { supabase.from("tedarikciler").select("*").order("tedarikci_adi").then(({ data }) => { setRows(data ?? []); setLoading(false); }); }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div><h2 className="text-2xl font-bold text-slate-900">Tedarikçiler</h2><p className="text-slate-500 mt-1">{rows.length} kayıt</p></div>
        <Link href="/admin/tedarikciler/new" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors shadow-sm"><PlusCircle className="w-4 h-4" /> Yeni</Link>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-slate-100 bg-slate-50"><th className="text-left px-4 py-3 font-semibold text-slate-600">Ad</th><th className="text-left px-4 py-3 font-semibold text-slate-600">Yetkili</th><th className="text-left px-4 py-3 font-semibold text-slate-600">Telefon</th><th className="text-left px-4 py-3 font-semibold text-slate-600">Ülke / Şehir</th><th className="text-left px-4 py-3 font-semibold text-slate-600">Durum</th><th className="px-4 py-3"></th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={6} className="text-center py-12 text-slate-400">Yükleniyor...</td></tr>
              : rows.length === 0 ? <tr><td colSpan={6} className="text-center py-12 text-slate-400">Kayıt yok</td></tr>
              : rows.map((r) => (
                <tr key={r.tedarikci_id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-4 py-3"><p className="font-medium text-slate-800">{r.tedarikci_adi}</p><p className="text-xs font-mono text-slate-400">{r.tedarikci_kod}</p></td>
                  <td className="px-4 py-3 text-slate-600">{r.yetkili_kisi ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{r.telefon ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-500">{[r.ulke, r.sehir].filter(Boolean).join(" / ") || "—"}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full font-medium ${r.aktif ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{r.aktif ? "Aktif" : "Pasif"}</span></td>
                  <td className="px-4 py-3 text-right"><Link href={`/admin/tedarikciler/${r.tedarikci_id}`} className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"><Pencil className="w-3 h-3" /> Düzenle</Link></td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
