import { useState } from 'react';
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
import { TagIcon } from '@/components/admin/TagIcon';
import { X, Plus } from 'lucide-react';

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
  
  const { data: tags = [] } = useTags();
  const { data: userTags = [] } = useUserTags(member?.user_id || '');
  const assignTag = useAssignTag();
  const removeTag = useRemoveTag();

  const { register, handleSubmit, formState: { errors } } = useForm<UserFormData>({
    defaultValues: {
      display_name: member?.display_name || '',
      email: member?.email || '',
      role: member?.role || 'member',
    }
  });

  const onSubmit = (data: UserFormData) => {
    // TODO: Implementar atualização dos dados do usuário
    console.log('Update user data:', data);
    toast.success('Dados do usuário atualizados!');
    onOpenChange(false);
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
      <DialogContent className="sm:max-w-[500px]">
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
        </div>
      </DialogContent>
    </Dialog>
  );
};