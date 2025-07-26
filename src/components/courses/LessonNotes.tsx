import { useState } from 'react';
import { useLessonNotes, useCreateLessonNote, useUpdateLessonNote, useDeleteLessonNote } from '@/hooks/useLessonNotes';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Plus, Edit2, Trash2, Save, X, StickyNote } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface LessonNotesProps {
  lessonId: string;
}

export const LessonNotes = ({ lessonId }: LessonNotesProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [editContent, setEditContent] = useState('');

  const { data: notes, isLoading } = useLessonNotes(lessonId);
  const createNote = useCreateLessonNote();
  const updateNote = useUpdateLessonNote();
  const deleteNote = useDeleteLessonNote();

  const handleCreateNote = async () => {
    if (!newNoteContent.trim()) return;
    
    await createNote.mutateAsync({
      lessonId,
      content: newNoteContent.trim()
    });
    
    setNewNoteContent('');
    setIsCreating(false);
  };

  const handleEditNote = (noteId: string, currentContent: string) => {
    setEditingId(noteId);
    setEditContent(currentContent);
  };

  const handleUpdateNote = async (noteId: string) => {
    if (!editContent.trim()) return;
    
    await updateNote.mutateAsync({
      noteId,
      lessonId,
      content: editContent.trim()
    });
    
    setEditingId(null);
    setEditContent('');
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta anotação?')) return;
    
    await deleteNote.mutateAsync({ noteId, lessonId });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent('');
    setIsCreating(false);
    setNewNoteContent('');
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Create new note */}
      {!isCreating ? (
        <Button
          onClick={() => setIsCreating(true)}
          variant="outline"
          className="w-full justify-start gap-2"
        >
          <Plus className="h-4 w-4" />
          Adicionar nova anotação
        </Button>
      ) : (
        <Card className="p-4">
          <Textarea
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            placeholder="Digite sua anotação aqui..."
            className="min-h-20 mb-3"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleCreateNote}
              disabled={!newNoteContent.trim() || createNote.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              Salvar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={cancelEdit}
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
          </div>
        </Card>
      )}

      {/* Existing notes */}
      {notes && notes.length > 0 ? (
        <div className="space-y-3">
          {notes.map((note) => (
            <Card key={note.id} className="p-4">
              {editingId === note.id ? (
                <>
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="min-h-20 mb-3"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleUpdateNote(note.id)}
                      disabled={!editContent.trim() || updateNote.isPending}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Salvar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={cancelEdit}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="mb-3">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {note.content}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(note.created_at), {
                        addSuffix: true,
                        locale: ptBR
                      })}
                    </p>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditNote(note.id, note.content)}
                        className="h-8 px-2"
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteNote(note.id)}
                        className="h-8 px-2 text-destructive hover:text-destructive"
                        disabled={deleteNote.isPending}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </Card>
          ))}
        </div>
      ) : (
        !isCreating && (
          <div className="text-center py-8">
            <StickyNote className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Você ainda não tem anotações para esta aula.
            </p>
          </div>
        )
      )}
    </div>
  );
};
