import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, X, FileText } from 'lucide-react';
import { useFileUpload } from '@/hooks/useFileUpload';

interface DocumentUploaderProps {
  value?: string;
  onChange: (url: string | null) => void;
  label?: string;
  className?: string;
}

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({
  value,
  onChange,
  label = 'Documento de Orientação',
  className = ''
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const { uploadFile, isUploading } = useFileUpload({
    bucket: 'post-documents',
    maxSizeBytes: 50 * 1024 * 1024, // 50MB
    allowedTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
    ],
  });

  const getFileName = (url: string) => {
    return url.split('/').pop() || 'documento.pdf';
  };

  const handleFileSelect = async (file: File) => {
    const url = await uploadFile(file);
    if (url) {
      onChange(url);
    }
  };

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    
    const file = event.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemove = () => {
    onChange(null);
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Label>{label}</Label>
      
      {value ? (
        <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{getFileName(value)}</p>
              <p className="text-xs text-muted-foreground">Documento carregado</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => window.open(value, '_blank')}
            >
              Visualizar
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRemove}
              disabled={isUploading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            dragOver 
              ? 'border-primary bg-primary/5' 
              : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="flex flex-col items-center gap-3">
            {isUploading ? (
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            ) : (
              <FileText className="h-10 w-10 text-muted-foreground" />
            )}
            <div>
              <p className="font-medium">
                {isUploading ? 'Enviando...' : 'Clique ou arraste um documento'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                PDF, DOC, DOCX, XLS, XLSX, TXT até 50MB
              </p>
            </div>
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              disabled={isUploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              Selecionar Arquivo
            </Button>
          </div>
        </div>
      )}
      
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain"
        onChange={handleFileInput}
        className="hidden"
      />
    </div>
  );
};