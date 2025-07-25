import { Skeleton } from '@/components/ui/skeleton';

export const CategoryFilterSkeleton = () => {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-20" />
      
      <div className="space-y-1">
        {/* "All" category skeleton */}
        <Skeleton className="h-9 w-full" />
        
        {/* Category skeletons */}
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full" />
        ))}
      </div>
    </div>
  );
};