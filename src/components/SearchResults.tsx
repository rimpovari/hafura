import type { Part } from '@/components/SearchBar'

const DURUM: Record<string, { label: string; cls: string }> = {
  PDUR1: { label: 'Aktif', cls: 'bg-green-100 text-green-700' },
  PDUR2: { label: 'Teklif', cls: 'bg-yellow-100 text-yellow-700' },
  PDUR3: { label: 'Satış Dışı', cls: 'bg-red-100 text-red-700' },
  PDUR4: { label: 'Arşiv', cls: 'bg-gray-100 text-gray-500' },
}

export default function SearchResults({
  parts,
  query,
}: {
  parts: Part[]
  query: string
}) {
  if (parts.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 text-center text-slate-500 text-sm shadow">
        &quot;<span className="font-medium text-slate-700">{query}</span>&quot; için sonuç
        bulunamadı.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-slate-400 text-xs px-1">{parts.length} sonuç bulundu</p>
      {parts.map((p) => {
        const durum = p.parca_durum_id ? DURUM[p.parca_durum_id] : null
        return (
          <div
            key={p.parca_id}
            className="bg-white rounded-xl px-5 py-4 shadow flex items-start justify-between gap-4 hover:shadow-md transition-shadow"
          >
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-900 truncate">{p.parca_adi}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                {p.hafu_kod && (
                  <span className="text-xs text-slate-500">
                    HAFU: <span className="font-mono text-slate-700">{p.hafu_kod}</span>
                  </span>
                )}
                {p.oem_kod && (
                  <span className="text-xs text-slate-500">
                    OEM: <span className="font-mono text-slate-700">{p.oem_kod}</span>
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              {durum && (
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${durum.cls}`}>
                  {durum.label}
                </span>
              )}
              <button className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                Detay →
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
