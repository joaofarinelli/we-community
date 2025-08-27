import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Grid3X3, Heart, PenTool, Award, ShoppingCart, Bug, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface UtilityOption {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  path?: string;
  onClick?: () => void;
}

export const UtilitiesDialog = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const utilityOptions: UtilityOption[] = [
    {
      title: 'Aulas curtidas',
      description: 'Veja todas as aulas que você curtiu',
      icon: Heart,
      path: '/dashboard/liked-lessons'
    },
    {
      title: 'Minhas anotações',
      description: 'Veja suas anotações feita nas aulas',
      icon: PenTool,
      path: '/dashboard/lesson-notes'
    },
    {
      title: 'Meus certificados',
      description: 'Veja e emita todos os seus certificados',
      icon: Award,
      path: '/dashboard/certificates'
    },
    {
      title: 'Relatar problema',
      description: 'Encontrou um bug? Relate aqui',
      icon: Bug,
      onClick: () => {
        // For now, just show an alert or could open a support form
        alert('Funcionalidade de relatório de problemas em desenvolvimento');
      }
    }
  ];

  const handleOptionClick = (option: UtilityOption) => {
    if (option.onClick) {
      option.onClick();
    } else if (option.path) {
      navigate(option.path);
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="p-2">
          <Grid3X3 className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Utilidades</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {utilityOptions.map((option, index) => (
            <button
              key={index}
              onClick={() => handleOptionClick(option)}
              className="w-full flex items-start gap-4 p-3 rounded-lg hover:bg-muted transition-colors text-left"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <option.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-foreground mb-1">
                  {option.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {option.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};