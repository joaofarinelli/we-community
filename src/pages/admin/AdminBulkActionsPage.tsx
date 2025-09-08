import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { BulkActionsButton } from '@/components/admin/BulkActionsButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserFilters } from '@/hooks/useCompanyUsersWithFilters';
import { useTags } from '@/hooks/useTags';
import { useCompanyLevels } from '@/hooks/useCompanyLevels';
import { useTrailBadges } from '@/hooks/useTrailBadges';
import { Search, Users } from 'lucide-react';

export default function AdminBulkActionsPage() {
  const [filters, setFilters] = useState<UserFilters>({});
  
  const { data: tags = [] } = useTags();
  const { data: levels = [] } = useCompanyLevels();
  const { data: badges = [] } = useTrailBadges();

  const handleFilterChange = (key: keyof UserFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }));
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ações em Massa</h1>
          <p className="text-muted-foreground">
            Execute operações em múltiplos usuários simultaneamente com base em filtros específicos.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Filtros de Usuários
            </CardTitle>
            <CardDescription>
              Configure os filtros para selecionar os usuários que receberão as ações em massa.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Buscar usuários</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Nome ou email..."
                    value={filters.search || ''}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tags</Label>
                <Select onValueChange={(value) => handleFilterChange('tagIds', value ? [value] : undefined)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar tag..." />
                  </SelectTrigger>
                  <SelectContent>
                    {tags.map((tag) => (
                      <SelectItem key={tag.id} value={tag.id}>
                        {tag.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Níveis</Label>
                <Select onValueChange={(value) => handleFilterChange('levelIds', value ? [value] : undefined)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar nível..." />
                  </SelectTrigger>
                  <SelectContent>
                    {levels.map((level) => (
                      <SelectItem key={level.id} value={level.id}>
                        Nível {level.level_number} - {level.level_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Selos</Label>
                <Select onValueChange={(value) => handleFilterChange('badgeIds', value ? [value] : undefined)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar selo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {badges.map((badge) => (
                      <SelectItem key={badge.id} value={badge.id}>
                        {badge.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="pt-4 border-t">
              <BulkActionsButton filters={filters} />
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}