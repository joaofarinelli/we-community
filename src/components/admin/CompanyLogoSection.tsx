import { useState, useRef, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCompany } from '@/hooks/useCompany';
import { useCompanyLogo } from '@/hooks/useCompanyLogo';
import { Upload, X, ImageIcon } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export const CompanyLogoSection = () => {
  const { data: company } = useCompany();
  const { uploadLogo, removeLogo, uploading } = useCompanyLogo();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const logoSrc = useMemo(() => {
    const url = company?.logo_url;
    if (!url) return null;
    const suffix = url.includes('?') ? '&' : '?';
    const version = uploadLogo.isSuccess ? Date.now() : 0;
    return `${url}${suffix}v=${version}`;
  }, [company?.logo_url, uploadLogo.isSuccess]);

  const handleFileSelect = (file: File) => {
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione uma imagem válida.');
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        alert('O arquivo deve ter no máximo 5MB.');
        return;
      }

      uploadLogo.mutate(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveLogo = () => {
    removeLogo.mutate();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Logo da Empresa</CardTitle>
        <CardDescription>
          Faça upload do logo da sua empresa. Recomendamos imagens em formato PNG ou JPG com fundo transparente.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {logoSrc ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <img
                src={logoSrc}
                alt="Logo da empresa"
                className="h-16 w-16 object-contain rounded border"
              />
              <div className="flex-1">
                <p className="text-sm font-medium">Logo atual</p>
                <p className="text-xs text-muted-foreground">
                  Clique em "Alterar logo" para fazer upload de um novo logo
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button 
                onClick={handleUploadClick} 
                disabled={uploading}
                variant="outline"
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? 'Enviando...' : 'Alterar Logo'}
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="icon">
                    <X className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remover logo</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja remover o logo da empresa? Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleRemoveLogo}>
                      Remover
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ) : (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragOver 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-muted-foreground/50'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <div className="space-y-2">
              <p className="text-sm font-medium">
                Arraste uma imagem aqui ou clique para selecionar
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG até 5MB
              </p>
            </div>
            <Button 
              onClick={handleUploadClick} 
              disabled={uploading}
              className="mt-4"
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? 'Enviando...' : 'Selecionar Arquivo'}
            </Button>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInputChange}
          className="hidden"
        />
      </CardContent>
    </Card>
  );
};