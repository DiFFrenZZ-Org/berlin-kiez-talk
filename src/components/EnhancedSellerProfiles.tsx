
import { useState, useEffect } from "react";
import { Star, MapPin, CreditCard, MessageSquare, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "@/hooks/useAuth";

interface SellerListing {
  id: string;
  title: string;
  description: string;
  borough: string | null;
  price_range: string | null;
  is_featured: boolean;
  views_count: number;
  rating_average: number;
  rating_count: number;
  profiles: {
    nickname: string;
    subscription_active: boolean;
    subscription_tier: string;
    borough: string;
  };
  forum_categories: {
    name: string;
    color: string;
  };
}

interface EnhancedSellerProfilesProps {
  userProfile: UserProfile;
}

const berlinBoroughs = [
  'Alle Bezirke', 'Mitte', 'Friedrichshain-Kreuzberg', 'Pankow', 'Charlottenburg-Wilmersdorf',
  'Spandau', 'Steglitz-Zehlendorf', 'Tempelhof-Schöneberg', 'Neukölln', 
  'Treptow-Köpenick', 'Marzahn-Hellersdorf', 'Lichtenberg', 'Reinickendorf'
];

export const EnhancedSellerProfiles = ({ userProfile }: EnhancedSellerProfilesProps) => {
  const [listings, setListings] = useState<SellerListing[]>([]);
  const [selectedBorough, setSelectedBorough] = useState('Alle Bezirke');
  const [sortBy, setSortBy] = useState('featured');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchListings();
  }, [selectedBorough, sortBy]);

  const fetchListings = async () => {
    try {
      let query = supabase
        .from('seller_listings')
        .select(`
          *,
          profiles!inner(nickname, subscription_active, subscription_tier, borough),
          forum_categories(name, color)
        `)
        .eq('is_active', true);

      if (selectedBorough !== 'Alle Bezirke') {
        query = query.eq('borough', selectedBorough);
      }

      // Apply sorting
      switch (sortBy) {
        case 'featured':
          query = query.order('is_featured', { ascending: false }).order('created_at', { ascending: false });
          break;
        case 'rating':
          query = query.order('rating_average', { ascending: false });
          break;
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'views':
          query = query.order('views_count', { ascending: false });
          break;
      }

      const { data, error } = await query;

      if (error) throw error;
      setListings(data || []);
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case 'premium': return 'bg-purple-600';
      case 'pro': return 'bg-blue-600';
      case 'basic': return 'bg-gray-600';
      default: return 'bg-gray-600';
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating) 
            ? 'text-yellow-400 fill-current' 
            : 'text-gray-400'
        }`}
      />
    ));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Verkäufer in Berlin</h2>
        <p className="text-blue-200">Entdecken Sie lokale Dienstleister in Ihrer Nähe</p>
      </div>

      {/* Filters */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Sortieren nach</label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="featured">Featured</SelectItem>
                  <SelectItem value="rating">Bewertung</SelectItem>
                  <SelectItem value="newest">Neueste</SelectItem>
                  <SelectItem value="views">Beliebteste</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={() => setSelectedBorough(userProfile.borough || 'Alle Bezirke')}
                variant="outline"
                className="border-white/20 text-blue-200 hover:text-white hover:bg-white/10"
              >
                Mein Kiez
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Listings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center text-blue-200 py-8">Lädt Anzeigen...</div>
        ) : listings.length === 0 ? (
          <div className="col-span-full text-center text-blue-200 py-8">
            Keine Verkäufer in diesem Bereich gefunden.
          </div>
        ) : (
          listings.map((listing) => (
            <Card
              key={listing.id}
              className={`bg-white/10 backdrop-blur-md border-white/20 text-white transition-all hover:scale-105 ${
                listing.profiles.subscription_active 
                  ? 'ring-2 ring-green-400/30' 
                  : 'opacity-75'
              } ${listing.is_featured ? 'ring-2 ring-purple-400/50' : ''}`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{listing.title}</CardTitle>
                    <CardDescription className="text-blue-200">
                      von {listing.profiles.nickname}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col space-y-1">
                    {listing.is_featured && (
                      <Badge className="bg-purple-600 text-white text-xs">
                        Featured
                      </Badge>
                    )}
                    <Badge 
                      className={`${getTierBadgeColor(listing.profiles.subscription_tier)} text-white text-xs`}
                    >
                      {listing.profiles.subscription_tier.toUpperCase()}
                    </Badge>
                    {listing.profiles.subscription_active ? (
                      <Badge className="bg-green-600 text-white text-xs">
                        <CreditCard className="h-3 w-3 mr-1" />
                        Aktiv
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-red-400 text-red-300 text-xs">
                        Inaktiv
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-blue-100 line-clamp-3">{listing.description}</p>
                
                {listing.price_range && (
                  <div className="text-sm text-green-300 font-medium">
                    {listing.price_range}
                  </div>
                )}

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1">
                      {renderStars(listing.rating_average)}
                      <span className="text-white ml-1">
                        {listing.rating_average.toFixed(1)}
                      </span>
                      <span className="text-blue-300">({listing.rating_count})</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 text-blue-300">
                    <Eye className="h-3 w-3" />
                    <span className="text-xs">{listing.views_count}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-blue-300 text-sm">
                  <MapPin className="h-3 w-3" />
                  <span>{listing.borough || listing.profiles.borough}</span>
                </div>

                {listing.forum_categories && (
                  <Badge
                    style={{ backgroundColor: listing.forum_categories.color }}
                    className="text-white text-xs"
                  >
                    {listing.forum_categories.name}
                  </Badge>
                )}

                <Button
                  className={`w-full ${
                    listing.profiles.subscription_active
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-gray-600 hover:bg-gray-700"
                  }`}
                  disabled={!listing.profiles.subscription_active}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  {listing.profiles.subscription_active ? 'Nachricht senden' : 'Nicht verfügbar'}
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Information Box */}
      <Card className="bg-blue-600/20 backdrop-blur-md border-blue-400/30 text-white">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <CreditCard className="h-5 w-5 text-blue-300 mt-0.5" />
            <div>
              <h3 className="font-semibold mb-1">Verkäufer werden</h3>
              <p className="text-sm text-blue-200">
                Als Verkäufer benötigen Sie ein aktives monatliches Abonnement, um Nachrichten zu empfangen 
                und Ihre Dienste anzubieten. Grüne Rahmen zeigen aktive Verkäufer an.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
