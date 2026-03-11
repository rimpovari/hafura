"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GitBranch, Package, Layers, Tags, Database, Home, ChevronRight, FolderTree, Network } from "lucide-react";

const menuItems = [
  { name: "Dashboard", href: "/admin", icon: Home },
  { name: "Markalar", href: "/admin/markalar", icon: Tags },
  { name: "Modeller", href: "/admin/modeller", icon: Layers },
  { name: "Parça Listesi", href: "/admin/parcalar", icon: Package },
  { name: "Ana Gruplar", href: "/admin/ana-gruplar", icon: FolderTree },
  { name: "Alt Gruplar", href: "/admin/alt-gruplar", icon: Database },
  { name: "Usage Matrix", href: "/admin/usage-matrix", icon: Network },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-900 text-slate-100 border-r border-slate-800 z-50">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Database className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">HAFU Admin</span>
        </div>

        <nav className="space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                  isActive
                    ? "bg-blue-600/10 text-blue-400 font-medium"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={`w-5 h-5 ${isActive ? "text-blue-400" : "group-hover:text-slate-100"}`} />
                  <span>{item.name}</span>
                </div>
                {isActive && <ChevronRight className="w-4 h-4" />}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="absolute bottom-0 left-0 w-full p-6 border-t border-slate-800">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">A</div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-slate-200">Admin</span>
            <Link href="/" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">← Siteye Dön</Link>
          </div>
        </div>
      </div>
    </aside>
  );
}
