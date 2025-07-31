import { useState } from 'react';
import { PlayCircle, CheckCircle, Send, Edit2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useStageResponse, useCreateTrailStageResponse, useUpdateTrailStageResponse } from '@/hooks/useTrailStageResponses';
import { useCompleteTrailStage } from '@/hooks/useTrailProgress';

export interface TrailStage {
  id: string;
  trail_id: string;
  template_id?: string;
  name: string;
  description?: string;
  order_index: number;
  is_required: boolean;
  guidance_text?: string;
  video_url?: string;
  question?: string;
  requires_response: boolean;
  created_at: string;
  updated_at: string;
}

interface StageDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stage: TrailStage | null;
  trailId: string;
  isCompleted: boolean;
  onStageComplete?: () => void;
}

export const StageDetailsDialog = ({ 
  open, 
  onOpenChange, 
  stage, 
  trailId, 
  isCompleted, 
  onStageComplete 
}: StageDetailsDialogProps) => {
  const [responseText, setResponseText] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const { data: existingResponse } = useStageResponse(trailId, stage?.id || '');
  const createResponse = useCreateTrailStageResponse();
  const updateResponse = useUpdateTrailStageResponse();
  const completeStage = useCompleteTrailStage();

  const hasExistingResponse = !!existingResponse;
  const canSubmit = !stage?.requires_response || responseText.trim() || hasExistingResponse;

  const handleSubmitResponse = async () => {
    if (!stage || !responseText.trim()) return;

    try {
      if (hasExistingResponse) {
        await updateResponse.mutateAsync({
          responseId: existingResponse.id,
          responseText: responseText.trim(),
        });
      } else {
        await createResponse.mutateAsync({
          trailId,
          stageId: stage.id,
          responseText: responseText.trim(),
        });
      }
      setIsEditing(false);
    } catch (error) {
      console.error('Error submitting response:', error);
    }
  };

  const handleCompleteStage = async () => {
    if (!stage) return;

    try {
      await completeStage.mutateAsync({ trailId, stageId: stage.id });
      onStageComplete?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error completing stage:', error);
    }
  };

  const startEditing = () => {
    setResponseText(existingResponse?.response_text || '');
    setIsEditing(true);
  };

  if (!stage) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
                isCompleted 
                  ? 'bg-green-500 text-white' 
                  : 'bg-primary text-primary-foreground'
              }`}>
                {isCompleted ? <CheckCircle className="h-6 w-6" /> : stage.order_index + 1}
              </div>
              <div>
                <DialogTitle className="text-xl">{stage.name}</DialogTitle>
                {stage.description && (
                  <DialogDescription className="mt-1">{stage.description}</DialogDescription>
                )}
              </div>
            </div>
            <Badge variant={isCompleted ? 'default' : 'secondary'}>
              {isCompleted ? 'Concluída' : 'Em andamento'}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Video Section */}
          {stage.video_url && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PlayCircle className="h-5 w-5" />
                  Vídeo da Etapa
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    src={stage.video_url}
                    className="absolute top-0 left-0 w-full h-full rounded-lg"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Guidance Text */}
          {stage.guidance_text && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground">{stage.guidance_text}</p>
              </CardContent>
            </Card>
          )}

          {/* Question and Response Section */}
          {stage.requires_response && (
            <Card>
              <CardHeader>
                <CardTitle>Sua Resposta</CardTitle>
                {stage.question && (
                  <p className="text-muted-foreground">{stage.question}</p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {hasExistingResponse && !isEditing ? (
                  <div className="space-y-3">
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="whitespace-pre-wrap">{existingResponse.response_text}</p>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Respondido em {new Date(existingResponse.created_at).toLocaleDateString()}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={startEditing}
                        className="flex items-center gap-2"
                      >
                        <Edit2 className="h-4 w-4" />
                        Editar Resposta
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Textarea
                      placeholder="Digite sua resposta aqui..."
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      rows={6}
                      className="min-h-[120px]"
                    />
                    <div className="flex justify-end gap-2">
                      {isEditing && (
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsEditing(false);
                            setResponseText('');
                          }}
                        >
                          Cancelar
                        </Button>
                      )}
                      <Button
                        onClick={handleSubmitResponse}
                        disabled={!responseText.trim() || createResponse.isPending || updateResponse.isPending}
                        className="flex items-center gap-2"
                      >
                        <Send className="h-4 w-4" />
                        {createResponse.isPending || updateResponse.isPending
                          ? 'Salvando...'
                          : hasExistingResponse
                          ? 'Atualizar Resposta'
                          : 'Enviar Resposta'
                        }
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Separator />

          {/* Complete Stage Button */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
            {!isCompleted && canSubmit && (
              <Button
                onClick={handleCompleteStage}
                disabled={completeStage.isPending}
                className="flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                {completeStage.isPending ? 'Concluindo...' : 'Concluir Etapa'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};