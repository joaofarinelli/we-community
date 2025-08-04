import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Image, Paperclip } from 'lucide-react';
import { useFileUpload } from '@/hooks/useFileUpload';

interface ChatAttachmentButtonProps {
  onAttachmentUpload: (url: string, name: string, type: 'image' | 'document') => void;
  type: 'image' | 'document';
}

export const ChatAttachmentButton = ({ onAttachmentUpload, type }: ChatAttachmentButtonProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { uploadFile, isUploading } = useFileUpload({
    bucket: type === 'image' ? 'chat-images' : 'chat-documents',
    maxSizeBytes: type === 'image' ? 10 * 1024 * 1024 : 50 * 1024 * 1024, // 10MB for images, 50MB for documents
    allowedTypes: type === 'image' 
      ? ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      : [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'text/plain',
        ],
  });

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const url = await uploadFile(file);
    if (url) {
      onAttachmentUpload(url, file.name, type);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const acceptTypes = type === 'image' 
    ? 'image/jpeg,image/png,image/gif,image/webp'
    : '.pdf,.doc,.docx,.xls,.xlsx,.txt';

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleClick}
        disabled={isUploading}
        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
      >
        {type === 'image' ? <Image className="h-4 w-4" /> : <Paperclip className="h-4 w-4" />}
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptTypes}
        onChange={handleFileSelect}
        className="hidden"
      />
    </>
  );
};