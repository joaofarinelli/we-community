import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Download, FileSpreadsheet, Info, Loader2 } from 'lucide-react';
import { useUserImportExport } from '@/hooks/useUserImportExport';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ImportResultsModal } from './ImportResultsModal';
import { Progress } from '@/components/ui/progress';

interface UserImportExportDialogProps {
  children: React.ReactNode;
}

export const UserImportExportDialog = ({ children }: UserImportExportDialogProps) => {
  const [open, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showResults, setShowResults] = useState(false);
  const { exportUsers, importUsers, isExporting, isImporting, importResults } = useUserImportExport();

  // Show results modal after successful import
  useEffect(() => {
    if (importResults && !isImporting) {
      setShowResults(true);
      setOpen(false);
    }
  }, [importResults, isImporting]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleImport = () => {
    if (selectedFile) {
      importUsers(selectedFile);
      setSelectedFile(null);
    }
  };

  const handleExport = () => {
    exportUsers();
  };

  const downloadTemplate = () => {
    const template = [
      'Nome,Sobrenome,Email,Telefone,Cargo',
      'João,Silva,joao@exemplo.com,11999999999,member',
      'Maria,Santos,maria@exemplo.com,11888888888,admin',
      'Ana,Costa,ana@exemplo.com,11777777777,member'
    ].join('\n');

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'template-usuarios.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Importar/Exportar Usuários
            </DialogTitle>
          </DialogHeader>

        <Tabs defaultValue="export" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export">Exportar</TabsTrigger>
            <TabsTrigger value="import">Importar</TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Exportar Usuários</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Baixe um arquivo CSV com todos os usuários da empresa.
              </p>
              <Button 
                onClick={handleExport} 
                disabled={isExporting}
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                {isExporting ? 'Exportando...' : 'Baixar CSV'}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="import" className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Importar Usuários</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Envie um arquivo CSV para convidar vários usuários de uma vez. Os convites serão enviados automaticamente por email.
              </p>

              <Alert className="mb-4">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  <strong>Colunas aceitas:</strong> Nome/Email (obrigatórios), Sobrenome, Telefone, Cargo.<br />
                  <strong>Formatos:</strong> Aceita diferentes variações dos nomes das colunas (português/inglês).<br />
                  <strong>Duplicados:</strong> Emails já existentes serão ignorados automaticamente.
                </AlertDescription>
              </Alert>

              {isImporting && (
                <div className="mb-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processando arquivo e enviando convites...
                  </div>
                  <Progress value={undefined} className="w-full" />
                </div>
              )}

              <div className="space-y-3">
                <Button 
                  variant="outline" 
                  onClick={downloadTemplate}
                  className="w-full"
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Baixar Template
                </Button>

                <div>
                  <Label htmlFor="file">Arquivo CSV</Label>
                  <Input
                    id="file"
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="mt-1"
                  />
                </div>

                {selectedFile && (
                  <div className="text-sm text-muted-foreground">
                    Arquivo selecionado: {selectedFile.name}
                  </div>
                )}

                <Button 
                  onClick={handleImport}
                  disabled={!selectedFile || isImporting}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {isImporting ? 'Importando...' : 'Importar Usuários'}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>

    {importResults && (
      <ImportResultsModal 
        open={showResults} 
        onOpenChange={setShowResults}
        results={importResults}
      />
    )}
    </>
  );
};