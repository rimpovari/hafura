'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import SearchResults from '@/components/SearchResults'
import LoginIncentive from '@/components/LoginIncentive'

export type Part = {
  parca_id: string
  parca_adi: string
  hafu_kod: string | null
  oem_kod: string | null
  parca_durum_id: string | null
}

export default function SearchBar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Part[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const supabaseRef = useRef(createClient())

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    const trimmed = query.trim()
    if (trimmed.length < 2) {
      setResults([])
      setSearched(false)
      setError(null)
      return
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      setError(null)
      const { data, error: qErr } = await supabaseRef.current
        .from('parca_listesi')
        .select('parca_id, parca_adi, hafu_kod, oem_kod, parca_durum_id')
        .or(
          `parca_adi.ilike.%${trimmed}%,hafu_kod.ilike.%${trimmed}%,oem_kod.ilike.%${trimmed}%`
        )
        .limit(20)

      if (qErr) setError(qErr.message)
      setResults(data ?? [])
      setSearched(true)
      setLoading(false)
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  function clear() {
    setQuery('')
    setResults([])
    setSearched(false)
  }

  return (
    <div className="w-full">
      {/* Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Örn: yağ filtresi, FDBA000001, LF3000..."
          className="w-full bg-white text-slate-900 placeholder-slate-400 rounded-xl pl-12 pr-12 py-4 text-base shadow-lg outline-none focus:ring-2 focus:ring-blue-500"
          autoComplete="off"
          autoFocus
        />
        {loading && (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 animate-spin" />
        )}
        {!loading && query && (
          <button
            onClick={clear}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Results area */}
      {error && (
        <div className="mt-4 bg-red-50 text-red-700 rounded-xl px-4 py-3 text-sm text-left">
          Hata: {error}
        </div>
      )}
      {searched && !error && (
        <div className="mt-4 text-left space-y-3">
          <SearchResults parts={results} query={query} />
          {results.length > 0 && <LoginIncentive />}
        </div>
      )}
    </div>
  )
}
