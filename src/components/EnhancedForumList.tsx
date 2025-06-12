
import { useState, useEffect } from "react";
import { MessageSquare, Eye, Heart, Filter, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserProfile } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { NewPostDialog } from "./NewPostDialog";

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
  user_id: string | null;
  category_id: string | null;
  profile?: {
    nickname: string | null;
    borough: string | null;
  } | null;
  category?: {
    name: string;
    color: string;
    icon: string | null;
  } | null;
}

interface ForumCategory {
  id: string;
  name: string;
  color: string;
  icon: string | null;
}

interface EnhancedForumListProps {
  userProfile: UserProfile;
}

export const EnhancedForumList = ({ userProfile }: EnhancedForumListProps) => {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [openNew, setOpenNew] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("__placeholder");
  const [selectedPostType, setSelectedPostType] = useState<string>("__placeholder");
  const [selectedBorough, setSelectedBorough] = useState<string>("__placeholder");
  const [searchTerm, setSearchTerm] = useState('');

  const berlinBoroughs = [
    'Mitte', 'Friedrichshain-Kreuzberg', 'Pankow', 'Charlottenburg-Wilmersdorf',
    'Spandau', 'Steglitz-Zehlendorf', 'Tempelhof-Schöneberg', 'Neukölln', 
    'Treptow-Köpenick', 'Marzahn-Hellersdorf', 'Lichtenberg', 'Reinickendorf'
  ];

  const postTypes = [
    { value: 'offering', label: 'Bieten', color: 'bg-green-600' },
    { value: 'searching', label: 'Suchen', color: 'bg-blue-600' },
    { value: 'discussion', label: 'Diskussion', color: 'bg-purple-600' }
  ];

  useEffect(() => {
    fetchCategories();
    fetchPosts();
  }, [selectedCategory, selectedPostType, selectedBorough]);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('forum_categories')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching categories:', error);
    } else {
      setCategories(data || []);
    }
  };

  const fetchPosts = async () => {
    setLoading(true);
    
    // First fetch posts
    let query = supabase
      .from('forum_posts')
      .select('*')
      .eq('is_private', false)
      .order('created_at', { ascending: false });

    if (selectedCategory !== 'all') {
      query = query.eq('category_id', selectedCategory);
    }

    if (selectedPostType !== 'all') {
      query = query.eq('post_type', selectedPostType as 'offering' | 'searching' | 'discussion');
    }

    if (selectedBorough !== 'all') {
      query = query.eq('borough', selectedBorough);
    }

    const { data: postsData, error: postsError } = await query;

    if (postsError) {
      console.error('Error fetching posts:', postsError);
      setLoading(false);
      return;
    }

    // Fetch related data separately
    const enrichedPosts: ForumPost[] = [];
    
    for (const post of postsData || []) {
      let profile = null;
      let category = null;

      // Fetch profile data if user_id exists
      if (post.user_id) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('nickname, borough')
          .eq('id', post.user_id)
          .single();
        
        if (profileData) {
          profile = {
            nickname: profileData.nickname,
            borough: profileData.borough
          };
        }
      }

      // Fetch category data if category_id exists
      if (post.category_id) {
        const { data: categoryData } = await supabase
          .from('forum_categories')
          .select('name, color, icon')
          .eq('id', post.category_id)
          .single();
        
        if (categoryData) {
          category = {
            name: categoryData.name,
            color: categoryData.color,
            icon: categoryData.icon
          };
        }
      }

      enrichedPosts.push({
        ...post,
        profile,
        category
      });
    }

    setPosts(enrichedPosts);
    setLoading(false);
  };

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPostTypeInfo = (type: string) => {
    return postTypes.find(pt => pt.value === type) || postTypes[2];
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'vor wenigen Minuten';
    if (diffInHours < 24) return `vor ${diffInHours}h`;
    return `vor ${Math.floor(diffInHours / 24)}d`;
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Forum</CardTitle>
              <CardDescription className="text-blue-200">
                Diskutiere mit deinem Kiez
              </CardDescription>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setOpenNew(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Neuer Beitrag
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm text-blue-300 mb-2 block">Kategorie</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Kategorie wählen" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="__placeholder" disabled>
                    Kategorie wählen
                  </SelectItem>
                  <SelectItem value="all" className="text-white hover:bg-slate-700">Alle Kategorien</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id} className="text-white hover:bg-slate-700">
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm text-blue-300 mb-2 block">Typ</label>
              <Select value={selectedPostType} onValueChange={setSelectedPostType}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Typ wählen" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="__placeholder" disabled>
                    Typ wählen
                  </SelectItem>
                  <SelectItem value="all" className="text-white hover:bg-slate-700">Alle Typen</SelectItem>
                  {postTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value} className="text-white hover:bg-slate-700">
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm text-blue-300 mb-2 block">Bezirk</label>
              <Select value={selectedBorough} onValueChange={setSelectedBorough}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Bezirk wählen" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="__placeholder" disabled>
                    Bezirk wählen
                  </SelectItem>
                  <SelectItem value="all" className="text-white hover:bg-slate-700">Alle Bezirke</SelectItem>
                  {berlinBoroughs.map((borough) => (
                    <SelectItem key={borough} value={borough} className="text-white hover:bg-slate-700">
                      {borough}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm text-blue-300 mb-2 block">Suchen</label>
              <Input
                placeholder="Beiträge durchsuchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center text-blue-300 py-8">Lädt...</div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center text-blue-300 py-8">Keine Beiträge gefunden</div>
        ) : (
          filteredPosts.map((post) => {
            const postTypeInfo = getPostTypeInfo(post.post_type);
            return (
              <Card key={post.id} className="bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/15 transition-colors cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <Badge className={`${postTypeInfo.color} text-white`}>
                        {postTypeInfo.label}
                      </Badge>
                      {post.category && (
                        <Badge variant="outline" className="border-blue-400 text-blue-300">
                          {post.category.name}
                        </Badge>
                      )}
                      {post.borough && (
                        <Badge variant="outline" className="border-green-400 text-green-300">
                          📍 {post.borough}
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-blue-300">{formatTimeAgo(post.created_at)}</span>
                  </div>
                  
                  <h3 className="font-semibold text-lg mb-2 text-white">{post.title}</h3>
                  <p className="text-blue-200 text-sm mb-3 line-clamp-2">{post.content}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-xs text-blue-300">
                      <span>von {post.profile?.nickname || 'Anonym'}</span>
                      {post.profile?.borough && (
                        <span>aus {post.profile.borough}</span>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 text-xs text-blue-300">
                      <div className="flex items-center space-x-1">
                        <Eye className="h-3 w-3" />
                        <span>{post.views_count}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Heart className="h-3 w-3" />
                        <span>{post.likes_count}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MessageSquare className="h-3 w-3" />
                        <span>{post.replies_count}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
      <NewPostDialog
        open={openNew}
        onOpenChange={setOpenNew}
        categories={categories}
        userProfile={userProfile}
        onCreated={fetchPosts}
      />
    </div>
  );
};
