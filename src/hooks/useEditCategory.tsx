import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
type EditCategoryFormData = {
  name: string;
  slug?: string;
  permissions: any;
  id: string;
};

export const useEditCategory = () => {
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const editCategoryMutation = useMutation({
    mutationFn: async (data: EditCategoryFormData) => {
      if (!user) throw new Error('Usuário não autenticado');

      // Generate slug from name if not provided
      const slug = data.slug || data.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .trim();

      const { data: result, error } = await supabase
        .from('space_categories')
        .update({
          name: data.name,
          slug: slug || null,
          permissions: data.permissions,
        })
        .eq('id', data.id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spaceCategories'] });
      toast.success('Categoria atualizada com sucesso!');
      setEditingCategory(null);
    },
    onError: (error: any) => {
      console.error('Erro ao atualizar categoria:', error);
      if (error.code === '23505') {
        toast.error('Este slug já está sendo usado. Tente outro.');
      } else {
        toast.error('Erro ao atualizar categoria. Tente novamente.');
      }
    },
  });

  return {
    editingCategory,
    setEditingCategory,
    editCategory: editCategoryMutation.mutate,
    isLoading: editCategoryMutation.isPending,
  };
};