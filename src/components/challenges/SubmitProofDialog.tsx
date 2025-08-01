import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent } from '@/components/ui/card';
import { ImageUpload } from '@/components/ui/image-upload';
import { Input } from '@/components/ui/input';
import { Upload, FileText, Image, Type, Paperclip } from 'lucide-react';
import { useCreateSubmission } from '@/hooks/useChallengeSubmissions';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useFileUpload } from '@/hooks/useFileUpload';

interface SubmitProofDialogProps {
  participationId: string | null;
  challengeTitle: string;
  acceptedProofTypes: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SubmitProofDialog = ({ 
  participationId, 
  challengeTitle, 
  acceptedProofTypes,
  open, 
  onOpenChange 
}: SubmitProofDialogProps) => {
  const [submissionType, setSubmissionType] = useState<'text' | 'image' | 'file'>('text');
  const [textContent, setTextContent] = useState('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [fileData, setFileData] = useState<{
    url: string;
    name: string;
    size: number;
    type: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createSubmission = useCreateSubmission();
  const { uploadImage } = useImageUpload();
  const { uploadFile, isUploading } = useFileUpload({
    bucket: 'post-documents',
    maxSizeBytes: 50 * 1024 * 1024,
    allowedTypes: ['application/pdf', 'image/jpeg', 'image/png', 'text/plain']
  });

  const handleSubmit = async () => {
    if (!participationId) return;

    setIsSubmitting(true);
    try {
      let submissionData: any = {
        participationId,
        submissionType,
      };

      if (submissionType === 'text') {
        if (!textContent.trim()) {
          throw new Error('Por favor, insira o texto da prova');
        }
        submissionData.submissionContent = textContent;
      } else if (submissionType === 'image') {
        if (!imageUrl) {
          throw new Error('Por favor, selecione uma imagem');
        }
        submissionData.fileUrl = imageUrl;
        submissionData.fileName = 'prova-imagem.jpg';
        submissionData.mimeType = 'image/jpeg';
      } else if (submissionType === 'file') {
        if (!fileData) {
          throw new Error('Por favor, selecione um arquivo');
        }
        submissionData.fileUrl = fileData.url;
        submissionData.fileName = fileData.name;
        submissionData.fileSize = fileData.size;
        submissionData.mimeType = fileData.type;
      }

      await createSubmission.mutateAsync(submissionData);
      
      // Reset form
      setTextContent('');
      setImageUrl('');
      setFileData(null);
      onOpenChange(false);
    } catch (error: any) {
      console.error('Erro ao enviar prova:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageChange = (url: string) => {
    setImageUrl(url);
  };

  const handleImageRemove = () => {
    setImageUrl('');
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const url = await uploadFile(file);
    if (url) {
      setFileData({
        url,
        name: file.name,
        size: file.size,
        type: file.type
      });
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!participationId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Enviar Prova - {challengeTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Proof Type Selection */}
          <div>
            <Label className="text-base font-medium mb-3 block">
              Tipo de Prova
            </Label>
            <RadioGroup 
              value={submissionType} 
              onValueChange={(value) => setSubmissionType(value as 'text' | 'image' | 'file')}
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              {acceptedProofTypes.includes('text') && (
                <div>
                  <RadioGroupItem value="text" id="text" className="peer sr-only" />
                  <Label 
                    htmlFor="text"
                    className="flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent/50 peer-checked:border-primary peer-checked:bg-primary/5"
                  >
                    <Type className="h-8 w-8 mb-2 text-muted-foreground" />
                    <span className="font-medium">Texto</span>
                    <span className="text-sm text-muted-foreground">Descrição escrita</span>
                  </Label>
                </div>
              )}

              {acceptedProofTypes.includes('image') && (
                <div>
                  <RadioGroupItem value="image" id="image" className="peer sr-only" />
                  <Label 
                    htmlFor="image"
                    className="flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent/50 peer-checked:border-primary peer-checked:bg-primary/5"
                  >
                    <Image className="h-8 w-8 mb-2 text-muted-foreground" />
                    <span className="font-medium">Imagem</span>
                    <span className="text-sm text-muted-foreground">Foto ou imagem</span>
                  </Label>
                </div>
              )}

              {acceptedProofTypes.includes('file') && (
                <div>
                  <RadioGroupItem value="file" id="file" className="peer sr-only" />
                  <Label 
                    htmlFor="file"
                    className="flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent/50 peer-checked:border-primary peer-checked:bg-primary/5"
                  >
                    <FileText className="h-8 w-8 mb-2 text-muted-foreground" />
                    <span className="font-medium">Arquivo</span>
                    <span className="text-sm text-muted-foreground">Documento ou arquivo</span>
                  </Label>
                </div>
              )}
            </RadioGroup>
          </div>

          {/* Content Input */}
          <Card>
            <CardContent className="p-4">
              {submissionType === 'text' && (
                <div>
                  <Label htmlFor="text-content" className="text-base font-medium mb-2 block">
                    Descrição da Prova
                  </Label>
                  <Textarea
                    id="text-content"
                    placeholder="Descreva detalhadamente como você completou o desafio..."
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    rows={6}
                    className="min-h-[120px]"
                  />
                </div>
              )}

              {submissionType === 'image' && (
                <div>
                  <Label className="text-base font-medium mb-2 block">
                    Imagem da Prova
                  </Label>
                  <ImageUpload
                    value={imageUrl}
                    onChange={handleImageChange}
                    onRemove={handleImageRemove}
                    bucketName="post-images"
                    maxSizeKB={5120}
                  />
                </div>
              )}

              {submissionType === 'file' && (
                <div>
                  <Label className="text-base font-medium mb-2 block">
                    Arquivo da Prova
                  </Label>
                  <div className="space-y-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="w-full justify-start"
                    >
                      {isUploading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Paperclip className="h-4 w-4 mr-2" />
                          Selecionar arquivo
                        </>
                      )}
                    </Button>
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    {fileData && (
                      <div className="p-3 bg-accent rounded-lg">
                        <p className="text-sm font-medium">{fileData.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(fileData.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting || (
                (submissionType === 'text' && !textContent.trim()) ||
                (submissionType === 'image' && !imageUrl) ||
                (submissionType === 'file' && !fileData)
              )}
            >
              {isSubmitting ? 'Enviando...' : 'Enviar Prova'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};