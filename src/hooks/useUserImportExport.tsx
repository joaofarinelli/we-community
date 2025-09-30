import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useCompanyContext } from './useCompanyContext';

export interface ImportResults {
  totalProcessed: number;
  successful: number;
  invited: number;
  skipped: number;
  errors: Array<{ line: number; email: string; error: string }>;
  duplicates: Array<{ line: number; email: string }>;
  details: Array<{ line: number; email: string; status: string; firstName?: string; lastName?: string; tags?: string[] }>;
}

export const useUserImportExport = () => {
  const { currentCompanyId } = useCompanyContext();
  const exportUsers = useMutation({
    mutationFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        throw new Error('Não autenticado');
      }

      const response = await fetch('https://zqswqyxrgmgbcgdipoid.supabase.co/functions/v1/export-users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpxc3dxeXhyZ21nYmNnZGlwb2lkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MDMxMTQsImV4cCI6MjA3MzM3OTExNH0.qxH9o_AsA7TULMUfsz70zVxQJQf7T-hR9gpUhKD8pQo',
          'Content-Type': 'application/json',
          'x-company-id': currentCompanyId || ''
        }
      });

      const contentType = response.headers.get('Content-Type') || '';
      
      if (!response.ok) {
        if (contentType.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData?.error || 'Falha ao exportar usuários');
        }
        throw new Error(`Falha ao exportar usuários (HTTP ${response.status})`);
      }

      if (contentType.includes('application/json')) {
        const errorData = await response.json();
        throw new Error(errorData?.error || 'Falha ao exportar usuários');
      }

      // Get binary blob
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `usuarios-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
    onSuccess: () => {
      toast.success('Usuários exportados com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao exportar usuários: ${error.message}`);
    },
  });

  const importUsers = useMutation<{ success: boolean; message: string; results: ImportResults }, Error, File>({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      const { data, error } = await supabase.functions.invoke('import-users', {
        body: formData,
        headers: {
          'x-company-id': currentCompanyId || ''
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: (data) => {
      const { results } = data;
      if (results.successful > 0) {
        toast.success(`${results.successful} usuários processados com sucesso! ${results.invited} convites enviados.`);
      }
      if (results.skipped > 0) {
        toast.info(`${results.skipped} usuários ignorados (duplicados ou já convidados).`);
      }
      if (results.errors.length > 0) {
        toast.warning(`${results.errors.length} erros encontrados. Verifique os detalhes.`);
      }
    },
    onError: (error: Error) => {
      toast.error(`Erro ao importar usuários: ${error.message}`);
    },
  });

  return {
    exportUsers: exportUsers.mutate,
    importUsers: importUsers.mutate,
    isExporting: exportUsers.isPending,
    isImporting: importUsers.isPending,
    importResults: importUsers.data?.results,
    importError: importUsers.error,
  };
};