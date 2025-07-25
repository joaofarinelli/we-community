import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const MarketplaceItemSkeleton = () => {
  return (
    <Card className="h-full flex flex-col">
      <CardContent className="p-4 flex-1">
        {/* Image skeleton */}
        <Skeleton className="aspect-video rounded-lg mb-3" />
        
        <div className="space-y-2">
          {/* Title and badge skeleton */}
          <div className="flex items-start justify-between">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-5 w-16 ml-2" />
          </div>
          
          {/* Description skeleton */}
          <div className="space-y-1">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          
          {/* Seller skeleton */}
          <Skeleton className="h-3 w-1/2" />
          
          {/* Price and stock skeleton */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 w-8" />
            </div>
            <Skeleton className="h-5 w-20" />
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0">
        <Skeleton className="h-10 w-full" />
      </CardFooter>
    </Card>
  );
};