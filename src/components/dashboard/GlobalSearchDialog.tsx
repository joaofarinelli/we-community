import { useState } from 'react';
import { Search, FileText, MessageCircle, User, BookOpen, FolderOpen, PlayCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useGlobalSearch, SearchResult } from '@/hooks/useGlobalSearch';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface GlobalSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const GlobalSearchDialog = ({ open, onOpenChange }: GlobalSearchDialogProps) => {
  const [query, setQuery] = useState('');
  const { data: results = [], isLoading } = useGlobalSearch(query);
  const navigate = useNavigate();

  const getTypeIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'post':
        return <FileText className="h-4 w-4" />;
      case 'comment':
        return <MessageCircle className="h-4 w-4" />;
      case 'user':
        return <User className="h-4 w-4" />;
      case 'course':
        return <BookOpen className="h-4 w-4" />;
      case 'module':
        return <FolderOpen className="h-4 w-4" />;
      case 'lesson':
        return <PlayCircle className="h-4 w-4" />;
      default:
        return <Search className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: SearchResult['type']) => {
    switch (type) {
      case 'post':
        return 'Post';
      case 'comment':
        return 'Comentário';
      case 'user':
        return 'Usuário';
      case 'course':
        return 'Curso';
      case 'module':
        return 'Módulo';
      case 'lesson':
        return 'Aula';
      default:
        return 'Item';
    }
  };

  const getTypeColor = (type: SearchResult['type']) => {
    switch (type) {
      case 'post':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'comment':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'user':
        return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      case 'course':
        return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
      case 'module':
        return 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20';
      case 'lesson':
        return 'bg-pink-500/10 text-pink-600 border-pink-500/20';
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  const handleResultClick = (result: SearchResult) => {
    if (result.url) {
      navigate(result.url);
      onOpenChange(false);
      setQuery('');
    } else {
      toast.info('Link não disponível para este item.');
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
    if (!newOpen) {
      setQuery('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Pesquisar na comunidade
          </DialogTitle>
        </DialogHeader>
        
        <div className="px-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Tente pesquisar por palavras-chave em publicações, comentários, eventos, aulas, espaços e muito mais..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 pr-4 h-12 text-base bg-muted/30 border-border/50"
              autoFocus
            />
          </div>
        </div>

        <div className="px-6 pb-2">
          <p className="text-sm text-muted-foreground">
            Busque por conteúdo, pessoas e cursos na sua comunidade
          </p>
        </div>

        {query.length >= 2 && (
          <ScrollArea className="max-h-96 px-6 pb-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : results.length > 0 ? (
              <div className="space-y-2">
                {results.map((result) => (
                  <div
                    key={`${result.type}-${result.id}`}
                    className="flex items-start gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handleResultClick(result)}
                  >
                    <div className="flex-shrink-0 mt-1">
                      {getTypeIcon(result.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="font-medium text-sm line-clamp-1">
                          {result.title}
                        </h4>
                        <Badge 
                          variant="outline" 
                          className={`text-xs flex-shrink-0 ${getTypeColor(result.type)}`}
                        >
                          {getTypeLabel(result.type)}
                        </Badge>
                      </div>
                      
                      {result.content && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {result.content}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {result.author && (
                          <span>{result.author}</span>
                        )}
                        {result.created_at && (
                          <span>
                            {format(new Date(result.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Search className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground">
                  Nenhum resultado encontrado para "{query}"
                </p>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  Tente usar palavras-chave diferentes
                </p>
              </div>
            )}
          </ScrollArea>
        )}

        {query.length < 2 && query.length > 0 && (
          <div className="px-6 pb-6">
            <p className="text-center text-muted-foreground text-sm">
              Digite pelo menos 2 caracteres para buscar
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};