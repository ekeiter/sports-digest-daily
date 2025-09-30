import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ExternalLink, Calendar, Clock, Lock } from "lucide-react";

interface NewsArticle {
  title: string;
  description: string;
  url: string;
  urlToImage: string;
  publishedAt: string;
  source: {
    name: string;
  } | string;
  author: string;
  paywalled?: boolean;
}

interface ArticleViewerProps {
  article: NewsArticle;
  onBack: () => void;
}

const ArticleViewer = ({ article, onBack }: ArticleViewerProps) => {
  const [iframeError, setIframeError] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const sourceName = typeof article.source === 'string' ? article.source : article.source?.name || 'Unknown Source';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Fixed Header */}
      <header className="bg-background border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-sm font-medium truncate">
                {sourceName}
              </h1>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(article.publishedAt)}</span>
                <Clock className="h-3 w-3" />
                <span>{formatTime(article.publishedAt)}</span>
                {article.paywalled && (
                  <Badge variant="secondary" className="text-xs flex items-center gap-1 h-4 px-1.5">
                    <Lock className="h-2.5 w-2.5" />
                    Premium
                  </Badge>
                )}
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open(article.url, '_blank')}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Article Content */}
      <main className="flex-1 flex flex-col">
        {/* Article Header */}
        <div className="container mx-auto px-4 py-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl leading-tight">
                {article.title}
              </CardTitle>
              {article.description && (
                <p className="text-muted-foreground">
                  {article.description}
                </p>
              )}
            </CardHeader>
            {article.urlToImage && (
              <CardContent className="pt-0">
                <img
                  src={article.urlToImage}
                  alt={article.title}
                  className="w-full h-48 object-cover rounded-md"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </CardContent>
            )}
          </Card>
        </div>

        {/* Article Iframe */}
        <div className="flex-1 container mx-auto px-4 pb-4">
          {!iframeError ? (
            <div className="h-full min-h-[60vh]">
              <iframe
                src={article.url}
                className="w-full h-full border rounded-lg"
                onError={() => setIframeError(true)}
                onLoad={(e) => {
                  // Check if iframe failed to load
                  try {
                    const iframe = e.target as HTMLIFrameElement;
                    if (!iframe.contentDocument) {
                      setIframeError(true);
                    }
                  } catch (error) {
                    setIframeError(true);
                  }
                }}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                title={article.title}
              />
            </div>
          ) : (
            <Card className="h-full min-h-[60vh] flex items-center justify-center">
              <CardContent className="text-center">
                <p className="text-lg font-medium mb-4">Content cannot be displayed</p>
                <p className="text-muted-foreground mb-6">
                  This article cannot be embedded. You can view it in your browser instead.
                </p>
                <Button 
                  onClick={() => window.open(article.url, '_blank')}
                  className="gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open in Browser
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Fixed Bottom Navigation */}
      <div className="bg-background border-t p-4 safe-area-pb">
        <div className="container mx-auto">
          <Button 
            onClick={onBack} 
            className="w-full"
            size="lg"
          >
            Back to News
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ArticleViewer;