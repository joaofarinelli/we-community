import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface GlobalMetrics {
  total_companies: number;
  active_companies: number;
  total_users: number;
  total_spaces: number;
  total_posts: number;
  companies_this_month: number;
  users_this_month: number;
}

interface CompanyData {
  id: string;
  name: string;
  subdomain: string | null;
  custom_domain: string | null;
  status: string;
  plan: string;
  created_at: string;
  total_users: number;
  total_spaces: number;
  total_posts: number;
}

export const useSuperAdmin = () => {
  return useQuery({
    queryKey: ["super-admin-check"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("is_super_admin");
      if (error) throw error;
      return data;
    },
    retry: false,
  });
};

export const useSuperAdminCompanies = () => {
  return useQuery<CompanyData[]>({
    queryKey: ["super-admin-companies"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_all_companies_for_super_admin");
      if (error) throw error;
      return data as CompanyData[];
    },
    enabled: false, // Only enable when super admin is confirmed
  });
};

export const useSuperAdminMetrics = () => {
  return useQuery<GlobalMetrics>({
    queryKey: ["super-admin-metrics"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_global_metrics_for_super_admin");
      if (error) throw error;
      return data as unknown as GlobalMetrics;
    },
    enabled: false, // Only enable when super admin is confirmed
  });
};