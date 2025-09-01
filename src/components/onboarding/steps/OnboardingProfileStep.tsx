import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useUserProfile } from '@/hooks/useUserProfile';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyContext } from '@/hooks/useCompanyContext';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface OnboardingProfileStepProps {
  step: any;
  onComplete: (data?: Record<string, any>) => void;
  onSkip: () => void;
  isLoading: boolean;
}

export const OnboardingProfileStep = ({ 
  step, 
  onComplete, 
  onSkip, 
  isLoading 
}: OnboardingProfileStepProps) => {
  const { user } = useAuth();
  const { currentCompanyId } = useCompanyContext();
  const { data: profile } = useUserProfile();
  const config = step.config || {};
  const requiredFields = config.required_fields || ['first_name', 'last_name'];

  const [formData, setFormData] = useState({
    first_name: profile?.first_name || '',
    last_name: profile?.last_name || '',
    avatar_url: profile?.avatar_url || '',
    bio: profile?.bio || '',
    phone: profile?.phone || '',
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    // Validate required fields
    const missingFields = requiredFields.filter((field: string) => !formData[field as keyof typeof formData]);
    if (missingFields.length > 0) {
      toast.error(`Por favor, preencha os campos obrigatórios: ${missingFields.join(', ')}`);
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update(formData)
        .eq('user_id', user?.id)
        .eq('company_id', currentCompanyId);

      if (error) throw error;

      onComplete(formData);
      toast.success('Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      toast.error('Erro ao salvar perfil');
    } finally {
      setIsSaving(false);
    }
  };

  const fieldLabels = {
    first_name: 'Nome',
    last_name: 'Sobrenome',
    avatar_url: 'URL da Foto',
    bio: 'Biografia',
    phone: 'Telefone',
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="text-4xl mb-4">👤</div>
              <p className="text-muted-foreground">
                Complete seu perfil para que outros usuários possam conhecê-lo melhor
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {['first_name', 'last_name'].map((field) => (
                <div key={field} className="space-y-2">
                  <Label htmlFor={field}>
                    {fieldLabels[field as keyof typeof fieldLabels]}
                    {requiredFields.includes(field) && (
                      <span className="text-destructive ml-1">*</span>
                    )}
                  </Label>
                  <Input
                    id={field}
                    value={formData[field as keyof typeof formData]}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      [field]: e.target.value
                    }))}
                    placeholder={`Digite seu ${fieldLabels[field as keyof typeof fieldLabels].toLowerCase()}`}
                  />
                </div>
              ))}
            </div>

            {['avatar_url', 'phone'].map((field) => (
              <div key={field} className="space-y-2">
                <Label htmlFor={field}>
                  {fieldLabels[field as keyof typeof fieldLabels]}
                  {requiredFields.includes(field) && (
                    <span className="text-destructive ml-1">*</span>
                  )}
                </Label>
                <Input
                  id={field}
                  value={formData[field as keyof typeof formData]}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    [field]: e.target.value
                  }))}
                  placeholder={
                    field === 'avatar_url' 
                      ? 'https://exemplo.com/sua-foto.jpg'
                      : '(11) 99999-9999'
                  }
                />
              </div>
            ))}

            {(requiredFields.includes('bio') || config.optional_fields?.includes('bio')) && (
              <div className="space-y-2">
                <Label htmlFor="bio">
                  Biografia
                  {requiredFields.includes('bio') && (
                    <span className="text-destructive ml-1">*</span>
                  )}
                </Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    bio: e.target.value
                  }))}
                  placeholder="Conte um pouco sobre você..."
                  rows={3}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center gap-3">
        {config.allow_skip && (
          <Button 
            variant="outline" 
            onClick={onSkip}
            disabled={isLoading || isSaving}
          >
            Pular
          </Button>
        )}
        <Button 
          onClick={handleSave}
          disabled={isLoading || isSaving}
        >
          {isSaving ? 'Salvando...' : 'Continuar'}
        </Button>
      </div>
    </div>
  );
};