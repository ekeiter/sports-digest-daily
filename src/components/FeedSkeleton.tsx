import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function FeedSkeleton() {
  return (
    <div className="min-h-screen">
      {/* Header skeleton */}
      <header className="border-b sticky top-0 bg-background/80 backdrop-blur-sm z-10">
        <div className="container mx-auto px-3 py-2 max-w-3xl">
          <div className="flex flex-col gap-2">
            <div className="flex justify-center">
              <Skeleton className="h-8 w-64" />
            </div>
            <div className="flex gap-1.5 justify-center">
              <Skeleton className="h-7 w-20" />
              <Skeleton className="h-7 w-20" />
              <Skeleton className="h-7 w-20" />
            </div>
          </div>
        </div>
      </header>

      {/* Feed articles skeleton */}
      <main className="container mx-auto px-2 py-2 max-w-3xl">
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  <div className="w-full md:w-64 md:flex-shrink-0">
                    <Skeleton className="w-full aspect-video" />
                  </div>
                  <div className="px-3 pt-1.5 pb-2 flex-1 md:flex md:flex-col md:justify-center">
                    <div className="flex gap-2 mb-1">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-3 w-8" />
                    </div>
                    <Skeleton className="h-4 w-full mb-1" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
