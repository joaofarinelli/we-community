import { useEffect, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useUserCertificates } from '@/hooks/useUserCertificates';
import { useCompany } from '@/hooks/useCompany';
import { Award, Clock, Hash } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export const CertificatesPage = () => {
  const { data: company } = useCompany();
  const { data: certificates, isLoading } = useUserCertificates();

  // SEO basics
  useEffect(() => {
    const keyword = 'Certificados';
    const titleBase = company?.name ? ` - ${company.name}` : '';
    document.title = `${keyword}${titleBase}`.slice(0, 60);

    const metaDesc = document.querySelector('meta[name="description"]') || (() => {
      const m = document.createElement('meta');
      m.name = 'description';
      document.head.appendChild(m);
      return m;
    })();
    metaDesc.setAttribute('content', `${keyword} dos seus cursos concluídos${company?.name ? ` na ${company.name}` : ''}.`.slice(0, 160));

    const linkCanonical = document.querySelector('link[rel="canonical"]') || (() => {
      const l = document.createElement('link');
      l.setAttribute('rel', 'canonical');
      document.head.appendChild(l);
      return l;
    })();
    linkCanonical.setAttribute('href', window.location.href);
  }, [company?.name]);

  const content = useMemo(() => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="h-48">
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-8 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (!certificates || certificates.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-muted p-6 mb-4">
            <Award className="h-12 w-12 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Nenhum certificado encontrado</h2>
          <p className="text-muted-foreground max-w-md">Conclua cursos para gerar e visualizar seus certificados aqui.</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {certificates.map((cert) => {
          const hours = Math.max(0, Math.round((cert.duration_minutes || 0) / 60));
          return (
            <Card key={cert.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  {cert.course_title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Carga horária: {hours}h</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Emitido em: {new Date(cert.issued_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="secondary" className="gap-1">
                    <Hash className="h-3 w-3" />
                    {cert.certificate_code}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }, [certificates, isLoading]);

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <header className="px-8 pt-8">
          <h1 className="text-4xl font-bold tracking-tight">Certificados</h1>
          <p className="text-muted-foreground mt-2">Consulte seus certificados emitidos pelos cursos concluídos.</p>
        </header>
        <main className="px-8 py-8">
          {content}
        </main>
      </div>
    </DashboardLayout>
  );
};

export default CertificatesPage;
