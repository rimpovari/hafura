'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'

export type CartItem = {
  parca_id: string
  parca_adi: string
  hafu_kod: string | null
  qty: number
  makine_id?: string
  makine_label?: string
}

type CartCtx = {
  items: CartItem[]
  add: (item: Omit<CartItem, 'qty'> & { qty?: number }) => void
  remove: (parca_id: string) => void
  updateQty: (parca_id: string, qty: number) => void
  clear: () => void
  count: number
}

const CartContext = createContext<CartCtx | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('hafu_cart')
      if (saved) setItems(JSON.parse(saved))
    } catch {}
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) localStorage.setItem('hafu_cart', JSON.stringify(items))
  }, [items, hydrated])

  const add = useCallback((item: Omit<CartItem, 'qty'> & { qty?: number }) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.parca_id === item.parca_id)
      if (existing) {
        return prev.map((i) =>
          i.parca_id === item.parca_id ? { ...i, qty: i.qty + (item.qty ?? 1) } : i
        )
      }
      return [...prev, { ...item, qty: item.qty ?? 1 }]
    })
  }, [])

  const remove = useCallback((parca_id: string) => {
    setItems((prev) => prev.filter((i) => i.parca_id !== parca_id))
  }, [])

  const updateQty = useCallback((parca_id: string, qty: number) => {
    if (qty <= 0) { remove(parca_id); return }
    setItems((prev) => prev.map((i) => (i.parca_id === parca_id ? { ...i, qty } : i)))
  }, [remove])

  const clear = useCallback(() => setItems([]), [])

  return (
    <CartContext.Provider value={{ items, add, remove, updateQty, clear, count: items.length }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
