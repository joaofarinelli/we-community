import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PenTool, Clock, BookOpen, ChevronRight, Search } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface LessonNote {
  id: string;
  lesson_id: string;
  content: string;
  timestamp_seconds: number | null;
  created_at: string;
  updated_at: string;
  lesson: {
    id: string;
    title: string;
    module_id: string;
    module: {
      title: string;
      course_id: string;
      course: {
        title: string;
        thumbnail_url: string;
      };
    };
  };
}

export const LessonNotesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: lessonNotes, isLoading } = useQuery({
    queryKey: ['lesson-notes', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // First get the notes
      const { data: notes, error: notesError } = await supabase
        .from('lesson_notes')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (notesError) {
        console.error('Error fetching lesson notes:', notesError);
        return [];
      }

      if (!notes || notes.length === 0) return [];

      // Then get lesson details for each note
      const lessonIds = notes.map(note => note.lesson_id);
      const { data: lessons, error: lessonsError } = await supabase
        .from('course_lessons')
        .select(`
          id,
          title,
          module_id,
          course_modules!inner(
            title,
            course_id,
            courses!inner(
              title,
              thumbnail_url
            )
          )
        `)
        .in('id', lessonIds);

      if (lessonsError) {
        console.error('Error fetching lessons:', lessonsError);
        return [];
      }

      // Combine notes with lesson data
      const combinedData = notes.map(note => {
        const lesson = lessons?.find(l => l.id === note.lesson_id);
        return {
          ...note,
          lesson: lesson ? {
            id: lesson.id,
            title: lesson.title,
            module_id: lesson.module_id,
            module: {
              title: (lesson.course_modules as any)?.title,
              course_id: (lesson.course_modules as any)?.course_id,
              course: {
                title: (lesson.course_modules as any)?.courses?.[0]?.title || ''
              }
            }
          } : null
        };
      }).filter(note => note.lesson) as LessonNote[];

      return combinedData;
    },
    enabled: !!user?.id,
  });

  const filteredNotes = lessonNotes?.filter(note =>
    note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.lesson.module.course.title.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleNoteClick = (note: LessonNote) => {
    const timestamp = note.timestamp_seconds ? `?t=${note.timestamp_seconds}` : '';
    navigate(`/courses/${note.lesson.module.course_id}/modules/${note.lesson.module_id}/lessons/${note.lesson_id}${timestamp}`);
  };

  const formatTimestamp = (seconds: number | null) => {
    if (!seconds) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 rounded-lg">
            <PenTool className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Minhas Anotações</h1>
            <p className="text-muted-foreground">Suas anotações feitas nas aulas</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar nas anotações..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {isLoading ? (
          <div className="grid gap-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <Skeleton className="h-12 w-12 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-16 w-full" />
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : filteredNotes.length > 0 ? (
          <div className="grid gap-4">
            {filteredNotes.map((note) => (
              <Card key={note.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      {note.lesson.module.course.thumbnail_url ? (
                        <img
                          src={note.lesson.module.course.thumbnail_url}
                          alt={note.lesson.module.course.title}
                          className="h-full w-full object-cover rounded-lg"
                        />
                      ) : (
                        <BookOpen className="h-6 w-6 text-primary" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-foreground">
                            {note.lesson.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {note.lesson.module.course.title} • {note.lesson.module.title}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {note.timestamp_seconds && (
                            <Badge variant="outline" className="text-xs">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatTimestamp(note.timestamp_seconds)}
                            </Badge>
                          )}
                          <span>{new Date(note.updated_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <div className="bg-muted/50 p-3 rounded-lg mt-2">
                        <p className="text-sm text-foreground">
                          {truncateContent(note.content)}
                        </p>
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleNoteClick(note)}
                      className="flex-shrink-0"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <div className="p-4 bg-muted rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <PenTool className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                {searchTerm ? 'Nenhuma anotação encontrada' : 'Nenhuma anotação ainda'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm 
                  ? `Não encontramos anotações com "${searchTerm}".`
                  : 'Quando você fizer anotações nas aulas, elas aparecerão aqui.'
                }
              </p>
              {searchTerm ? (
                <Button variant="outline" onClick={() => setSearchTerm('')}>
                  Limpar busca
                </Button>
              ) : (
                <Button onClick={() => navigate('/dashboard/courses')}>
                  Explorar Cursos
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};