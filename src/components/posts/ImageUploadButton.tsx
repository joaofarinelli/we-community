import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Image } from 'lucide-react';
import { useFileUpload } from '@/hooks/useFileUpload';

interface ImageUploadButtonProps {
  onImageUpload: (url: string) => void;
}

export const ImageUploadButton = ({ onImageUpload }: ImageUploadButtonProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile, isUploading } = useFileUpload({
    bucket: 'post-images',
    maxSizeBytes: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  });

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const url = await uploadFile(file);
    if (url) {
      onImageUpload(url);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleClick}
        disabled={isUploading}
        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
      >
        <Image className="h-4 w-4" />
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />
    </>
  );
};