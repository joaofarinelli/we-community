import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePageBanner } from '@/hooks/usePageBanner';
import { Upload, X, Image as ImageIcon, LogIn } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ResponsiveBanner } from '@/components/ui/responsive-banner';

export const LoginBannerSection = () => {
  const { bannerUrl, uploadBanner, removeBanner, isUploading, isRemoving, isLoading } = usePageBanner('login');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    uploadBanner(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) handleFileSelect(files[0]);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) handleFileSelect(files[0]);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LogIn className="h-5 w-5" />
          Banner da Página de Login
        </CardTitle>
        <CardDescription>Imagem vertical (ex.: 9:16) para a lateral da página de login.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="w-full h-[300px] bg-muted animate-pulse rounded-lg" />
        ) : bannerUrl ? (
          <div className="relative w-full rounded-lg overflow-hidden border">
            <ResponsiveBanner
              src={bannerUrl}
              aspectRatio={9/16}
              maxWidth={768}
              quality={75}
              fit="cover"
              focusX={50}
              className="rounded-lg"
            />
            <div className="absolute top-4 right-4 flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                <Upload className="h-4 w-4 mr-2" />
                Trocar
              </Button>
              <Button size="sm" variant="destructive" onClick={() => removeBanner()} disabled={isRemoving}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileInputChange} className="hidden" />
          </div>
        ) : (
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors h-[300px] flex flex-col items-center justify-center",
              isDragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25",
              "hover:border-primary hover:bg-primary/5"
            )}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
          >
            <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Adicionar Banner de Login</h3>
            <p className="text-muted-foreground mb-4">Arraste uma imagem ou clique para selecionar</p>
            <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading} variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              {isUploading ? 'Enviando...' : 'Selecionar Imagem'}
            </Button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileInputChange} className="hidden" />
            <p className="text-xs text-muted-foreground mt-2">Recomendado: proporção 9:16</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};