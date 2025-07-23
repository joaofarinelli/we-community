import { Tag } from '@/hooks/useTags';

interface TagIconProps {
  tag: Tag;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'w-3 h-3 text-xs',
  md: 'w-4 h-4 text-sm',
  lg: 'w-5 h-5 text-base'
};

export const TagIcon = ({ tag, size = 'md' }: TagIconProps) => {
  if (tag.icon_type === 'none' || !tag.icon_value) {
    return null;
  }

  if (tag.icon_type === 'emoji') {
    return (
      <span className={`inline-flex items-center justify-center mr-1 ${sizeClasses[size]}`}>
        {tag.icon_value}
      </span>
    );
  }

  if (tag.icon_type === 'image') {
    return (
      <img
        src={tag.icon_value}
        alt={`Ícone da tag ${tag.name}`}
        className={`inline-block rounded-sm object-cover mr-1 ${sizeClasses[size]}`}
      />
    );
  }

  return null;
};