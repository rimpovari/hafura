import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <AdminSidebar />
      <main className="pl-64">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-8 sticky top-0 z-40">
          <h1 className="text-lg font-semibold text-slate-800">Yönetim Paneli</h1>
        </header>
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
