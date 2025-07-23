import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  onRemove: () => void;
  bucketName?: string;
  maxSizeKB?: number;
}

export const ImageUpload = ({ 
  value, 
  onChange, 
  onRemove, 
  bucketName = 'space-icons', 
  maxSizeKB = 1024 
}: ImageUploadProps) => {
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxSizeKB * 1024) {
      toast.error(`Arquivo muito grande. Máximo ${maxSizeKB}KB`);
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Apenas arquivos de imagem são permitidos');
      return;
    }

    setLoading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      onChange(publicUrl);
      toast.success('Imagem enviada com sucesso!');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Erro ao enviar imagem');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = () => {
    onRemove();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (value) {
    return (
      <div className="flex items-center gap-2">
        <div className="relative w-10 h-10 rounded border border-border overflow-hidden">
          <img 
            src={value} 
            alt="Icon preview" 
            className="w-full h-full object-cover"
          />
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRemove}
          className="h-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        disabled={loading}
        className="hidden"
      />
      <Button
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
        disabled={loading}
        className="w-full justify-start"
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
            Enviando...
          </>
        ) : (
          <>
            <Upload className="h-4 w-4 mr-2" />
            Enviar imagem
          </>
        )}
      </Button>
    </div>
  );
};