"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Trash2, PlusCircle, Search } from "lucide-react";

export default function UsageMatrixPage() {
  const supabase = createClient();

  const [modeller, setModeller] = useState<any[]>([]);
  const [periyotlar, setPeriyotlar] = useState<any[]>([]);
  const [parcalar, setParcalar] = useState<any[]>([]); // parca_listesi - for picker

  const [selectedModel, setSelectedModel] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("");

  const [rows, setRows] = useState<any[]>([]);
  const [loadingRows, setLoadingRows] = useState(false);

  // Parça ekleme
  const [showPicker, setShowPicker] = useState(false);
  const [pickerQuery, setPickerQuery] = useState("");
  const [pickerResults, setPickerResults] = useState<any[]>([]);
  const [addQty, setAddQty] = useState("1");
  const [addZorunlu, setAddZorunlu] = useState(true);
  const [selectedParca, setSelectedParca] = useState<any>(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    Promise.all([
      supabase.from("model").select("model_id, model_adi, marka(marka_adi)").eq("aktif", true).order("model_adi"),
      supabase.from("bakim_periyotlari").select("*").eq("aktif", true).order("saat"),
    ]).then(([m, p]) => {
      setModeller(m.data ?? []);
      setPeriyotlar(p.data ?? []);
      if (p.data && p.data.length > 0) setSelectedPeriod(p.data[0].period_id);
    });
  }, []);

  useEffect(() => {
    if (!selectedModel || !selectedPeriod) { setRows([]); return; }
    fetchRows();
  }, [selectedModel, selectedPeriod]);

  async function fetchRows() {
    setLoadingRows(true);
    const { data } = await supabase
      .from("usage_matrix")
      .select("*, parca_listesi(parca_id, parca_adi, hafu_kod, oem_kod)")
      .eq("model_id", selectedModel)
      .eq("period_id", selectedPeriod)
      .order("usage_id");
    setRows(data ?? []);
    setLoadingRows(false);
  }

  async function handleDelete(usage_id: string) {
    await supabase.from("usage_matrix").delete().eq("usage_id", usage_id);
    setRows((r) => r.filter((x) => x.usage_id !== usage_id));
  }

  async function handleQtyChange(usage_id: string, qty: number) {
    await supabase.from("usage_matrix").update({ qty }).eq("usage_id", usage_id);
    setRows((r) => r.map((x) => x.usage_id === usage_id ? { ...x, qty } : x));
  }

  async function handleZorunluToggle(usage_id: string, val: boolean) {
    await supabase.from("usage_matrix").update({ zorunlu_mu: val }).eq("usage_id", usage_id);
    setRows((r) => r.map((x) => x.usage_id === usage_id ? { ...x, zorunlu_mu: val } : x));
  }

  async function handlePickerSearch(q: string) {
    setPickerQuery(q);
    if (!q.trim()) { setPickerResults([]); return; }
    const { data } = await supabase
      .from("parca_listesi")
      .select("parca_id, parca_adi, hafu_kod, oem_kod")
      .or(`parca_adi.ilike.%${q}%,hafu_kod.ilike.%${q}%,oem_kod.ilike.%${q}%`)
      .limit(10);
    // Zaten eklenmiş parçaları filtrele
    const existing = new Set(rows.map((r) => r.parca_id));
    setPickerResults((data ?? []).filter((p) => !existing.has(p.parca_id)));
  }

  async function handleAdd() {
    if (!selectedParca || !selectedModel || !selectedPeriod) return;
    setAdding(true);
    const usage_id = "USG" + Date.now().toString(36).toUpperCase();
    const { error } = await supabase.from("usage_matrix").insert({
      usage_id,
      model_id: selectedModel,
      period_id: selectedPeriod,
      parca_id: selectedParca.parca_id,
      qty: parseFloat(addQty) || 1,
      zorunlu_mu: addZorunlu,
    });
    if (!error) {
      setRows((r) => [...r, {
        usage_id,
        model_id: selectedModel,
        period_id: selectedPeriod,
        parca_id: selectedParca.parca_id,
        qty: parseFloat(addQty) || 1,
        zorunlu_mu: addZorunlu,
        aktif: true,
        parca_listesi: selectedParca,
      }]);
      setShowPicker(false);
      setSelectedParca(null);
      setPickerQuery("");
      setPickerResults([]);
      setAddQty("1");
      setAddZorunlu(true);
    }
    setAdding(false);
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Usage Matrix</h2>
        <p className="text-slate-500 mt-1">Model + periyot bazında hangi parçaların kullanıldığını yönetin.</p>
      </div>

      {/* Model Seçimi */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6 shadow-sm">
        <label className="block text-sm font-semibold text-slate-700 mb-2">Model Seç</label>
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="w-full max-w-sm border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">— Model seçiniz —</option>
          {modeller.map((m) => (
            <option key={m.model_id} value={m.model_id}>
              {(m.marka as any)?.marka_adi} — {m.model_adi}
            </option>
          ))}
        </select>
      </div>

      {selectedModel && (
        <>
          {/* Periyot Tabları */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {periyotlar.map((p) => (
              <button
                key={p.period_id}
                onClick={() => setSelectedPeriod(p.period_id)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                  selectedPeriod === p.period_id
                    ? "bg-blue-600 text-white border-blue-600 shadow"
                    : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                }`}
              >
                {p.saat}H
              </button>
            ))}
          </div>

          {/* Tablo */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <p className="text-sm font-semibold text-slate-700">
                {loadingRows ? "Yükleniyor..." : `${rows.length} parça`}
              </p>
              <button
                onClick={() => { setShowPicker(true); setPickerQuery(""); setPickerResults([]); }}
                className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
              >
                <PlusCircle className="w-4 h-4" /> Parça Ekle
              </button>
            </div>

            {rows.length === 0 && !loadingRows ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                Bu model + periyot için henüz parça eklenmemiş.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Parça</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">HAFU Kodu</th>
                    <th className="text-center px-4 py-3 font-semibold text-slate-600 w-24">Adet</th>
                    <th className="text-center px-4 py-3 font-semibold text-slate-600 w-24">Zorunlu</th>
                    <th className="px-4 py-3 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.usage_id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-800">{row.parca_listesi?.parca_adi}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">{row.parca_listesi?.hafu_kod}</td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="number"
                          min={1}
                          step={0.5}
                          value={row.qty}
                          onChange={(e) => handleQtyChange(row.usage_id, parseFloat(e.target.value) || 1)}
                          className="w-16 text-center border border-slate-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={row.zorunlu_mu}
                          onChange={(e) => handleZorunluToggle(row.usage_id, e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded border-slate-300"
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => handleDelete(row.usage_id)} className="text-red-400 hover:text-red-600 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* Parça Ekleme Modal */}
      {showPicker && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Parça Ekle</h3>

            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                autoFocus
                value={pickerQuery}
                onChange={(e) => handlePickerSearch(e.target.value)}
                placeholder="Parça adı, HAFU kodu veya OEM..."
                className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {pickerResults.length > 0 && !selectedParca && (
              <div className="border border-slate-200 rounded-xl overflow-hidden mb-4 max-h-52 overflow-y-auto">
                {pickerResults.map((p) => (
                  <button
                    key={p.parca_id}
                    onClick={() => { setSelectedParca(p); setPickerResults([]); }}
                    className="w-full text-left px-4 py-3 text-sm hover:bg-blue-50 border-b border-slate-50 last:border-0 transition-colors"
                  >
                    <span className="font-medium text-slate-800">{p.parca_adi}</span>
                    <span className="text-slate-400 ml-2 font-mono text-xs">{p.hafu_kod}</span>
                  </button>
                ))}
              </div>
            )}

            {selectedParca && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-blue-900">{selectedParca.parca_adi}</p>
                  <p className="text-xs text-blue-600 font-mono mt-0.5">{selectedParca.hafu_kod}</p>
                </div>
                <button onClick={() => { setSelectedParca(null); setPickerQuery(""); }} className="text-blue-400 hover:text-blue-600 text-xs">Değiştir</button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 mb-5">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Adet</label>
                <input
                  type="number"
                  min={1}
                  step={0.5}
                  value={addQty}
                  onChange={(e) => setAddQty(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={addZorunlu}
                    onChange={(e) => setAddZorunlu(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300"
                  />
                  Zorunlu parça
                </label>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setShowPicker(false); setSelectedParca(null); }}
                className="flex-1 border border-slate-200 text-slate-600 font-medium text-sm py-2.5 rounded-xl hover:bg-slate-50 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleAdd}
                disabled={!selectedParca || adding}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm py-2.5 rounded-xl transition-colors"
              >
                {adding ? "Ekleniyor..." : "Ekle"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
