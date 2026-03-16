"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MakineTipiForm } from "@/components/admin/MakineTipiForm";
import { Loader2 } from "lucide-react";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const supabase = createClient();
  const [data, setData] = useState<any>(null);
  useEffect(() => { params.then(({ id }) => { supabase.from("makine_tipi").select("*").eq("makine_tip_id", id).single().then(({ data }) => setData(data)); }); }, []);
  if (!data) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>;
  return <MakineTipiForm initialData={data} isEdit />;
}
