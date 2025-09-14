import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { CompanyMember } from '@/hooks/useCompanyMembers';
import { useTags } from '@/hooks/useTags';
import { useUserTags, useAssignTag, useRemoveTag } from '@/hooks/useUserTags';
import { useCourses } from '@/hooks/useCourses';
import { useUserPoints } from '@/hooks/useUserPoints';
import { TagIcon } from '@/components/admin/TagIcon';
import { X, Plus, BookOpen, Coins } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useCompanyContext } from '@/hooks/useCompanyContext';

interface UserEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: CompanyMember | null;
}

interface UserFormData {
  display_name: string;
  email: string;
  role: string;
}

export const UserEditDialog = ({ open, onOpenChange, member }: UserEditDialogProps) => {
  const [selectedTagId, setSelectedTagId] = useState<string>('');
  const [newCoinAmount, setNewCoinAmount] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);
  const queryClient = useQueryClient();
  const { currentCompanyId } = useCompanyContext();
  
  const { data: tags = [] } = useTags();
  const { data: userTags = [] } = useUserTags(member?.user_id || '');
  const { data: courses = [] } = useCourses();
  const { data: userPoints } = useUserPoints(member?.user_id || '');
  const assignTag = useAssignTag();
  const removeTag = useRemoveTag();

  const { register, handleSubmit, formState: { errors }, reset } = useForm<UserFormData>({
    defaultValues: {
      display_name: '',
      email: '',
      role: 'member',
    }
  });

  // Reset form when member changes
  React.useEffect(() => {
    if (member) {
      reset({
        display_name: member.display_name || '',
        email: member.email || '',
        role: member.role || 'member',
      });
    }
  }, [member, reset]);

  const onSubmit = (data: UserFormData) => {
    // TODO: Implementar atualização dos dados do usuário
    console.log('Update user data:', data);
    toast.success('Dados do usuário atualizados!');
    onOpenChange(false);
  };

  const handleUpdateCoins = async () => {
    if (!member || !newCoinAmount) return;
    
    setIsUpdating(true);
    try {
      const newAmount = parseInt(newCoinAmount);
      
      // Atualizar moedas do usuário usando UPDATE ao invés de UPSERT para evitar conflito de constraint
      const { error } = await supabase
        .from('user_points')
        .update({ total_coins: newAmount, updated_at: new Date().toISOString() })
        .eq('user_id', member.user_id)
        .eq('company_id', currentCompanyId);

      // Se não existe registro, criar um novo
      if (error && error.code === 'PGRST116') {
        const { error: insertError } = await supabase
          .from('user_points')
          .insert({
            user_id: member.user_id,
            company_id: currentCompanyId,
            total_coins: newAmount
          });
        
        if (insertError) throw insertError;
      } else if (error) {
        throw error;
      }

      // Invalidar queries para atualizar dados
      queryClient.invalidateQueries({ queryKey: ['userCoins', member.user_id, currentCompanyId] });
      queryClient.invalidateQueries({ queryKey: ['user-points'] });
      
      toast.success('Moedas atualizadas com sucesso!');
      setNewCoinAmount('');
    } catch (error) {
      console.error('Error updating coins:', error);
      toast.error('Erro ao atualizar moedas');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCourseAccessToggle = async (courseId: string, hasAccess: boolean) => {
    if (!member) return;

    try {
      if (hasAccess) {
        // Remover acesso
        const { error } = await supabase
          .from('user_course_access')
          .delete()
          .eq('user_id', member.user_id)
          .eq('course_id', courseId);

        if (error) throw error;
      } else {
        // Adicionar acesso
        const { error } = await supabase
          .from('user_course_access')
          .insert({
            user_id: member.user_id,
            course_id: courseId,
            company_id: currentCompanyId,
            granted_by: member.user_id // Será substituído por admin atual
          });

        if (error) throw error;
      }

      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['user-course-access'] });
      
      toast.success(hasAccess ? 'Acesso removido!' : 'Acesso concedido!');
    } catch (error) {
      console.error('Error updating course access:', error);
      toast.error('Erro ao atualizar acesso ao curso');
    }
  };

  const handleAssignTag = () => {
    if (selectedTagId && member) {
      assignTag.mutate({ userId: member.user_id, tagId: selectedTagId });
      setSelectedTagId('');
    }
  };

  const handleRemoveTag = (tagId: string) => {
    if (member) {
      removeTag.mutate({ userId: member.user_id, tagId });
    }
  };

  const availableTags = tags.filter(tag => 
    !userTags.some(userTag => userTag.tag_id === tag.id)
  );

  if (!member) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Usuário</DialogTitle>
          <DialogDescription>
            Edite as informações e tags do usuário {member.display_name || member.email}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações básicas */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="display_name">Nome de exibição</Label>
              <Input
                id="display_name"
                {...register('display_name', { required: 'Nome é obrigatório' })}
                placeholder="Nome do usuário"
              />
              {errors.display_name && (
                <p className="text-sm text-destructive">{errors.display_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register('email', { required: 'Email é obrigatório' })}
                placeholder="email@exemplo.com"
                disabled
              />
              <p className="text-xs text-muted-foreground">O email não pode ser alterado</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Função</Label>
              <Select defaultValue={member.role}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Membro</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" className="w-full">
              Salvar alterações
            </Button>
          </form>

          <Separator />

          {/* Gerenciamento de Tags */}
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Tags do usuário</h4>
              <div className="flex flex-wrap gap-2">
                {userTags.length > 0 ? (
                  userTags.map((userTag) => (
                    <Badge
                      key={userTag.id}
                      style={{ backgroundColor: userTag.tags.color, color: '#fff' }}
                      className="inline-flex items-center gap-1"
                    >
                      <TagIcon tag={userTag.tags as any} size="sm" />
                      {userTag.tags.name}
                      <button
                        onClick={() => handleRemoveTag(userTag.tag_id)}
                        className="ml-1 hover:bg-white/20 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhuma tag atribuída</p>
                )}
              </div>
            </div>

            {availableTags.length > 0 && (
              <div className="space-y-2">
                <Label>Adicionar tag</Label>
                <div className="flex gap-2">
                  <Select value={selectedTagId} onValueChange={setSelectedTagId}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Selecione uma tag" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTags.map((tag) => (
                        <SelectItem key={tag.id} value={tag.id}>
                          <div className="flex items-center gap-2">
                            <TagIcon tag={tag} size="sm" />
                            {tag.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleAssignTag}
                    disabled={!selectedTagId || assignTag.isPending}
                    size="icon"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Gerenciamento de Moedas */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-yellow-500" />
              <h4 className="font-medium">Moedas do usuário</h4>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">Saldo atual:</span>
                <Badge variant="outline" className="font-mono">
                  {userPoints?.total_coins || 0} moedas
                </Badge>
              </div>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Nova quantidade"
                  value={newCoinAmount}
                  onChange={(e) => setNewCoinAmount(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={handleUpdateCoins}
                  disabled={!newCoinAmount || isUpdating}
                  size="sm"
                >
                  {isUpdating ? 'Atualizando...' : 'Atualizar'}
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          {/* Gerenciamento de Acesso a Cursos */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-500" />
              <h4 className="font-medium">Acesso a cursos</h4>
            </div>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {courses.length > 0 ? (
                courses.map((course) => (
                  <div key={course.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <h5 className="font-medium text-sm">{course.title}</h5>
                      {course.description && (
                        <p className="text-xs text-muted-foreground truncate">
                          {course.description}
                        </p>
                      )}
                    </div>
                    <Checkbox
                      checked={false} // TODO: Implementar verificação de acesso
                      onCheckedChange={(checked) => 
                        handleCourseAccessToggle(course.id, !checked)
                      }
                    />
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum curso disponível
                </p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};