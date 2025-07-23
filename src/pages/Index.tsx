import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  MessageSquare, 
  BookOpen, 
  Trophy, 
  Settings, 
  Zap, 
  Shield, 
  BarChart3,
  Star,
  Crown,
  Gamepad2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-community.jpg";

const Index = () => {
  const navigate = useNavigate();
  const features = [
    {
      icon: Users,
      title: "Comunidades Personalizadas",
      description: "Crie e gerencie comunidades únicas para cada usuário com total controle."
    },
    {
      icon: MessageSquare,
      title: "Canais & Categorias",
      description: "Organize conversas com canais dedicados e categorias inteligentes."
    },
    {
      icon: BookOpen,
      title: "Vitrine de Cursos",
      description: "Exiba seus cursos de forma atrativa com sistema de marketplace integrado."
    },
    {
      icon: Trophy,
      title: "Gamificação Avançada",
      description: "Sistema de pontos, badges e ranking para engajar sua comunidade."
    },
    {
      icon: Settings,
      title: "Painel Administrativo",
      description: "Controles completos de moderação e administração da comunidade."
    },
    {
      icon: BarChart3,
      title: "Analytics Detalhado",
      description: "Acompanhe métricas de engajamento e crescimento em tempo real."
    }
  ];

  const gamificationFeatures = [
    { icon: Star, label: "Sistema de XP", color: "bg-primary" },
    { icon: Crown, label: "Ranks & Níveis", color: "bg-accent" },
    { icon: Trophy, label: "Conquistas", color: "bg-warning" },
    { icon: Gamepad2, label: "Desafios", color: "bg-success" }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold">CommunityHub</span>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate('/auth')}>Login</Button>
            <Button variant="hero" onClick={() => navigate('/auth')}>Começar Grátis</Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-10"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge className="animate-fade-in">
                  <Zap className="h-3 w-3 mr-1" />
                  Plataforma SaaS Completa
                </Badge>
                <h1 className="text-5xl lg:text-6xl font-bold leading-tight animate-slide-up">
                  Gerencie suas{" "}
                  <span className="bg-gradient-primary bg-clip-text text-transparent">
                    Comunidades
                  </span>{" "}
                  com Inteligência
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed animate-slide-up">
                  A plataforma completa para criar, gerenciar e fazer crescer comunidades online 
                  com gamificação, cursos e ferramentas administrativas avançadas.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 animate-slide-up">
                <Button 
                  variant="hero" 
                  size="xl" 
                  className="shadow-glow"
                  onClick={() => navigate('/auth')}
                >
                  <Shield className="h-5 w-5 mr-2" />
                  Criar Minha Comunidade
                </Button>
                <Button variant="outline" size="xl">
                  Ver Demo ao Vivo
                </Button>
              </div>

              <div className="flex items-center space-x-6 pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">10k+</div>
                  <div className="text-sm text-muted-foreground">Comunidades</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-accent">500k+</div>
                  <div className="text-sm text-muted-foreground">Membros Ativos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-success">99.9%</div>
                  <div className="text-sm text-muted-foreground">Uptime</div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-primary rounded-3xl blur-3xl opacity-20 animate-glow"></div>
              <img 
                src={heroImage} 
                alt="Community Management Platform" 
                className="relative rounded-2xl shadow-elegant w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4">
              <Star className="h-3 w-3 mr-1" />
              Recursos Principais
            </Badge>
            <h2 className="text-4xl font-bold mb-4">
              Tudo que você precisa para{" "}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                sua comunidade
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Ferramentas poderosas projetadas para criar experiências únicas e engajadoras
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="bg-gradient-card border-0 hover:shadow-elegant transition-all duration-300 hover:-translate-y-1">
                <CardHeader>
                  <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Gamification Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div>
                <Badge className="mb-4">
                  <Trophy className="h-3 w-3 mr-1" />
                  Gamificação
                </Badge>
                <h2 className="text-4xl font-bold mb-4">
                  Engaje sua comunidade com{" "}
                  <span className="bg-gradient-secondary bg-clip-text text-transparent">
                    gamificação
                  </span>
                </h2>
                <p className="text-xl text-muted-foreground">
                  Sistema completo de pontos, níveis, conquistas e desafios para manter 
                  seus membros sempre engajados e motivados.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {gamificationFeatures.map((item, index) => (
                  <div key={index} className="flex items-center space-x-3 p-4 rounded-lg border bg-card hover:shadow-accent transition-all duration-300">
                    <div className={`w-10 h-10 ${item.color} rounded-full flex items-center justify-center`}>
                      <item.icon className="h-5 w-5 text-white" />
                    </div>
                    <span className="font-medium">{item.label}</span>
                  </div>
                ))}
              </div>

              <Button variant="gradient" size="lg" className="w-full sm:w-auto">
                <Gamepad2 className="h-5 w-5 mr-2" />
                Explorar Gamificação
              </Button>
            </div>

            <div className="space-y-6">
              <Card className="p-6 bg-gradient-card border-0 shadow-elegant">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Ranking da Comunidade</h3>
                  <Trophy className="h-5 w-5 text-warning" />
                </div>
                <div className="space-y-4">
                  {[
                    { name: "Ana Silva", points: "2,450 XP", level: "Ninja", position: 1 },
                    { name: "João Santos", points: "2,210 XP", level: "Expert", position: 2 },
                    { name: "Maria Costa", points: "1,890 XP", level: "Pro", position: 3 }
                  ].map((user, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                        user.position === 1 ? 'bg-warning' : user.position === 2 ? 'bg-muted-foreground' : 'bg-primary'
                      }`}>
                        {user.position}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-muted-foreground">{user.level}</div>
                      </div>
                      <div className="text-primary font-semibold">{user.points}</div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-background/10 backdrop-blur-sm"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-3xl mx-auto text-white space-y-8">
            <h2 className="text-4xl lg:text-5xl font-bold">
              Pronto para transformar sua comunidade?
            </h2>
            <p className="text-xl opacity-90">
              Junte-se a milhares de criadores que já estão construindo comunidades incríveis com nossa plataforma.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                variant="secondary" 
                size="xl" 
                className="shadow-glow"
                onClick={() => navigate('/auth')}
              >
                <Users className="h-5 w-5 mr-2" />
                Começar Grátis por 14 dias
              </Button>
              <Button variant="outline" size="xl" className="border-white text-white hover:bg-white/10">
                Agendar Demonstração
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-bold">CommunityHub</span>
              </div>
              <p className="text-muted-foreground">
                A plataforma definitiva para gestão de comunidades online.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Produto</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>Funcionalidades</li>
                <li>Preços</li>
                <li>Integrações</li>
                <li>API</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Suporte</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>Central de Ajuda</li>
                <li>Documentação</li>
                <li>Status</li>
                <li>Contato</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>Sobre nós</li>
                <li>Blog</li>
                <li>Carreiras</li>
                <li>Privacidade</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t mt-8 pt-8 text-center text-muted-foreground">
            <p>&copy; 2024 CommunityHub. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;