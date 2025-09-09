
import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useSupabaseContext } from '@/hooks/useSupabaseContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, FileDown, Printer } from 'lucide-react';
import QRCode from 'qrcode';

interface CertificateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
}

export const CertificateDialog = ({ open, onOpenChange, courseId }: CertificateDialogProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: userProfile } = useUserProfile();
  useSupabaseContext();

  const {
    data: course,
    isLoading: courseLoading,
    error: courseError,
  } = useQuery({
    queryKey: ['course-for-certificate', courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title, certificate_enabled, mentor_name, mentor_role, mentor_signature_url, certificate_background_url, certificate_footer_text')
        .eq('id', courseId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: open && !!courseId,
  });

  const {
    data: completion,
    isLoading: completionLoading,
    error: completionError,
  } = useQuery({
    queryKey: ['course-completion', user?.id, courseId],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      const { data, error } = await supabase.rpc('check_course_completion', {
        p_user_id: user.id,
        p_course_id: courseId,
      });
      if (error) throw error;
      return Boolean(data);
    },
    enabled: open && !!user?.id && !!courseId,
  });

  const {
    data: certificate,
    isLoading: certificateLoading,
    error: certificateError,
    refetch: refetchCertificate,
  } = useQuery({
    queryKey: ['user-course-certificate', user?.id, courseId],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      const { data, error } = await supabase
        .from('user_course_certificates')
        .select('*')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: open && !!user?.id && !!courseId,
  });

  const canIssue = useMemo(() => {
    if (!course?.certificate_enabled) return false;
    if (!completion) return false;
    if (certificate) return false;
    return true;
  }, [course, completion, certificate]);

  const issueMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      const { data, error } = await supabase.rpc('issue_course_certificate', {
        p_user_id: user.id,
        p_course_id: courseId,
      });
      if (error) throw error;
      return data as { id: string; certificate_code: string; already_exists: boolean };
    },
    onSuccess: async () => {
      toast({ title: 'Certificado emitido com sucesso!', description: 'Você já pode visualizar e imprimir seu certificado.' });
      await refetchCertificate();
      queryClient.invalidateQueries({ queryKey: ['user-course-certificate', user?.id, courseId] });
    },
    onError: (err: any) => {
      toast({ title: 'Não foi possível emitir o certificado', description: err?.message || 'Tente novamente mais tarde.', variant: 'destructive' });
      console.error('issue_course_certificate error:', err);
    },
  });

  const handlePrint = () => {
    // Para uma versão simples, usamos window.print() com o preview aberto.
    window.print();
  };

  const hoursText = useMemo(() => {
    if (!certificate) return '';
    const hours = Math.max(0, Math.round((certificate.duration_minutes || 0) / 60));
    return `${hours} hora${hours === 1 ? '' : 's'}`;
  }, [certificate]);

  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  useEffect(() => {
    if (certificate && open) {
      const generateQRCode = async () => {
        try {
          const verificationUrl = `${window.location.origin}/certificate/${certificate.certificate_code}`;
          const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
            width: 120,
            margin: 1,
            color: {
              dark: 'currentColor',
              light: '#00000000' // transparent background
            }
          });
          setQrCodeUrl(qrDataUrl);
        } catch (error) {
          console.error('Error generating QR code:', error);
        }
      };
      generateQRCode();
    }
  }, [certificate, open]);

  const userName = useMemo(() => {
    if (userProfile?.first_name || userProfile?.last_name) {
      return `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim();
    }
    return 'Usuário';
  }, [userProfile]);

  useEffect(() => {
    if (!open) return;
    // Log útil para depuração em tempo real
    console.log('🧾 CertificateDialog open for course:', courseId, 'user:', user?.id);
    if (courseError) console.error('Course load error:', courseError);
    if (completionError) console.error('Completion check error:', completionError);
    if (certificateError) console.error('Certificate load error:', certificateError);
  }, [open, courseId, user?.id, courseError, completionError, certificateError]);

  const loading = courseLoading || completionLoading || certificateLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Certificado do Curso</DialogTitle>
          <DialogDescription>
            Visualize, emita e imprima o certificado de conclusão deste curso.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-[300px] w-full" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Status */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2">
                {certificate ? (
                  <Badge variant="default" className="gap-1">
                    <CheckCircle2 className="h-4 w-4" />
                    Certificado emitido
                  </Badge>
                ) : course?.certificate_enabled ? (
                  <Badge variant={completion ? 'default' : 'secondary'}>
                    {completion ? 'Pronto para emitir' : 'Conclua o curso para emitir'}
                  </Badge>
                ) : (
                  <Badge variant="secondary">Certificado não habilitado para este curso</Badge>
                )}
              </div>

              <div className="flex gap-2">
                {!certificate && canIssue && (
                  <Button onClick={() => issueMutation.mutate()} disabled={issueMutation.isPending}>
                    {issueMutation.isPending ? 'Emitindo...' : 'Emitir Certificado'}
                  </Button>
                )}

                {certificate && (
                  <>
                    <Button variant="outline" onClick={handlePrint} className="gap-2">
                      <Printer className="h-4 w-4" />
                      Imprimir
                    </Button>
                    {/* Placeholder para futura geração de PDF nativa */}
                    <Button variant="ghost" className="gap-2" onClick={handlePrint}>
                      <FileDown className="h-4 w-4" />
                      Baixar PDF
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Preview do Certificado */}
            <div className="rounded-lg border bg-card p-4 sm:p-6">
              {certificate ? (
                <div
                  className="relative mx-auto w-full max-w-4xl aspect-[1.414] overflow-hidden shadow"
                  style={{
                    background: 'radial-gradient(circle farthest-corner at 35% 25%, hsl(var(--background)), color-mix(in hsl, hsl(var(--primary)), #000000 20%))',
                    printColorAdjust: 'exact',
                  }}
                >
                  <div className="absolute inset-0 p-6 sm:p-10 flex flex-col">
                    <div className="text-center">
                      <div className="text-xs tracking-widest text-foreground opacity-70">CERTIFICADO DE CONCLUSÃO</div>
                      <h2 className="text-2xl sm:text-3xl font-bold mt-2 text-foreground">{certificate.course_title}</h2>
                    </div>

                    <div className="mt-8 text-center">
                      <p className="text-sm sm:text-base text-foreground opacity-80">Conferido a</p>
                      <p className="text-xl sm:text-2xl font-semibold mt-1 text-foreground">
                        {userName}
                      </p>
                      <p className="mt-3 text-sm sm:text-base text-foreground">
                        pela conclusão do curso com carga horária de {hoursText}.
                      </p>
                    </div>

                    <div className="mt-auto grid grid-cols-1 sm:grid-cols-3 gap-6 items-end">
                      <div className="sm:col-span-2 text-sm text-foreground opacity-80">
                        <div>Código do certificado: <span className="font-mono font-medium text-foreground">{certificate.certificate_code}</span></div>
                        <div className="mt-1">Emitido em: {new Date(certificate.issued_at).toLocaleDateString()}</div>
                        {course?.certificate_footer_text && (
                          <div className="mt-4 text-xs">{course.certificate_footer_text}</div>
                        )}
                      </div>
                      
                      <div className="text-center">
                        {qrCodeUrl && (
                          <div className="flex flex-col items-center gap-2 mb-4">
                            <img 
                              src={qrCodeUrl} 
                              alt="QR Code para validação" 
                              className="w-20 h-20 opacity-80"
                            />
                            <span className="text-xs text-foreground opacity-60">Validar certificado</span>
                          </div>
                        )}
                        
                        {course?.mentor_name && (
                          <div className="mt-2">
                            <div className="font-whisper text-2xl sm:text-3xl font-normal text-foreground">
                              {course.mentor_name}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  {course?.certificate_enabled
                    ? completion
                      ? 'Clique em “Emitir Certificado” para gerar seu certificado.'
                      : 'Conclua todas as aulas do curso para emitir o certificado.'
                    : 'Este curso não possui certificado habilitado.'}
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CertificateDialog;
