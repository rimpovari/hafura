import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Settings2 } from 'lucide-react'
import ParcaListesi, { type ParcaRow } from '@/components/ParcaListesi'
import CartIcon from '@/components/CartIcon'

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ period?: string }>
}

export default async function MakinePage({ params, searchParams }: Props) {
  const { id } = await params
  const { period: selectedPeriod } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const { data: makine } = await supabase
    .from('musteri_makineleri')
    .select('musteri_makine_id, makine_etiketi, sasi_no, calisma_saati, model_id, model:model_id(model_id, model_adi)')
    .eq('musteri_makine_id', id)
    .single()

  if (!makine) redirect('/hesabim')

  const { data: musteri } = await supabase
    .from('musteriler')
    .select('musteri_id')
    .eq('auth_user_id', user.id)
    .single()

  const { data: tumMakineler } = await supabase
    .from('musteri_makineleri')
    .select('musteri_makine_id, makine_etiketi, model:model_id(model_adi)')
    .eq('musteri_id', musteri?.musteri_id ?? '')
    .eq('aktif', true)

  const { data: usageRows } = await supabase
    .from('usage_matrix')
    .select('period_id')
    .eq('model_id', makine.model_id)
    .eq('aktif', true)

  const periodIds = [...new Set((usageRows ?? []).map((r) => r.period_id))]

  const { data: periods } = await supabase
    .from('bakim_periyotlari')
    .select('period_id, period_kod, saat')
    .in('period_id', periodIds)
    .order('saat')

  const activePeriod = selectedPeriod ?? periods?.[0]?.period_id ?? null
  const saatler = makine.calisma_saati ?? 0
  const nextPeriod = periods?.find((p) => p.saat > saatler)

  const { data: rawParcalar } = activePeriod
    ? await supabase
        .from('usage_matrix')
        .select('qty, zorunlu_mu, parca_listesi!inner(parca_id, parca_adi, hafu_kod, oem_kod, parca_durum_id)')
        .eq('model_id', makine.model_id)
        .eq('period_id', activePeriod)
        .eq('aktif', true)
    : { data: [] }

  const model = (Array.isArray(makine.model) ? makine.model[0] : makine.model) as { model_id: string; model_adi: string } | null
  const makineLabel = makine.makine_etiketi || model?.model_adi || 'Makine'

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-slate-900 text-white px-4 py-4 flex items-center justify-between">
        <a href="/" className="text-xl font-bold tracking-tight">
          HAFU <span className="text-slate-400 text-sm font-normal ml-1">Yedek Parça</span>
        </a>
        <div className="flex items-center gap-5">
          <a href="/hesabim" className="text-sm text-slate-400 hover:text-white transition-colors">
            ← Hesabım
          </a>
          <CartIcon />
          <form action="/auth/signout" method="post">
            <button type="submit" className="text-sm text-slate-400 hover:text-white transition-colors">
              Çıkış
            </button>
          </form>
        </div>
      </header>

      {/* Makine kartları — yatay kaydırma */}
      <div className="bg-slate-800 px-4 py-3">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(tumMakineler ?? []).map((m) => {
            const isActive = m.musteri_makine_id === id
            const label = m.makine_etiketi || ((Array.isArray(m.model) ? m.model[0] : m.model) as { model_adi: string } | null)?.model_adi || 'Makine'
            return (
              <a
                key={m.musteri_makine_id}
                href={`/hesabim/makine/${m.musteri_makine_id}`}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                  isActive ? 'bg-white text-slate-900' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {label}
              </a>
            )
          })}
          <a
            href="/hesabim/makine-ekle"
            className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-700 text-slate-400 hover:bg-slate-600 transition-colors"
          >
            + Ekle
          </a>
        </div>
      </div>

      {/* Makine bilgisi */}
      <div className="bg-white border-b px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-start justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900">{makineLabel}</h1>
            {makine.makine_etiketi && model?.model_adi && (
              <p className="text-sm text-slate-500">{model.model_adi}</p>
            )}
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
              {makine.sasi_no && (
                <span className="text-xs text-slate-400">
                  Şasi: <span className="font-mono text-slate-600">{makine.sasi_no}</span>
                </span>
              )}
              {makine.calisma_saati != null && (
                <span className="text-xs text-slate-400">
                  Mevcut: <span className="font-medium text-slate-700">{makine.calisma_saati} saat</span>
                </span>
              )}
              {nextPeriod && (
                <span className="text-xs text-blue-600 font-medium">
                  Sonraki bakım: {nextPeriod.period_kod}
                </span>
              )}
            </div>
          </div>
          <div className="text-slate-300 p-1">
            <Settings2 className="w-4 h-4" />
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {periods && periods.length > 0 ? (
          <>
            <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
              {periods.map((p) => {
                const isActive = p.period_id === activePeriod
                const isNext = p.period_id === nextPeriod?.period_id
                return (
                  <a
                    key={p.period_id}
                    href={`/hesabim/makine/${id}?period=${p.period_id}`}
                    className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap relative ${
                      isActive ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border hover:border-slate-400'
                    }`}
                  >
                    {p.period_kod}
                    {isNext && !isActive && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full" />
                    )}
                  </a>
                )
              })}
            </div>

            <ParcaListesi
              parcalar={(rawParcalar ?? []) as unknown as ParcaRow[]}
              makine_id={id}
              makine_label={makineLabel}
            />
          </>
        ) : (
          <div className="bg-white rounded-xl border p-8 text-center text-slate-400 text-sm">
            Bu model için bakım listesi henüz tanımlanmamış.
          </div>
        )}
      </div>
    </main>
  )
}
