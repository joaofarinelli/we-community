import { User, Settings, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { UserAvatar } from './UserAvatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface UserDropdownProps {
  name?: string;
  email?: string;
  imageUrl?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function UserDropdown({ name, email, imageUrl, size = 'md' }: UserDropdownProps) {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleViewProfile = () => {
    navigate('/profile');
  };

  const handleEditProfile = () => {
    navigate('/profile/edit');
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="cursor-pointer">
          <UserAvatar 
            name={name} 
            email={email} 
            imageUrl={imageUrl} 
            size={size}
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="w-56 bg-popover border border-border shadow-lg z-50"
        align="end"
        sideOffset={4}
      >
        <DropdownMenuItem 
          onClick={handleViewProfile}
          className="cursor-pointer"
        >
          <User className="mr-2 h-4 w-4" />
          <span>Ver Perfil</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={handleEditProfile}
          className="cursor-pointer"
        >
          <Settings className="mr-2 h-4 w-4" />
          <span>Editar Perfil</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={handleSignOut}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}