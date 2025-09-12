import { useCompany } from '@/hooks/useCompany';
import { Settings, Clock, AlertTriangle } from 'lucide-react';

export const MaintenancePage = () => {
  const { data: company } = useCompany();

  const defaultMessage = `A plataforma está temporariamente em manutenção. 
    Estamos trabalhando para melhorar sua experiência. 
    Tente novamente em alguns instantes.`;

  const message = (company as any)?.maintenance_message || defaultMessage;

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{
        background: `linear-gradient(135deg, ${company?.primary_color || '#334155'} 0%, ${company?.primary_color || '#334155'}80 100%)`
      }}
    >
      <div className="max-w-md w-full bg-card rounded-lg shadow-xl p-8 text-center space-y-6">
        {/* Logo da empresa */}
        {company?.logo_url ? (
          <img 
            src={company.logo_url} 
            alt={`Logo da ${company.name}`}
            className="h-16 w-auto mx-auto"
          />
        ) : (
          <div className="h-16 flex items-center justify-center">
            <Settings className="h-12 w-12 text-primary" />
          </div>
        )}

        {/* Título */}
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2 text-warning">
            <AlertTriangle className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Manutenção</h1>
          </div>
          <p className="text-muted-foreground font-medium">
            {company?.name || 'Plataforma'} em manutenção
          </p>
        </div>

        {/* Mensagem */}
        <div className="space-y-4">
          <div className="p-4 bg-muted/50 rounded-lg border">
            <p className="text-sm leading-relaxed whitespace-pre-line">
              {message}
            </p>
          </div>
          
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Aguarde, voltaremos em breve</span>
          </div>
        </div>

        {/* Rodapé */}
        <div className="pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Em caso de urgência, entre em contato com o administrador
          </p>
        </div>
      </div>
    </div>
  );
};