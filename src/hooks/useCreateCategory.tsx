import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import type { CreateCategoryFormData } from '@/lib/schemas';

export const useCreateCategory = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const createCategoryMutation = useMutation({
    mutationFn: async (data: CreateCategoryFormData) => {
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

      // Get user's company_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('user_id', user.id)
        .single();

      if (!profile?.company_id) throw new Error('Empresa não encontrada');

      const { data: result, error } = await supabase
        .from('space_categories')
        .insert({
          name: data.name,
          slug: slug || null,
          permissions: data.permissions,
          created_by: user.id,
          company_id: profile.company_id,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spaceCategories'] });
      toast.success('Categoria criada com sucesso!');
      setIsOpen(false);
    },
    onError: (error: any) => {
      console.error('Erro ao criar categoria:', error);
      if (error.code === '23505') {
        toast.error('Este slug já está sendo usado. Tente outro.');
      } else {
        toast.error('Erro ao criar categoria. Tente novamente.');
      }
    },
  });

  return {
    isOpen,
    setIsOpen,
    createCategory: createCategoryMutation.mutate,
    isLoading: createCategoryMutation.isPending,
  };
};