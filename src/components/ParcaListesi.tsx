'use client'

import { useState } from 'react'
import { ShoppingCart, Check } from 'lucide-react'
import { useCart } from '@/context/CartContext'

const DURUM_BADGE: Record<string, { label: string; cls: string }> = {
  PDUR1: { label: 'Aktif', cls: 'bg-green-100 text-green-700' },
  PDUR2: { label: 'Teklif', cls: 'bg-yellow-100 text-yellow-700' },
  PDUR3: { label: 'Satış Dışı', cls: 'bg-red-100 text-red-700' },
  PDUR4: { label: 'Arşiv', cls: 'bg-gray-100 text-gray-500' },
}

export type ParcaRow = {
  qty: number
  zorunlu_mu: boolean
  parca_listesi: {
    parca_id: string
    parca_adi: string
    hafu_kod: string | null
    oem_kod: string | null
    parca_durum_id: string | null
  }
}

type Props = {
  parcalar: ParcaRow[]
  makine_id: string
  makine_label: string
}

function AddButton({ parca, makine_id, makine_label, qty }: {
  parca: ParcaRow['parca_listesi']
  makine_id: string
  makine_label: string
  qty: number
}) {
  const { add, items } = useCart()
  const [flash, setFlash] = useState(false)
  const inCart = items.some((i) => i.parca_id === parca.parca_id)

  function handleAdd() {
    add({
      parca_id: parca.parca_id,
      parca_adi: parca.parca_adi,
      hafu_kod: parca.hafu_kod,
      qty,
      makine_id,
      makine_label,
    })
    setFlash(true)
    setTimeout(() => setFlash(false), 1500)
  }

  if (flash || inCart) {
    return (
      <button
        onClick={handleAdd}
        className="flex items-center gap-1 text-xs text-green-600 font-medium"
      >
        <Check className="w-3.5 h-3.5" /> {flash ? 'Eklendi!' : 'Sepette'}
      </button>
    )
  }

  return (
    <button
      onClick={handleAdd}
      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
    >
      <ShoppingCart className="w-3.5 h-3.5" /> Sepete Ekle
    </button>
  )
}

export default function ParcaListesi({ parcalar, makine_id, makine_label }: Props) {
  if (parcalar.length === 0) {
    return (
      <div className="bg-white rounded-xl border p-8 text-center text-slate-400 text-sm">
        Bu periyot için parça bulunamadı.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-400 px-1">{parcalar.length} parça</p>
      {parcalar.map((row) => {
        const p = row.parca_listesi
        const durum = p.parca_durum_id ? DURUM_BADGE[p.parca_durum_id] : null
        const satisDisi = p.parca_durum_id === 'PDUR3' || p.parca_durum_id === 'PDUR4'

        return (
          <div
            key={p.parca_id}
            className="bg-white rounded-xl border px-5 py-4 flex items-start justify-between gap-4"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium text-slate-900 text-sm">{p.parca_adi}</p>
                {!row.zorunlu_mu && (
                  <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                    Opsiyonel
                  </span>
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
                <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                  x{row.qty}
                </span>
              </div>
              {!satisDisi && (
                <AddButton
                  parca={p}
                  makine_id={makine_id}
                  makine_label={makine_label}
                  qty={row.qty}
                />
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
