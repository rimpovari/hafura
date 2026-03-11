'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X, Loader2, Check, ShoppingCart } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useCart } from '@/context/CartContext'
import CartIcon from '@/components/CartIcon'
import LoginIncentive from '@/components/LoginIncentive'

export type UserMachine = {
  musteri_makine_id: string
  model_id: string
  makine_label: string
}

type Period = { period_id: string; period_kod: string; saat: number }

type Part = {
  parca_id: string
  parca_adi: string
  hafu_kod: string | null
  oem_kod: string | null
  parca_durum_id: string | null
  qty?: number
  zorunlu_mu?: boolean
}

const DURUM_BADGE: Record<string, { label: string; cls: string }> = {
  PDUR1: { label: 'Aktif', cls: 'bg-green-100 text-green-700' },
  PDUR2: { label: 'Teklif', cls: 'bg-yellow-100 text-yellow-700' },
  PDUR3: { label: 'Satış Dışı', cls: 'bg-red-100 text-red-700' },
  PDUR4: { label: 'Arşiv', cls: 'bg-gray-100 text-gray-500' },
}

function AddBtn({ part, makine_label }: { part: Part; makine_label?: string }) {
  const { add, items } = useCart()
  const [flash, setFlash] = useState(false)
  const inCart = items.some((i) => i.parca_id === part.parca_id)
  const satisDisi = part.parca_durum_id === 'PDUR3' || part.parca_durum_id === 'PDUR4'
  if (satisDisi) return null

  function handleAdd() {
    add({ parca_id: part.parca_id, parca_adi: part.parca_adi, hafu_kod: part.hafu_kod, qty: part.qty ?? 1, makine_label })
    setFlash(true)
    setTimeout(() => setFlash(false), 1500)
  }

  if (flash || inCart) {
    return (
      <button onClick={handleAdd} className="flex items-center gap-1 text-xs text-green-600 font-medium">
        <Check className="w-3.5 h-3.5" /> {flash ? 'Eklendi!' : 'Sepette'}
      </button>
    )
  }
  return (
    <button onClick={handleAdd} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium">
      <ShoppingCart className="w-3.5 h-3.5" /> Sepete Ekle
    </button>
  )
}

