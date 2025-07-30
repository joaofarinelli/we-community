import { useEffect, useState } from "react";
import { SuperAdminLayout } from "@/components/super-admin/SuperAdminLayout";
import { useSuperAdminCompanies } from "@/hooks/useSuperAdmin";
import { CreateCompanyDialog } from "@/components/super-admin/CreateCompanyDialog";
import { EditCompanyDialog } from "@/components/super-admin/EditCompanyDialog";
import { CompanyStatusDialog } from "@/components/super-admin/CompanyStatusDialog";
import { CompanyFeaturesDialog } from "@/components/super-admin/CompanyFeaturesDialog";
import { useSuperAdminCompanyActions } from "@/hooks/useSuperAdminCompanyActions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Search, MoreHorizontal, Plus, Filter, Edit, Power, Settings } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CompanyData {
  id: string;
  name: string;
  subdomain: string | null;
  custom_domain: string | null;
  status: string;
  plan: string;
  created_at: string;
  total_users: number;
  total_spaces: number;
  total_posts: number;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  cnpj?: string;
}

export const SuperAdminCompanies = () => {
  const { 
    data: companies, 
    isLoading, 
    refetch 
  } = useSuperAdminCompanies();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [featuresDialogOpen, setFeaturesDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<CompanyData | null>(null);
  
  const { updateCompanyFeatures } = useSuperAdminCompanyActions();

  // Enable query when component mounts
  useEffect(() => {
    refetch();
  }, [refetch]);

  const filteredCompanies = companies?.filter(company => {
    const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         company.subdomain?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         company.custom_domain?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || company.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  const handleEditCompany = (company: CompanyData) => {
    setSelectedCompany(company);
    setEditDialogOpen(true);
  };

  const handleToggleStatus = (company: CompanyData) => {
    setSelectedCompany(company);
    setStatusDialogOpen(true);
  };

  const handleManageFeatures = (company: CompanyData) => {
    setSelectedCompany(company);
    setFeaturesDialogOpen(true);
  };

  if (isLoading) {
    return (
      <SuperAdminLayout>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">Gerenciamento de Empresas</h1>
          <Card>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-12 bg-muted rounded"></div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Gerenciamento de Empresas</h1>
            <p className="text-muted-foreground">
              Gerencie todas as empresas cadastradas no sistema
            </p>
          </div>
          <Button className="gap-2" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Nova Empresa
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar empresas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Filter className="h-4 w-4" />
                    Filtrar
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setStatusFilter("all")}>
                    Todas
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("active")}>
                    Ativas
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("inactive")}>
                    Inativas
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Domínio</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Usuários</TableHead>
                  <TableHead>Criada em</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCompanies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{company.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {company.total_spaces} espaços • {company.total_posts} posts
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        {company.custom_domain ? (
                          <div>
                            <div className="font-medium">{company.custom_domain}</div>
                            {company.subdomain && (
                              <div className="text-sm text-muted-foreground">
                                {company.subdomain}.lovable.app
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="font-medium">
                            {company.subdomain ? `${company.subdomain}.lovable.app` : "Não configurado"}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={company.status === 'active' ? 'default' : 'secondary'}
                      >
                        {company.status === 'active' ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {company.plan || 'Free'}
                      </Badge>
                    </TableCell>
                    <TableCell>{company.total_users}</TableCell>
                    <TableCell>
                      {format(new Date(company.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditCompany(company)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleManageFeatures(company)}>
                            <Settings className="h-4 w-4 mr-2" />
                            Gerenciar Funcionalidades
                          </DropdownMenuItem>
                          <DropdownMenuItem>Ver Detalhes</DropdownMenuItem>
                          <DropdownMenuItem>Relatório</DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleToggleStatus(company)}
                            className={company.status === 'active' ? "text-destructive" : "text-green-600"}
                          >
                            <Power className="h-4 w-4 mr-2" />
                            {company.status === 'active' ? 'Desativar' : 'Ativar'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Dialogs */}
        <CreateCompanyDialog 
          open={createDialogOpen} 
          onOpenChange={setCreateDialogOpen} 
        />
        
        <EditCompanyDialog 
          open={editDialogOpen} 
          onOpenChange={setEditDialogOpen} 
          company={selectedCompany}
        />
        
        <CompanyStatusDialog 
          open={statusDialogOpen} 
          onOpenChange={setStatusDialogOpen} 
          company={selectedCompany}
        />
        
        <CompanyFeaturesDialog
          open={featuresDialogOpen}
          onOpenChange={setFeaturesDialogOpen}
          company={selectedCompany}
          onUpdateFeatures={(companyId, features) => {
            updateCompanyFeatures.mutate({ id: companyId, features });
            setFeaturesDialogOpen(false);
          }}
          isLoading={updateCompanyFeatures.isPending}
        />
      </div>
    </SuperAdminLayout>
  );
};