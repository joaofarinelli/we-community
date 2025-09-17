import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Mention from '@tiptap/extension-mention';
import ResizeImage from 'tiptap-extension-resize-image';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { ImageViewerDialog } from './ImageViewerDialog';

interface PostContentProps {
  content: string;
  className?: string;
}

export const PostContent = ({ content, className }: PostContentProps) => {
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState('');

  const editor = useEditor({
    extensions: [
      StarterKit,
      ResizeImage,
      Link.configure({
        openOnClick: true,
        HTMLAttributes: {
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
      Mention.configure({
        HTMLAttributes: {
          class: 'mention bg-primary/10 text-primary px-1 py-0.5 rounded font-medium cursor-pointer',
        },
        renderHTML({ options, node }) {
          return [
            'span',
            {
              ...options.HTMLAttributes,
              'data-type': 'mention',
              'data-id': node.attrs.id,
            },
            `@${node.attrs.label || node.attrs.id}`,
          ];
        },
      }),
    ],
    content,
    editable: false,
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm max-w-none',
          'prose-headings:text-foreground',
          'prose-p:text-foreground prose-p:leading-relaxed',
          'prose-strong:text-foreground prose-strong:font-semibold',
          'prose-em:text-foreground',
          'prose-ul:text-foreground prose-ol:text-foreground',
          'prose-li:text-foreground',
          'prose-a:text-primary hover:prose-a:text-primary/80',
          'prose-blockquote:text-muted-foreground prose-blockquote:border-border',
          'prose-code:text-foreground prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded',
          '[&_.apple-emoji]:font-emoji',
          '[&_img]:cursor-pointer [&_img]:rounded-lg [&_img]:transition-all [&_img]:hover:opacity-80',
          'focus:outline-none',
          className
        ),
      },
    },
  });

  // Add click handler for images
  useEffect(() => {
    if (!editor) return;

    const handleImageClick = (event: Event) => {
      const target = event.target as HTMLElement;
      console.log('Click detected on:', target.tagName, target);
      
      if (target.tagName === 'IMG') {
        const img = target as HTMLImageElement;
        console.log('Image clicked, src:', img.src);
        console.log('Image alt:', img.alt);
        setSelectedImageUrl(img.src);
        setImageViewerOpen(true);
        event.preventDefault();
        event.stopPropagation();
      }
    };

    const editorElement = editor.view.dom;
    editorElement.addEventListener('click', handleImageClick);

    return () => {
      editorElement.removeEventListener('click', handleImageClick);
    };
  }, [editor]);

  // Update editor content when content prop changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [editor, content]);

  return (
    <div className="w-full" data-post-content>
      <EditorContent editor={editor} />
      
      <ImageViewerDialog
        open={imageViewerOpen}
        onOpenChange={setImageViewerOpen}
        imageUrl={selectedImageUrl}
        alt="Imagem do post"
      />
    </div>
  );
};