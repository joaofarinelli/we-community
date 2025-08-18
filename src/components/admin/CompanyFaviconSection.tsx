import { useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCompany } from '@/hooks/useCompany';
import { useCompanyFavicon } from '@/hooks/useCompanyFavicon';
import { Upload, X, Shield } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export const CompanyFaviconSection = () => {
  const { data: company } = useCompany();
  const { uploadFavicon, removeFavicon, uploading } = useCompanyFavicon();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const faviconSrc = useMemo(() => {
    const url = company?.favicon_url;
    if (!url) return null;
    const suffix = url.includes('?') ? '&' : '?';
    const version = uploadFavicon.isSuccess ? Date.now() : 0;
    return `${url}${suffix}v=${version}`;
  }, [company?.favicon_url, uploadFavicon.isSuccess]);

  const handleFileSelect = (file: File) => {
    if (!file) return;
    // Validate type
    if (!(file.type === 'image/png' || file.type === 'image/jpeg')) {
      alert('Envie um arquivo PNG ou JPG.');
      return;
    }
    // Validate size
    if (file.size > 512 * 1024) {
      alert('O arquivo deve ter no máximo 512KB.');
      return;
    }
    uploadFavicon.mutate(file);
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragOver(true); };
  const onDragLeave = (e: React.DragEvent) => { e.preventDefault(); setDragOver(false); };

  const openPicker = () => fileInputRef.current?.click();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Favicon</CardTitle>
        <CardDescription>
          Envie um pequeno ícone (PNG/JPG até 512KB). Recomendado 64x64 ou 128x128.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {faviconSrc ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <img src={faviconSrc} alt="Favicon da empresa" className="h-10 w-10 rounded border" />
              <div className="text-sm">
                <p className="font-medium">Favicon atual</p>
                <p className="text-xs text-muted-foreground">Use um ícone quadrado para melhor aparência.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={openPicker} disabled={uploading} variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? 'Enviando...' : 'Alterar Favicon'}
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="icon">
                    <X className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remover favicon</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja remover o favicon? Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => removeFavicon.mutate()}>Remover</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ) : (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-muted-foreground/50'}`}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
          >
            <Shield className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm font-medium">Arraste o arquivo aqui ou clique para selecionar</p>
            <p className="text-xs text-muted-foreground">PNG ou JPG até 512KB</p>
            <Button onClick={openPicker} disabled={uploading} className="mt-4">
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? 'Enviando...' : 'Selecionar Arquivo'}
            </Button>
          </div>
        )}

        <input ref={fileInputRef} type="file" accept="image/png,image/jpeg" onChange={onInputChange} className="hidden" />
      </CardContent>
    </Card>
  );
};
