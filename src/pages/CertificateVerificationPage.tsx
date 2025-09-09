import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Calendar, Clock, User, Building2 } from 'lucide-react';

interface CertificateVerification {
  course_title: string;
  user_name: string;
  duration_minutes: number;
  issued_at: string;
  company_name: string;
  mentor_name?: string;
  mentor_role?: string;
  is_valid: boolean;
}

export default function CertificateVerificationPage() {
  const { certificateCode } = useParams<{ certificateCode: string }>();
  const [certificate, setCertificate] = useState<CertificateVerification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyCertificate = async () => {
      if (!certificateCode) {
        setError('Código do certificado não fornecido');
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.rpc('verify_certificate', {
          p_certificate_code: certificateCode
        });

        if (error) {
          console.error('Erro ao verificar certificado:', error);
          setError('Erro ao verificar certificado');
          return;
        }

        if (!data || data.length === 0) {
          setError('Certificado não encontrado ou inválido');
          return;
        }

        setCertificate(data[0]);
      } catch (err) {
        console.error('Erro:', err);
        setError('Erro inesperado ao verificar certificado');
      } finally {
        setLoading(false);
      }
    };

    verifyCertificate();
  }, [certificateCode]);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours === 0) return `${remainingMinutes} minutos`;
    if (remainingMinutes === 0) return `${hours} ${hours === 1 ? 'hora' : 'horas'}`;
    return `${hours}h${remainingMinutes}min`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando certificado...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Verificação de Certificado</h1>
          <p className="text-muted-foreground">
            Código: <span className="font-mono font-medium">{certificateCode}</span>
          </p>
        </div>

        <Card>
          <CardContent className="p-8">
            {error ? (
              <div className="text-center py-8">
                <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-destructive mb-2">Certificado Inválido</h2>
                <p className="text-muted-foreground">{error}</p>
              </div>
            ) : certificate ? (
              <div>
                <div className="text-center mb-8">
                  <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                  <Badge variant="secondary" className="bg-green-100 text-green-800 mb-4">
                    ✓ Certificado Válido
                  </Badge>
                  <h2 className="text-2xl font-bold">{certificate.course_title}</h2>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Concluído por</p>
                        <p className="font-semibold">{certificate.user_name}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Empresa</p>
                        <p className="font-semibold">{certificate.company_name}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Carga horária</p>
                        <p className="font-semibold">{formatDuration(certificate.duration_minutes)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Data de emissão</p>
                        <p className="font-semibold">
                          {new Date(certificate.issued_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>

                    {certificate.mentor_name && (
                      <div>
                        <p className="text-sm text-muted-foreground">Mentor</p>
                        <p className="font-semibold">{certificate.mentor_name}</p>
                        {certificate.mentor_role && (
                          <p className="text-xs text-muted-foreground">{certificate.mentor_role}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t text-center text-sm text-muted-foreground">
                  <p>Este certificado foi emitido digitalmente e pode ser verificado através deste código único.</p>
                  <p className="mt-1">Para mais informações, entre em contato com {certificate.company_name}.</p>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}