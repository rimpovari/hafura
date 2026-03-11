"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Package, Layers, Tags, PlusCircle, Database, ArrowUpRight } from "lucide-react";
import Link from "next/link";

export default function AdminDashboard() {
  const supabase = createClient();
  const [stats, setStats] = useState([
    { name: "Toplam Marka", value: "...", icon: Tags, href: "/admin/markalar" },
    { name: "Toplam Model", value: "...", icon: Layers, href: "/admin/modeller" },
    { name: "Toplam Parça", value: "...", icon: Package, href: "/admin/parcalar" },
  ]);

  useEffect(() => {
    async function fetchStats() {
      const [markaRes, modelRes, parcaRes] = await Promise.all([
        supabase.from("marka").select("*", { count: "exact", head: true }),
        supabase.from("model").select("*", { count: "exact", head: true }),
        supabase.from("parca_listesi").select("*", { count: "exact", head: true }),
      ]);
      setStats([
        { name: "Toplam Marka", value: markaRes.count?.toString() ?? "0", icon: Tags, href: "/admin/markalar" },
        { name: "Toplam Model", value: modelRes.count?.toString() ?? "0", icon: Layers, href: "/admin/modeller" },
        { name: "Toplam Parça", value: parcaRes.count?.toString() ?? "0", icon: Package, href: "/admin/parcalar" },
      ]);
    }
    fetchStats();
  }, []);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Hoş Geldiniz</h2>
        <p className="text-slate-500 text-lg mt-1">Parça, marka ve model girişlerini buradan yönetin.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {stats.map((stat) => (
          <div key={stat.name} className="relative group overflow-hidden bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/50 rounded-full -mr-8 -mt-8 group-hover:bg-blue-100/50 transition-colors" />
            <div className="relative">
              <div className="flex items-center justify-between mb-6">
                <div className="p-3 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-200">
                  <stat.icon className="w-6 h-6" />
                </div>
                <Link href={stat.href} className="flex items-center gap-1.5 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors">
                  Tümünü Gör <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
              <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">{stat.name}</span>
              <div className="text-4xl font-extrabold text-slate-900 mt-1">{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-blue-600" /> Hızlı İşlemler
          </h3>
          <div className="space-y-3">
            {[
              { href: "/admin/parcalar/new", label: "Yeni Parça Ekle" },
              { href: "/admin/markalar/new", label: "Yeni Marka Tanımla" },
              { href: "/admin/modeller/new", label: "Yeni Model Ekle" },
            ].map((item) => (
              <Link key={item.href} href={item.href} className="flex items-center justify-between p-4 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors group">
                <span className="text-slate-700 font-medium">{item.label}</span>
                <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Database className="w-5 h-5 text-slate-400" /> Sistem Durumu
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-slate-50 text-sm">
              <span className="text-slate-500">Veritabanı</span>
              <span className="text-emerald-600 font-medium flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Bağlı (Local)
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-50 text-sm">
              <span className="text-slate-500">Ortam</span>
              <span className="text-slate-700 font-medium">Development</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
