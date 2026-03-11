'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Model = { model_id: string; model_adi: string; marka_id: string }

export default function MakineEklePage() {
  const [models, setModels] = useState<Model[]>([])
  const [modelId, setModelId] = useState('')
  const [etiket, setEtiket] = useState('')
  const [sasiNo, setSasiNo] = useState('')
  const [calisma, setCalisma] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase
      .from('model')
      .select('model_id, model_adi, marka_id')
      .eq('aktif', true)
      .order('model_adi')
      .then(({ data }) => setModels(data ?? []))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/giris'); return }

    let { data: musteri } = await supabase
      .from('musteriler')
      .select('musteri_id')
      .eq('auth_user_id', user.id)
      .single()

    // Müşteri kaydı yoksa otomatik oluştur (trigger kaçırıldıysa)
    if (!musteri) {
      const mstId = 'MST' + Date.now().toString(36).toUpperCase()
      const { data: yeni, error: createErr } = await supabase
        .from('musteriler')
        .insert({
          musteri_id: mstId,
          unvan_ad_soyad: user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'Müşteri',
          eposta: user.email,
          auth_user_id: user.id,
        })
        .select('musteri_id')
        .single()

      if (createErr || !yeni) {
        setError('Müşteri kaydı oluşturulamadı: ' + createErr?.message)
        setLoading(false)
        return
      }
      musteri = yeni
    }

    const id = 'MM' + Date.now().toString(36).toUpperCase()
    const { error: insertErr } = await supabase.from('musteri_makineleri').insert({
      musteri_makine_id: id,
      musteri_id: musteri.musteri_id,
      model_id: modelId,
      makine_etiketi: etiket || null,
      sasi_no: sasiNo || null,
      calisma_saati: calisma ? parseFloat(calisma) : null,
    })

    if (insertErr) { setError(insertErr.message); setLoading(false); return }

    router.push('/hesabim')
    router.refresh()
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-slate-900 text-white px-4 py-4">
        <a href="/hesabim" className="text-slate-400 hover:text-white text-sm transition-colors">
          ← Hesabım
        </a>
      </header>

      <div className="max-w-sm mx-auto px-4 py-8">
        <h1 className="text-xl font-bold text-slate-900 mb-6">Makine Ekle</h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Model <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
              className="w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Seçin...</option>
              {models.map((m) => (
                <option key={m.model_id} value={m.model_id}>
                  {m.model_adi}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Makine Adı / Etiketi
            </label>
            <input
              type="text"
              value={etiket}
              onChange={(e) => setEtiket(e.target.value)}
              placeholder="Örn: Şantiye No.2"
              className="w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Şasi Numarası</label>
            <input
              type="text"
              value={sasiNo}
              onChange={(e) => setSasiNo(e.target.value)}
              className="w-full border rounded-lg px-3 py-2.5 text-sm font-mono outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Çalışma Saati</label>
            <input
              type="number"
              value={calisma}
              onChange={(e) => setCalisma(e.target.value)}
              min={0}
              step={0.1}
              placeholder="0"
              className="w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-slate-800 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Kaydediliyor...' : 'Makineyi Kaydet'}
          </button>
        </form>
      </div>
    </main>
  )
}
