import { useState } from 'react';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Smile } from 'lucide-react';

interface EditorEmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
}

export const EditorEmojiPicker = ({ onEmojiSelect }: EditorEmojiPickerProps) => {
  const [open, setOpen] = useState(false);

  const onEmojiClick = (emojiData: EmojiClickData) => {
    onEmojiSelect(emojiData.emoji);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
        >
          <Smile className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 border-0 bg-background shadow-lg" align="start">
        <EmojiPicker onEmojiClick={onEmojiClick} />
      </PopoverContent>
    </Popover>
  );
};