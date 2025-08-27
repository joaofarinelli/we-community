import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import ResizeImage from 'tiptap-extension-resize-image';
import Mention from '@tiptap/extension-mention';
import BubbleMenuExtension from '@tiptap/extension-bubble-menu';
import { ReactRenderer } from '@tiptap/react';
import tippy from 'tippy.js';
import { cn } from '@/lib/utils';
import { useCompanyUsers, CompanyUser } from '@/hooks/useCompanyUsers';
import { MentionSuggestion, MentionSuggestionRef } from './MentionSuggestion';
import { EditorBubbleMenu } from './EditorBubbleMenu';
import { useState, useImperativeHandle, forwardRef, useEffect } from 'react';

export interface TipTapEditorRef {
  insertEmoji: (emoji: string) => void;
  insertImage: (url: string, alt?: string) => void;
  insertDocument: (url: string, name: string) => void;
}

interface TipTapEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
}

export const TipTapEditor = forwardRef<TipTapEditorRef, TipTapEditorProps>(({ 
  content, 
  onChange, 
  placeholder = "Escreva algo...", 
  className 
}, ref) => {
  const [mentionQuery, setMentionQuery] = useState('');
  const { data: users = [] } = useCompanyUsers(mentionQuery);

  const editor = useEditor({
    extensions: [
      StarterKit,
      BubbleMenuExtension,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline hover:text-primary/80 transition-colors cursor-pointer',
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
      ResizeImage.configure({
        HTMLAttributes: {
          class: 'max-w-full max-h-[60vh] h-auto rounded-lg object-contain',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Mention.configure({
        HTMLAttributes: {
          class: 'mention bg-primary/10 text-primary px-1 py-0.5 rounded font-medium',
        },
        suggestion: {
          items: ({ query }: { query: string }) => {
            setMentionQuery(query);
            return users.filter((user: CompanyUser) =>
              `${user.first_name} ${user.last_name}`
                .toLowerCase()
                .includes(query.toLowerCase())
            ).slice(0, 5);
          },
          render: () => {
            let component: ReactRenderer<MentionSuggestionRef>;
            let popup: any;

            return {
              onStart: (props: any) => {
                component = new ReactRenderer(MentionSuggestion, {
                  props,
                  editor: props.editor,
                });

                if (!props.clientRect) {
                  return;
                }

                popup = tippy('body', {
                  getReferenceClientRect: props.clientRect,
                  appendTo: () => document.body,
                  content: component.element,
                  showOnCreate: true,
                  interactive: true,
                  trigger: 'manual',
                  placement: 'bottom-start',
                });
              },

              onUpdate(props: any) {
                component.updateProps(props);

                if (!props.clientRect) {
                  return;
                }

                popup[0].setProps({
                  getReferenceClientRect: props.clientRect,
                });
              },

              onKeyDown(props: any) {
                if (props.event.key === 'Escape') {
                  popup[0].hide();
                  return true;
                }

                return component.ref?.onKeyDown(props.event);
              },

              onExit() {
                popup[0].destroy();
                component.destroy();
              },
            };
          },
        },
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none',
          'min-h-[200px] p-4',
          className
        ),
      },
    },
  });

  // Sync content when prop changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);
  useImperativeHandle(ref, () => ({
    insertEmoji: (emoji: string) => {
      if (editor) {
        editor.chain().focus().insertContent(`<span class="apple-emoji">${emoji}</span>`).run();
      }
    },
    insertImage: (url: string, alt?: string) => {
      if (editor) {
        editor.chain().focus().setImage({ 
          src: url, 
          alt: alt || ''
        }).run();
      }
    },
    insertDocument: (url: string, name: string) => {
      if (editor) {
        const linkHtml = `<a href="${url}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 px-3 py-2 bg-muted rounded-md text-sm font-medium hover:bg-muted/80 transition-colors">
          <span class="apple-emoji">📎</span> ${name}
        </a>`;
        editor.chain().focus().insertContent(linkHtml).run();
      }
    },
  }));

  return (
    <div className="w-full relative">
      {editor && <EditorBubbleMenu editor={editor} />}
      <EditorContent 
        editor={editor} 
        className="w-full min-h-[200px] border-none outline-none"
      />
    </div>
  );
});