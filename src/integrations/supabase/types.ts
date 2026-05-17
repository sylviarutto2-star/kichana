export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          appointment_date: string
          appointment_time: string
          created_at: string
          customer_id: string
          deposit_amount: number
          deposit_paid: boolean | null
          id: string
          inspiration_photo: string | null
          location_type: string
          notes: string | null
          platform_fee: number
          remaining_balance: number
          service_id: string
          status: string
          stylist_id: string
          total_price: number
          updated_at: string
        }
        Insert: {
          appointment_date: string
          appointment_time: string
          created_at?: string
          customer_id: string
          deposit_amount?: number
          deposit_paid?: boolean | null
          id?: string
          inspiration_photo?: string | null
          location_type: string
          notes?: string | null
          platform_fee?: number
          remaining_balance?: number
          service_id: string
          status?: string
          stylist_id: string
          total_price: number
          updated_at?: string
        }
        Update: {
          appointment_date?: string
          appointment_time?: string
          created_at?: string
          customer_id?: string
          deposit_amount?: number
          deposit_paid?: boolean | null
          id?: string
          inspiration_photo?: string | null
          location_type?: string
          notes?: string | null
          platform_fee?: number
          remaining_balance?: number
          service_id?: string
          status?: string
          stylist_id?: string
          total_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_stylist_id_fkey"
            columns: ["stylist_id"]
            isOneToOne: false
            referencedRelation: "stylists"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          booking_id: string | null
          created_at: string
          id: string
          message_text: string
          read: boolean | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          id?: string
          message_text: string
          read?: boolean | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          id?: string
          message_text?: string
          read?: boolean | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          created_at: string
          id: string
          is_default: boolean
          label: string
          phone_number: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string
          phone_number: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string
          phone_number?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          booking_id: string
          checkout_request_id: string | null
          created_at: string
          id: string
          merchant_request_id: string | null
          mpesa_receipt_number: string | null
          phone_number: string
          result_description: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          booking_id: string
          checkout_request_id?: string | null
          created_at?: string
          id?: string
          merchant_request_id?: string | null
          mpesa_receipt_number?: string | null
          phone_number: string
          result_description?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          booking_id?: string
          checkout_request_id?: string | null
          created_at?: string
          id?: string
          merchant_request_id?: string | null
          mpesa_receipt_number?: string | null
          phone_number?: string
          result_description?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_images: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          image_url: string
          is_cover: boolean
          media_type: string
          service_id: string | null
          sort_order: number
          stylist_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url: string
          is_cover?: boolean
          media_type?: string
          service_id?: string | null
          sort_order?: number
          stylist_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url?: string
          is_cover?: boolean
          media_type?: string
          service_id?: string | null
          sort_order?: number
          stylist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_images_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portfolio_images_stylist_id_fkey"
            columns: ["stylist_id"]
            isOneToOne: false
            referencedRelation: "stylists"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          latitude: number | null
          location: string | null
          longitude: number | null
          name: string
          phone: string | null
          profile_photo: string | null
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          name?: string
          phone?: string | null
          profile_photo?: string | null
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          name?: string
          phone?: string | null
          profile_photo?: string | null
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          booking_id: string
          comment: string | null
          created_at: string
          customer_id: string
          id: string
          rating: number
          stylist_id: string
        }
        Insert: {
          booking_id: string
          comment?: string | null
          created_at?: string
          customer_id: string
          id?: string
          rating: number
          stylist_id: string
        }
        Update: {
          booking_id?: string
          comment?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          rating?: number
          stylist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_stylist_id_fkey"
            columns: ["stylist_id"]
            isOneToOne: false
            referencedRelation: "stylists"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          active: boolean
          category: string | null
          created_at: string
          deposit_override: number | null
          description: string | null
          duration: string | null
          duration_min: number | null
          hair_type_tags: string[]
          id: string
          images: string[] | null
          intro_offer_active: boolean
          intro_offer_percent: number | null
          name: string
          price: number
          sort_order: number
          stylist_id: string
          subcategory: string | null
        }
        Insert: {
          active?: boolean
          category?: string | null
          created_at?: string
          deposit_override?: number | null
          description?: string | null
          duration?: string | null
          duration_min?: number | null
          hair_type_tags?: string[]
          id?: string
          images?: string[] | null
          intro_offer_active?: boolean
          intro_offer_percent?: number | null
          name: string
          price: number
          sort_order?: number
          stylist_id: string
          subcategory?: string | null
        }
        Update: {
          active?: boolean
          category?: string | null
          created_at?: string
          deposit_override?: number | null
          description?: string | null
          duration?: string | null
          duration_min?: number | null
          hair_type_tags?: string[]
          id?: string
          images?: string[] | null
          intro_offer_active?: boolean
          intro_offer_percent?: number | null
          name?: string
          price?: number
          sort_order?: number
          stylist_id?: string
          subcategory?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "services_stylist_id_fkey"
            columns: ["stylist_id"]
            isOneToOne: false
            referencedRelation: "stylists"
            referencedColumns: ["id"]
          },
        ]
      }
      stylist_availability: {
        Row: {
          created_at: string
          end_time: string
          id: string
          start_time: string
          stylist_id: string
          weekday: number
        }
        Insert: {
          created_at?: string
          end_time: string
          id?: string
          start_time: string
          stylist_id: string
          weekday: number
        }
        Update: {
          created_at?: string
          end_time?: string
          id?: string
          start_time?: string
          stylist_id?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "stylist_availability_stylist_id_fkey"
            columns: ["stylist_id"]
            isOneToOne: false
            referencedRelation: "stylists"
            referencedColumns: ["id"]
          },
        ]
      }
      stylist_policies: {
        Row: {
          cancellation_hours: number
          created_at: string
          custom_terms: string | null
          deposit_refundable: boolean
          late_grace_min: number
          no_show_fee_percent: number
          stylist_id: string
          updated_at: string
        }
        Insert: {
          cancellation_hours?: number
          created_at?: string
          custom_terms?: string | null
          deposit_refundable?: boolean
          late_grace_min?: number
          no_show_fee_percent?: number
          stylist_id: string
          updated_at?: string
        }
        Update: {
          cancellation_hours?: number
          created_at?: string
          custom_terms?: string | null
          deposit_refundable?: boolean
          late_grace_min?: number
          no_show_fee_percent?: number
          stylist_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stylist_policies_stylist_id_fkey"
            columns: ["stylist_id"]
            isOneToOne: true
            referencedRelation: "stylists"
            referencedColumns: ["id"]
          },
        ]
      }
      stylist_schedule_overrides: {
        Row: {
          created_at: string
          date: string
          end_time: string | null
          id: string
          is_closed: boolean
          reason: string | null
          start_time: string | null
          stylist_id: string
        }
        Insert: {
          created_at?: string
          date: string
          end_time?: string | null
          id?: string
          is_closed?: boolean
          reason?: string | null
          start_time?: string | null
          stylist_id: string
        }
        Update: {
          created_at?: string
          date?: string
          end_time?: string | null
          id?: string
          is_closed?: boolean
          reason?: string | null
          start_time?: string | null
          stylist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stylist_schedule_overrides_stylist_id_fkey"
            columns: ["stylist_id"]
            isOneToOne: false
            referencedRelation: "stylists"
            referencedColumns: ["id"]
          },
        ]
      }
      stylists: {
        Row: {
          bio: string | null
          buffer_minutes: number
          completed_bookings_count: number
          created_at: string
          deposit_percentage: number
          display_name: string | null
          early_program: boolean
          early_program_start: string | null
          hero_image_url: string | null
          home_service_enabled: boolean
          id: string
          latitude: number | null
          longitude: number | null
          rating: number | null
          review_count: number | null
          service_areas: string[] | null
          specialties: string[]
          transport_fee: number
          travels: boolean
          updated_at: string
          user_id: string
          verified: boolean | null
          years_experience: number | null
        }
        Insert: {
          bio?: string | null
          buffer_minutes?: number
          completed_bookings_count?: number
          created_at?: string
          deposit_percentage?: number
          display_name?: string | null
          early_program?: boolean
          early_program_start?: string | null
          hero_image_url?: string | null
          home_service_enabled?: boolean
          id?: string
          latitude?: number | null
          longitude?: number | null
          rating?: number | null
          review_count?: number | null
          service_areas?: string[] | null
          specialties?: string[]
          transport_fee?: number
          travels?: boolean
          updated_at?: string
          user_id: string
          verified?: boolean | null
          years_experience?: number | null
        }
        Update: {
          bio?: string | null
          buffer_minutes?: number
          completed_bookings_count?: number
          created_at?: string
          deposit_percentage?: number
          display_name?: string | null
          early_program?: boolean
          early_program_start?: string | null
          hero_image_url?: string | null
          home_service_enabled?: boolean
          id?: string
          latitude?: number | null
          longitude?: number | null
          rating?: number | null
          review_count?: number | null
          service_areas?: string[] | null
          specialties?: string[]
          transport_fee?: number
          travels?: boolean
          updated_at?: string
          user_id?: string
          verified?: boolean | null
          years_experience?: number | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          booking_id: string
          commission_amount: number
          created_at: string
          id: string
          mpesa_receipt: string | null
          payment_method: string | null
          payment_status: string
          stylist_payout: number
          total_amount: number
        }
        Insert: {
          booking_id: string
          commission_amount: number
          created_at?: string
          id?: string
          mpesa_receipt?: string | null
          payment_method?: string | null
          payment_status?: string
          stylist_payout: number
          total_amount: number
        }
        Update: {
          booking_id?: string
          commission_amount?: number
          created_at?: string
          id?: string
          mpesa_receipt?: string | null
          payment_method?: string | null
          payment_status?: string
          stylist_payout?: number
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "transactions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_booking_conflict: {
        Args: {
          p_date: string
          p_duration_minutes?: number
          p_stylist_id: string
          p_time: string
        }
        Returns: boolean
      }
      get_available_slots: {
        Args: { p_date: string; p_stylist_id: string }
        Returns: {
          time_slot: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
