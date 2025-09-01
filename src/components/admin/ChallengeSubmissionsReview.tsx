import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  Image as ImageIcon, 
  Type, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  User,
  Calendar,
  MessageSquare
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAdminSubmissions, useReviewSubmission } from '@/hooks/useChallengeSubmissions';

interface ReviewDialogProps {
  submission: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ReviewDialog = ({ submission, open, onOpenChange }: ReviewDialogProps) => {
  const [reviewStatus, setReviewStatus] = useState<'approved' | 'rejected'>('approved');
  const [reviewNotes, setReviewNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const reviewSubmission = useReviewSubmission();

  const handleReview = async () => {
    if (!submission) return;
    
    setIsSubmitting(true);
    try {
      await reviewSubmission.mutateAsync({
        submissionId: submission.id,
        status: reviewStatus,
        notes: reviewNotes.trim() || undefined
      });
      setReviewNotes('');
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao revisar submissão:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!submission) return null;

  const getTypeIcon = () => {
    switch (submission.submission_type) {
      case 'text': return <Type className="h-4 w-4" />;
      case 'image': return <ImageIcon className="h-4 w-4" />;
      case 'file': return <FileText className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Revisar Submissão
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* User and Challenge Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-primary" />
                  <span className="font-medium">Usuário</span>
                </div>
                <p className="text-sm">
                  {submission.user_challenge_participations?.profiles?.first_name} {submission.user_challenge_participations?.profiles?.last_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {submission.user_challenge_participations?.profiles?.email}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="font-medium">Data de Submissão</span>
                </div>
                <p className="text-sm">
                  {format(new Date(submission.submitted_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Challenge Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {submission.user_challenge_participations?.challenges?.title}
              </CardTitle>
            </CardHeader>
          </Card>

          {/* Submission Content */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                {getTypeIcon()}
                Conteúdo da Submissão
                <Badge variant="outline">
                  {submission.submission_type === 'text' ? 'Texto' :
                   submission.submission_type === 'image' ? 'Imagem' : 'Arquivo'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {submission.submission_type === 'text' && submission.submission_content && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="whitespace-pre-wrap">{submission.submission_content}</p>
                </div>
              )}

              {submission.submission_type === 'image' && submission.file_url && (
                <div className="flex justify-center">
                  <img 
                    src={submission.file_url} 
                    alt="Prova enviada"
                    className="max-w-full h-auto max-h-96 rounded-lg border"
                  />
                </div>
              )}

              {submission.submission_type === 'file' && submission.file_url && (
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4" />
                    <span className="font-medium">{submission.file_name}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {submission.file_size && `Tamanho: ${(submission.file_size / 1024 / 1024).toFixed(2)} MB`}
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <a href={submission.file_url} target="_blank" rel="noopener noreferrer">
                      Baixar Arquivo
                    </a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Separator />

          {/* Review Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Revisar Submissão</h3>
            
            <div className="flex gap-4">
              <Button
                variant={reviewStatus === 'approved' ? 'default' : 'outline'}
                onClick={() => setReviewStatus('approved')}
                className="flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Aprovar
              </Button>
              <Button
                variant={reviewStatus === 'rejected' ? 'destructive' : 'outline'}
                onClick={() => setReviewStatus('rejected')}
                className="flex items-center gap-2"
              >
                <XCircle className="h-4 w-4" />
                Rejeitar
              </Button>
            </div>

            <div>
              <Label htmlFor="review-notes">
                Comentários {reviewStatus === 'rejected' ? '(obrigatório)' : '(opcional)'}
              </Label>
              <Textarea
                id="review-notes"
                placeholder={
                  reviewStatus === 'approved' 
                    ? 'Adicione comentários opcionais sobre a aprovação...'
                    : 'Explique o motivo da rejeição...'
                }
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleReview}
                disabled={isSubmitting || (reviewStatus === 'rejected' && !reviewNotes.trim())}
              >
                {isSubmitting ? 'Processando...' : 'Confirmar Revisão'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const ChallengeSubmissionsReview = () => {
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const { data: submissions, isLoading } = useAdminSubmissions();

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'text': return <Type className="h-4 w-4" />;
      case 'image': return <ImageIcon className="h-4 w-4" />;
      case 'file': return <FileText className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Submissões de Desafios</h2>
        {submissions && (
          <Badge variant="secondary">
            {submissions.length} submissão{submissions.length !== 1 ? 'ões' : ''}
          </Badge>
        )}
      </div>

      {!submissions || submissions.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma submissão encontrada</h3>
            <p className="text-muted-foreground">
              As submissões dos desafios aparecerão aqui para revisão.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {submissions.map((submission: any) => (
            <Card key={submission.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">
                        {submission.user_challenge_participations?.challenges?.title}
                      </h3>
                      <Badge 
                        variant="outline" 
                        className={getStatusColor(submission.admin_review_status)}
                      >
                        {getStatusIcon(submission.admin_review_status)}
                        <span className="ml-1">
                          {submission.admin_review_status === 'approved' ? 'Aprovado' :
                           submission.admin_review_status === 'rejected' ? 'Rejeitado' : 'Pendente'}
                        </span>
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {submission.user_challenge_participations?.profiles?.first_name} {submission.user_challenge_participations?.profiles?.last_name}
                      </div>
                      <div className="flex items-center gap-1">
                        {getTypeIcon(submission.submission_type)}
                        {submission.submission_type === 'text' ? 'Texto' :
                         submission.submission_type === 'image' ? 'Imagem' : 'Arquivo'}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(submission.submitted_at), 'dd/MM/yyyy', { locale: ptBR })}
                      </div>
                    </div>

                    {submission.admin_review_notes && (
                      <div className="p-2 bg-muted rounded text-sm">
                        <span className="font-medium">Comentários: </span>
                        {submission.admin_review_notes}
                      </div>
                    )}
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedSubmission(submission)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Revisar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ReviewDialog 
        submission={selectedSubmission}
        open={!!selectedSubmission}
        onOpenChange={(open) => !open && setSelectedSubmission(null)}
      />
    </div>
  );
};