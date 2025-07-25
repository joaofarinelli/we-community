import { Editor } from '@tiptap/react';
import { Bold, Italic, Strikethrough } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';

interface EditorBubbleMenuProps {
  editor: Editor;
}

export const EditorBubbleMenu = ({ editor }: EditorBubbleMenuProps) => {
  if (!editor) return null;

  return (
    <div 
      style={{
        position: 'absolute',
        zIndex: 50,
        background: 'var(--background)',
        border: '1px solid var(--border)',
        borderRadius: '6px',
        padding: '4px',
        display: 'flex',
        gap: '4px',
        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        visibility: editor.state.selection.empty ? 'hidden' : 'visible',
        opacity: editor.state.selection.empty ? 0 : 1,
        transform: 'translateY(-8px)',
        transition: 'opacity 150ms, visibility 150ms'
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