import { useState } from 'react';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Smile } from 'lucide-react';

interface EmojiPickerComponentProps {
  value?: string;
  onChange: (emoji: string) => void;
  placeholder?: string;
}

export const EmojiPickerComponent = ({ value, onChange, placeholder = "Selecionar emoji" }: EmojiPickerComponentProps) => {
  const [open, setOpen] = useState(false);

  const onEmojiClick = (emojiData: EmojiClickData) => {
    onChange(emojiData.emoji);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
          {value ? (
            <span className="text-lg mr-2">{value}</span>
          ) : (
            <Smile className="h-4 w-4 mr-2" />
          )}
          {value ? value : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 border-0">
        <EmojiPicker onEmojiClick={onEmojiClick} />
      </PopoverContent>
    </Popover>
  );
};