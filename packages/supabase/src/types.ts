export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      admin_audit_logs: {
        Row: {
          action: string
          actor_id: string
          changes: Json | null
          created_at: string
          id: string
          target_id: string
          target_table: string
        }
        Insert: {
          action: string
          actor_id: string
          changes?: Json | null
          created_at?: string
          id?: string
          target_id: string
          target_table: string
        }
        Update: {
          action?: string
          actor_id?: string
          changes?: Json | null
          created_at?: string
          id?: string
          target_id?: string
          target_table?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_users: {
        Row: {
          created_at: string
          deleted_at: string | null
          display_name: string
          id: string
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          display_name: string
          id: string
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          display_name?: string
          id?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      certification_tags: {
        Row: {
          certification_id: string
          tag: string
        }
        Insert: {
          certification_id: string
          tag: string
        }
        Update: {
          certification_id?: string
          tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "certification_tags_certification_id_fkey"
            columns: ["certification_id"]
            isOneToOne: false
            referencedRelation: "certifications"
            referencedColumns: ["id"]
          },
        ]
      }
      certifications: {
        Row: {
          acquired_location: string | null
          acquired_on: string
          agency: string
          created_at: string
          dive_id: string | null
          diver_number: string | null
          id: string
          instructor_number: string | null
          rank: string
          trained_by: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          acquired_location?: string | null
          acquired_on: string
          agency: string
          created_at?: string
          dive_id?: string | null
          diver_number?: string | null
          id?: string
          instructor_number?: string | null
          rank: string
          trained_by?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          acquired_location?: string | null
          acquired_on?: string
          agency?: string
          created_at?: string
          dive_id?: string | null
          diver_number?: string | null
          id?: string
          instructor_number?: string | null
          rank?: string
          trained_by?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certifications_dive_id_fkey"
            columns: ["dive_id"]
            isOneToOne: false
            referencedRelation: "dives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      dive_photos: {
        Row: {
          caption: string
          created_at: string
          deleted_at: string | null
          display_path: string
          dive_id: string
          height: number | null
          id: string
          is_cover: boolean
          sort_order: number
          thumb_path: string
          updated_at: string
          user_id: string
          width: number | null
        }
        Insert: {
          caption?: string
          created_at?: string
          deleted_at?: string | null
          display_path: string
          dive_id: string
          height?: number | null
          id?: string
          is_cover?: boolean
          sort_order?: number
          thumb_path: string
          updated_at?: string
          user_id: string
          width?: number | null
        }
        Update: {
          caption?: string
          created_at?: string
          deleted_at?: string | null
          display_path?: string
          dive_id?: string
          height?: number | null
          id?: string
          is_cover?: boolean
          sort_order?: number
          thumb_path?: string
          updated_at?: string
          user_id?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "dive_photos_dive_id_fkey"
            columns: ["dive_id"]
            isOneToOne: false
            referencedRelation: "dives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dive_photos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      dive_plans: {
        Row: {
          created_at: string
          id: string
          location: string
          notes: string | null
          planned_on: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          location: string
          notes?: string | null
          planned_on: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          location?: string
          notes?: string | null
          planned_on?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dive_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      dive_sites: {
        Row: {
          area: string | null
          country: string
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          area?: string | null
          country?: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          area?: string | null
          country?: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      dive_log_buddies: {
        Row: {
          buddy_name: string | null
          buddy_user_id: string | null
          created_at: string
          dive_id: string
          id: string
          removed_by_buddy: boolean
        }
        Insert: {
          buddy_name?: string | null
          buddy_user_id?: string | null
          created_at?: string
          dive_id: string
          id?: string
          removed_by_buddy?: boolean
        }
        Update: {
          buddy_name?: string | null
          buddy_user_id?: string | null
          created_at?: string
          dive_id?: string
          id?: string
          removed_by_buddy?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "dive_log_buddies_dive_id_fkey"
            columns: ["dive_id"]
            isOneToOne: false
            referencedRelation: "dives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dive_log_buddies_buddy_user_id_fkey"
            columns: ["buddy_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      dives: {
        Row: {
          air_temp_c: number | null
          avg_depth_m: number | null
          bottom_time_min: number
          buddy_name: string | null
          certification_dive: boolean
          created_at: string
          current_condition: string | null
          deleted_at: string | null
          dive_date: string
          dive_number: number | null
          dive_site_id: string | null
          dive_type: string | null
          entry_time: string | null
          equipment_notes: string | null
          exit_time: string | null
          gas_type: string | null
          id: string
          instructor_name: string | null
          is_public: boolean
          location: string | null
          max_depth_m: number
          notes: string | null
          o2_percent: number | null
          pressure_end_bar: number | null
          pressure_start_bar: number | null
          public_slug: string | null
          suit_type: string | null
          tank_type: string | null
          tank_volume_l: number | null
          updated_at: string
          user_id: string
          visibility_m: number | null
          water_temp_c: number | null
          wave: string | null
          weather: string | null
          weight_kg: number | null
        }
        Insert: {
          air_temp_c?: number | null
          avg_depth_m?: number | null
          bottom_time_min: number
          buddy_name?: string | null
          certification_dive?: boolean
          created_at?: string
          current_condition?: string | null
          deleted_at?: string | null
          dive_date: string
          dive_number?: number | null
          dive_site_id?: string | null
          dive_type?: string | null
          entry_time?: string | null
          equipment_notes?: string | null
          exit_time?: string | null
          gas_type?: string | null
          id?: string
          instructor_name?: string | null
          is_public?: boolean
          location?: string | null
          max_depth_m: number
          notes?: string | null
          o2_percent?: number | null
          pressure_end_bar?: number | null
          pressure_start_bar?: number | null
          public_slug?: string | null
          suit_type?: string | null
          tank_type?: string | null
          tank_volume_l?: number | null
          updated_at?: string
          user_id: string
          visibility_m?: number | null
          water_temp_c?: number | null
          wave?: string | null
          weather?: string | null
          weight_kg?: number | null
        }
        Update: {
          air_temp_c?: number | null
          avg_depth_m?: number | null
          bottom_time_min?: number
          buddy_name?: string | null
          certification_dive?: boolean
          created_at?: string
          current_condition?: string | null
          deleted_at?: string | null
          dive_date?: string
          dive_number?: number | null
          dive_site_id?: string | null
          dive_type?: string | null
          entry_time?: string | null
          equipment_notes?: string | null
          exit_time?: string | null
          gas_type?: string | null
          id?: string
          instructor_name?: string | null
          is_public?: boolean
          location?: string | null
          max_depth_m?: number
          notes?: string | null
          o2_percent?: number | null
          pressure_end_bar?: number | null
          pressure_start_bar?: number | null
          public_slug?: string | null
          suit_type?: string | null
          tank_type?: string | null
          tank_volume_l?: number | null
          updated_at?: string
          user_id?: string
          visibility_m?: number | null
          water_temp_c?: number | null
          wave?: string | null
          weather?: string | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "dives_dive_site_id_fkey"
            columns: ["dive_site_id"]
            isOneToOne: false
            referencedRelation: "dive_sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dives_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      inquiries: {
        Row: {
          body: string
          category: string
          created_at: string
          email: string
          id: string
          name: string
          submitter_ip: unknown
          submitter_user_id: string | null
        }
        Insert: {
          body: string
          category: string
          created_at?: string
          email: string
          id?: string
          name: string
          submitter_ip?: unknown
          submitter_user_id?: string | null
        }
        Update: {
          body?: string
          category?: string
          created_at?: string
          email?: string
          id?: string
          name?: string
          submitter_ip?: unknown
          submitter_user_id?: string | null
        }
        Relationships: []
      }
      plan_packing_items: {
        Row: {
          created_at: string
          id: string
          is_checked: boolean
          name: string
          plan_id: string
          position: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_checked?: boolean
          name: string
          plan_id: string
          position?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_checked?: boolean
          name?: string
          plan_id?: string
          position?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_packing_items_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "dive_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      regulators: {
        Row: {
          brand: string
          created_at: string
          id: string
          is_primary: boolean
          last_overhauled_on: string
          model: string
          notes: string | null
          overhaul_interval_dives: number
          overhaul_interval_months: number
          purchased_on: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          brand: string
          created_at?: string
          id?: string
          is_primary?: boolean
          last_overhauled_on: string
          model: string
          notes?: string | null
          overhaul_interval_dives?: number
          overhaul_interval_months?: number
          purchased_on?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          brand?: string
          created_at?: string
          id?: string
          is_primary?: boolean
          last_overhauled_on?: string
          model?: string
          notes?: string | null
          overhaul_interval_dives?: number
          overhaul_interval_months?: number
          purchased_on?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "regulators_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_details: {
        Row: {
          birth_on: string
          created_at: string
          diver_number: string | null
          diver_type: string | null
          first_name: string
          first_name_romaji: string
          gender: string
          height_cm: number | null
          last_name: string
          last_name_romaji: string
          nickname: string
          terms_agreed_at: string | null
          terms_version: string | null
          updated_at: string
          user_id: string
          weight_kg: number | null
        }
        Insert: {
          birth_on: string
          created_at?: string
          diver_number?: string | null
          diver_type?: string | null
          first_name: string
          first_name_romaji: string
          gender?: string
          height_cm?: number | null
          last_name: string
          last_name_romaji: string
          nickname: string
          terms_agreed_at?: string | null
          terms_version?: string | null
          updated_at?: string
          user_id: string
          weight_kg?: number | null
        }
        Update: {
          birth_on?: string
          created_at?: string
          diver_number?: string | null
          diver_type?: string | null
          first_name?: string
          first_name_romaji?: string
          gender?: string
          height_cm?: number | null
          last_name?: string
          last_name_romaji?: string
          nickname?: string
          terms_agreed_at?: string | null
          terms_version?: string | null
          updated_at?: string
          user_id?: string
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_details_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_follows: {
        Row: {
          created_at: string
          followee_id: string
          follower_id: string
        }
        Insert: {
          created_at?: string
          followee_id: string
          follower_id: string
        }
        Update: {
          created_at?: string
          followee_id?: string
          follower_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_follows_followee_id_fkey"
            columns: ["followee_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      discard_recent_inquiry: { Args: { p_id: string }; Returns: undefined }
      get_dive_monthly_stats: {
        Args: { months_back?: number }
        Returns: {
          avg_water_temp_c: number
          dive_count: number
          max_depth_m: number
          month: string
        }[]
      }
      get_dive_stats: {
        Args: never
        Returns: {
          max_depth_m: number
          total_bottom_time_min: number
          total_dives: number
          visited_locations: number
        }[]
      }
      get_dive_yearly_counts: {
        Args: never
        Returns: {
          dive_count: number
          year: number
        }[]
      }
      get_public_dive: {
        Args: { p_slug: string }
        Returns: {
          id: string
          dive_date: string
          location: string
          max_depth_m: number
          bottom_time_min: number
          notes: string | null
          owner_nickname: string
        }[]
      }
      get_user_public_profiles: {
        Args: { p_ids: string[] }
        Returns: {
          nickname: string
          user_id: string
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      is_public_dive_photo: { Args: { object_name: string }; Returns: boolean }
      is_superadmin: { Args: never; Returns: boolean }
      submit_inquiry: {
        Args: {
          p_body: string
          p_category: string
          p_email: string
          p_name: string
          p_submitter_ip: unknown
          p_submitter_user_id: string
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

