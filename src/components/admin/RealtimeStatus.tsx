import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Wifi, WifiOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export const RealtimeStatus = () => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Check initial connection status
    const checkConnection = () => {
      // @ts-ignore - accessing internal state for connection status
      const connectionState = supabase.realtime.connection?.connectionState;
      setIsConnected(connectionState === 'open');
    };

    checkConnection();

    // Set up listeners for connection state changes
    const channel = supabase.channel('connection-status');
    
    channel.subscribe((status) => {
      setIsConnected(status === 'SUBSCRIBED');
    });

    // Check connection every 30 seconds
    const interval = setInterval(checkConnection, 30000);

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge 
          variant={isConnected ? "default" : "secondary"} 
          className="flex items-center gap-1 cursor-help"
        >
          {isConnected ? (
            <>
              <Wifi className="w-3 h-3" />
              Real-time Ativo
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3" />
              Real-time Inativo
            </>
          )}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <p>
          {isConnected 
            ? "Atualizações em tempo real estão funcionando. Mudanças feitas por outros usuários aparecerão automaticamente."
            : "Atualizações em tempo real não estão disponíveis. Atualize a página manualmente para ver mudanças."
          }
        </p>
      </TooltipContent>
    </Tooltip>
  );
};