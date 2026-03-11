"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AnaGrupForm } from "@/components/admin/AnaGrupForm";
import { Loader2 } from "lucide-react";

export default function AnaGrupEditPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = createClient();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    params.then(({ id }) => {
      supabase.from("ana_grup").select("*").eq("ana_grup_id", id).single().then(({ data }) => setData(data));
    });
  }, []);

  if (!data) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>;
  return <AnaGrupForm initialData={data} isEdit />;
}
