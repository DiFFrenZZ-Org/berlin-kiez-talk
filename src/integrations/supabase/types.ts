export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      chat_rooms: {
        Row: {
          borough: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          expires_at: string | null
          id: string
          is_private: boolean | null
          is_temporary: boolean | null
          max_participants: number | null
          name: string
        }
        Insert: {
          borough?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          is_private?: boolean | null
          is_temporary?: boolean | null
          max_participants?: number | null
          name: string
        }
        Update: {
          borough?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          is_private?: boolean | null
          is_temporary?: boolean | null
          max_participants?: number | null
          name?: string
        }
        Relationships: []
      }
      forum_categories: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      forum_posts: {
        Row: {
          borough: string | null
          category_id: string | null
          content: string
          created_at: string | null
          expires_at: string | null
          id: string
          is_private: boolean | null
          likes_count: number | null
          post_type: Database["public"]["Enums"]["post_type"]
          replies_count: number | null
          title: string
          updated_at: string | null
          user_id: string | null
          views_count: number | null
        }
        Insert: {
          borough?: string | null
          category_id?: string | null
          content: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_private?: boolean | null
          likes_count?: number | null
          post_type?: Database["public"]["Enums"]["post_type"]
          replies_count?: number | null
          title: string
          updated_at?: string | null
          user_id?: string | null
          views_count?: number | null
        }
        Update: {
          borough?: string | null
          category_id?: string | null
          content?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_private?: boolean | null
          likes_count?: number | null
          post_type?: Database["public"]["Enums"]["post_type"]
          replies_count?: number | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "forum_posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "forum_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_replies: {
        Row: {
          content: string
          created_at: string | null
          id: string
          parent_reply_id: string | null
          post_id: string | null
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          parent_reply_id?: string | null
          post_id?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          parent_reply_id?: string | null
          post_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "forum_replies_parent_reply_id_fkey"
            columns: ["parent_reply_id"]
            isOneToOne: false
            referencedRelation: "forum_replies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_replies_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          borough: string | null
          created_at: string | null
          email: string
          id: string
          nickname: string | null
          reputation_score: number | null
          subscription_active: boolean | null
          subscription_end: string | null
          subscription_tier:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          updated_at: string | null
          user_role: Database["public"]["Enums"]["user_role"]
          verified_local: boolean | null
        }
        Insert: {
          borough?: string | null
          created_at?: string | null
          email: string
          id: string
          nickname?: string | null
          reputation_score?: number | null
          subscription_active?: boolean | null
          subscription_end?: string | null
          subscription_tier?:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          updated_at?: string | null
          user_role?: Database["public"]["Enums"]["user_role"]
          verified_local?: boolean | null
        }
        Update: {
          borough?: string | null
          created_at?: string | null
          email?: string
          id?: string
          nickname?: string | null
          reputation_score?: number | null
          subscription_active?: boolean | null
          subscription_end?: string | null
          subscription_tier?:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          updated_at?: string | null
          user_role?: Database["public"]["Enums"]["user_role"]
          verified_local?: boolean | null
        }
        Relationships: []
      }
      seller_listings: {
        Row: {
          borough: string | null
          category_id: string | null
          created_at: string | null
          description: string
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          price_range: string | null
          rating_average: number | null
          rating_count: number | null
          seller_id: string | null
          title: string
          updated_at: string | null
          views_count: number | null
        }
        Insert: {
          borough?: string | null
          category_id?: string | null
          created_at?: string | null
          description: string
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          price_range?: string | null
          rating_average?: number | null
          rating_count?: number | null
          seller_id?: string | null
          title: string
          updated_at?: string | null
          views_count?: number | null
        }
        Update: {
          borough?: string | null
          category_id?: string | null
          created_at?: string | null
          description?: string
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          price_range?: string | null
          rating_average?: number | null
          rating_count?: number | null
          seller_id?: string | null
          title?: string
          updated_at?: string | null
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "seller_listings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "forum_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_ratings: {
        Row: {
          buyer_id: string | null
          created_at: string | null
          id: string
          listing_id: string | null
          rating: number | null
          review_text: string | null
          seller_id: string | null
        }
        Insert: {
          buyer_id?: string | null
          created_at?: string | null
          id?: string
          listing_id?: string | null
          rating?: number | null
          review_text?: string | null
          seller_id?: string | null
        }
        Update: {
          buyer_id?: string | null
          created_at?: string | null
          id?: string
          listing_id?: string | null
          rating?: number | null
          review_text?: string | null
          seller_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seller_ratings_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "seller_listings"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      post_type: "offering" | "searching" | "discussion"
      subscription_tier: "basic" | "pro" | "premium"
      user_role: "seller" | "buyer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      post_type: ["offering", "searching", "discussion"],
      subscription_tier: ["basic", "pro", "premium"],
      user_role: ["seller", "buyer"],
    },
  },
} as const
