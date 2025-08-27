import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Editor } from '@tiptap/react';

interface LinkDialogProps {
  editor: Editor;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const LinkDialog = ({ editor, open, onOpenChange }: LinkDialogProps) => {
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');

  useEffect(() => {
    if (open) {
      const { from, to } = editor.state.selection;
      const selectedText = editor.state.doc.textBetween(from, to);
      const href = editor.getAttributes('link').href;
      
      setText(selectedText || '');
      setUrl(href || '');
    }
  }, [open, editor]);

  const handleSave = () => {
    if (!url) return;

    const normalizedUrl = normalizeUrl(url);
    const hasSelection = editor.state.selection.from !== editor.state.selection.to;

    if (hasSelection) {
      // Apply link to selected text
      editor.chain().focus().setLink({ href: normalizedUrl }).run();
    } else if (text) {
      // Insert new text with link
      editor.chain().focus().insertContent(`<a href="${normalizedUrl}">${text}</a> `).run();
    } else {
      // No text selected or provided, insert URL as text with link
      editor.chain().focus().insertContent(`<a href="${normalizedUrl}">${normalizedUrl}</a> `).run();
    }

    handleClose();
  };

  const handleRemoveLink = () => {
    editor.chain().focus().unsetLink().run();
    handleClose();
  };

  const handleClose = () => {
    setUrl('');
    setText('');
    onOpenChange(false);
  };

  const isValidUrl = (string: string) => {
    if (!string.trim()) return false;
    
    // Allow relative URLs, absolute URLs, email, and tel links
    if (string.startsWith('/') || 
        string.startsWith('mailto:') || 
        string.startsWith('tel:') ||
        string.startsWith('#')) {
      return true;
    }
    
    // Add protocol if missing and try to validate
    let urlToTest = string;
    if (!string.match(/^https?:\/\//)) {
      urlToTest = `https://${string}`;
    }
    
    try {
      new URL(urlToTest);
      return true;
    } catch (_) {
      return false;
    }
  };

  const normalizeUrl = (url: string) => {
    if (!url) return '';
    
    // Don't modify special protocols or relative URLs
    if (url.startsWith('mailto:') || 
        url.startsWith('tel:') || 
        url.startsWith('/') || 
        url.startsWith('#') ||
        url.startsWith('http://') || 
        url.startsWith('https://')) {
      return url;
    }
    
    // Add https:// prefix for regular URLs
    return `https://${url}`;
  };

  const hasLink = editor.getAttributes('link').href;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {hasLink ? 'Editar Link' : 'Adicionar Link'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="link-url">URL</Label>
            <Input
              id="link-url"
              type="url"
              placeholder="https://exemplo.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSave();
                }
              }}
            />
          </div>
          
          {editor.state.selection.from === editor.state.selection.to && (
            <div className="space-y-2">
              <Label htmlFor="link-text">Texto do Link (opcional)</Label>
              <Input
                id="link-text"
                type="text"
                placeholder="Texto que será exibido"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSave();
                  }
                }}
              />
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          {hasLink && (
            <Button
              variant="outline"
              onClick={handleRemoveLink}
              className="mr-auto"
            >
              Remover Link
            </Button>
          )}
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!url || !isValidUrl(url)}
          >
            {hasLink ? 'Atualizar' : 'Adicionar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};