import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCompany } from './useCompany';
import { toast } from 'sonner';

interface UseFileUploadOptions {
  bucket: 'post-images' | 'post-documents' | 'lesson-materials' | 'chat-images' | 'chat-documents';
  maxSizeBytes?: number;
  allowedTypes?: string[];
}

export const useFileUpload = (options: UseFileUploadOptions) => {
  const [isUploading, setIsUploading] = useState(false);
  const { user } = useAuth();
  const { data: company } = useCompany();

  const uploadFile = async (file: File): Promise<string | null> => {
    if (!user || !company) {
      toast.error('Usuário não autenticado');
      return null;
    }

    // Validate file size
    if (options.maxSizeBytes && file.size > options.maxSizeBytes) {
      toast.error(`Arquivo muito grande. Tamanho máximo: ${(options.maxSizeBytes / 1024 / 1024).toFixed(1)}MB`);
      return null;
    }

    // Validate file type
    if (options.allowedTypes && !options.allowedTypes.includes(file.type)) {
      toast.error('Tipo de arquivo não permitido');
      return null;
    }

    setIsUploading(true);

    try {
      // Create file path based on bucket type
      let filePath: string;
      const timestamp = Date.now();
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');

      if (options.bucket === 'post-images') {
        filePath = `${user.id}/${timestamp}_${sanitizedFileName}`;
      } else {
        filePath = `${company.id}/${user.id}/${timestamp}_${sanitizedFileName}`;
      }

      const { data, error } = await supabase.storage
        .from(options.bucket)
        .upload(filePath, file);

      if (error) {
        console.error('Error uploading file:', error);
        toast.error('Erro ao enviar arquivo');
        return null;
      }

      // Get public URL for public buckets or signed URL for private buckets
      if (options.bucket === 'post-images' || options.bucket === 'chat-images') {
        const { data: { publicUrl } } = supabase.storage
          .from(options.bucket)
          .getPublicUrl(data.path);
        
        return publicUrl;
      } else {
        // For lesson-materials, post-documents, and chat-documents, use signed URLs for security
        const { data: { signedUrl }, error: signedError } = await supabase.storage
          .from(options.bucket)
          .createSignedUrl(data.path, 86400); // 24 hours expiry
        
        if (signedError) {
          console.error('Error creating signed URL:', signedError);
          toast.error('Erro ao gerar link do arquivo');
          return null;
        }
        
        return signedUrl;
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Erro ao enviar arquivo');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadFile,
    isUploading,
  };
};