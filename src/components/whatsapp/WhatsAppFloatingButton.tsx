import { MessageCircle } from 'lucide-react';
import { useWhatsAppConfig } from '@/hooks/useWhatsAppConfig';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export const WhatsAppFloatingButton = () => {
  const { data: config, isLoading } = useWhatsAppConfig();

  // Don't render if loading, not enabled, or no phone number
  if (isLoading || !config?.whatsapp_enabled || !config?.whatsapp_phone) {
    return null;
  }

  const handleClick = () => {
    const phone = config.whatsapp_phone.replace(/[^0-9]/g, ''); // Remove non-digits
    const message = encodeURIComponent(config.whatsapp_message || 'Olá! Gostaria de saber mais informações.');
    const whatsappUrl = `https://wa.me/${phone}?text=${message}`;
    
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={handleClick}
            size="icon"
            className="fixed bottom-6 right-6 lg:bottom-8 lg:right-8 z-50 h-14 w-14 rounded-full bg-[#25D366] hover:bg-[#128C7E] text-white shadow-lg hover:shadow-xl transition-all duration-300 animate-fade-in"
            aria-label="Falar no WhatsApp"
          >
            <MessageCircle className="h-6 w-6" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left" className="mr-2">
          <p>Fale conosco no WhatsApp</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};