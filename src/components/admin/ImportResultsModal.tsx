import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, CheckCircle, XCircle, Clock, Users, AlertTriangle } from 'lucide-react';
import { ImportResults } from '@/hooks/useUserImportExport';

interface ImportResultsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  results: ImportResults;
}

export const ImportResultsModal = ({ open, onOpenChange, results }: ImportResultsModalProps) => {
  const [activeTab, setActiveTab] = useState('summary');

  const downloadErrorsCSV = () => {
    if (results.errors.length === 0) return;

    const csvContent = [
      'Linha,Email,Erro',
      ...results.errors.map(error => 
        `${error.line},"${error.email}","${error.error}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `erros-importacao-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'invited':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Convidado</Badge>;
      case 'invited_no_email':
        return <Badge variant="secondary"><AlertTriangle className="h-3 w-3 mr-1" />Convidado (email falhou)</Badge>;
      case 'duplicate':
        return <Badge variant="outline"><Users className="h-3 w-3 mr-1" />Já existe</Badge>;
      case 'invite_pending':
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Convite pendente</Badge>;
      default:
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Erro</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Resultados da Importação
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold">{results.totalProcessed}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Convidados</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-green-600">{results.successful}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Ignorados</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-yellow-600">{results.skipped}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Erros</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-red-600">{results.errors.length}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="summary">Resumo</TabsTrigger>
            <TabsTrigger value="details">Detalhes</TabsTrigger>
            <TabsTrigger value="errors">Erros</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Resumo da Importação</CardTitle>
                <CardDescription>
                  Processamento concluído com {results.successful} usuários convidados
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {results.successful > 0 && (
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="h-4 w-4" />
                    <span>{results.successful} convites enviados com sucesso</span>
                  </div>
                )}
                
                {results.skipped > 0 && (
                  <div className="flex items-center gap-2 text-yellow-700">
                    <Clock className="h-4 w-4" />
                    <span>{results.skipped} usuários ignorados (já existem ou já foram convidados)</span>
                  </div>
                )}
                
                {results.errors.length > 0 && (
                  <div className="flex items-center gap-2 text-red-700">
                    <XCircle className="h-4 w-4" />
                    <span>{results.errors.length} erros encontrados</span>
                  </div>
                )}

                {results.duplicates.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    <strong>Duplicados encontrados:</strong> {results.duplicates.map(d => d.email).join(', ')}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="details" className="space-y-4">
            <div className="max-h-96 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Linha</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.details.map((detail, index) => (
                    <TableRow key={index}>
                      <TableCell>{detail.line}</TableCell>
                      <TableCell>{detail.firstName} {detail.lastName}</TableCell>
                      <TableCell>{detail.email}</TableCell>
                      <TableCell>{getStatusBadge(detail.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="errors" className="space-y-4">
            {results.errors.length > 0 ? (
              <>
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Erros Encontrados</h3>
                  <Button onClick={downloadErrorsCSV} size="sm" variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Baixar CSV de Erros
                  </Button>
                </div>
                
                <div className="max-h-96 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Linha</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Erro</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.errors.map((error, index) => (
                        <TableRow key={index}>
                          <TableCell>{error.line}</TableCell>
                          <TableCell>{error.email}</TableCell>
                          <TableCell className="text-red-600">{error.error}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
                    <p>Nenhum erro encontrado!</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};