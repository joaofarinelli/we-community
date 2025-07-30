import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export const useImageUpload = () => {
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();

  const uploadImage = async (file: File, bucket: string = 'product-images'): Promise<string | null> => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return null;
    }

    setUploading(true);

    try {
      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // Upload file
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file);

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      toast.success('Imagem enviada com sucesso!');
      return publicUrl;
    } catch (error: any) {
      toast.error(error.message || 'Erro ao enviar imagem');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const deleteImage = async (url: string, bucket: string = 'product-images'): Promise<boolean> => {
    if (!user) return false;

    try {
      // Extract path from URL
      const urlParts = url.split('/');
      const path = urlParts.slice(-2).join('/'); // user_id/filename.ext

      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);

      if (error) throw error;

      toast.success('Imagem removida com sucesso!');
      return true;
    } catch (error: any) {
      toast.error(error.message || 'Erro ao remover imagem');
      return false;
    }
  };

  return {
    uploadImage,
    deleteImage,
    uploading
  };
};