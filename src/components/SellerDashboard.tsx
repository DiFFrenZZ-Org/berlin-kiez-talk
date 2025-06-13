import {
  useState,
  useCallback,
  useEffect,
  Fragment,
} from "react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

/* -------------------------------------------------------------------------- */
/*  Props                                                                     */
/* -------------------------------------------------------------------------- */

interface SellerDashboardProps {
  userProfile: UserProfile;
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export const SellerDashboard = ({
  userProfile,
}: SellerDashboardProps) => {
  /* ----------------------------- KPI state -------------------------------- */
  const [views, setViews] = useState(0);
  const [reviews, setReviews] = useState(0);
  const [activeChats, setActiveChats] = useState(0);
  const [totalSales, setTotalSales] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [aov, setAov] = useState(0);

  /* -------------------------- Subscription state -------------------------- */
  const [tier, setTier] = useState<
    UserProfile["subscription_tier"] | "__placeholder"
  >(userProfile.subscription_tier ?? "__placeholder");

  const [active, setActive] = useState<boolean>(
    Boolean(userProfile.subscription_active),
  );

  const { toast } = useToast();

  /* ----------------------------------------------------------------------- */
  /*  Fetch metrics – wrapped in useCallback so the effect can depend on it  */
  /* ----------------------------------------------------------------------- */
  const fetchMetrics = useCallback(async () => {
    try {
      /* --------- aggregated KPI view (seller_kpis) --------- */
      const { data: kpis, error: kpiErr } = await supabase
        .from("seller_kpis")
        .select(
          "total_views, total_reviews, total_sales, total_revenue, average_order_value",
        )
        .eq("seller_id", userProfile.id)
        .maybeSingle();

      if (kpiErr) throw kpiErr;

      if (kpis) {
        setViews(kpis.total_views);
        setReviews(kpis.total_reviews);
        setTotalSales(kpis.total_sales);
        setRevenue(kpis.total_revenue);
        setAov(kpis.average_order_value);
      }

      /* --------- active chat rooms (quick count) --------- */
      const { data: rooms } = await supabase
        .from("chat_rooms")
        .select("expires_at")
        .eq("created_by", userProfile.id);

      const now = Date.now();
      const count =
        rooms?.filter(
          (r) => !r.expires_at || Date.parse(r.expires_at) > now,
        ).length ?? 0;
      setActiveChats(count);
    } catch (err) {
      console.error("Failed to load seller KPIs:", err);
      toast({
        title: "Fehler",
        description: "Metriken konnten nicht geladen werden",
        variant: "destructive",
      });
    }
  }, [userProfile.id, toast]);

  /* ----------------------------- Lifecycle -------------------------------- */
  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  /* ------------------------- Save subscription --------------------------- */
  const saveSubscription = async () => {
    const { error } = await supabase
      .from("profiles")
      .update({
        subscription_tier: tier === "__placeholder" ? null : tier,
        subscription_active: active,
      })
      .eq("id", userProfile.id);

    if (error) {
      toast({
        title: "Fehler",
        description: "Abo konnte nicht aktualisiert werden",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Erfolgreich",
        description: "Abo aktualisiert",
      });
      fetchMetrics(); // refresh after change
    }
  };

  /* ----------------------------------------------------------------------- */
  /*  UI                                                                     */
  /* ----------------------------------------------------------------------- */
  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
      <CardHeader>
        <CardTitle>Seller Dashboard</CardTitle>
        <CardDescription className="text-blue-200">
          Übersicht über deine Aktivitäten
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* KPI GRID */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-center">
          {/* Views */}
          <Kpi label="Aufrufe" value={views} />
          {/* Reviews */}
          <Kpi label="Bewertungen" value={reviews} />
          {/* Chats */}
          <Kpi label="Aktive Chats" value={activeChats} />
          {/* Tier */}
          <div>
            <p className="text-sm text-blue-300">Abo-Tier</p>
            <Badge className="mt-1">
              {tier === "__placeholder" ? "–" : tier}
            </Badge>
          </div>
          {/* Sales */}
          <Kpi label="Bestellungen" value={totalSales} />
          {/* Revenue */}
          <Kpi
            label="Umsatz (€)"
            value={revenue.toLocaleString("de-DE", {
              minimumFractionDigits: 2,
            })}
          />
          {/* AOV */}
          <Kpi
            label="Ø Warenkorb (€)"
            value={aov.toLocaleString("de-DE", {
              minimumFractionDigits: 2,
            })}
          />
        </div>

        {/* Subscription controls */}
        <div className="space-y-4">
          {/* Tier select */}
          <div>
            <label className="text-sm text-blue-300 mb-2 block">
              Tier wählen
            </label>

            <Select
              value={tier}
              onValueChange={(val) =>
                setTier(
                  val as UserProfile["subscription_tier"] | "__placeholder",
                )
              }
            >
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="Tier" />
              </SelectTrigger>

              <SelectContent className="bg-slate-800 border-slate-600 text-white">
                <SelectItem value="__placeholder" disabled>
                  Tier
                </SelectItem>
                <SelectItem value="basic">basic</SelectItem>
                <SelectItem value="pro">pro</SelectItem>
                <SelectItem value="premium">premium</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Active switch */}
          <div className="flex items-center space-x-2">
            <Switch
              id="active"
              checked={active}
              onCheckedChange={() => setActive((prev) => !prev)}
            />
            <label htmlFor="active" className="text-sm">
              Aktiv
            </label>
          </div>

          {/* Save */}
          <Button
            onClick={saveSubscription}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Speichern
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

/* -------------------------------------------------------------------------- */
/*  Small KPI component (keeps JSX tidy)                                      */
/* -------------------------------------------------------------------------- */

interface KpiProps {
  label: string;
  value: string | number;
}

const Kpi = ({ label, value }: KpiProps) => (
  <Fragment>
    <div>
      <p className="text-sm text-blue-300">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  </Fragment>
);
