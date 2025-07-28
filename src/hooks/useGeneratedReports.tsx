import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type GeneratedReport = Database['public']['Tables']['generated_reports']['Row'];

export const useGeneratedReports = (limit = 10) => {
  return useQuery<GeneratedReport[]>({
    queryKey: ["generated-reports", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('generated_reports')
        .select('*')
        .order('generated_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

export const useCreateReport = () => {
  const createReport = async (reportData: {
    name: string;
    type: string;
    description?: string;
    company_id?: string;
  }) => {
    const { data, error } = await supabase
      .from('generated_reports')
      .insert([{
        ...reportData,
        generated_by: (await supabase.auth.getUser()).data.user?.id,
        status: 'generating' as const
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  return { createReport };
};