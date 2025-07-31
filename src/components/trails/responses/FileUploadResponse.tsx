import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Upload, X, FileText } from 'lucide-react';
import { useFileUpload } from '@/hooks/useFileUpload';
import { toast } from 'sonner';

interface FileUploadResponseProps {
  question: string;
  allowMultipleFiles: boolean;
  maxFileSizeMB: number;
  allowedFileTypes: string[];
  existingResponse?: any;
  onSubmit: (responseData: any) => void;
  isSubmitting: boolean;
}

export const FileUploadResponse = ({
  question,
  allowMultipleFiles,
  maxFileSizeMB,
  allowedFileTypes,
  existingResponse,
  onSubmit,
  isSubmitting,
}: FileUploadResponseProps) => {
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ url: string; name: string }>>([]);
  const { uploadFile, isUploading } = useFileUpload({
    bucket: 'post-documents',
    maxSizeBytes: maxFileSizeMB * 1024 * 1024,
    allowedTypes: allowedFileTypes.length > 0 ? allowedFileTypes : undefined
  });

  useEffect(() => {
    if (existingResponse?.file_urls) {
      const files = existingResponse.file_urls.map((url: string, index: number) => ({
        url,
        name: `Arquivo ${index + 1}`
      }));
      setUploadedFiles(files);
    }
  }, [existingResponse]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      try {
        const url = await uploadFile(file);
        if (url) {
          if (allowMultipleFiles) {
            setUploadedFiles(prev => [...prev, { url, name: file.name }]);
          } else {
            setUploadedFiles([{ url, name: file.name }]);
          }
        }
      } catch (error) {
        toast.error(`Erro ao enviar ${file.name}`);
      }
    }
    
    // Reset input
    event.target.value = '';
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (uploadedFiles.length === 0) return;
    
    onSubmit({
      fileUrls: uploadedFiles.map(file => file.url),
      responseData: {
        fileNames: uploadedFiles.map(file => file.name)
      }
    });
  };

  const acceptedTypes = allowedFileTypes.length > 0 
    ? allowedFileTypes.map(type => `.${type}`).join(',')
    : undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Envio de Arquivo</CardTitle>
        {question && (
          <p className="text-muted-foreground">{question}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Input
            type="file"
            accept={acceptedTypes}
            multiple={allowMultipleFiles}
            onChange={handleFileSelect}
            disabled={isUploading || (!allowMultipleFiles && uploadedFiles.length > 0)}
          />
          
          <div className="text-sm text-muted-foreground">
            <p>Tamanho máximo: {maxFileSizeMB}MB</p>
            {allowedFileTypes.length > 0 && (
              <p>Tipos permitidos: {allowedFileTypes.join(', ')}</p>
            )}
            {allowMultipleFiles && <p>Múltiplos arquivos permitidos</p>}
          </div>
        </div>

        {uploadedFiles.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Arquivos enviados:</h4>
            {uploadedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 border rounded">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm">{file.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
        
        <Button
          onClick={handleSubmit}
          disabled={uploadedFiles.length === 0 || isSubmitting}
          className="flex items-center gap-2"
        >
          <Send className="h-4 w-4" />
          {isSubmitting ? 'Salvando...' : 'Enviar Resposta'}
        </Button>

        {isUploading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Upload className="h-4 w-4 animate-spin" />
            Enviando arquivo...
          </div>
        )}
      </CardContent>
    </Card>
  );
};