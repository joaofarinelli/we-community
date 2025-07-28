import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useCompany } from '@/hooks/useCompany';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Upload, Eye, X } from 'lucide-react';
import { ImageUpload } from '@/components/ui/image-upload';

export const FeedBannerSection = () => {
  const { data: company, refetch } = useCompany();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [bannerUrl, setBannerUrl] = useState(company?.feed_banner_url || '');
  const [showPreview, setShowPreview] = useState(false);

  const handleSave = async () => {
    if (!company?.id) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('companies')
        .update({ feed_banner_url: bannerUrl || null })
        .eq('id', company.id);

      if (error) throw error;

      await refetch();
      toast({
        title: "Banner atualizado",
        description: "O banner do feed foi atualizado com sucesso.",
      });
    } catch (error) {
      console.error('Error updating feed banner:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o banner do feed.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveBanner = async () => {
    if (!company?.id) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('companies')
        .update({ feed_banner_url: null })
        .eq('id', company.id);

      if (error) throw error;

      setBannerUrl('');
      await refetch();
      toast({
        title: "Banner removido",
        description: "O banner do feed foi removido com sucesso.",
      });
    } catch (error) {
      console.error('Error removing feed banner:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o banner do feed.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (url: string) => {
    setBannerUrl(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Banner do Feed
        </CardTitle>
        <CardDescription>
          Configure um banner que aparecerá no topo da página principal (feed) para todos os usuários da empresa
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="banner-url">URL do Banner</Label>
          <Input
            id="banner-url"
            placeholder="https://exemplo.com/banner.jpg"
            value={bannerUrl}
            onChange={(e) => setBannerUrl(e.target.value)}
          />
          <p className="text-sm text-muted-foreground">
            Use uma imagem com proporção 16:9 (recomendado: 1200x675px) para melhor resultado
          </p>
        </div>

        <div className="space-y-2">
          <Label>Ou faça upload de uma imagem</Label>
          <ImageUpload
            value={bannerUrl}
            onChange={handleImageUpload}
            onRemove={() => setBannerUrl('')}
            bucketName="company-logos"
            maxSizeKB={5120}
          />
        </div>

        {bannerUrl && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Pré-visualização</Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  {showPreview ? 'Ocultar' : 'Visualizar'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRemoveBanner}
                  disabled={isLoading}
                >
                  <X className="h-4 w-4 mr-1" />
                  Remover
                </Button>
              </div>
            </div>
            
            {showPreview && (
              <div className="border rounded-lg overflow-hidden">
                <img
                  src={bannerUrl}
                  alt="Preview do banner"
                  className="w-full h-auto max-h-48 object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    toast({
                      title: "Erro na imagem",
                      description: "Não foi possível carregar a imagem. Verifique se a URL está correta.",
                      variant: "destructive",
                    });
                  }}
                />
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Salvar Banner
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};