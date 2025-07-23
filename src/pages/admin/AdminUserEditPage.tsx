import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useForm } from 'react-hook-form';
import { useCompanyMembers, CompanyMember } from '@/hooks/useCompanyMembers';
import { useTags } from '@/hooks/useTags';
import { useUserTags, useAssignTag, useRemoveTag } from '@/hooks/useUserTags';
import { TagIcon } from '@/components/admin/TagIcon';
import { ArrowLeft, X, Plus, Save } from 'lucide-react';
import { toast } from 'sonner';

interface UserFormData {
  display_name: string;
  email: string;
  role: string;
}

export const AdminUserEditPage = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [selectedTagId, setSelectedTagId] = useState<string>('');
  
  const { data: members = [] } = useCompanyMembers();
  const { data: tags = [] } = useTags();
  const { data: userTags = [] } = useUserTags(userId || '');
  const assignTag = useAssignTag();
  const removeTag = useRemoveTag();

  // Encontrar o membro específico
  const member = members.find(m => m.user_id === userId);

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<UserFormData>();

  // Carregar dados do usuário no formulário
  useEffect(() => {
    if (member) {
      setValue('display_name', member.display_name || '');
      setValue('email', member.email || '');
      setValue('role', member.role || 'member');
    }
  }, [member, setValue]);

  const onSubmit = (data: UserFormData) => {
    // TODO: Implementar atualização dos dados do usuário
    console.log('Update user data:', data);
    toast.success('Dados do usuário atualizados!');
  };

  const handleAssignTag = () => {
    if (selectedTagId && userId) {
      assignTag.mutate({ userId, tagId: selectedTagId });
      setSelectedTagId('');
    }
  };

  const handleRemoveTag = (tagId: string) => {
    if (userId) {
      removeTag.mutate({ userId, tagId });
    }
  };

  const availableTags = tags.filter(tag => 
    !userTags.some(userTag => userTag.tag_id === tag.id)
  );

  if (!member) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/admin/users')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </div>
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">Usuário não encontrado</p>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/admin/users')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Audiência
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informações do Usuário */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações do Usuário</CardTitle>
                <CardDescription>
                  Edite as informações básicas do usuário
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="flex items-center space-x-4 mb-6">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={member.avatar_url || ''} />
                      <AvatarFallback className="text-lg">
                        {member.display_name?.charAt(0) || member.email.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-lg font-medium">{member.display_name || 'Sem nome'}</h3>
                      <p className="text-muted-foreground">{member.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        {...register('email')}
                        placeholder="email@exemplo.com"
                        disabled
                      />
                      <p className="text-xs text-muted-foreground">O email não pode ser alterado</p>
                    </div>
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
                    <Save className="h-4 w-4 mr-2" />
                    Salvar alterações
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Tags */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Tags do Usuário</CardTitle>
                <CardDescription>
                  Gerencie as tags atribuídas a este usuário
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Tags atuais */}
                <div className="space-y-2">
                  <Label>Tags atribuídas</Label>
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

                {/* Adicionar nova tag */}
                {availableTags.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <Label>Adicionar nova tag</Label>
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
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};