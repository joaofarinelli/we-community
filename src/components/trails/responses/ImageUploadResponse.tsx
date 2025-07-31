import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Upload, X, Image } from 'lucide-react';
import { useImageUpload } from '@/hooks/useImageUpload';
import { toast } from 'sonner';

interface ImageUploadResponseProps {
  question: string;
  allowMultipleFiles: boolean;
  maxFileSizeMB: number;
  existingResponse?: any;
  onSubmit: (responseData: any) => void;
  isSubmitting: boolean;
}

export const ImageUploadResponse = ({
  question,
  allowMultipleFiles,
  maxFileSizeMB,
  existingResponse,
  onSubmit,
  isSubmitting,
}: ImageUploadResponseProps) => {
  const [uploadedImages, setUploadedImages] = useState<Array<{ url: string; name: string }>>([]);
  const { uploadImage, uploading } = useImageUpload();

  useEffect(() => {
    if (existingResponse?.file_urls) {
      const images = existingResponse.file_urls.map((url: string, index: number) => ({
        url,
        name: `Imagem ${index + 1}`
      }));
      setUploadedImages(images);
    }
  }, [existingResponse]);

  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      // Check file size
      if (file.size > maxFileSizeMB * 1024 * 1024) {
        toast.error(`${file.name} excede o tamanho máximo de ${maxFileSizeMB}MB`);
        continue;
      }

      try {
        const url = await uploadImage(file, 'post-images');
        if (url) {
          if (allowMultipleFiles) {
            setUploadedImages(prev => [...prev, { url, name: file.name }]);
          } else {
            setUploadedImages([{ url, name: file.name }]);
          }
        }
      } catch (error) {
        toast.error(`Erro ao enviar ${file.name}`);
      }
    }
    
    // Reset input
    event.target.value = '';
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (uploadedImages.length === 0) return;
    
    onSubmit({
      fileUrls: uploadedImages.map(img => img.url),
      responseData: {
        imageNames: uploadedImages.map(img => img.name)
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Envio de Imagem</CardTitle>
        {question && (
          <p className="text-muted-foreground">{question}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Input
            type="file"
            accept="image/*"
            multiple={allowMultipleFiles}
            onChange={handleImageSelect}
            disabled={uploading || (!allowMultipleFiles && uploadedImages.length > 0)}
          />
          
          <div className="text-sm text-muted-foreground">
            <p>Tamanho máximo: {maxFileSizeMB}MB</p>
            <p>Tipos permitidos: PNG, JPG, JPEG, GIF, WEBP</p>
            {allowMultipleFiles && <p>Múltiplas imagens permitidas</p>}
          </div>
        </div>

        {uploadedImages.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Imagens enviadas:</h4>
            <div className="grid grid-cols-2 gap-4">
              {uploadedImages.map((image, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-square rounded-lg overflow-hidden border">
                    <img
                      src={image.url}
                      alt={image.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <p className="text-xs text-center mt-1 text-muted-foreground truncate">
                    {image.name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <Button
          onClick={handleSubmit}
          disabled={uploadedImages.length === 0 || isSubmitting}
          className="flex items-center gap-2"
        >
          <Send className="h-4 w-4" />
          {isSubmitting ? 'Salvando...' : 'Enviar Resposta'}
        </Button>

        {uploading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Upload className="h-4 w-4 animate-spin" />
            Enviando imagem...
          </div>
        )}
      </CardContent>
    </Card>
  );
};