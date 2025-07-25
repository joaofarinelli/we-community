import { Editor } from '@tiptap/react';
import { Bold, Italic, Strikethrough } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { useEffect, useState, useRef } from 'react';

interface EditorBubbleMenuProps {
  editor: Editor;
}

export const EditorBubbleMenu = ({ editor }: EditorBubbleMenuProps) => {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [visible, setVisible] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updatePosition = () => {
      const { state, view } = editor;
      const { selection } = state;

      if (selection.empty) {
        setVisible(false);
        return;
      }

      const { from, to } = selection;
      const start = view.coordsAtPos(from);
      const end = view.coordsAtPos(to);
      
      // Calculate position above the selection
      const rect = {
        left: Math.min(start.left, end.left),
        top: Math.min(start.top, end.top),
        right: Math.max(start.right, end.right),
        bottom: Math.max(start.bottom, end.bottom),
      };

      setPosition({
        left: rect.left + (rect.right - rect.left) / 2,
        top: rect.top - 50, // Position above selection
      });
      setVisible(true);
    };

    const handleSelectionUpdate = () => {
      updatePosition();
    };

    editor.on('selectionUpdate', handleSelectionUpdate);
    editor.on('transaction', handleSelectionUpdate);

    return () => {
      editor.off('selectionUpdate', handleSelectionUpdate);
      editor.off('transaction', handleSelectionUpdate);
    };
  }, [editor]);

  if (!visible) return null;

  return (
    <div 
      ref={menuRef}
      className="fixed z-50 bg-background border border-border rounded-md shadow-lg p-1 flex gap-1"
      style={{
        left: `${position.left}px`,
        top: `${position.top}px`,
        transform: 'translateX(-50%)',
      }}
    >
      <Toggle
        size="sm"
        pressed={editor.isActive('bold')}
        onPressedChange={() => editor.chain().focus().toggleBold().run()}
        aria-label="Bold"
      >
        <Bold className="h-4 w-4" />
      </Toggle>
      
      <Toggle
        size="sm"
        pressed={editor.isActive('italic')}
        onPressedChange={() => editor.chain().focus().toggleItalic().run()}
        aria-label="Italic"
      >
        <Italic className="h-4 w-4" />
      </Toggle>
      
      <Toggle
        size="sm"
        pressed={editor.isActive('strike')}
        onPressedChange={() => editor.chain().focus().toggleStrike().run()}
        aria-label="Strike"
      >
        <Strikethrough className="h-4 w-4" />
      </Toggle>
    </div>
  );
};