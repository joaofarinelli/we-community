import { forwardRef, useImperativeHandle, useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { MentionItem } from './MentionItem';
import { CompanyUser } from '@/hooks/useCompanyUsers';

export interface MentionSuggestionRef {
  onKeyDown: (event: KeyboardEvent) => boolean;
}

interface MentionSuggestionProps {
  items: CompanyUser[];
  command: (item: CompanyUser) => void;
}

export const MentionSuggestion = forwardRef<MentionSuggestionRef, MentionSuggestionProps>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    useEffect(() => {
      setSelectedIndex(0);
    }, [items]);

    const selectItem = (index: number) => {
      const item = items[index];
      if (item) {
        command(item);
      }
    };

    useImperativeHandle(ref, () => ({
      onKeyDown: (event: KeyboardEvent) => {
        if (event.key === 'ArrowUp') {
          setSelectedIndex((selectedIndex + items.length - 1) % items.length);
          return true;
        }

        if (event.key === 'ArrowDown') {
          setSelectedIndex((selectedIndex + 1) % items.length);
          return true;
        }

        if (event.key === 'Enter') {
          selectItem(selectedIndex);
          return true;
        }

        return false;
      },
    }));

    if (items.length === 0) {
      return null;
    }

    return (
      <Card className="p-1 shadow-lg border border-border bg-background max-h-48 overflow-y-auto">
        {items.map((item, index) => (
          <MentionItem
            key={item.user_id}
            user={item}
            isSelected={index === selectedIndex}
            onClick={() => selectItem(index)}
          />
        ))}
      </Card>
    );
  }
);

MentionSuggestion.displayName = 'MentionSuggestion';