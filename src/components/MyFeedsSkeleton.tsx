import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function MyFeedsSkeleton() {
  return (
    <div 
      className="min-h-screen bg-page-bg"
    >
      {/* Header skeleton */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-3 text-center">
          <Skeleton className="h-7 w-64 mx-auto mb-1" />
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>
      </header>

      <div className="container mx-auto px-2 py-4 max-w-3xl">
        {/* Navigation buttons skeleton */}
        <div className="flex justify-center gap-2 mb-4">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
        </div>

        <div className="space-y-4">
          {/* Sports/Leagues/Teams Section skeleton */}
          <Card className="bg-transparent border-none shadow-none">
            <CardHeader className="py-2 space-y-1">
              <Skeleton className="h-5 w-40 mx-auto" />
              <div className="flex justify-center">
                <Skeleton className="h-8 w-20" />
              </div>
            </CardHeader>
            <CardContent className="p-2 pt-0">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-end px-2">
                  <Skeleton className="h-4 w-12" />
                </div>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-2 px-2 py-1 border rounded-md bg-card w-full">
                    <Skeleton className="h-5 w-5 rounded-full flex-shrink-0" />
                    <Skeleton className="h-4 flex-1" />
                    <Skeleton className="h-7 w-7" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* People Section skeleton */}
          <Card className="bg-transparent border-none shadow-none">
            <CardHeader className="py-2 space-y-1">
              <Skeleton className="h-5 w-32 mx-auto" />
              <div className="flex justify-center">
                <Skeleton className="h-8 w-20" />
              </div>
            </CardHeader>
            <CardContent className="p-2 pt-0">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-end px-2">
                  <Skeleton className="h-4 w-12" />
                </div>
                {[1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-2 px-2 py-1 border rounded-md bg-card w-full">
                    <Skeleton className="h-5 w-5 rounded-full flex-shrink-0" />
                    <Skeleton className="h-4 flex-1" />
                    <Skeleton className="h-7 w-7" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
