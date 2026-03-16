"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { PlusCircle, Pencil } from "lucide-react";

export default function PeriyotlarPage() {
  const supabase = createClient();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { supabase.from("bakim_periyotlari").select("*").order("saat").then(({ data }) => { setRows(data ?? []); setLoading(false); }); }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div><h2 className="text-2xl font-bold text-slate-900">Bakım Periyotları</h2><p className="text-slate-500 mt-1">{rows.length} kayıt</p></div>
        <Link href="/admin/periyotlar/new" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors shadow-sm"><PlusCircle className="w-4 h-4" /> Yeni</Link>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-slate-100 bg-slate-50"><th className="text-left px-4 py-3 font-semibold text-slate-600">Kod</th><th className="text-left px-4 py-3 font-semibold text-slate-600">Saat</th><th className="text-left px-4 py-3 font-semibold text-slate-600">Açıklama</th><th className="text-left px-4 py-3 font-semibold text-slate-600">Durum</th><th className="px-4 py-3"></th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={5} className="text-center py-12 text-slate-400">Yükleniyor...</td></tr>
              : rows.map((r) => (
                <tr key={r.period_id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">{r.period_kod}</td>
                  <td className="px-4 py-3 font-semibold text-slate-800">{r.saat}H</td>
                  <td className="px-4 py-3 text-slate-500">{r.aciklama ?? "—"}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full font-medium ${r.aktif ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{r.aktif ? "Aktif" : "Pasif"}</span></td>
                  <td className="px-4 py-3 text-right"><Link href={`/admin/periyotlar/${r.period_id}`} className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"><Pencil className="w-3 h-3" /> Düzenle</Link></td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
