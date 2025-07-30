import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const TIME_RANGE_OPTIONS = [
  { value: 24, label: "24 hours (1 day)" },
  { value: 36, label: "36 hours (1.5 days)" },
  { value: 48, label: "48 hours (2 days)" },
  { value: 72, label: "72 hours (3 days)" },
  { value: 168, label: "168 hours (1 week)" }
];

export default function NewsSettings() {
  const [hoursBack, setHoursBack] = useState<number>(24);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadNewsConfig();
  }, []);

  const loadNewsConfig = async () => {
    try {
      const { data: newsConfig, error } = await supabase
        .from('news_config')
        .select('hours_back')
        .maybeSingle();

      if (error) {
        console.error('Error loading news config:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load news settings"
        });
        return;
      }

      // If no config exists, use default of 24 hours
      setHoursBack(newsConfig?.hours_back || 24);
    } catch (error) {
      console.error('Error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load news settings"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveNewsConfig = async () => {
    setSaving(true);
    try {
      // First try to update existing config
      const { data: existingConfig } = await supabase
        .from('news_config')
        .select('id')
        .maybeSingle();

      let error;
      
      if (existingConfig) {
        // Update existing config
        ({ error } = await supabase
          .from('news_config')
          .update({ hours_back: hoursBack })
          .eq('id', existingConfig.id));
      } else {
        // Create new config
        ({ error } = await supabase
          .from('news_config')
          .insert({ 
            hours_back: hoursBack,
            user_id: (await supabase.auth.getUser()).data.user?.id 
          }));
      }

      if (error) {
        console.error('Error saving news config:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to save news settings"
        });
        return;
      }

      toast({
        title: "Settings saved",
        description: `News will now show articles from the last ${hoursBack} hours`
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save news settings"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center space-x-2 mb-6">
            <Link to="/" className="flex items-center space-x-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center space-x-2 mb-6">
          <Link to="/" className="flex items-center space-x-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Link>
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">News Settings</h1>
            <p className="text-muted-foreground">
              Configure how your news aggregation works
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Time Range</span>
              </CardTitle>
              <CardDescription>
                How far back in time should we look for news articles? This applies to all news sources including RSS feeds, NewsAPI, and GNews.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Article Time Range
                </label>
                <Select 
                  value={hoursBack.toString()} 
                  onValueChange={(value) => setHoursBack(parseInt(value))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select time range" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_RANGE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value.toString()}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Currently showing articles from the last {hoursBack} hours
                </p>
              </div>

              <Button 
                onClick={saveNewsConfig} 
                disabled={saving}
                className="w-full sm:w-auto"
              >
                {saving ? "Saving..." : "Save Settings"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}