import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, CheckCircle, XCircle, Eye, MessageCircle, Calendar, User } from 'lucide-react';
import { useModerationReports } from '@/hooks/useModerationReports';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const ContentModerationDashboard = () => {
  const { reports, isLoading, reviewReport, pendingCount } = useModerationReports();
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  const filteredReports = reports.filter(report => {
    if (filter === 'all') return true;
    return report.status === filter;
  });

  const handleReview = async (reportId: string, status: 'approved' | 'rejected') => {
    try {
      await reviewReport.mutateAsync({ 
        reportId, 
        status, 
        notes: reviewNotes 
      });
      setSelectedReport(null);
      setReviewNotes('');
    } catch (error) {
      console.error('Error reviewing report:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'approved': return 'default';
      case 'rejected': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <AlertTriangle className="h-4 w-4" />;
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'approved': return 'Aprovado';
      case 'rejected': return 'Rejeitado';
      default: return 'Pendente';
    }
  };

  const getContentPreview = (content: string, maxLength = 100) => {
    return content.length > maxLength ? `${content.substring(0, maxLength)}...` : content;
  };

  if (isLoading) {
    return <div className="p-6">Carregando relatórios de moderação...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dashboard de Moderação</h2>
          <p className="text-muted-foreground">
            Gerencie conteúdo automaticamente sinalizado pelo sistema de moderação.
          </p>
        </div>
        
        {pendingCount > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <span className="font-medium text-orange-800">
                  {pendingCount} item{pendingCount !== 1 ? 's' : ''} pendente{pendingCount !== 1 ? 's' : ''}
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex space-x-2">
        {[
          { key: 'pending', label: 'Pendentes', count: reports.filter(r => r.status === 'pending').length },
          { key: 'approved', label: 'Aprovados', count: reports.filter(r => r.status === 'approved').length },
          { key: 'rejected', label: 'Rejeitados', count: reports.filter(r => r.status === 'rejected').length },
          { key: 'all', label: 'Todos', count: reports.length }
        ].map(({ key, label, count }) => (
          <Button
            key={key}
            variant={filter === key ? 'default' : 'outline'}
            onClick={() => setFilter(key as any)}
            className="relative"
          >
            {label}
            {count > 0 && (
              <Badge variant="secondary" className="ml-2">
                {count}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      {/* Reports list */}
      <div className="space-y-4">
        {filteredReports.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-muted-foreground">
                {filter === 'pending' 
                  ? 'Nenhum conteúdo pendente de moderação.' 
                  : `Nenhum relatório ${filter === 'all' ? '' : filter} encontrado.`}
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredReports.map((report) => (
            <Card key={report.id} className={`${report.status === 'pending' ? 'border-orange-200' : ''}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Badge variant={getStatusColor(report.status)} className="flex items-center space-x-1">
                        {getStatusIcon(report.status)}
                        <span>{getStatusLabel(report.status)}</span>
                      </Badge>
                      <Badge variant="outline" className="flex items-center space-x-1">
                        {report.content_type === 'post' ? <Eye className="h-3 w-3" /> : <MessageCircle className="h-3 w-3" />}
                        <span>{report.content_type === 'post' ? 'Post' : 'Comentário'}</span>
                      </Badge>
                      <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDistanceToNow(new Date(report.created_at), { addSuffix: true, locale: ptBR })}</span>
                      </div>
                    </div>
                    
                    <div className="text-sm">
                      <span className="font-medium">Palavras detectadas:</span>{' '}
                      {report.flagged_words.map((word, index) => (
                        <Badge key={index} variant="destructive" className="ml-1">
                          {word}
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="text-sm">
                      <span className="font-medium">Confiança:</span> {report.confidence_score}%
                    </div>
                  </div>
                  
                  {report.status === 'pending' && (
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReview(report.id, 'approved')}
                        disabled={reviewReport.isPending}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Aprovar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReview(report.id, 'rejected')}
                        disabled={reviewReport.isPending}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Rejeitar
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm font-medium mb-1">Conteúdo original:</div>
                    <div className="p-3 bg-muted rounded-lg text-sm">
                      {selectedReport === report.id ? (
                        <div className="space-y-3">
                          {report.original_content}
                          
                          {report.status === 'pending' && (
                            <div className="space-y-2 pt-3 border-t">
                              <Textarea
                                placeholder="Adicione observações sobre a moderação (opcional)"
                                value={reviewNotes}
                                onChange={(e) => setReviewNotes(e.target.value)}
                                rows={3}
                              />
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleReview(report.id, 'approved')}
                                  disabled={reviewReport.isPending}
                                >
                                  Aprovar Conteúdo
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleReview(report.id, 'rejected')}
                                  disabled={reviewReport.isPending}
                                >
                                  Manter Restrito
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelectedReport(null)}
                                >
                                  Cancelar
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          {getContentPreview(report.original_content)}
                          {report.original_content.length > 100 && (
                            <Button
                              variant="link"
                              size="sm"
                              className="p-0 h-auto ml-2"
                              onClick={() => setSelectedReport(report.id)}
                            >
                              Ver completo
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {report.review_notes && (
                    <div>
                      <div className="text-sm font-medium mb-1">Observações da moderação:</div>
                      <div className="p-2 bg-blue-50 rounded text-sm">
                        {report.review_notes}
                      </div>
                    </div>
                  )}
                  
                  {(report.reviewed_by || report.reviewed_at) && (
                    <div className="text-xs text-muted-foreground flex items-center space-x-1">
                      <User className="h-3 w-3" />
                      <span>
                        {report.reviewed_at && 
                          `Revisado em ${formatDistanceToNow(new Date(report.reviewed_at), { addSuffix: true, locale: ptBR })}`
                        }
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};