export default function MakineAramaEkrani({
  machines,
  userEmail,
}: {
  machines: UserMachine[]
  userEmail: string | null
}) {
  const supabase = createClient()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [selectedMachine, setSelectedMachine] = useState<UserMachine | null>(null)
  const [periods, setPeriods] = useState<Period[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [parts, setParts] = useState<Part[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  // Makine seçilince periyotları yükle
  useEffect(() => {
    if (!selectedMachine) {
      setPeriods([])
      setSelectedPeriod(null)
      setParts([])
      setSearched(false)
      return
    }

    async function loadPeriods() {
      if (!selectedMachine) return
      const { data: rows } = await supabase
        .from('usage_matrix')
        .select('period_id')
        .eq('model_id', selectedMachine.model_id)
        .eq('aktif', true)

      const ids = [...new Set((rows ?? []).map((r) => r.period_id))]
      const { data: ps } = await supabase
        .from('bakim_periyotlari')
        .select('period_id, period_kod, saat')
        .in('period_id', ids)
        .order('saat')

      setPeriods(ps ?? [])
      setSelectedPeriod(null)
      setParts([])
      setSearched(false)
    }
    loadPeriods()
  }, [selectedMachine])

  // Periyot seçilince o periyodun parçalarını getir
  useEffect(() => {
    if (!selectedMachine || !selectedPeriod) return
    setQuery('')
    fetchPeriodParts(selectedMachine.model_id, selectedPeriod)
  }, [selectedPeriod])

  async function fetchPeriodParts(modelId: string, periodId: string) {
    setLoading(true)
    const { data } = await supabase
      .from('usage_matrix')
      .select('qty, zorunlu_mu, parca_listesi!inner(parca_id, parca_adi, hafu_kod, oem_kod, parca_durum_id)')
      .eq('model_id', modelId)
      .eq('period_id', periodId)
      .eq('aktif', true)

    const mapped: Part[] = (data ?? []).map((row: any) => ({
      ...row.parca_listesi,
      qty: row.qty,
      zorunlu_mu: row.zorunlu_mu,
    }))
    setParts(mapped)
    setSearched(true)
    setLoading(false)
  }

  // Arama (debounce)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    const trimmed = query.trim()
    if (trimmed.length < 2) {
      // Periyot seçiliyse periyot parçalarını göster, yoksa temizle
      if (!selectedPeriod) {
        setParts([])
        setSearched(false)
      }
      return
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true)

      if (selectedMachine) {
        // Model bazlı arama: önce o modelin parca_id'lerini al
        const { data: umRows } = await supabase
          .from('usage_matrix')
          .select('parca_id')
          .eq('model_id', selectedMachine.model_id)
          .eq('aktif', true)

        const parcaIds = [...new Set((umRows ?? []).map((r) => r.parca_id))]

        if (parcaIds.length === 0) {
          setParts([])
          setSearched(true)
          setLoading(false)
          return
        }

        const { data } = await supabase
          .from('parca_listesi')
          .select('parca_id, parca_adi, hafu_kod, oem_kod, parca_durum_id')
          .in('parca_id', parcaIds)
          .or(`parca_adi.ilike.%${trimmed}%,hafu_kod.ilike.%${trimmed}%,oem_kod.ilike.%${trimmed}%`)
          .limit(20)

        setParts(data ?? [])
      } else {
        // Genel arama
        const { data } = await supabase
          .from('parca_listesi')
          .select('parca_id, parca_adi, hafu_kod, oem_kod, parca_durum_id')
          .or(`parca_adi.ilike.%${trimmed}%,hafu_kod.ilike.%${trimmed}%,oem_kod.ilike.%${trimmed}%`)
          .limit(20)

        setParts(data ?? [])
      }

      setSearched(true)
      setLoading(false)
    }, 300)

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query])

  function handleMachineSelect(m: UserMachine) {
    if (selectedMachine?.musteri_makine_id === m.musteri_makine_id) {
      setSelectedMachine(null)
    } else {
      setSelectedMachine(m)
      setQuery('')
    }
  }

  const showLoginIncentive = !userEmail && searched && parts.length > 0

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-slate-900 text-white px-4 py-4 flex items-center justify-between">
        <div>
          <span className="text-xl font-bold tracking-tight">HAFU</span>
          <span className="text-slate-400 text-sm ml-2">Yedek Parça</span>
        </div>
        <div className="flex items-center gap-4">
          <CartIcon />
          {userEmail ? (
            <>
              <a href="/hesabim" className="text-sm text-slate-300 hover:text-white transition-colors hidden sm:block">
                Hesabım
              </a>
              <form action="/auth/signout" method="post">
                <button type="submit" className="text-sm text-slate-400 hover:text-white transition-colors">
                  Çıkış
                </button>
              </form>
            </>
          ) : (
            <a href="/giris" className="text-sm text-slate-300 hover:text-white transition-colors">
              Giriş Yap
            </a>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="bg-slate-900 text-white px-4 pt-8 pb-12">
        <div className="max-w-2xl mx-auto">
          {/* Makine kartları */}
          {machines.length > 0 && (
            <div className="mb-6">
              <p className="text-slate-400 text-xs mb-2">Makinelerim</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {machines.map((m) => {
                  const isSelected = selectedMachine?.musteri_makine_id === m.musteri_makine_id
                  return (
                    <button
                      key={m.musteri_makine_id}
                      onClick={() => handleMachineSelect(m)}
                      className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap border ${
                        isSelected
                          ? 'bg-white text-slate-900 border-white'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      {m.makine_label}
                    </button>
                  )
                })}
                <a
                  href="/hesabim/makine-ekle"
                  className="shrink-0 px-4 py-2 rounded-full text-sm font-medium bg-slate-800 text-slate-500 border border-slate-700 hover:border-slate-500 transition-colors whitespace-nowrap"
                >
                  + Makine Ekle
                </a>
              </div>
            </div>
          )}

          {/* Başlık */}
          {!selectedMachine && (
            <div className="text-center mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold mb-1">İş Makinesi Yedek Parçası</h1>
              <p className="text-slate-400 text-sm">Parça adı, HAFU kodu veya OEM kodu ile arayın</p>
            </div>
          )}

          {/* Seçili makine bilgisi */}
          {selectedMachine && (
            <div className="mb-4">
              <p className="text-slate-300 text-sm">
                <span className="font-semibold text-white">{selectedMachine.makine_label}</span> için arama yapıyorsunuz
                <button
                  onClick={() => setSelectedMachine(null)}
                  className="ml-2 text-slate-500 hover:text-slate-300 text-xs underline"
                >
                  temizle
                </button>
              </p>
            </div>
          )}

          {/* Arama kutusu */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
            <input
              type="search"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setSelectedPeriod(null) }}
              placeholder={
                selectedMachine
                  ? `${selectedMachine.makine_label} parçalarında ara...`
                  : 'Örn: yağ filtresi, FDBA000001, LF3000...'
              }
              className="w-full bg-white text-slate-900 placeholder-slate-400 rounded-xl pl-12 pr-12 py-4 text-base shadow-lg outline-none focus:ring-2 focus:ring-blue-500"
              autoComplete="off"
            />
            {loading && (
              <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 animate-spin" />
            )}
            {!loading && query && (
              <button
                onClick={() => { setQuery(''); if (!selectedPeriod) { setParts([]); setSearched(false) } }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Bakım periyot sekmeleri */}
          {selectedMachine && periods.length > 0 && !query && (
            <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
              {periods.map((p) => (
                <button
                  key={p.period_id}
                  onClick={() => setSelectedPeriod(p.period_id === selectedPeriod ? null : p.period_id)}
                  className={`shrink-0 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                    selectedPeriod === p.period_id
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {p.period_kod}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Sonuçlar */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-3">
        {searched && !loading && (
          <>
            {parts.length === 0 ? (
              <div className="bg-white rounded-xl border p-8 text-center text-slate-400 text-sm">
                {query ? `"${query}" için sonuç bulunamadı.` : 'Bu periyot için parça bulunamadı.'}
              </div>
            ) : (
              <>
                <p className="text-xs text-slate-400 px-1">
                  {parts.length} parça
                  {selectedMachine && ` — ${selectedMachine.makine_label}`}
                  {selectedPeriod && ` / ${periods.find(p => p.period_id === selectedPeriod)?.period_kod}`}
                </p>
                {parts.map((p) => {
                  const durum = p.parca_durum_id ? DURUM_BADGE[p.parca_durum_id] : null
                  return (
                    <div
                      key={p.parca_id}
                      className="bg-white rounded-xl border px-5 py-4 flex items-start justify-between gap-4"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-slate-900 text-sm">{p.parca_adi}</p>
                          {p.zorunlu_mu === false && (
                            <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">Opsiyonel</span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                          {p.hafu_kod && (
                            <span className="text-xs text-slate-400">
                              HAFU: <span className="font-mono text-slate-600">{p.hafu_kod}</span>
                            </span>
                          )}
                          {p.oem_kod && (
                            <span className="text-xs text-slate-400">
                              OEM: <span className="font-mono text-slate-600">{p.oem_kod}</span>
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <div className="flex items-center gap-2">
                          {durum && (
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${durum.cls}`}>
                              {durum.label}
                            </span>
                          )}
                          {p.qty && (
                            <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                              x{p.qty}
                            </span>
                          )}
                        </div>
                        <AddBtn part={p} makine_label={selectedMachine?.makine_label} />
                      </div>
                    </div>
                  )
                })}
              </>
            )}

            {showLoginIncentive && (
              <div className="mt-2">
                <LoginIncentive />
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}
