import { useState } from 'react';

import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAllPosts, SortOption } from '@/hooks/useAllPosts';
import { FeedSortControls } from '@/components/posts/FeedSortControls';
import { FeedPostCard } from '@/components/posts/FeedPostCard';
import { HiddenPostCard } from '@/components/posts/HiddenPostCard';
import { GlobalCreatePostForm } from '@/components/posts/GlobalCreatePostForm';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { FeedBanner } from '@/components/feed/FeedBanner';


export const Dashboard = () => {
  const { user } = useAuth();
  const { data: userProfile } = useUserProfile();
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  
  const userName = userProfile?.first_name 
    ? `${userProfile.first_name} ${userProfile.last_name || ''}`.trim()
    : user?.email?.split('@')[0] || 'Usuário';

  const { data: posts, isLoading: postsLoading } = useAllPosts(sortBy);

  return (
    <DashboardLayout>
      {/* Feed Banner */}
      <FeedBanner />
      
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-6">

            {/* Welcome Title */}
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Boas-vindas à plataforma, {userName}!
              </h1>
              <p className="text-muted-foreground">
                Veja as últimas atualizações de todos os seus espaços
              </p>
            </div>

            {/* Create Post Form */}
            <GlobalCreatePostForm />

            {/* Sort Controls */}
            <div className="flex items-center justify-between">
              <FeedSortControls sortBy={sortBy} onSortChange={setSortBy} />
            </div>

            {/* Posts Feed */}
            <div className="space-y-6">
              {postsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i}>
                      <CardContent className="p-6">
                        <div className="space-y-3">
                          <div className="flex items-center space-x-3">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="space-y-2">
                              <Skeleton className="h-4 w-32" />
                              <Skeleton className="h-3 w-24" />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : posts && posts.length > 0 ? (
                posts.map(post => 
                  post.is_hidden ? (
                    <HiddenPostCard key={post.id} post={post} />
                  ) : (
                    <FeedPostCard key={post.id} post={post} />
                  )
                )
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <div className="space-y-3">
                      <h3 className="text-lg font-medium">Nenhum post ainda</h3>
                      <p className="text-muted-foreground max-w-md mx-auto">
                        Ainda não há posts em seus espaços. Que tal criar o primeiro post para começar as conversas?
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};