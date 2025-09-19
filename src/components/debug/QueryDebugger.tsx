import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCompanyContext } from '@/hooks/useCompanyContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { isCompanySpecificQuery, LEGACY_QUERY_KEYS } from '@/lib/queryPatterns';
import { Eye, EyeOff, Trash2, RefreshCw } from 'lucide-react';

/**
 * Componente de debug para monitorar queries e identificar problemas
 * Use apenas em desenvolvimento
 */
export const QueryDebugger = () => {
  const [isVisible, setIsVisible] = useState(false);
  const queryClient = useQueryClient();
  const { currentCompanyId } = useCompanyContext();

  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  const allQueries = queryClient.getQueryCache().getAll();
  const companyQueries = allQueries.filter(query => 
    isCompanySpecificQuery(query.queryKey as unknown[])
  );
  const problematicQueries = allQueries.filter(query => {
    const key = query.queryKey;
    return Array.isArray(key) && 
           key.length === 1 && 
           LEGACY_QUERY_KEYS.includes(key[0] as any);
  });
  const otherQueries = allQueries.filter(query => 
    !isCompanySpecificQuery(query.queryKey as unknown[]) && 
    !problematicQueries.includes(query)
  );

  const clearProblematicQueries = () => {
    problematicQueries.forEach(query => {
      queryClient.removeQueries({ queryKey: query.queryKey });
    });
  };

  const clearAllQueries = () => {
    queryClient.clear();
  };

  const refreshAllQueries = () => {
    queryClient.invalidateQueries();
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsVisible(true)}
          className="opacity-70 hover:opacity-100"
        >
          <Eye className="h-4 w-4" />
          Debug Queries
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-96 overflow-y-auto">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-sm">
            Query Debugger
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
            >
              <EyeOff className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-xs space-y-2">
            <div className="flex justify-between items-center">
              <span>Company ID:</span>
              <Badge variant="outline" className="text-xs">
                {currentCompanyId ? currentCompanyId.slice(0, 8) + '...' : 'None'}
              </Badge>
            </div>
            
            <div className="flex justify-between items-center">
              <span>Total Queries:</span>
              <Badge>{allQueries.length}</Badge>
            </div>
            
            <div className="flex justify-between items-center">
              <span>Company Specific:</span>
              <Badge variant="secondary">{companyQueries.length}</Badge>
            </div>
            
            <div className="flex justify-between items-center">
              <span>⚠️ Problematic:</span>
              <Badge variant="destructive">{problematicQueries.length}</Badge>
            </div>
            
            <div className="flex justify-between items-center">
              <span>Other:</span>
              <Badge variant="outline">{otherQueries.length}</Badge>
            </div>
          </div>

          {problematicQueries.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-medium text-destructive">
                Problematic Queries (missing companyId):
              </div>
              <div className="text-xs space-y-1">
                {problematicQueries.slice(0, 5).map((query, idx) => (
                  <div key={idx} className="truncate bg-destructive/10 px-2 py-1 rounded">
                    {JSON.stringify(query.queryKey)}
                  </div>
                ))}
                {problematicQueries.length > 5 && (
                  <div className="text-muted-foreground">
                    ... and {problematicQueries.length - 5} more
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={clearProblematicQueries}
              disabled={problematicQueries.length === 0}
              className="flex-1"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Clear Bad
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={refreshAllQueries}
              className="flex-1"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Refresh
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllQueries}
              className="flex-1"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Clear All
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};