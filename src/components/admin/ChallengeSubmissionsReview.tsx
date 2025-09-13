import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAdminSubmissions, useReviewSubmission } from '@/hooks/useChallengeSubmissions';
import { CheckCircle, XCircle, Clock, FileText, Image, Download, User } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const ChallengeSubmissionsReview = () => {
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);

  const { data: submissions, isLoading } = useAdminSubmissions();
  const reviewSubmission = useReviewSubmission();

  const filteredSubmissions = (submissions as any)?.filter((submission: any) => 
    statusFilter === 'all' || submission.admin_review_status === statusFilter
  ) || [];

  const handleReview = async (status: 'approved' | 'rejected') => {
    if (!selectedSubmission) return;

    try {
      await reviewSubmission.mutateAsync({
        submissionId: selectedSubmission.id,
        status,
        notes: reviewNotes
      });
      
      setReviewDialogOpen(false);
      setSelectedSubmission(null);
      setReviewNotes('');
    } catch (error) {
      console.error('Error reviewing submission:', error);
    }
  };

  const openReviewDialog = (submission: any) => {
    setSelectedSubmission(submission);
    setReviewNotes(submission.admin_review_notes || '');
    setReviewDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500 text-white"><CheckCircle className="h-3 w-3 mr-1" />Aprovado</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500 text-white"><XCircle className="h-3 w-3 mr-1" />Rejeitado</Badge>;
      case 'pending':
      default:
        return <Badge className="bg-yellow-500 text-white"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
    }
  };

  const getSubmissionIcon = (type: string) => {
    switch (type) {
      case 'text': return <FileText className="h-4 w-4" />;
      case 'image': return <Image className="h-4 w-4" />;
      case 'file': return <Download className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Submissões de Desafios</h2>
          <p className="text-sm text-muted-foreground">
            Revise e aprove ou rejeite as submissões dos usuários
          </p>
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="pending">Pendentes</SelectItem>
            <SelectItem value="approved">Aprovadas</SelectItem>
            <SelectItem value="rejected">Rejeitadas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredSubmissions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Clock className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">Nenhuma submissão encontrada</p>
            <p className="text-sm text-muted-foreground text-center">
              {statusFilter === 'pending' 
                ? 'Não há submissões pendentes de revisão no momento.'
                : `Não há submissões com status "${statusFilter}".`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredSubmissions.map((submission: any) => (
            <Card key={submission.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-base">
                      {submission.challenge_title}
                    </CardTitle>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span>{submission.user_name}</span>
                      <span>•</span>
                      <span>{format(new Date(submission.submitted_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</span>
                    </div>
                  </div>
                  {getStatusBadge(submission.admin_review_status)}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  {getSubmissionIcon(submission.submission_type)}
                  <span className="text-sm font-medium">
                    {submission.submission_type === 'text' ? 'Texto' :
                     submission.submission_type === 'image' ? 'Imagem' : 'Arquivo'}
                  </span>
                </div>

                {submission.submission_content && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Conteúdo:</Label>
                    <p className="text-sm mt-1 p-2 bg-muted rounded">{submission.submission_content}</p>
                  </div>
                )}

                {submission.file_url && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Arquivo:</Label>
                    <div className="mt-1">
                      <a
                        href={submission.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-2 text-sm text-primary hover:underline"
                      >
                        <Download className="h-3 w-3" />
                        <span>{submission.file_name || 'Ver arquivo'}</span>
                      </a>
                      {submission.file_size && (
                        <span className="text-xs text-muted-foreground ml-2">
                          ({(submission.file_size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {submission.admin_review_notes && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Observações da revisão:</Label>
                    <p className="text-sm mt-1 p-2 bg-muted rounded">{submission.admin_review_notes}</p>
                    {submission.reviewed_at && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Revisado em {format(new Date(submission.reviewed_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </p>
                    )}
                  </div>
                )}

                {submission.admin_review_status === 'pending' && (
                  <div className="flex space-x-2 pt-2">
                    <Button
                      size="sm"
                      onClick={() => openReviewDialog(submission)}
                      className="flex-1"
                    >
                      Revisar
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Revisar Submissão</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedSubmission && (
              <div className="p-3 bg-muted rounded">
                <p className="text-sm font-medium mb-1">
                  {selectedSubmission.challenge_title}
                </p>
                <p className="text-xs text-muted-foreground">
                  Por: {selectedSubmission.user_name}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Observações (opcional)</Label>
              <Textarea
                id="notes"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Adicione observações sobre a revisão..."
                rows={3}
              />
            </div>

            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => handleReview('rejected')}
                disabled={reviewSubmission.isPending}
                className="flex-1"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Rejeitar
              </Button>
              <Button
                onClick={() => handleReview('approved')}
                disabled={reviewSubmission.isPending}
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Aprovar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};