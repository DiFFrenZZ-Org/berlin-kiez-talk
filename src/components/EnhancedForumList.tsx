import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  type FC,
} from "react";
import {
  MessageSquare,
  Eye,
  Heart,
  Plus,
} from "lucide-react";

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
import { NewPostDialog } from "./NewPostDialog";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ForumPost {
  id: string;
  title: string;
  content: string;
  post_type: "offering" | "searching" | "discussion";
  borough: string | null;
  views_count: number;
  likes_count: number;
  replies_count: number;
  created_at: string;
  user_id: string | null;
  category_id: string | null;
  profile?: { nickname: string | null; borough: string | null } | null;
  category?: { name: string; color: string; icon: string | null } | null;
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

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const BERLIN_BOROUGHS = [
  "Mitte",
  "Friedrichshain-Kreuzberg",
  "Pankow",
  "Charlottenburg-Wilmersdorf",
  "Spandau",
  "Steglitz-Zehlendorf",
  "Tempelhofer-Schöneberg",
  "Neukölln",
  "Treptow-Köpenick",
  "Marzahn-Hellersdorf",
  "Lichtenberg",
  "Reinickendorf",
] as const;

const POST_TYPES = [
  { value: "offering", label: "Bieten", color: "bg-green-600" },
  { value: "searching", label: "Suchen", color: "bg-blue-600" },
  { value: "discussion", label: "Diskussion", color: "bg-purple-600" },
] as const;

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export const EnhancedForumList: FC<EnhancedForumListProps> = ({
  userProfile,
}) => {
  /* ---------------- state ---------------- */
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [openNew, setOpenNew] = useState(false);

  const [selectedCategory, setSelectedCategory] =
    useState<string>("all");
  const [selectedPostType, setSelectedPostType] =
    useState<string>("all");
  const [selectedBorough, setSelectedBorough] =
    useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  /* ---------------- helpers -------------- */
  const formatTimeAgo = (iso: string): string => {
    const date = new Date(iso);
    const now = new Date();
    const diffH = Math.floor(
      (now.getTime() - date.getTime()) / 36e5,
    );

    if (diffH < 1) return "vor wenigen Minuten";
    if (diffH < 24) return `vor ${diffH} h`;
    return `vor ${Math.floor(diffH / 24)} d`;
  };

  const getPostTypeInfo = (type: string) =>
    POST_TYPES.find((t) => t.value === type) ?? POST_TYPES[2];

  /* ---------------- data ----------------- */

  /** categories never depend on filters */
  const fetchCategories = useCallback(async () => {
    const { data, error } = await supabase
      .from("forum_categories")
      .select("*")
      .order("name");

    if (!error) setCategories(data ?? []);
  }, []);

  /** posts depend on three filters */
  const fetchPosts = useCallback(async () => {
    setLoading(true);

    let q = supabase
      .from("forum_posts")
      .select("*")
      .eq("is_private", false)
      .order("created_at", { ascending: false });

    if (selectedCategory !== "all")
      q = q.eq("category_id", selectedCategory);
    if (selectedPostType !== "all")
      q = q.eq(
        "post_type",
        selectedPostType as ForumPost["post_type"],
      );
    if (selectedBorough !== "all") q = q.eq("borough", selectedBorough);

    const { data: rawPosts, error } = await q;
    if (error || !rawPosts) {
      setLoading(false);
      return;
    }

    /* enrich posts with profile & category */
    const enriched: ForumPost[] = [];
    for (const p of rawPosts) {
      const [profileRes, categoryRes] = await Promise.all([
        p.user_id
          ? supabase
              .from("profiles")
              .select("nickname, borough")
              .eq("id", p.user_id)
              .maybeSingle()
          : { data: null },
        p.category_id
          ? supabase
              .from("forum_categories")
              .select("name, color, icon")
              .eq("id", p.category_id)
              .maybeSingle()
          : { data: null },
      ]);

      enriched.push({
        ...p,
        profile: profileRes.data ?? null,
        category: categoryRes.data ?? null,
      });
    }

    setPosts(enriched);
    setLoading(false);
  }, [selectedCategory, selectedPostType, selectedBorough]);

  /* ---------------- effects -------------- */
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  /* ---------------- derived -------------- */
  const filteredPosts = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return posts.filter(
      (p) =>
        p.title.toLowerCase().includes(term) ||
        p.content.toLowerCase().includes(term),
    );
  }, [posts, searchTerm]);

  /* ---------------- render --------------- */
  return (
    <div className="space-y-6">
      {/* Header & filters */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Forum</CardTitle>
              <CardDescription className="text-blue-200">
                Diskutiere mit deinem Kiez
              </CardDescription>
            </div>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => setOpenNew(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Neuer Beitrag
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* filter grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* category */}
            <FilterSelect
              label="Kategorie"
              value={selectedCategory}
              onChange={setSelectedCategory}
              placeholder="Kategorie wählen"
              items={[
                { value: "all", label: "Alle Kategorien" },
                ...categories.map((c) => ({
                  value: c.id,
                  label: c.name,
                })),
              ]}
            />

            {/* post type */}
            <FilterSelect
              label="Typ"
              value={selectedPostType}
              onChange={setSelectedPostType}
              placeholder="Typ wählen"
              items={[
                { value: "all", label: "Alle Typen" },
                ...POST_TYPES.map((t) => ({
                  value: t.value,
                  label: t.label,
                })),
              ]}
            />

            {/* borough */}
            <FilterSelect
              label="Bezirk"
              value={selectedBorough}
              onChange={setSelectedBorough}
              placeholder="Bezirk wählen"
              items={[
                { value: "all", label: "Alle Bezirke" },
                ...BERLIN_BOROUGHS.map((b) => ({
                  value: b,
                  label: b,
                })),
              ]}
            />

            {/* search */}
            <div>
              <label className="text-sm text-blue-300 mb-2 block">
                Suchen
              </label>
              <Input
                placeholder="Beiträge durchsuchen…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Posts list */}
      <div className="space-y-4">
        {loading ? (
          <p className="text-center text-blue-300 py-8">Lädt…</p>
        ) : filteredPosts.length === 0 ? (
          <p className="text-center text-blue-300 py-8">
            Keine Beiträge gefunden
          </p>
        ) : (
          filteredPosts.map((post) => {
            const info = getPostTypeInfo(post.post_type);
            return (
              <Card
                key={post.id}
                className="bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/15 transition-colors cursor-pointer"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <Badge className={`${info.color} text-white`}>
                        {info.label}
                      </Badge>

                      {post.category && (
                        <Badge
                          variant="outline"
                          className="border-blue-400 text-blue-300"
                        >
                          {post.category.name}
                        </Badge>
                      )}

                      {post.borough && (
                        <Badge
                          variant="outline"
                          className="border-green-400 text-green-300"
                        >
                          📍 {post.borough}
                        </Badge>
                      )}
                    </div>

                    <span className="text-xs text-blue-300">
                      {formatTimeAgo(post.created_at)}
                    </span>
                  </div>

                  <h3 className="font-semibold text-lg mb-2 text-white">
                    {post.title}
                  </h3>
                  <p className="text-blue-200 text-sm mb-3 line-clamp-2">
                    {post.content}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-xs text-blue-300">
                      <span>
                        von {post.profile?.nickname ?? "Anonym"}
                      </span>
                      {post.profile?.borough && (
                        <span>aus {post.profile.borough}</span>
                      )}
                    </div>

                    <div className="flex items-center space-x-4 text-xs text-blue-300">
                      <IconStat icon={Eye} value={post.views_count} />
                      <IconStat icon={Heart} value={post.likes_count} />
                      <IconStat
                        icon={MessageSquare}
                        value={post.replies_count}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* new-post dialog */}
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

/* ------------------------------------------------------------------ */
/*  Small helpers                                                      */
/* ------------------------------------------------------------------ */

interface FilterSelectProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  items: { value: string; label: string }[];
}

const FilterSelect: FC<FilterSelectProps> = ({
  label,
  value,
  onChange,
  placeholder,
  items,
}) => (
  <div>
    <label className="text-sm text-blue-300 mb-2 block">{label}</label>
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="bg-white/10 border-white/20 text-white">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="bg-slate-800 border-slate-600 text-white">
        {items.map(({ value: v, label: l }) => (
          <SelectItem key={v} value={v}>
            {l}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);

interface IconStatProps {
  icon: FC<{ className: string }>;
  value: number;
}

const IconStat: FC<IconStatProps> = ({ icon: Icon, value }) => (
  <div className="flex items-center space-x-1">
    <Icon className="h-3 w-3" />
    <span>{value}</span>
  </div>
);
