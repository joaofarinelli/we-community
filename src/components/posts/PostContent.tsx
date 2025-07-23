import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Mention from '@tiptap/extension-mention';
import { cn } from '@/lib/utils';

interface PostContentProps {
  content: string;
  className?: string;
}

export const PostContent = ({ content, className }: PostContentProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
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
          'focus:outline-none',
          className
        ),
      },
    },
  });

  return (
    <div className="w-full">
      <EditorContent editor={editor} />
    </div>
  );
};