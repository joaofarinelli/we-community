import React from 'react';
import { useOtherUserProfile } from '@/hooks/useOtherUserProfile';
import { Skeleton } from '@/components/ui/skeleton';
import { Mail, User, Building } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ChatUserProfileProps {
  userId: string;
}

export const ChatUserProfile: React.FC<ChatUserProfileProps> = ({ userId }) => {
  const { data: profile, isLoading } = useOtherUserProfile(userId);

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="text-center">
          <Skeleton className="w-20 h-20 rounded-full mx-auto mb-4" />
          <Skeleton className="h-6 w-32 mx-auto mb-2" />
          <Skeleton className="h-4 w-24 mx-auto" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p>Perfil não encontrado</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-6">
        {/* Avatar e Nome */}
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-medium text-primary">
              {profile.first_name?.[0] || '?'}
              {profile.last_name?.[0] || ''}
            </span>
          </div>
          <h3 className="text-lg font-semibold">
            {profile.first_name} {profile.last_name}
          </h3>
          <p className="text-sm text-muted-foreground capitalize">
            {profile.role || 'Membro'}
          </p>
        </div>

        {/* Informações de Contato */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Informações de Contato
          </h4>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-muted-foreground">{profile.email}</p>
              </div>
            </div>

            {profile.phone && (
              <div className="flex items-center space-x-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Telefone</p>
                  <p className="text-sm text-muted-foreground">{profile.phone}</p>
                </div>
              </div>
            )}

            <div className="flex items-center space-x-3">
              <Building className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Cargo</p>
                <p className="text-sm text-muted-foreground capitalize">
                  {profile.role || 'Não especificado'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Status
          </h4>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${profile.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
              <div>
                <p className="text-sm font-medium">
                  {profile.is_active ? 'Ativo' : 'Inativo'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Status da conta
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
};