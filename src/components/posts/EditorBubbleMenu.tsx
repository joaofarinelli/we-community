import { Editor } from '@tiptap/react';
import { Bold, Italic, Strikethrough } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { useEffect, useState, useRef, useCallback } from 'react';

interface EditorBubbleMenuProps {
  editor: Editor;
}

export const EditorBubbleMenu = ({ editor }: EditorBubbleMenuProps) => {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [visible, setVisible] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    const { state, view } = editor;
    const { selection } = state;

    if (selection.empty) {
      setVisible(false);
      return;
    }

    const { from, to } = selection;
    const start = view.coordsAtPos(from);
    const end = view.coordsAtPos(to);
    
    // Get editor container position
    const editorElement = view.dom;
    const editorRect = editorElement.getBoundingClientRect();
    
    // Calculate selection rectangle relative to viewport
    const selectionRect = {
      left: Math.min(start.left, end.left),
      top: Math.min(start.top, end.top),
      right: Math.max(start.right, end.right),
      bottom: Math.max(start.bottom, end.bottom),
    };

    // Calculate center position of selection
    const centerX = selectionRect.left + (selectionRect.right - selectionRect.left) / 2;
    let menuTop = selectionRect.top - 60; // Position above selection
    
    // Check viewport boundaries
    const menuWidth = 150; // Approximate menu width
    const menuHeight = 40; // Approximate menu height
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Adjust horizontal position to stay within viewport
    let menuLeft = centerX;
    if (centerX - menuWidth / 2 < 10) {
      menuLeft = menuWidth / 2 + 10;
    } else if (centerX + menuWidth / 2 > viewportWidth - 10) {
      menuLeft = viewportWidth - menuWidth / 2 - 10;
    }
    
    // If menu would be above viewport, show below selection
    if (menuTop < 10) {
      menuTop = selectionRect.bottom + 10;
    }
    
    // If menu would be below viewport, force above selection
    if (menuTop + menuHeight > viewportHeight - 10) {
      menuTop = selectionRect.top - 60;
    }

    setPosition({
      left: menuLeft,
      top: menuTop,
    });
    setVisible(true);
  }, [editor]);

  // Debounce function to optimize performance
  const debounce = useCallback((func: () => void, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(func, delay);
    };
  }, []);

  const debouncedUpdatePosition = useCallback(
    debounce(updatePosition, 16), // ~60fps
    [debounce, updatePosition]
  );

  useEffect(() => {
    const handleSelectionUpdate = () => {
      updatePosition();
    };

    const handleScroll = () => {
      if (visible) {
        debouncedUpdatePosition();
      }
    };

    const handleResize = () => {
      if (visible) {
        updatePosition();
      }
    };

    // Editor events
    editor.on('selectionUpdate', handleSelectionUpdate);
    editor.on('transaction', handleSelectionUpdate);
    
    // Window events for positioning updates
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);

    return () => {
      editor.off('selectionUpdate', handleSelectionUpdate);
      editor.off('transaction', handleSelectionUpdate);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [editor, updatePosition, debouncedUpdatePosition, visible]);

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