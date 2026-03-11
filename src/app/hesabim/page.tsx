import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

type Makine = {
  musteri_makine_id: string
  makine_etiketi: string | null
  sasi_no: string | null
  calisma_saati: number | null
  model: { model_adi: string } | null
}

export default async function HesabimPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const { data: musteri } = await supabase
    .from('musteriler')
    .select('musteri_id, unvan_ad_soyad')
    .eq('auth_user_id', user.id)
    .single()

  const { data: makineler } = musteri
    ? await supabase
        .from('musteri_makineleri')
        .select('musteri_makine_id, makine_etiketi, sasi_no, calisma_saati, model:model_id(model_adi)')
        .eq('musteri_id', musteri.musteri_id)
        .eq('aktif', true)
    : { data: [] as Makine[] }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-slate-900 text-white px-4 py-4 flex items-center justify-between">
        <a href="/" className="text-xl font-bold tracking-tight">
          HAFU <span className="text-slate-400 text-sm font-normal ml-1">Yedek Parça</span>
        </a>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-400 hidden sm:block">{user.email}</span>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              Çıkış
            </button>
          </form>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Makinelerim</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {musteri?.unvan_ad_soyad ?? user.email}
            </p>
          </div>
          <a
            href="/hesabim/makine-ekle"
            className="bg-slate-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            + Makine Ekle
          </a>
        </div>

        {!makineler || makineler.length === 0 ? (
          <div className="bg-white rounded-2xl border p-10 text-center">
            <p className="text-slate-400 text-sm">Henüz kayıtlı makine yok.</p>
            <a
              href="/hesabim/makine-ekle"
              className="inline-block mt-4 text-blue-600 text-sm font-medium hover:underline"
            >
              İlk makinenizi ekleyin →
            </a>
          </div>
        ) : (
          <div className="space-y-3">
            {(makineler as Makine[]).map((m) => (
              <div
                key={m.musteri_makine_id}
                className="bg-white rounded-2xl border px-5 py-4 flex items-start justify-between gap-4"
              >
                <div>
                  <p className="font-semibold text-slate-900">
                    {m.makine_etiketi || m.model?.model_adi || 'Makine'}
                  </p>
                  {m.makine_etiketi && m.model?.model_adi && (
                    <p className="text-sm text-slate-500">{m.model.model_adi}</p>
                  )}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                    {m.sasi_no && (
                      <span className="text-xs text-slate-400">
                        Şasi: <span className="font-mono text-slate-600">{m.sasi_no}</span>
                      </span>
                    )}
                    {m.calisma_saati != null && (
                      <span className="text-xs text-slate-400">{m.calisma_saati} saat</span>
                    )}
                  </div>
                </div>
                <a
                  href={`/hesabim/makine/${m.musteri_makine_id}`}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium shrink-0"
                >
                  Bakım Listesi →
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
