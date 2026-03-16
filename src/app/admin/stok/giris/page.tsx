"use client";
import { StokGirisForm } from "@/components/admin/StokGirisForm";
import { useRouter } from "next/navigation";

export default function StokGirisPage() {
  const router = useRouter();
  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Stok Hareketi</h2>
          <p className="text-slate-500 mt-1">Parça bazında giriş veya çıkış kaydet</p>
        </div>
        <button
          onClick={() => router.push("/admin/stok")}
          className="text-sm text-slate-500 hover:text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg"
        >
          ← Stok Listesi
        </button>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <StokGirisForm />
      </div>
    </div>
  );
}
