import { useQuery } from '@tanstack/react-query';
import { Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserAvatar } from '@/components/dashboard/UserAvatar';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Member {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  created_at: string;
}

export const NewMembersCard = () => {
  const { user } = useAuth();

  const { data: members, isLoading } = useQuery({
    queryKey: ['new-members', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // First get current company ID
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('user_id', user.id)
        .single();

      if (!profile) return [];

      const companyId = profile.company_id;

      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, first_name, last_name, avatar_url, created_at')
        .eq('is_active', true)
        .eq('company_id', companyId)
        .neq('user_id', user.id) // Exclude current user
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching new members:', error);
        return [];
      }

      return data as Member[];
    },
    enabled: !!user?.id,
  });

  const getDisplayName = (member: Member) => {
    if (member.first_name && member.last_name) {
      return `${member.first_name} ${member.last_name}`;
    }
    return member.first_name || 'Usuário';
  };

  return (
    <Card className="sticky top-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5" />
          Novos membros
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-5 gap-2">
            {[...Array(10)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-10 rounded-full" />
            ))}
          </div>
        ) : members && members.length > 0 ? (
          <div className="grid grid-cols-5 gap-2">
            {members.slice(0, 10).map((member) => (
              <div key={member.id} className="flex flex-col items-center">
                <UserAvatar
                  name={getDisplayName(member)}
                  imageUrl={member.avatar_url}
                  size="sm"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">
              Nenhum membro encontrado
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};