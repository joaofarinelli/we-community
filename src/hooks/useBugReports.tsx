import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useCompanyContext } from "./useCompanyContext";
import { useToast } from "@/hooks/use-toast";

export interface BugReport {
  id: string;
  user_id: string;
  company_id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  user_agent?: string;
  url?: string;
  screenshot_url?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  resolved_by?: string;
}

export interface CreateBugReportData {
  title: string;
  description: string;
  category: string;
  priority: string;
}

export const useBugReports = () => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: bugReports, isLoading } = useQuery({
    queryKey: ["bug-reports", user?.id, currentCompanyId],
    queryFn: async () => {
      if (!user?.id || !currentCompanyId) return [];

      const { data, error } = await supabase
        .from("bug_reports")
        .select("*")
        .eq("user_id", user.id)
        .eq("company_id", currentCompanyId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as BugReport[];
    },
    enabled: !!user?.id && !!currentCompanyId,
  });

  const createBugReportMutation = useMutation({
    mutationFn: async (data: CreateBugReportData) => {
      if (!user?.id || !currentCompanyId) {
        throw new Error("Usuário não autenticado");
      }

      const reportData = {
        user_id: user.id,
        company_id: currentCompanyId,
        title: data.title,
        description: data.description,
        category: data.category,
        priority: data.priority,
        status: "open",
        user_agent: navigator.userAgent,
        url: window.location.href,
      };

      const { data: result, error } = await supabase
        .from("bug_reports")
        .insert([reportData])
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bug-reports"] });
      toast({
        title: "Relatório enviado!",
        description: "Seu relatório foi enviado com sucesso. Obrigado pelo feedback!",
      });
    },
    onError: (error) => {
      console.error("Error creating bug report:", error);
      toast({
        title: "Erro ao enviar relatório",
        description: "Não foi possível enviar seu relatório. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  return {
    bugReports,
    isLoading,
    createBugReport: createBugReportMutation.mutate,
    isSubmitting: createBugReportMutation.isPending,
  };
};