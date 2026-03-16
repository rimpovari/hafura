"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

const DURUMLAR = ["TASLAK", "ONAY_BEKLIYOR", "ONAYLANDI", "HAZIRLANIYOR", "KARGODA", "TESLIM_EDILDI", "IPTAL"];

export default function SiparisDetayPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = createClient();
  const router = useRouter();
  const [siparis, setSiparis] = useState<any>(null);
  const [kalemler, setKalemler] = useState<any[]>([]);
  const [durum, setDurum] = useState("");
  const [icNot, setIcNot] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    params.then(async ({ id }) => {
      const [{ data: s }, { data: k }] = await Promise.all([
        supabase.from("siparisler").select("*, musteriler(unvan_ad_soyad, eposta, telefon)").eq("siparis_id", id).single(),
        supabase.from("siparis_kalemleri").select("*, parca_listesi(parca_adi, hafu_kod), musteri_makineleri(makine_etiketi)").eq("siparis_id", id),
      ]);
      setSiparis(s); setKalemler(k ?? []);
      setDurum(s?.durum ?? ""); setIcNot(s?.ic_not ?? "");
    });
  }, []);

  async function handleSave() {
    setSaving(true);
    await supabase.from("siparisler").update({ durum, ic_not: icNot }).eq("siparis_id", siparis.siparis_id);
    setSaving(false);
    router.refresh();
  }

  if (!siparis) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>;

  const musteri = siparis.musteriler as any;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div><h2 className="text-2xl font-bold text-slate-900">Sipariş Detayı</h2><p className="text-slate-500 font-mono text-sm mt-1">{siparis.siparis_id}</p></div>
        <button onClick={() => router.back()} className="text-sm text-slate-500 hover:text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg">← Geri</button>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Müşteri</h3>
          <p className="font-semibold text-slate-900">{musteri?.unvan_ad_soyad}</p>
          <p className="text-sm text-slate-500 mt-1">{musteri?.eposta}</p>
          <p className="text-sm text-slate-500">{musteri?.telefon}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Sipariş Bilgisi</h3>
          <p className="text-sm text-slate-600">Tip: <span className="font-medium text-slate-800">{siparis.siparis_tipi}</span></p>
          <p className="text-sm text-slate-600 mt-1">Tarih: <span className="font-medium text-slate-800">{new Date(siparis.siparis_tarihi).toLocaleDateString("tr-TR")}</span></p>
          {siparis.musteri_notu && <p className="text-sm text-slate-600 mt-2 bg-slate-50 px-3 py-2 rounded-lg italic">"{siparis.musteri_notu}"</p>}
        </div>
      </div>

      {/* Kalemler */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-slate-100"><p className="text-sm font-semibold text-slate-700">{kalemler.length} kalem</p></div>
        <table className="w-full text-sm">
          <thead><tr className="bg-slate-50 border-b border-slate-100"><th className="text-left px-4 py-3 font-semibold text-slate-600">Parça</th><th className="text-left px-4 py-3 font-semibold text-slate-600">Makine</th><th className="text-right px-4 py-3 font-semibold text-slate-600">Adet</th></tr></thead>
          <tbody>
            {kalemler.map((k) => (
              <tr key={k.siparis_kalem_id} className="border-b border-slate-50">
                <td className="px-4 py-3"><p className="font-medium text-slate-800">{(k.parca_listesi as any)?.parca_adi}</p><p className="text-xs font-mono text-slate-400">{(k.parca_listesi as any)?.hafu_kod}</p></td>
                <td className="px-4 py-3 text-slate-500 text-xs">{(k.musteri_makineleri as any)?.makine_etiketi ?? "—"}</td>
                <td className="px-4 py-3 text-right font-semibold text-slate-800">{k.qty}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Durum güncelleme */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-semibold text-slate-700">Durum Güncelle</h3>
        <div className="flex flex-wrap gap-2">
          {DURUMLAR.map((d) => (
            <button key={d} type="button" onClick={() => setDurum(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${durum === d ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"}`}>
              {d}
            </button>
          ))}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">İç Not</label>
          <textarea value={icNot} onChange={(e) => setIcNot(e.target.value)} rows={3}
            placeholder="Müşteriye görünmez, sadece iç kullanım"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
        </div>
        <button onClick={handleSave} disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors">
          {saving ? "Kaydediliyor..." : "Kaydet"}
        </button>
      </div>
    </div>
  );
}
