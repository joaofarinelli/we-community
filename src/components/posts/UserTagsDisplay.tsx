import { useUserTags } from '@/hooks/useUserTags';
import { TagIcon } from '@/components/admin/TagIcon';
import { Badge } from '@/components/ui/badge';

interface UserTagsDisplayProps {
  userId: string;
  maxTags?: number;
  size?: 'sm' | 'md';
}

export const UserTagsDisplay = ({ userId, maxTags = 2, size = 'sm' }: UserTagsDisplayProps) => {
  const { data: userTags = [] } = useUserTags(userId);
  
  if (userTags.length === 0) {
    return null;
  }

  const displayTags = userTags.slice(0, maxTags);
  const remainingCount = userTags.length - maxTags;

  return (
    <div className="flex items-center gap-1">
      {displayTags.map((userTag) => (
        <Badge
          key={userTag.id}
          style={{ backgroundColor: userTag.tags.color, color: '#fff' }}
          className={`inline-flex items-center ${size === 'sm' ? 'text-xs h-5' : 'text-sm h-6'}`}
        >
          <TagIcon tag={userTag.tags as any} size="sm" />
          {userTag.tags.name}
        </Badge>
      ))}
      {remainingCount > 0 && (
        <span className={`text-muted-foreground ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
          +{remainingCount}
        </span>
      )}
    </div>
  );
};