import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { CompanyUser } from '@/hooks/useCompanyUsers';

interface MentionItemProps {
  user: CompanyUser;
  isSelected: boolean;
  onClick: () => void;
}

export const MentionItem = ({ user, isSelected, onClick }: MentionItemProps) => {
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div
      className={`flex items-center gap-2 p-2 cursor-pointer transition-colors ${
        isSelected ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'
      }`}
      onClick={onClick}
    >
      <Avatar className="h-6 w-6">
        <AvatarFallback className="text-xs bg-primary/10 text-primary">
          {getInitials(user.first_name, user.last_name)}
        </AvatarFallback>
      </Avatar>
      <span className="text-sm font-medium">
        {user.first_name} {user.last_name}
      </span>
    </div>
  );
};