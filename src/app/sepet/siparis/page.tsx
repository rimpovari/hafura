'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/context/CartContext'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, Loader2, ShoppingCart } from 'lucide-react'

export default function SiparisPage() {
  const { items, count, clear } = useCart()
  const router = useRouter()
  const supabase = createClient()

  const [musteriId, setMusteriId] = useState<string | null>(null)
  const [not, setNot] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/giris'); return }
      const { data } = await supabase.from('musteriler').select('musteri_id').eq('auth_user_id', user.id).single()
      setMusteriId(data?.musteri_id ?? null)
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!musteriId || count === 0) return
    setLoading(true)
    setError('')

    const siparis_id = 'SIP' + Date.now().toString(36).toUpperCase()

    const { error: sipErr } = await supabase.from('siparisler').insert({
      siparis_id,
      musteri_id: musteriId,
      siparis_tipi: 'TEKLIF',
      durum: 'TASLAK',
      musteri_notu: not.trim() || null,
    })

    if (sipErr) { setError(sipErr.message); setLoading(false); return }

    const kalemler = items.map((item) => ({
      siparis_kalem_id: 'SKL' + Math.random().toString(36).slice(2, 10).toUpperCase(),
      siparis_id,
      parca_id: item.parca_id,
      musteri_makine_id: item.makine_id ?? null,
      qty: item.qty,
      birim_fiyat: 0,
    }))

    const { error: kalemErr } = await supabase.from('siparis_kalemleri').insert(kalemler)
    if (kalemErr) { setError(kalemErr.message); setLoading(false); return }

    clear()
    setDone(true)
    setLoading(false)
  }

  if (done) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border p-10 max-w-md w-full text-center shadow-sm">
          <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Talebiniz Alındı</h2>
          <p className="text-slate-500 text-sm mb-8">
            Sipariş talebinizi aldık. En kısa sürede fiyat teklifi ile geri döneceğiz.
          </p>
          <a
            href="/"
            className="block w-full bg-slate-900 text-white text-center font-semibold text-sm rounded-xl py-3 hover:bg-slate-800 transition-colors"
          >
            Ana Sayfaya Dön
          </a>
        </div>
      </main>
    )
  }

  if (count === 0) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border p-10 max-w-md w-full text-center shadow-sm">
          <ShoppingCart className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm mb-4">Sepetiniz boş.</p>
          <a href="/sepet" className="text-blue-600 text-sm font-medium hover:underline">← Sepete Dön</a>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-slate-900 text-white px-4 py-4 flex items-center justify-between">
        <a href="/" className="text-xl font-bold tracking-tight">
          HAFU <span className="text-slate-400 text-sm font-normal ml-1">Yedek Parça</span>
        </a>
        <a href="/sepet" className="text-sm text-slate-400 hover:text-white transition-colors">← Sepete Dön</a>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-xl font-bold text-slate-900 mb-6">Sipariş Talebi</h1>

        {/* Özet */}
        <div className="bg-white rounded-2xl border overflow-hidden mb-4">
          <div className="px-5 py-3 bg-slate-50 border-b">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Talep Edilen Parçalar</p>
          </div>
          <div className="divide-y">
            {items.map((item) => (
              <div key={item.parca_id} className="px-5 py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{item.parca_adi}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {item.hafu_kod && <span className="font-mono mr-2">{item.hafu_kod}</span>}
                    {item.makine_label && <span>{item.makine_label}</span>}
                  </p>
                </div>
                <span className="text-sm font-semibold text-slate-700 shrink-0">{item.qty} adet</span>
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border p-5 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg border border-red-200">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Notunuz <span className="text-slate-400 font-normal">(opsiyonel)</span>
            </label>
            <textarea
              value={not}
              onChange={(e) => setNot(e.target.value)}
              rows={4}
              placeholder="Teslimat adresi, aciliyet, özel istek vb."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <p className="text-xs text-slate-400">
            Talebinizi gönderdikten sonra ekibimiz fiyat teklifi ile iletişime geçecektir.
          </p>

          <button
            type="submit"
            disabled={loading || !musteriId}
            className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold text-sm rounded-xl py-3.5 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Gönderiliyor...</> : 'Talebi Gönder'}
          </button>
        </form>
      </div>
    </main>
  )
}
