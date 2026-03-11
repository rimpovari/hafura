'use client'

import { useCart } from '@/context/CartContext'
import { Trash2, Plus, Minus, ShoppingCart } from 'lucide-react'
import CartIcon from '@/components/CartIcon'

export default function SepetPage() {
  const { items, remove, updateQty, clear, count } = useCart()

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-slate-900 text-white px-4 py-4 flex items-center justify-between">
        <a href="/" className="text-xl font-bold tracking-tight">
          HAFU <span className="text-slate-400 text-sm font-normal ml-1">Yedek Parça</span>
        </a>
        <div className="flex items-center gap-4">
          <a href="/hesabim" className="text-sm text-slate-400 hover:text-white transition-colors">
            Hesabım
          </a>
          <CartIcon />
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-slate-900">
            Sepetim{count > 0 && <span className="text-slate-400 font-normal text-base ml-2">({count} ürün)</span>}
          </h1>
          {count > 0 && (
            <button
              onClick={clear}
              className="text-sm text-red-500 hover:text-red-700 transition-colors"
            >
              Sepeti Boşalt
            </button>
          )}
        </div>

        {count === 0 ? (
          <div className="bg-white rounded-2xl border p-12 text-center">
            <ShoppingCart className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Sepetiniz boş.</p>
            <a
              href="/hesabim"
              className="inline-block mt-4 text-blue-600 text-sm font-medium hover:underline"
            >
              Makinelerime git →
            </a>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Makineye göre grupla */}
            {Object.entries(
              items.reduce<Record<string, typeof items>>((acc, item) => {
                const key = item.makine_label ?? 'Genel'
                acc[key] = [...(acc[key] ?? []), item]
                return acc
              }, {})
            ).map(([makineLabel, group]) => (
              <div key={makineLabel} className="bg-white rounded-2xl border overflow-hidden">
                <div className="px-5 py-3 bg-slate-50 border-b">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    {makineLabel}
                  </p>
                </div>
                <div className="divide-y">
                  {group.map((item) => (
                    <div key={item.parca_id} className="px-5 py-4 flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 text-sm truncate">{item.parca_adi}</p>
                        {item.hafu_kod && (
                          <p className="text-xs font-mono text-slate-400 mt-0.5">{item.hafu_kod}</p>
                        )}
                      </div>

                      {/* Adet kontrolü */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => updateQty(item.parca_id, item.qty - 1)}
                          className="w-7 h-7 rounded-lg border flex items-center justify-center text-slate-500 hover:border-slate-400 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-sm font-medium">{item.qty}</span>
                        <button
                          onClick={() => updateQty(item.parca_id, item.qty + 1)}
                          className="w-7 h-7 rounded-lg border flex items-center justify-center text-slate-500 hover:border-slate-400 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => remove(item.parca_id)}
                          className="ml-1 text-red-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Sipariş talebi */}
            <div className="bg-white rounded-2xl border p-5 mt-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-slate-500">{count} kalem ürün</p>
                <p className="text-xs text-slate-400">Fiyatlar teklif aşamasında bildirilecek</p>
              </div>
              <a
                href="/sepet/siparis"
                className="block w-full bg-slate-900 text-white text-center font-semibold text-sm rounded-xl py-3.5 hover:bg-slate-800 transition-colors"
              >
                Sipariş Talebi Gönder
              </a>
              <p className="text-center text-xs text-slate-400 mt-3">
                Talebinizi aldıktan sonra fiyat teklifi ile geri döneceğiz.
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
