import { createClient } from '@/lib/supabase/server'
import MakineAramaEkrani, { type UserMachine } from '@/components/MakineAramaEkrani'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let machines: UserMachine[] = []

  if (user) {
    const { data: musteri } = await supabase
      .from('musteriler')
      .select('musteri_id')
      .eq('auth_user_id', user.id)
      .single()

    if (musteri) {
      const { data } = await supabase
        .from('musteri_makineleri')
        .select('musteri_makine_id, makine_etiketi, model_id, model:model_id(model_adi)')
        .eq('musteri_id', musteri.musteri_id)
        .eq('aktif', true)

      machines = (data ?? []).map((m) => ({
        musteri_makine_id: m.musteri_makine_id,
        model_id: m.model_id,
        makine_label: m.makine_etiketi || (m.model as { model_adi: string } | null)?.model_adi || 'Makine',
      }))
    }
  }

  return (
    <MakineAramaEkrani
      machines={machines}
      userEmail={user?.email ?? null}
    />
  )
}
