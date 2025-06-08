
import { useState, useEffect } from "react";
import { Star, MapPin, Eye, Filter, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserProfile } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface SellerListing {
  id: string;
  title: string;
  description: string;
  price_range: string | null;
  borough: string | null;
  is_featured: boolean;
  views_count: number;
  rating_average: number;
  rating_count: number;
  created_at: string;
  profiles: {
    nickname: string | null;
    subscription_active: boolean;
    subscription_tier: string;
    borough: string | null;
  } | null;
  forum_categories: {
    name: string;
    color: string;
  } | null;
}

interface EnhancedSellerProfilesProps {
  userProfile: UserProfile;
}

export const EnhancedSellerProfiles = ({ userProfile }: EnhancedSellerProfilesProps) => {
  const [listings, setListings] = useState<SellerListing[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBorough, setSelectedBorough] = useState<string>(userProfile.borough || 'all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<string>('newest');

  const berlinBoroughs = [
    'Mitte', 'Friedrichshain-Kreuzberg', 'Pankow', 'Charlottenburg-Wilmersdorf',
    'Spandau', 'Steglitz-Zehlendorf', 'Tempelhof-Schöneberg', 'Neukölln', 
    'Treptow-Köpenick', 'Marzahn-Hellersdorf', 'Lichtenberg', 'Reinickendorf'
  ];

  useEffect(() => {
    fetchCategories();
    fetchListings();
  }, [selectedCategory, selectedBorough, sortBy]);

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

  const fetchListings = async () => {
    setLoading(true);
    let query = supabase
      .from('seller_listings')
      .select(`
        *,
        profiles (nickname, subscription_active, subscription_tier, borough),
        forum_categories (name, color)
      `)
      .eq('is_active', true);

    if (selectedCategory !== 'all') {
      query = query.eq('category_id', selectedCategory);
    }

    if (selectedBorough !== 'all') {
      query = query.eq('borough', selectedBorough);
    }

    // Apply sorting
    switch (sortBy) {
      case 'rating':
        query = query.order('rating_average', { ascending: false });
        break;
      case 'views':
        query = query.order('views_count', { ascending: false });
        break;
      case 'newest':
      default:
        query = query.order('created_at', { ascending: false });
        break;
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching listings:', error);
    } else {
      const transformedData = (data || []).map(listing => ({
        ...listing,
        profiles: listing.profiles ? {
          nickname: listing.profiles.nickname,
          subscription_active: listing.profiles.subscription_active,
          subscription_tier: listing.profiles.subscription_tier,
          borough: listing.profiles.borough
        } : null,
        forum_categories: listing.forum_categories ? {
          name: listing.forum_categories.name,
          color: listing.forum_categories.color
        } : null
      }));
      setListings(transformedData);
    }
    setLoading(false);
  };

  const filteredListings = listings.filter(listing =>
    listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    listing.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-400'
        }`}
      />
    ));
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
          <CardTitle className="text-xl">Verkäufer & Dienstleister</CardTitle>
          <CardDescription className="text-blue-200">
            Entdecke lokale Anbieter in deinem Kiez
          </CardDescription>
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
              <label className="text-sm text-blue-300 mb-2 block">Bezirk</label>
              <Select value={selectedBorough} onValueChange={setSelectedBorough}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Bezirk wählen" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
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
              <label className="text-sm text-blue-300 mb-2 block">Sortieren</label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Sortieren nach" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="newest" className="text-white hover:bg-slate-700">Neueste</SelectItem>
                  <SelectItem value="rating" className="text-white hover:bg-slate-700">Bewertung</SelectItem>
                  <SelectItem value="views" className="text-white hover:bg-slate-700">Aufrufe</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm text-blue-300 mb-2 block">Suchen</label>
              <Input
                placeholder="Angebote durchsuchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center text-blue-300 py-8">Lädt...</div>
        ) : filteredListings.length === 0 ? (
          <div className="col-span-full text-center text-blue-300 py-8">Keine Angebote gefunden</div>
        ) : (
          filteredListings.map((listing) => (
            <Card key={listing.id} className="bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/15 transition-colors cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {listing.is_featured && (
                      <Badge className="bg-yellow-600 text-white text-xs">
                        ⭐ Featured
                      </Badge>
                    )}
                    {listing.forum_categories && (
                      <Badge variant="outline" className="border-blue-400 text-blue-300 text-xs">
                        {listing.forum_categories.name}
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-blue-300">{formatTimeAgo(listing.created_at)}</span>
                </div>
                
                <h3 className="font-semibold text-lg mb-2 text-white">{listing.title}</h3>
                <p className="text-blue-200 text-sm mb-3 line-clamp-3">{listing.description}</p>
                
                {listing.price_range && (
                  <div className="mb-3">
                    <Badge variant="outline" className="border-green-400 text-green-300">
                      💰 {listing.price_range}
                    </Badge>
                  </div>
                )}
                
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-1">
                    {renderStars(listing.rating_average)}
                    <span className="text-xs text-blue-300 ml-2">
                      ({listing.rating_count} Bewertungen)
                    </span>
                  </div>
                  <div className="flex items-center space-x-1 text-xs text-blue-300">
                    <Eye className="h-3 w-3" />
                    <span>{listing.views_count}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-blue-300">
                      {listing.profiles?.nickname || 'Anonym'}
                    </span>
                    {listing.profiles?.subscription_active && (
                      <Badge className="bg-blue-600 text-white text-xs">
                        {listing.profiles.subscription_tier}
                      </Badge>
                    )}
                  </div>
                  {listing.borough && (
                    <div className="flex items-center space-x-1 text-xs text-green-300">
                      <MapPin className="h-3 w-3" />
                      <span>{listing.borough}</span>
                    </div>
                  )}
                </div>
                
                <Button className="w-full mt-4 bg-blue-600 hover:bg-blue-700">
                  Kontaktieren
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
