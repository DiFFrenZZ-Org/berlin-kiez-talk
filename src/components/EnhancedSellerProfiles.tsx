import { useState, useEffect } from "react";
import { Star, MapPin, Eye, Filter, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { UserProfile } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

/* ---------- Types ------------------------------------------------------- */

interface ForumCategory {
  id: string;
  name: string;
  color: string;
}

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
  seller_id: string | null;
  category_id: string | null;
  profile?: {
    nickname: string | null;
    subscription_active: boolean;
    subscription_tier: string;
    borough: string | null;
  } | null;
  category?: {
    name: string;
    color: string;
  } | null;
}

interface EnhancedSellerProfilesProps {
  userProfile: UserProfile;
}

/* ---------- Component --------------------------------------------------- */

export const EnhancedSellerProfiles = ({
  userProfile,
}: EnhancedSellerProfilesProps) => {
  const [listings, setListings] = useState<SellerListing[]>([]);
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState<string>("__placeholder");
  const [selectedBorough, setSelectedBorough] = useState<string>(
    userProfile?.borough ?? "__placeholder"
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<string>("__placeholder");

  /* --- Static data ------------------------------------------------------ */

  const berlinBoroughs = [
    "Mitte",
    "Friedrichshain-Kreuzberg",
    "Pankow",
    "Charlottenburg-Wilmersdorf",
    "Spandau",
    "Steglitz-Zehlendorf",
    "Tempelhof-Schöneberg",
    "Neukölln",
    "Treptow-Köpenick",
    "Marzahn-Hellersdorf",
    "Lichtenberg",
    "Reinickendorf",
  ];

  /* --- Lifecycle -------------------------------------------------------- */

  useEffect(() => {
    fetchCategories();
    fetchListings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, selectedBorough, sortBy]);

  /* --- Supabase helpers -------------------------------------------------- */

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("forum_categories")
      .select("*")
      .order("name");

    if (error) {
      console.error("Error fetching categories:", error);
      return;
    }
    setCategories(data ?? []);
  };

  const fetchListings = async () => {
    setLoading(true);

    /* 1️⃣  base query ----------------------------------------------------- */
    let query = supabase.from("seller_listings").select("*").eq("is_active", true);

    if (selectedCategory !== "all") query = query.eq("category_id", selectedCategory);
    if (selectedBorough !== "all") query = query.eq("borough", selectedBorough);

    switch (sortBy) {
      case "rating":
        query = query.order("rating_average", { ascending: false });
        break;
      case "views":
        query = query.order("views_count", { ascending: false });
        break;
      default:
        query = query.order("created_at", { ascending: false });
    }

    const { data: listingsData, error: listingsError } = await query;

    if (listingsError) {
      console.error("Error fetching listings:", listingsError);
      setLoading(false);
      return;
    }

    /* 2️⃣  Inject sample data if DB empty -------------------------------- */
    if ((listingsData?.length ?? 0) === 0) {
      const sampleCats: ForumCategory[] = [
        { id: "c1", name: "Handwerk", color: "#f5a623" },
        { id: "c2", name: "Haustechnik", color: "#50e3c2" },
        { id: "c3", name: "Design & Media", color: "#9b51e0" },
      ];

      const sampleListings: SellerListing[] = [
        {
          id: "l1",
          title: "Schreiner – Maß­arbeit für dein Zuhause",
          description:
            "Regale, Tische oder pass­ge­naue Küchen – alles aus einer Hand, gefertigt in Prenzlauer Berg.",
          price_range: "23 €/Std · Festpreis möglich",
          borough: "Pankow",
          is_featured: true,
          views_count: 132,
          rating_average: 4.8,
          rating_count: 21,
          created_at: new Date().toISOString(),
          seller_id: null,
          category_id: "c1",
        },
        {
          id: "l2",
          title: "Klempner-Notdienst 24/7",
          description:
            "Rohrbruch? Verstopfung? Wir sind in 30 Minuten in Neukölln oder Kreuzberg.",
          price_range: "29 €/Std",
          borough: "Neukölln",
          is_featured: false,
          views_count: 87,
          rating_average: 4.6,
          rating_count: 11,
          created_at: new Date(Date.now() - 864e5).toISOString(),
          seller_id: null,
          category_id: "c2",
        },
        {
          id: "l3",
          title: "Freelance Graphic Designer",
          description:
            "Logos, Social Ads & Pitch-Decks – 48-h Turnaround, remote oder vor Ort in Mitte.",
          price_range: "33 €/Std",
          borough: "Mitte",
          is_featured: false,
          views_count: 54,
          rating_average: 5.0,
          rating_count: 8,
          created_at: new Date(Date.now() - 2 * 864e5).toISOString(),
          seller_id: null,
          category_id: "c3",
        },
      ];

      setCategories((prev) => (prev.length === 0 ? sampleCats : prev));
      setListings(sampleListings);
      setLoading(false);
      return;
    }

    /* 3️⃣  Enrich each listing with profile & category ------------------- */
    const enriched: SellerListing[] = [];

    for (const listing of listingsData ?? []) {
      let profile = null;
      let category = null;

      if (listing.seller_id) {
        const { data } = await supabase
          .from("profiles")
          .select("nickname, subscription_active, subscription_tier, borough")
          .eq("id", listing.seller_id)
          .single();
        if (data) {
          profile = {
            nickname: data.nickname,
            subscription_active: data.subscription_active,
            subscription_tier: data.subscription_tier,
            borough: data.borough,
          };
        }
      }

      if (listing.category_id) {
        const { data } = await supabase
          .from("forum_categories")
          .select("name, color")
          .eq("id", listing.category_id)
          .single();
        if (data) category = { name: data.name, color: data.color };
      }

      enriched.push({ ...listing, profile, category });
    }

    setListings(enriched);
    setLoading(false);
  };

  /* --- Helpers ----------------------------------------------------------- */

  const filteredListings = listings.filter(
    (l) =>
      l.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderStars = (rating: number) =>
    Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating) ? "text-yellow-400 fill-current" : "text-gray-400"
        }`}
      />
    ));

  const formatTimeAgo = (iso: string) => {
    const diffHr = Math.floor((Date.now() - +new Date(iso)) / 36e5);
    if (diffHr < 1) return "vor wenigen Minuten";
    if (diffHr < 24) return `vor ${diffHr}h`;
    return `vor ${Math.floor(diffHr / 24)}d`;
  };

  /* --- JSX --------------------------------------------------------------- */

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
          {/* Filter / Search bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Kategorie */}
            <div>
              <label className="flex items-center gap-1 text-sm text-blue-300 mb-2">
                <Filter className="h-4 w-4" />
                Kategorie
              </label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Kategorie wählen" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="__placeholder" disabled>
                    Kategorie wählen
                  </SelectItem>
                  <SelectItem value="all" className="text-white hover:bg-slate-700">
                    Alle Kategorien
                  </SelectItem>
                  {categories.map((c) => (
                    <SelectItem
                      key={c.id}
                      value={c.id}
                      className="text-white hover:bg-slate-700"
                    >
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Bezirk */}
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
                  <SelectItem value="all" className="text-white hover:bg-slate-700">
                    Alle Bezirke
                  </SelectItem>
                  {berlinBoroughs.map((b) => (
                    <SelectItem
                      key={b}
                      value={b}
                      className="text-white hover:bg-slate-700"
                    >
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sortieren */}
            <div>
              <label className="text-sm text-blue-300 mb-2 block">Sortieren</label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Sortieren nach" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="__placeholder" disabled>
                    Sortieren nach
                  </SelectItem>
                  <SelectItem value="newest" className="text-white hover:bg-slate-700">
                    Neueste
                  </SelectItem>
                  <SelectItem value="rating" className="text-white hover:bg-slate-700">
                    Bewertung
                  </SelectItem>
                  <SelectItem value="views" className="text-white hover:bg-slate-700">
                    Aufrufe
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Suche */}
            <div className="relative">
              <label className="text-sm text-blue-300 mb-2 block">Suchen</label>
              <Search className="absolute left-3 top-[42px] h-4 w-4 text-blue-300 pointer-events-none" />
              <Input
                placeholder="Angebote durchsuchen …"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Listings grid ----------------------------------------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center text-blue-300 py-8">
            Lädt …
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="col-span-full text-center text-blue-300 py-8">
            Keine Angebote gefunden
          </div>
        ) : (
          filteredListings.map((listing) => (
            <Card
              key={listing.id}
              className="bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/15 transition-colors cursor-pointer"
            >
              <CardContent className="p-4">
                {/* Badges + time */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {listing.is_featured && (
                      <Badge className="bg-yellow-600 text-white text-xs">
                        ⭐ Featured
                      </Badge>
                    )}
                    {listing.category && (
                      <Badge
                        variant="outline"
                        className="border-blue-400 text-blue-300 text-xs"
                      >
                        {listing.category.name}
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-blue-300">
                    {formatTimeAgo(listing.created_at)}
                  </span>
                </div>

                {/* Title + description */}
                <h3 className="font-semibold text-lg mb-2 text-white">{listing.title}</h3>
                <p className="text-blue-200 text-sm mb-3 line-clamp-3">
                  {listing.description}
                </p>

                {/* Price badge */}
                {listing.price_range && (
                  <div className="mb-3">
                    <Badge
                      variant="outline"
                      className="border-green-400 text-green-300"
                    >
                      💰 {listing.price_range}
                    </Badge>
                  </div>
                )}

                {/* Stars + views */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1">
                    {renderStars(listing.rating_average)}
                    <span className="text-xs text-blue-300 ml-2">
                      ({listing.rating_count} Bewertungen)
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-blue-300">
                    <Eye className="h-3 w-3" />
                    <span>{listing.views_count}</span>
                  </div>
                </div>

                {/* Nickname + borough */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-blue-300">
                      {listing.profile?.nickname ?? "Anonym"}
                    </span>
                    {listing.profile?.subscription_active && (
                      <Badge className="bg-blue-600 text-white text-xs">
                        {listing.profile.subscription_tier}
                      </Badge>
                    )}
                  </div>
                  {listing.borough && (
                    <div className="flex items-center gap-1 text-xs text-green-300">
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
