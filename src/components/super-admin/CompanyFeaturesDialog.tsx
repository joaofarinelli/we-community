import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, ShoppingBag, Trophy, Wallet, Store, Zap, Target } from 'lucide-react';
import { CompanyFeatures } from '@/hooks/useCompanyFeatures';

interface CompanyFeaturesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: {
    id: string;
    name: string;
    enabled_features?: CompanyFeatures;
  } | null;
  onUpdateFeatures: (companyId: string, features: CompanyFeatures) => void;
  isLoading?: boolean;
}

const FEATURES = [
  {
    key: 'marketplace' as const,
    name: 'Marketplace',
    description: 'Permite que usuários comprem e vendam itens entre si',
    icon: ShoppingBag,
    color: 'text-blue-500'
  },
  {
    key: 'ranking' as const,
    name: 'Ranking e Níveis',
    description: 'Sistema de pontuação e níveis para gamificação',
    icon: Trophy,
    color: 'text-yellow-500'
  },
  {
    key: 'bank' as const,
    name: 'Banco',
    description: 'Sistema de transferência de moedas entre usuários',
    icon: Wallet,
    color: 'text-green-500'
  },
  {
    key: 'store' as const,
    name: 'Loja',
    description: 'Loja oficial da empresa com itens exclusivos',
    icon: Store,
    color: 'text-purple-500'
  },
  {
    key: 'streak' as const,
    name: 'Ofensiva',
    description: 'Sistema de sequência de dias consecutivos de atividade',
    icon: Zap,
    color: 'text-orange-500'
  },
  {
    key: 'challenges' as const,
    name: 'Desafios',
    description: 'Desafios e missões para engajar usuários',
    icon: Target,
    color: 'text-red-500'
  },
];

export function CompanyFeaturesDialog({ 
  open, 
  onOpenChange, 
  company, 
  onUpdateFeatures,
  isLoading 
}: CompanyFeaturesDialogProps) {
  const [features, setFeatures] = useState<CompanyFeatures>({
    marketplace: true,
    ranking: true,
    bank: true,
    store: true,
    streak: true,
    challenges: true,
  });

  useEffect(() => {
    if (company?.enabled_features) {
      setFeatures(company.enabled_features);
    }
  }, [company]);

  const handleFeatureToggle = (featureKey: keyof CompanyFeatures) => {
    setFeatures(prev => ({
      ...prev,
      [featureKey]: !prev[featureKey]
    }));
  };

  const handleSave = () => {
    if (company) {
      onUpdateFeatures(company.id, features);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Gerenciar Funcionalidades - {company?.name}
          </DialogTitle>
          <DialogDescription>
            Configure quais funcionalidades estarão disponíveis para esta empresa.
            Funcionalidades desabilitadas não aparecerão na navegação dos usuários.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.key}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-muted ${feature.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{feature.name}</CardTitle>
                        <CardDescription className="text-sm">
                          {feature.description}
                        </CardDescription>
                      </div>
                    </div>
                    <Switch
                      id={feature.key}
                      checked={features[feature.key]}
                      onCheckedChange={() => handleFeatureToggle(feature.key)}
                    />
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}