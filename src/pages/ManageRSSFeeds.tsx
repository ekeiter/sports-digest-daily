import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface RSSFeed {
  id: string;
  name: string;
  url: string;
  sport: string;
  city: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function ManageRSSFeeds() {
  const [feeds, setFeeds] = useState<RSSFeed[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingFeed, setEditingFeed] = useState<RSSFeed | null>(null);
  const [newFeed, setNewFeed] = useState({
    name: "",
    url: "",
    sport: "General",
    city: "General",
    is_active: true
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchFeeds();
  }, []);

  const fetchFeeds = async () => {
    try {
      const { data, error } = await supabase
        .from('rss_sources')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFeeds(data || []);
    } catch (error) {
      console.error('Error fetching feeds:', error);
      toast({
        title: "Error",
        description: "Failed to fetch RSS feeds",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddFeed = async () => {
    if (!newFeed.name || !newFeed.url || !newFeed.sport || !newFeed.city) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('rss_sources')
        .insert([newFeed]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "RSS feed added successfully"
      });

      setNewFeed({ name: "", url: "", sport: "General", city: "General", is_active: true });
      fetchFeeds();
    } catch (error) {
      console.error('Error adding feed:', error);
      toast({
        title: "Error",
        description: "Failed to add RSS feed",
        variant: "destructive"
      });
    }
  };

  const handleUpdateFeed = async (feed: RSSFeed) => {
    try {
      const { error } = await supabase
        .from('rss_sources')
        .update({
          name: feed.name,
          url: feed.url,
          sport: feed.sport,
          city: feed.city,
          is_active: feed.is_active
        })
        .eq('id', feed.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "RSS feed updated successfully"
      });

      setEditingFeed(null);
      fetchFeeds();
    } catch (error) {
      console.error('Error updating feed:', error);
      toast({
        title: "Error",
        description: "Failed to update RSS feed",
        variant: "destructive"
      });
    }
  };

  const handleDeleteFeed = async (id: string) => {
    try {
      const { error } = await supabase
        .from('rss_sources')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "RSS feed deleted successfully"
      });

      fetchFeeds();
    } catch (error) {
      console.error('Error deleting feed:', error);
      toast({
        title: "Error",
        description: "Failed to delete RSS feed",
        variant: "destructive"
      });
    }
  };

  const toggleFeedStatus = async (feed: RSSFeed) => {
    try {
      const { error } = await supabase
        .from('rss_sources')
        .update({ is_active: !feed.is_active })
        .eq('id', feed.id);

      if (error) throw error;

      fetchFeeds();
    } catch (error) {
      console.error('Error toggling feed status:', error);
      toast({
        title: "Error",
        description: "Failed to update feed status",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Manage RSS Feeds</h1>
      </div>

      {/* Add New Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New RSS Feed
          </CardTitle>
          <CardDescription>
            Add RSS feeds for teams, sports, or other news sources
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={newFeed.name}
                onChange={(e) => setNewFeed({ ...newFeed, name: e.target.value })}
                placeholder="e.g., Philadelphia Phillies"
              />
            </div>
            <div>
              <Label htmlFor="url">RSS URL</Label>
              <Input
                id="url"
                value={newFeed.url}
                onChange={(e) => setNewFeed({ ...newFeed, url: e.target.value })}
                placeholder="https://example.com/rss"
              />
            </div>
            <div>
              <Label htmlFor="sport">Sport</Label>
              <Input
                id="sport"
                value={newFeed.sport}
                onChange={(e) => setNewFeed({ ...newFeed, sport: e.target.value })}
                placeholder="e.g., Baseball, Football, General"
              />
            </div>
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={newFeed.city}
                onChange={(e) => setNewFeed({ ...newFeed, city: e.target.value })}
                placeholder="e.g., Philadelphia, Pittsburgh, General"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="active"
              checked={newFeed.is_active}
              onCheckedChange={(checked) => setNewFeed({ ...newFeed, is_active: checked })}
            />
            <Label htmlFor="active">Active</Label>
          </div>
          <Button onClick={handleAddFeed}>Add RSS Feed</Button>
        </CardContent>
      </Card>

      {/* Existing Feeds */}
      <div className="grid gap-4">
        {feeds.map((feed) => (
          <Card key={feed.id}>
            <CardContent className="p-6">
              {editingFeed?.id === feed.id ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label>Name</Label>
                      <Input
                        value={editingFeed.name}
                        onChange={(e) => setEditingFeed({ ...editingFeed, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>RSS URL</Label>
                      <Input
                        value={editingFeed.url}
                        onChange={(e) => setEditingFeed({ ...editingFeed, url: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Sport</Label>
                      <Input
                        value={editingFeed.sport}
                        onChange={(e) => setEditingFeed({ ...editingFeed, sport: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>City</Label>
                      <Input
                        value={editingFeed.city}
                        onChange={(e) => setEditingFeed({ ...editingFeed, city: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={editingFeed.is_active}
                        onCheckedChange={(checked) => setEditingFeed({ ...editingFeed, is_active: checked })}
                      />
                      <Label>Active</Label>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => handleUpdateFeed(editingFeed)}>Save</Button>
                      <Button variant="outline" onClick={() => setEditingFeed(null)}>Cancel</Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{feed.name}</h3>
                      <span className="text-sm text-muted-foreground">({feed.sport} - {feed.city})</span>
                      <Switch
                        checked={feed.is_active}
                        onCheckedChange={() => toggleFeedStatus(feed)}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">{feed.url}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingFeed(feed)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteFeed(feed.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {feeds.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">No RSS feeds configured yet. Add one above to get started.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
