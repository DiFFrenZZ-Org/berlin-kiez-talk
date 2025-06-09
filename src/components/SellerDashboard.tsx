import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface SellerDashboardProps {
  userProfile: UserProfile;
}

export const SellerDashboard = ({ userProfile }: SellerDashboardProps) => {
  const [views, setViews] = useState(0);
  const [reviews, setReviews] = useState(0);
  const [activeChats, setActiveChats] = useState(0);
  const [tier, setTier] = useState<UserProfile["subscription_tier"]>(userProfile.subscription_tier);
  const [active, setActive] = useState(userProfile.subscription_active);
  const { toast } = useToast();

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    const { data: listings } = await supabase
      .from('seller_listings')
      .select('views_count')
      .eq('seller_id', userProfile.id);
    const totalViews = (listings || []).reduce((acc, cur) => acc + (cur.views_count || 0), 0);
    setViews(totalViews);

    const { data: ratings } = await supabase
      .from('seller_ratings')
      .select('id')
      .eq('seller_id', userProfile.id);
    setReviews((ratings || []).length);

    const { data: rooms } = await supabase
      .from('chat_rooms')
      .select('expires_at')
      .eq('created_by', userProfile.id);
    const now = new Date();
    const activeCount = (rooms || []).filter(r => !r.expires_at || new Date(r.expires_at) > now).length;
    setActiveChats(activeCount);
  };

  const saveSubscription = async () => {
    const { error } = await supabase
      .from('profiles')
      .update({ subscription_tier: tier, subscription_active: active })
      .eq('id', userProfile.id);

    if (error) {
      toast({ title: 'Fehler', description: 'Abo konnte nicht aktualisiert werden', variant: 'destructive' });
    } else {
      toast({ title: 'Erfolgreich', description: 'Abo aktualisiert' });
    }
  };

  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
      <CardHeader>
        <CardTitle>Seller Dashboard</CardTitle>
        <CardDescription className="text-blue-200">Übersicht über deine Aktivitäten</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-sm text-blue-300">Aufrufe</p>
            <p className="text-2xl font-bold">{views}</p>
          </div>
          <div>
            <p className="text-sm text-blue-300">Bewertungen</p>
            <p className="text-2xl font-bold">{reviews}</p>
          </div>
          <div>
            <p className="text-sm text-blue-300">Aktive Chats</p>
            <p className="text-2xl font-bold">{activeChats}</p>
          </div>
          <div>
            <p className="text-sm text-blue-300">Abo-Tier</p>
            <Badge className="mt-1">{tier}</Badge>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-blue-300 mb-2 block">Tier wählen</label>
            <Select value={tier} onValueChange={(val) => setTier(val as UserProfile["subscription_tier"])}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="Tier" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600 text-white">
                <SelectItem value="basic">basic</SelectItem>
                <SelectItem value="pro">pro</SelectItem>
                <SelectItem value="premium">premium</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="active" checked={active} onCheckedChange={() => setActive(!active)} />
            <label htmlFor="active" className="text-sm">Aktiv</label>
          </div>
          <Button onClick={saveSubscription} className="bg-blue-600 hover:bg-blue-700">Speichern</Button>
        </div>
      </CardContent>
    </Card>
  );
};
