import { usePlatform } from '@/hooks/usePlatform';
import { NativeAdBanner } from './NativeAdBanner';
import { WebAdBanner } from './WebAdBanner';
import { Card, CardContent } from '@/components/ui/card';

interface FeedAdProps {
  // Native (AdMob) props
  nativeAdUnitId?: string;
  // Web (AdSense) props
  webAdSlot?: string;
  webAdClient?: string;
}

export const FeedAd = ({ 
  nativeAdUnitId,
  webAdSlot,
  webAdClient,
}: FeedAdProps) => {
  const { isNative, isWeb } = usePlatform();

  return (
    <Card className="overflow-hidden rounded-none border-0 shadow-none bg-muted/20">
      <CardContent className="p-0">
        <div className="flex flex-col items-center justify-center">
          {/* Small "Ad" label for transparency */}
          <div className="w-full px-3 pt-1">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Sponsored
            </span>
          </div>
          
          {/* Render appropriate ad based on platform */}
          {isNative && (
            <NativeAdBanner 
              adUnitId={nativeAdUnitId} 
              position="inline" 
            />
          )}
          
          {isWeb && (
            <WebAdBanner 
              adSlot={webAdSlot}
              adClient={webAdClient}
              format="horizontal"
              responsive={true}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
};
