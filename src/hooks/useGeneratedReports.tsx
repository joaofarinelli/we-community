import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useAuth } from "./useAuth";
import { useCompanyContext } from "./useCompanyContext";

export type GeneratedReport = Database['public']['Tables']['generated_reports']['Row'];

export const useGeneratedReports = (limit = 10) => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();
  
  return useQuery<GeneratedReport[]>({
    queryKey: ["generated-reports", user?.id, currentCompanyId, limit],
    queryFn: async () => {
      if (!user || !currentCompanyId) return [];
      
      const { data, error } = await supabase
        .from('generated_reports')
        .select('*')
        .eq('company_id', currentCompanyId)
        .order('generated_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!currentCompanyId,
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