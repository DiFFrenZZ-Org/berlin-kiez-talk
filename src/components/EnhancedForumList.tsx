
import { useState, useEffect } from "react";
import { MessageCircle, ThumbsUp, MapPin, Plus, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface ForumCategory {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
}

interface ForumPost {
  id: string;
  title: string;
  content: string;
  post_type: 'offering' | 'searching' | 'discussion';
  borough: string | null;
  views_count: number;
  likes_count: number;
  replies_count: number;
  created_at: string;
  profiles: {
    nickname: string;
    borough: string;
  };
  forum_categories: {
    name: string;
    color: string;
  };
}

interface EnhancedForumListProps {
  userProfile: UserProfile;
}

const berlinBoroughs = [
  'Alle Bezirke', 'Mitte', 'Friedrichshain-Kreuzberg', 'Pankow', 'Charlottenburg-Wilmersdorf',
  'Spandau', 'Steglitz-Zehlendorf', 'Tempelhof-Schöneberg', 'Neukölln', 
  'Treptow-Köpenick', 'Marzahn-Hellersdorf', 'Lichtenberg', 'Reinickendorf'
];

export const EnhancedForumList = ({ userProfile }: EnhancedForumListProps) => {
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [selectedBorough, setSelectedBorough] = useState('Alle Bezirke');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPostType, setSelectedPostType] = useState('all');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
    fetchPosts();
  }, [selectedBorough, selectedCategory, selectedPostType]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('forum_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchPosts = async () => {
    try {
      let query = supabase
        .from('forum_posts')
        .select(`
          *,
          profiles!inner(nickname, borough),
          forum_categories(name, color)
        `)
        .order('created_at', { ascending: false });

      if (selectedBorough !== 'Alle Bezirke') {
        query = query.eq('borough', selectedBorough);
      }

      if (selectedCategory !== 'all') {
        query = query.eq('category_id', selectedCategory);
      }

      if (selectedPostType !== 'all') {
        query = query.eq('post_type', selectedPostType);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast({
        title: "Fehler",
        description: "Beiträge konnten nicht geladen werden.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getPostTypeColor = (type: string) => {
    switch (type) {
      case 'offering': return 'bg-green-600';
      case 'searching': return 'bg-blue-600';
      case 'discussion': return 'bg-gray-600';
      default: return 'bg-gray-600';
    }
  };

  const getPostTypeLabel = (type: string) => {
    switch (type) {
      case 'offering': return 'Biete';
      case 'searching': return 'Suche';
      case 'discussion': return 'Diskussion';
      default: return type;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Gerade eben';
    if (diffInHours < 24) return `${diffInHours} Std.`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} Tag${diffInDays > 1 ? 'e' : ''}`;
    return date.toLocaleDateString('de-DE');
  };

  return (
    <div className="space-y-6">
      {/* Header with New Topic Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Berlin Forum</h2>
          <p className="text-blue-200">Diskutieren Sie mit Ihrer Nachbarschaft</p>
        </div>
        <Button className="bg-green-600 hover:bg-green-700">
          <Plus className="h-4 w-4 mr-2" />
          Neues Thema
        </Button>
      </div>

      {/* Enhanced Filters */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Borough Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Bezirk</label>
              <Select value={selectedBorough} onValueChange={setSelectedBorough}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {berlinBoroughs.map((borough) => (
                    <SelectItem key={borough} value={borough}>
                      {borough}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Kategorie</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Kategorien</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Post Type Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Typ</label>
              <Select value={selectedPostType} onValueChange={setSelectedPostType}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Typen</SelectItem>
                  <SelectItem value="offering">Biete</SelectItem>
                  <SelectItem value="searching">Suche</SelectItem>
                  <SelectItem value="discussion">Diskussion</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Quick Filter Buttons */}
            <div className="flex flex-wrap gap-2 items-end">
              <Button
                onClick={() => setSelectedBorough(userProfile.borough || 'Alle Bezirke')}
                variant="outline"
                size="sm"
                className="border-white/20 text-blue-200 hover:text-white hover:bg-white/10"
              >
                <Filter className="h-3 w-3 mr-1" />
                Mein Kiez
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Posts List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center text-blue-200 py-8">Lädt Beiträge...</div>
        ) : posts.length === 0 ? (
          <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
            <CardContent className="p-8 text-center">
              <p className="text-blue-200">Keine Beiträge in diesem Filter gefunden.</p>
              <Button className="mt-4 bg-green-600 hover:bg-green-700">
                Ersten Beitrag erstellen
              </Button>
            </CardContent>
          </Card>
        ) : (
          posts.map((post) => (
            <Card
              key={post.id}
              className="bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/15 transition-colors cursor-pointer"
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center space-x-2 flex-wrap">
                      <Badge className={`${getPostTypeColor(post.post_type)} text-white text-xs`}>
                        {getPostTypeLabel(post.post_type)}
                      </Badge>
                      {post.forum_categories && (
                        <Badge 
                          style={{ backgroundColor: post.forum_categories.color }}
                          className="text-white text-xs"
                        >
                          {post.forum_categories.name}
                        </Badge>
                      )}
                      <h3 className="font-semibold hover:text-blue-300 transition-colors flex-1">
                        {post.title}
                      </h3>
                    </div>
                    
                    <p className="text-sm text-blue-100 line-clamp-2">{post.content}</p>
                    
                    <div className="flex items-center space-x-4 text-sm text-blue-200">
                      <span>von {post.profiles?.nickname}</span>
                      {post.borough && (
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3" />
                          <span>{post.borough}</span>
                        </div>
                      )}
                      <span>{formatTimeAgo(post.created_at)}</span>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center space-x-1 text-blue-300">
                        <MessageCircle className="h-4 w-4" />
                        <span>{post.replies_count} Antworten</span>
                      </div>
                      <div className="flex items-center space-x-1 text-green-300">
                        <ThumbsUp className="h-4 w-4" />
                        <span>{post.likes_count}</span>
                      </div>
                      <div className="text-blue-300">
                        {post.views_count} Aufrufe
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
