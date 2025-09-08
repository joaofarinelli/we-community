import { useState } from 'react';
import { Plus, FileText, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useMarketplaceTerms, useMarketplaceTermsHistory, useCreateMarketplaceTerms } from '@/hooks/useMarketplaceTerms';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function AdminMarketplaceTermsPage() {
  const [createDialog, setCreateDialog] = useState(false);
  const [newTermsContent, setNewTermsContent] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  const { data: activeTerms } = useMarketplaceTerms();
  const { data: termsHistory } = useMarketplaceTermsHistory();
  const createTermsMutation = useCreateMarketplaceTerms();

  const handleCreateTerms = async () => {
    if (!newTermsContent.trim()) return;

    await createTermsMutation.mutateAsync({
      content: newTermsContent,
    });

    setCreateDialog(false);
    setNewTermsContent('');
  };

  const defaultTermsContent = `TERMOS DE ANÚNCIO DO MARKETPLACE

Ao submeter um anúncio em nosso marketplace, você concorda com os seguintes termos:

1. RESPONSABILIDADE DO VENDEDOR
- Você é totalmente responsável pela veracidade das informações do produto
- Deve possuir o produto/serviço anunciado e ter autorização para vendê-lo
- É responsável pela entrega do produto conforme descrito

2. PRODUTOS PROIBIDOS
- Não são permitidos produtos ilegais, falsificados ou perigosos
- Não são permitidos produtos que violem direitos autorais
- Produtos devem estar em conformidade com a legislação brasileira

3. MODERAÇÃO
- Todos os anúncios passam por análise antes da publicação
- A administração reserva-se o direito de rejeitar anúncios inadequados
- Anúncios rejeitados terão justificativa fornecida

4. TRANSAÇÕES
- As transações são realizadas através do sistema de moedas da plataforma
- A plataforma não se responsabiliza por conflitos entre vendedor e comprador
- Problemas devem ser reportados à administração

5. ALTERAÇÕES
- Estes termos podem ser alterados a qualquer momento
- Usuários serão notificados sobre mudanças significativas

Ao marcar a caixa de aceite, você confirma ter lido e concordado com todos os termos acima.`;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Termos do Marketplace</h1>
            <p className="text-muted-foreground">
              Gerencie os termos que os usuários devem aceitar ao criar anúncios
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowHistory(!showHistory)}
            >
              {showHistory ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              {showHistory ? 'Ocultar Histórico' : 'Ver Histórico'}
            </Button>
            <Button onClick={() => setCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Novos Termos
            </Button>
          </div>
        </div>

        {/* Active Terms */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Termos Atuais
                </CardTitle>
                <CardDescription>
                  Termos que os usuários devem aceitar para criar anúncios
                </CardDescription>
              </div>
              {activeTerms && (
                <Badge className="bg-green-100 text-green-800">
                  Versão {activeTerms.version}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {activeTerms ? (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm">{activeTerms.content}</pre>
                </div>
                <p className="text-sm text-muted-foreground">
                  Criado em {format(new Date(activeTerms.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                </p>
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum termo ativo</h3>
                <p className="text-muted-foreground mb-4">
                  Você precisa criar termos para que os usuários possam anunciar no marketplace
                </p>
                <Button onClick={() => setCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Termo
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Terms History */}
        {showHistory && termsHistory && termsHistory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Versões</CardTitle>
              <CardDescription>
                Todas as versões anteriores dos termos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {termsHistory.map((terms) => (
                  <div key={terms.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={terms.is_active ? "default" : "outline"}>
                          Versão {terms.version}
                        </Badge>
                        {terms.is_active && (
                          <Badge className="bg-green-100 text-green-800">Ativa</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(terms.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </p>
                    </div>
                    <div className="p-3 bg-muted rounded max-h-32 overflow-y-auto">
                      <pre className="whitespace-pre-wrap text-xs">{terms.content}</pre>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Create Terms Dialog */}
        <Dialog open={createDialog} onOpenChange={setCreateDialog}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Criar Novos Termos</DialogTitle>
              <DialogDescription>
                Os novos termos substituirão os atuais e serão exigidos para novos anúncios
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 space-y-4 overflow-hidden">
              <div className="space-y-2">
                <label className="text-sm font-medium">Conteúdo dos Termos</label>
                <Textarea
                  placeholder="Digite o conteúdo dos termos..."
                  value={newTermsContent}
                  onChange={(e) => setNewTermsContent(e.target.value)}
                  className="min-h-[400px] resize-none"
                />
              </div>
              
              {!newTermsContent && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Você pode usar o modelo abaixo como base:
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setNewTermsContent(defaultTermsContent)}
                  >
                    Usar Modelo Padrão
                  </Button>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialog(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleCreateTerms}
                disabled={!newTermsContent.trim() || createTermsMutation.isPending}
              >
                {createTermsMutation.isPending ? 'Criando...' : 'Criar Termos'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}