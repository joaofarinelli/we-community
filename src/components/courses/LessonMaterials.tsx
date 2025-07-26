import { useLessonMaterials } from '@/hooks/useLessonMaterials';
import { Button } from '@/components/ui/button';
import { Download, FileText, Image, Video, File } from 'lucide-react';
import { formatBytes } from '@/lib/utils';

interface LessonMaterialsProps {
  lessonId: string;
}

export const LessonMaterials = ({ lessonId }: LessonMaterialsProps) => {
  const { data: materials, isLoading } = useLessonMaterials(lessonId);

  const getFileIcon = (fileType: string | null) => {
    if (!fileType) return File;
    
    if (fileType.startsWith('image/')) return Image;
    if (fileType.startsWith('video/')) return Video;
    if (fileType.includes('pdf') || fileType.includes('document')) return FileText;
    
    return File;
  };

  const handleDownload = (fileUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (!materials || materials.length === 0) {
    return (
      <div className="text-center py-8">
        <File className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Nenhum material disponível para esta aula.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {materials.map((material) => {
        const FileIcon = getFileIcon(material.file_type);
        
        return (
          <div
            key={material.id}
            className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">{material.title}</p>
                {material.file_size && (
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(material.file_size)}
                  </p>
                )}
              </div>
            </div>
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDownload(material.file_url, material.title)}
              className="h-8 px-3"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        );
      })}
    </div>
  );
};