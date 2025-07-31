import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, PlayCircle, CheckCircle, Send, Video } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useTrailStages } from '@/hooks/useTrailStages';
import { useTrailProgress, useCompleteTrailStage } from '@/hooks/useTrailProgress';
import { useStageResponse, useCreateTrailStageResponse, useUpdateTrailStageResponse } from '@/hooks/useTrailStageResponses';

export const TrailStagePlayerPage = () => {
  const { trailId, stageId } = useParams<{ trailId: string; stageId: string }>();
  const navigate = useNavigate();
  const [responseText, setResponseText] = useState('');

  const { data: stages } = useTrailStages(trailId);
  const { data: progress } = useTrailProgress(trailId);
  const { data: existingResponse } = useStageResponse(trailId || '', stageId || '');
  const createResponse = useCreateTrailStageResponse();
  const updateResponse = useUpdateTrailStageResponse();
  const completeStage = useCompleteTrailStage();

  const stage = stages?.find(s => s.id === stageId);
  const isCompleted = progress?.find(p => p.stage_id === stageId)?.is_completed || false;
  const hasExistingResponse = !!existingResponse;

  useEffect(() => {
    if (existingResponse) {
      setResponseText(existingResponse.response_text);
    }
  }, [existingResponse]);

  const handleSubmitResponse = async () => {
    if (!stage || !responseText.trim() || !trailId) return;

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
    } catch (error) {
      console.error('Error submitting response:', error);
    }
  };

  const handleCompleteStage = async () => {
    if (!stage || !trailId) return;

    try {
      await completeStage.mutateAsync({ trailId, stageId: stage.id });
      navigate(`/dashboard/trails/${trailId}`);
    } catch (error) {
      console.error('Error completing stage:', error);
    }
  };

  if (!stage) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate(`/dashboard/trails/${trailId}`)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </div>
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">Etapa não encontrada.</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const canComplete = !stage.requires_response || hasExistingResponse;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate(`/dashboard/trails/${trailId}`)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar à Trilha
            </Button>
          </div>
          <Badge variant={isCompleted ? 'default' : 'secondary'}>
            {isCompleted ? 'Concluída' : 'Em andamento'}
          </Badge>
        </div>

        {/* Stage Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
                isCompleted 
                  ? 'bg-green-500 text-white' 
                  : 'bg-primary text-primary-foreground'
              }`}>
                {isCompleted ? <CheckCircle className="h-6 w-6" /> : stage.order_index + 1}
              </div>
              <div>
                <CardTitle className="text-2xl">{stage.name}</CardTitle>
                {stage.description && (
                  <p className="text-muted-foreground mt-1">{stage.description}</p>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Video Section */}
        {stage.video_url && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
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

        {/* Guidance */}
        {stage.guidance_text && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground whitespace-pre-wrap">{stage.guidance_text}</p>
            </CardContent>
          </Card>
        )}

        {/* Response Section */}
        {stage.requires_response && (
          <Card>
            <CardHeader>
              <CardTitle>Sua Resposta</CardTitle>
              {stage.question && (
                <p className="text-muted-foreground">{stage.question}</p>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Digite sua resposta aqui..."
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                rows={8}
                className="min-h-[200px]"
              />
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
            </CardContent>
          </Card>
        )}

        {/* Complete Button */}
        {!isCompleted && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-center">
                <Button
                  onClick={handleCompleteStage}
                  disabled={!canComplete || completeStage.isPending}
                  size="lg"
                  className="flex items-center gap-2"
                >
                  <CheckCircle className="h-5 w-5" />
                  {completeStage.isPending ? 'Concluindo...' : 'Concluir Etapa'}
                </Button>
              </div>
              {stage.requires_response && !hasExistingResponse && (
                <p className="text-center text-sm text-muted-foreground mt-2">
                  Você precisa enviar uma resposta antes de concluir esta etapa.
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};