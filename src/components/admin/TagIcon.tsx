import { Tag } from '@/hooks/useTags';

interface TagIconProps {
  tag: Tag;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'w-4 h-4 text-sm',
  md: 'w-5 h-5 text-base',
  lg: 'w-6 h-6 text-lg'
};

export const TagIcon = ({ tag, size = 'md' }: TagIconProps) => {
  if (tag.icon_type === 'none' || !tag.icon_value) {
    return null;
  }

  if (tag.icon_type === 'emoji') {
    return (
      <span className={`inline-flex items-center justify-center ${sizeClasses[size]}`}>
        {tag.icon_value}
      </span>
    );
  }

  if (tag.icon_type === 'image') {
    return (
      <img
        src={tag.icon_value}
        alt={`Ícone da tag ${tag.name}`}
        className={`inline-block rounded-sm object-cover ${sizeClasses[size]}`}
      />
    );
  }

  return null;
};