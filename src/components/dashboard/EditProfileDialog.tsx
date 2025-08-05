import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useCustomProfileFields, useUserCustomProfileData, useUpdateUserCustomProfileData } from '@/hooks/useCustomProfileFields';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Upload, X } from 'lucide-react';

const profileSchema = z.object({
  first_name: z.string().min(1, 'Nome é obrigatório'),
  last_name: z.string().min(1, 'Sobrenome é obrigatório'),
  bio: z.string().optional(),
  phone: z.string().optional(),
  profession: z.string().optional(),
  location: z.string().optional(),
  show_email_to_others: z.boolean(),
  show_coins_to_others: z.boolean(),
  show_profession_to_others: z.boolean(),
  show_location_to_others: z.boolean(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditProfileDialog = ({ open, onOpenChange }: EditProfileDialogProps) => {
  const { user } = useAuth();
  const { data: userProfile, isLoading } = useUserProfile();
  const { data: customFields = [] } = useCustomProfileFields();
  const { data: customData = [] } = useUserCustomProfileData();
  const updateCustomData = useUpdateUserCustomProfileData();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: userProfile?.first_name || '',
      last_name: userProfile?.last_name || '',
      bio: userProfile?.bio || '',
      phone: userProfile?.phone || '',
      profession: userProfile?.profession || '',
      location: userProfile?.location || '',
      show_email_to_others: userProfile?.show_email_to_others ?? true,
      show_coins_to_others: userProfile?.show_coins_to_others ?? true,
      show_profession_to_others: userProfile?.show_profession_to_others ?? true,
      show_location_to_others: userProfile?.show_location_to_others ?? true,
    }
  });

  // Reset form when profile data loads
  useEffect(() => {
    if (userProfile) {
      reset({
        first_name: userProfile.first_name || '',
        last_name: userProfile.last_name || '',
        bio: userProfile.bio || '',
        phone: userProfile.phone || '',
        profession: userProfile.profession || '',
        location: userProfile.location || '',
        show_email_to_others: userProfile.show_email_to_others ?? true,
        show_coins_to_others: userProfile.show_coins_to_others ?? true,
        show_profession_to_others: userProfile.show_profession_to_others ?? true,
        show_location_to_others: userProfile.show_location_to_others ?? true,
      });
    }
  }, [userProfile, reset]);

  // Initialize custom field values
  useEffect(() => {
    const initialValues: Record<string, string> = {};
    customFields.forEach(field => {
      const userData = customData.find(data => data.field_id === field.id);
      initialValues[field.id] = userData?.field_value || '';
    });
    setCustomFieldValues(initialValues);
  }, [customFields, customData]);

  const showEmailToOthers = watch('show_email_to_others');
  const showCoinsToOthers = watch('show_coins_to_others');
  const showProfessionToOthers = watch('show_profession_to_others');
  const showLocationToOthers = watch('show_location_to_others');

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadAvatar = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/avatar-${Date.now()}.${fileExt}`;
      
      // Delete previous avatar if exists
      if (userProfile?.avatar_url) {
        const oldFileName = userProfile.avatar_url.split('/').pop();
        if (oldFileName && oldFileName.includes('avatar-')) {
          await supabase.storage
            .from('avatars')
            .remove([`${user?.id}/${oldFileName}`]);
        }
      }
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          upsert: true
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw error;
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    if (!user || !userProfile) return;

    setIsSubmitting(true);
    try {
      let avatarUrl = userProfile.avatar_url;

      // Upload new avatar if selected
      if (avatarFile) {
        const uploadedUrl = await uploadAvatar(avatarFile);
        if (uploadedUrl) {
          avatarUrl = uploadedUrl;
        }
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: data.first_name,
          last_name: data.last_name,
          bio: data.bio,
          phone: data.phone,
          profession: data.profession,
          location: data.location,
          avatar_url: avatarUrl,
          show_email_to_others: data.show_email_to_others,
          show_coins_to_others: data.show_coins_to_others,
          show_profession_to_others: data.show_profession_to_others,
          show_location_to_others: data.show_location_to_others,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .eq('company_id', userProfile.company_id);

      if (error) throw error;

      // Update custom fields data - only if there are values to update
      if (Object.keys(customFieldValues).length > 0) {
        const customUpdates = Object.entries(customFieldValues)
          .filter(([_, value]) => value && value.trim() !== '') // Only send non-empty values
          .map(([fieldId, value]) => ({
            field_id: fieldId,
            field_value: value,
          }));

        if (customUpdates.length > 0) {
          await updateCustomData.mutateAsync(customUpdates);
        }
      }

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      queryClient.invalidateQueries({ queryKey: ['user-custom-profile-data'] });
      
      // Also invalidate the specific user profile query to ensure header updates
      queryClient.invalidateQueries({ queryKey: ['userProfileForCompany'] });
      
      toast({
        title: 'Perfil atualizado',
        description: 'Suas informações foram salvas com sucesso.',
       });

       // Reset avatar preview and file
       setAvatarPreview(null);
       setAvatarFile(null);
       
       onOpenChange(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Erro ao atualizar perfil',
        description: 'Não foi possível salvar as alterações.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getUserInitials = () => {
    const firstName = userProfile?.first_name;
    const lastName = userProfile?.last_name;
    if (firstName && lastName) {
      return `${firstName.charAt(0).toUpperCase()}${lastName.charAt(0).toUpperCase()}`;
    } else if (firstName) {
      return firstName.substring(0, 2).toUpperCase();
    } else if (userProfile?.email) {
      return userProfile.email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">Carregando perfil...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-2xl font-bold">Editar Perfil</DialogTitle>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Avatar Section */}
          <Card>
            <CardHeader>
              <CardTitle>Foto do Perfil</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage 
                  src={avatarPreview || userProfile?.avatar_url || user?.user_metadata?.avatar_url} 
                  alt="Avatar"
                  className="object-cover" 
                />
                <AvatarFallback className="text-xl">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => document.getElementById('avatar')?.click()}
                  className="cursor-pointer"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Alterar Foto
                </Button>
                <Input
                  id="avatar"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  JPG, PNG ou GIF até 5MB
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">Nome</Label>
                  <Input
                    id="first_name"
                    {...register('first_name')}
                    placeholder="Seu nome"
                  />
                  {errors.first_name && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.first_name.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="last_name">Sobrenome</Label>
                  <Input
                    id="last_name"
                    {...register('last_name')}
                    placeholder="Seu sobrenome"
                  />
                  {errors.last_name && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.last_name.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="bio">Biografia</Label>
                <Textarea
                  id="bio"
                  {...register('bio')}
                  placeholder="Conte um pouco sobre você..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  {...register('phone')}
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="profession">Profissão</Label>
                  <Input
                    id="profession"
                    {...register('profession')}
                    placeholder="Sua profissão"
                  />
                </div>
                <div>
                  <Label htmlFor="location">Localização</Label>
                  <Input
                    id="location"
                    {...register('location')}
                    placeholder="Sua cidade/estado"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Custom Fields */}
          {customFields.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Informações Adicionais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {customFields.map((field) => (
                  <div key={field.id}>
                    <Label htmlFor={field.field_name}>
                      {field.field_label}
                      {field.is_required && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    {field.field_type === 'text' && (
                      <Input
                        id={field.field_name}
                        value={customFieldValues[field.id] || ''}
                        onChange={(e) => setCustomFieldValues(prev => ({
                          ...prev,
                          [field.id]: e.target.value
                        }))}
                        placeholder={`Digite ${field.field_label.toLowerCase()}`}
                      />
                    )}
                    {field.field_type === 'textarea' && (
                      <Textarea
                        id={field.field_name}
                        value={customFieldValues[field.id] || ''}
                        onChange={(e) => setCustomFieldValues(prev => ({
                          ...prev,
                          [field.id]: e.target.value
                        }))}
                        placeholder={`Digite ${field.field_label.toLowerCase()}`}
                        rows={3}
                      />
                    )}
                    {field.field_type === 'select' && (
                      <Select
                        value={customFieldValues[field.id] || ''}
                        onValueChange={(value) => setCustomFieldValues(prev => ({
                          ...prev,
                          [field.id]: value
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={`Selecione ${field.field_label.toLowerCase()}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {((field.field_options as any)?.options || []).map((option: string) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {field.field_type === 'number' && (
                      <Input
                        id={field.field_name}
                        type="number"
                        value={customFieldValues[field.id] || ''}
                        onChange={(e) => setCustomFieldValues(prev => ({
                          ...prev,
                          [field.id]: e.target.value
                        }))}
                        placeholder={`Digite ${field.field_label.toLowerCase()}`}
                      />
                    )}
                    {field.field_type === 'date' && (
                      <Input
                        id={field.field_name}
                        type="date"
                        value={customFieldValues[field.id] || ''}
                        onChange={(e) => setCustomFieldValues(prev => ({
                          ...prev,
                          [field.id]: e.target.value
                        }))}
                      />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Privacy Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Privacidade</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Mostrar email para outros membros</Label>
                  <p className="text-sm text-muted-foreground">
                    Outros membros poderão ver seu endereço de email
                  </p>
                </div>
                <Switch
                  checked={showEmailToOthers}
                  onCheckedChange={(checked) => setValue('show_email_to_others', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Mostrar quantidade de moedas</Label>
                  <p className="text-sm text-muted-foreground">
                    Outros membros poderão ver quantas moedas você possui
                  </p>
                </div>
                <Switch
                  checked={showCoinsToOthers}
                  onCheckedChange={(checked) => setValue('show_coins_to_others', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Mostrar profissão para outros membros</Label>
                  <p className="text-sm text-muted-foreground">
                    Outros membros poderão ver sua profissão
                  </p>
                </div>
                <Switch
                  checked={showProfessionToOthers}
                  onCheckedChange={(checked) => setValue('show_profession_to_others', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Mostrar localização para outros membros</Label>
                  <p className="text-sm text-muted-foreground">
                    Outros membros poderão ver sua localização
                  </p>
                </div>
                <Switch
                  checked={showLocationToOthers}
                  onCheckedChange={(checked) => setValue('show_location_to_others', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};