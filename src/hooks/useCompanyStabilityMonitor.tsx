import { useEffect, useRef } from 'react';
import { getGlobalCompanyId } from '@/integrations/supabase/enhanced-client';
import { useCompanyContext } from './useCompanyContext';

/**
 * Hook para monitorar a estabilidade do x-company-id header
 * Detecta quando o header fica instável ou "flutua"
 */
export const useCompanyStabilityMonitor = () => {
  const { currentCompanyId } = useCompanyContext();
  const stabilityLogRef = useRef<string[]>([]);
  const lastLogTime = useRef<number>(0);

  useEffect(() => {
    const checkStability = () => {
      const globalId = getGlobalCompanyId();
      const timestamp = Date.now();
      
      // Log changes only every 5 seconds to avoid spam
      if (timestamp - lastLogTime.current > 5000) {
        const logEntry = `${new Date().toISOString()}: context=${currentCompanyId || 'null'}, global=${globalId || 'null'}`;
        
        // Check for instability
        if (currentCompanyId !== globalId) {
          console.warn('⚠️ Company ID mismatch detected!', {
            contextId: currentCompanyId,
            globalId,
            timestamp: new Date().toISOString()
          });
        }
        
        // Keep only last 10 entries
        stabilityLogRef.current.push(logEntry);
        if (stabilityLogRef.current.length > 10) {
          stabilityLogRef.current.shift();
        }
        
        console.log('📊 Company ID stability check:', logEntry);
        lastLogTime.current = timestamp;
      }
    };

    const interval = setInterval(checkStability, 5000);
    
    // Initial check
    checkStability();
    
    return () => clearInterval(interval);
  }, [currentCompanyId]);

  return {
    getStabilityLog: () => stabilityLogRef.current,
  };
};
