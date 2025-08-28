import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useCompany } from '@/hooks/useCompany';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, LogIn, Eye, X } from 'lucide-react';
import { ImageUpload } from '@/components/ui/image-upload';

export const LoginBannerSection = () => {
  const { data: company, refetch } = useCompany();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [bannerUrl, setBannerUrl] = useState(company?.login_banner_url || '');
  const [showPreview, setShowPreview] = useState(false);

  const handleSave = async () => {
    if (!company?.id) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('companies')
        .update({ login_banner_url: bannerUrl || null })
        .eq('id', company.id);

      if (error) throw error;

      await refetch();
      toast({
        title: "Banner de login atualizado",
        description: "O banner da página de login foi atualizado com sucesso.",
      });
    } catch (error) {
      console.error('Error updating login banner:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o banner de login.",
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
        .update({ login_banner_url: null })
        .eq('id', company.id);

      if (error) throw error;

      setBannerUrl('');
      await refetch();
      toast({
        title: "Banner de login removido",
        description: "O banner da página de login foi removido com sucesso.",
      });
    } catch (error) {
      console.error('Error removing login banner:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o banner de login.",
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
          <LogIn className="h-5 w-5" />
          Banner da Página de Login
        </CardTitle>
        <CardDescription>
          Faça upload de um banner lateral que aparecerá do lado esquerdo da página de login. Recomendamos uma imagem vertical com boa qualidade.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Upload do Banner</Label>
          <ImageUpload
            value={bannerUrl}
            onChange={handleImageUpload}
            onRemove={() => setBannerUrl('')}
            bucketName="company-logos"
            maxSizeKB={5120}
          />
          <p className="text-sm text-muted-foreground">
            Use uma imagem vertical (proporção 9:16 ou similar) para melhor resultado. Largura máxima de 500px.
          </p>
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
              <div className="border rounded-lg overflow-hidden max-w-xs mx-auto">
                <img
                  src={bannerUrl}
                  alt="Preview do banner de login"
                  className="w-full h-auto max-h-96 object-cover"
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