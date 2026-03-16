"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Package, Layers, Tags, Database, Home, ChevronRight, FolderTree, Network,
  CircleDollarSign, Truck, Warehouse, Users, BarChart3, ShoppingCart, Cpu, Timer,
} from "lucide-react";

type MenuItem = { name: string; href: string; icon: React.ElementType };
type Group = { label: string; items: MenuItem[] };

const menuGroups: Group[] = [
  {
    label: "Genel",
    items: [
      { name: "Dashboard", href: "/admin", icon: Home },
    ],
  },
  {
    label: "Katalog",
    items: [
      { name: "Markalar", href: "/admin/markalar", icon: Tags },
      { name: "Modeller", href: "/admin/modeller", icon: Layers },
      { name: "Ana Gruplar", href: "/admin/ana-gruplar", icon: FolderTree },
      { name: "Alt Gruplar", href: "/admin/alt-gruplar", icon: Database },
      { name: "Parça Listesi", href: "/admin/parcalar", icon: Package },
      { name: "Usage Matrix", href: "/admin/usage-matrix", icon: Network },
    ],
  },
  {
    label: "Konfigürasyon",
    items: [
      { name: "Makine Tipleri", href: "/admin/makine-tipleri", icon: Cpu },
      { name: "Bakım Periyotları", href: "/admin/periyotlar", icon: Timer },
    ],
  },
  {
    label: "Fiyat & Stok",
    items: [
      { name: "Fiyatlar", href: "/admin/fiyatlar", icon: CircleDollarSign },
      { name: "Stok Durumu", href: "/admin/stok", icon: BarChart3 },
      { name: "Stok Hareketi", href: "/admin/stok/giris", icon: Package },
      { name: "Depolar", href: "/admin/depolar", icon: Warehouse },
    ],
  },
  {
    label: "Tedarik",
    items: [
      { name: "Tedarikçiler", href: "/admin/tedarikciler", icon: Truck },
    ],
  },
  {
    label: "Satış",
    items: [
      { name: "Müşteriler", href: "/admin/musteriler", icon: Users },
      { name: "Siparişler", href: "/admin/siparisler", icon: ShoppingCart },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-900 text-slate-100 border-r border-slate-800 z-50 flex flex-col">
      <div className="p-6 pb-2 flex-shrink-0">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Database className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">HAFU Admin</span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
        {menuGroups.map((group) => (
          <div key={group.label}>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-1">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/admin" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200 group text-sm ${
                      isActive
                        ? "bg-blue-600/10 text-blue-400 font-medium"
                        : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon
                        className={`w-4 h-4 ${isActive ? "text-blue-400" : "group-hover:text-slate-100"}`}
                      />
                      <span>{item.name}</span>
                    </div>
                    {isActive && <ChevronRight className="w-3 h-3" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="flex-shrink-0 p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
            A
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-slate-200">Admin</span>
            <Link
              href="/"
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              ← Siteye Dön
            </Link>
          </div>
        </div>
      </div>
    </aside>
  );
}
