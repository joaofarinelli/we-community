import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ResponsiveBanner } from '@/components/ui/responsive-banner';
import { useLessonPlayerBanner } from '@/hooks/useLessonPlayerBanner';
import { Upload, X, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

export const LessonPlayerBannerSection = () => {
  const { 
    bannerConfig, 
    isLoading, 
    updateBannerConfig, 
    uploadBannerImage, 
    removeBanner,
    isUpdating,
    isUploading,
    isRemoving
  } = useLessonPlayerBanner();

  const [isDragOver, setIsDragOver] = useState(false);
  const [linkUrl, setLinkUrl] = useState(bannerConfig?.linkUrl || '');
  const [openInNewTab, setOpenInNewTab] = useState(bannerConfig?.openInNewTab ?? true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione um arquivo de imagem válido');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('O arquivo deve ter menos de 5MB');
      return;
    }

    uploadBannerImage(file, {
      onSuccess: (imageUrl) => {
        updateBannerConfig({
          imageUrl,
          linkUrl: linkUrl || undefined,
          openInNewTab
        });
      }
    });
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleUpdateSettings = () => {
    if (!bannerConfig?.imageUrl) {
      toast.error('Adicione uma imagem primeiro');
      return;
    }

    updateBannerConfig({
      imageUrl: bannerConfig.imageUrl,
      linkUrl: linkUrl || undefined,
      openInNewTab
    });
  };

  const sanitizeUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `https://${url}`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Banner do Player de Aulas</CardTitle>
          <CardDescription>Carregando...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Banner do Player de Aulas</CardTitle>
        <CardDescription>
          Configure um banner clicável que aparecerá logo abaixo do player de vídeo nas aulas. 
          Recomendado: 1300x300 pixels.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {bannerConfig?.imageUrl ? (
          <div className="space-y-4">
            <div className="relative">
              <ResponsiveBanner
                src={bannerConfig.imageUrl}
                aspectRatio={1300/300}
                maxWidth={1300}
              />
              {bannerConfig.linkUrl && (
                <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                  <ExternalLink className="h-3 w-3" />
                  Link ativo
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? 'Enviando...' : 'Alterar Imagem'}
              </Button>
              <Button 
                variant="destructive"
                onClick={() => removeBanner()}
                disabled={isRemoving}
              >
                {isRemoving ? 'Removendo...' : 'Remover Banner'}
              </Button>
            </div>
          </div>
        ) : (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-muted-foreground/50'
            }`}
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
          >
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <div className="space-y-2">
              <p className="text-sm font-medium">Arraste uma imagem aqui ou clique para selecionar</p>
              <p className="text-xs text-muted-foreground">
                Suporta PNG, JPG. Máximo 5MB. Recomendado: 1300x300px
              </p>
            </div>
            <Button 
              className="mt-4" 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? 'Enviando...' : 'Selecionar Arquivo'}
            </Button>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileInputChange}
        />

        <div className="space-y-4 pt-4 border-t">
          <div className="space-y-2">
            <Label htmlFor="banner-link">Link do Banner (opcional)</Label>
            <Input
              id="banner-link"
              placeholder="https://exemplo.com"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              URL para onde o usuário será direcionado ao clicar no banner
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="open-new-tab"
              checked={openInNewTab}
              onCheckedChange={setOpenInNewTab}
            />
            <Label htmlFor="open-new-tab">Abrir link em nova aba</Label>
          </div>

          {bannerConfig?.imageUrl && (
            <Button 
              onClick={handleUpdateSettings}
              disabled={isUpdating}
              className="w-full"
            >
              {isUpdating ? 'Salvando...' : 'Salvar Configurações do Link'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};