import { useState } from 'react';
import { User, Settings, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { UserAvatar } from './UserAvatar';
import { UserProfileDialog } from './UserProfileDialog';
import { EditProfileDialog } from './EditProfileDialog';
import { NotificationDropdown } from './NotificationDropdown';
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
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const handleViewProfile = () => {
    setProfileDialogOpen(true);
  };

  const handleEditProfile = () => {
    setEditDialogOpen(true);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      // Even if signOut fails, we still want to redirect to auth page
      console.error('Logout error:', error);
    } finally {
      // Always redirect to auth page regardless of logout success/failure
      navigate('/auth');
    }
  };

  return (
    <div className="flex items-center gap-2">
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
      
      <UserProfileDialog 
        open={profileDialogOpen} 
        onOpenChange={setProfileDialogOpen} 
      />
      
      <EditProfileDialog 
        open={editDialogOpen} 
        onOpenChange={setEditDialogOpen} 
      />
    </DropdownMenu>
    </div>
  );
}