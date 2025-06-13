import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "@/hooks/useAuth";

type PostType = "__placeholder" | "offering" | "searching" | "discussion";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  categories: { id: string; name: string }[];
  onCreated?: () => void;
  userProfile: UserProfile;
}

export const NewPostDialog = ({
  open,
  onOpenChange,
  categories,
  onCreated,
  userProfile,
}: Props) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<string>("__placeholder");
  const [type, setType] = useState<PostType>("__placeholder");

  const createPost = async () => {
    if (!title.trim() || !content.trim()) return;

    await supabase.from("forum_posts").insert({
      title,
      content,
      category_id: category || null,
      post_type: type,
      user_id: userProfile.id,
      borough: userProfile.borough,
    });

    setTitle("");
    setContent("");
    setCategory("__placeholder");
    onOpenChange(false);

    if (onCreated) {
      onCreated();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white/10 border-white/20 text-white">
        <DialogHeader>
          <DialogTitle>Neuen Beitrag erstellen</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titel"
            className="bg-white/10 border-white/20"
          />

          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Inhalt"
            className="bg-white/10 border-white/20"
          />

          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="bg-white/10 border-white/20">
              <SelectValue placeholder="Kategorie" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 text-white">
              <SelectItem value="__placeholder" disabled>
                Kategorie
              </SelectItem>
              <SelectItem value="">Keine</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={type} onValueChange={(v) => setType(v as PostType)}>
            <SelectTrigger className="bg-white/10 border-white/20">
              <SelectValue placeholder="Typ" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 text-white">
              <SelectItem value="__placeholder" disabled>
                Typ
              </SelectItem>
              <SelectItem value="offering">Bieten</SelectItem>
              <SelectItem value="searching">Suchen</SelectItem>
              <SelectItem value="discussion">Diskussion</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button
            onClick={createPost}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Posten
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
