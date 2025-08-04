import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useUserImportExport = () => {
  const exportUsers = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('export-users');
      
      if (error) {
        throw new Error(error.message);
      }
      
      // Create blob and download
      const blob = new Blob([data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `usuarios-${new Date().toISOString().split('T')[0]}.csv`;
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

  const importUsers = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      const { data, error } = await supabase.functions.invoke('import-users', {
        body: formData,
      });

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: (data) => {
      const { results } = data;
      if (results.success > 0) {
        toast.success(`${results.success} usuários processados com sucesso! ${results.invited} convites enviados.`);
      }
      if (results.errors.length > 0) {
        results.errors.forEach((error: string) => {
          toast.error(error);
        });
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
  };
};