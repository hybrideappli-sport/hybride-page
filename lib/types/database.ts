export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  club: {
    Tables: {
      admin_roles: {
        Row: {
          club_id: string | null
          created_at: string
          id: string
          profile_id: string
          role: Database["club"]["Enums"]["admin_role"]
        }
        Insert: {
          club_id?: string | null
          created_at?: string
          id?: string
          profile_id: string
          role: Database["club"]["Enums"]["admin_role"]
        }
        Update: {
          club_id?: string | null
          created_at?: string
          id?: string
          profile_id?: string
          role?: Database["club"]["Enums"]["admin_role"]
        }
        Relationships: [
          {
            foreignKeyName: "admin_roles_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      clubs: {
        Row: {
          city: string
          contact_email: string | null
          created_at: string
          description_md: string | null
          hello_asso_url: string | null
          id: string
          instagram_url: string | null
          is_published: boolean
          map_image_url: string | null
          meeting_point: string | null
          name: string
          slug: string
          tagline: string | null
          timezone: string
          updated_at: string
        }
        Insert: {
          city: string
          contact_email?: string | null
          created_at?: string
          description_md?: string | null
          hello_asso_url?: string | null
          id?: string
          instagram_url?: string | null
          is_published?: boolean
          map_image_url?: string | null
          meeting_point?: string | null
          name: string
          slug: string
          tagline?: string | null
          timezone?: string
          updated_at?: string
        }
        Update: {
          city?: string
          contact_email?: string | null
          created_at?: string
          description_md?: string | null
          hello_asso_url?: string | null
          id?: string
          instagram_url?: string | null
          is_published?: boolean
          map_image_url?: string | null
          meeting_point?: string | null
          name?: string
          slug?: string
          tagline?: string | null
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      consent_documents: {
        Row: {
          body_md: string
          checksum: string
          code: string
          is_current: boolean
          locale: string
          published_at: string
          title: string
          version: string
        }
        Insert: {
          body_md: string
          checksum: string
          code: string
          is_current?: boolean
          locale?: string
          published_at?: string
          title: string
          version: string
        }
        Update: {
          body_md?: string
          checksum?: string
          code?: string
          is_current?: boolean
          locale?: string
          published_at?: string
          title?: string
          version?: string
        }
        Relationships: []
      }
      consents: {
        Row: {
          club_id: string
          created_at: string
          document_code: string
          document_version: string
          granted: boolean
          granted_at: string
          granted_by: Database["club"]["Enums"]["consent_grantor"]
          id: string
          ip_hash: string | null
          locale: string
          parental_authorization_id: string | null
          revoked_at: string | null
          subject_erased_at: string | null
          subject_profile_id: string
          user_agent: string | null
        }
        Insert: {
          club_id: string
          created_at?: string
          document_code: string
          document_version: string
          granted: boolean
          granted_at?: string
          granted_by: Database["club"]["Enums"]["consent_grantor"]
          id?: string
          ip_hash?: string | null
          locale?: string
          parental_authorization_id?: string | null
          revoked_at?: string | null
          subject_erased_at?: string | null
          subject_profile_id: string
          user_agent?: string | null
        }
        Update: {
          club_id?: string
          created_at?: string
          document_code?: string
          document_version?: string
          granted?: boolean
          granted_at?: string
          granted_by?: Database["club"]["Enums"]["consent_grantor"]
          id?: string
          ip_hash?: string | null
          locale?: string
          parental_authorization_id?: string | null
          revoked_at?: string | null
          subject_erased_at?: string | null
          subject_profile_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consents_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consents_document_fk"
            columns: ["document_code", "document_version", "locale"]
            isOneToOne: false
            referencedRelation: "consent_documents"
            referencedColumns: ["code", "version", "locale"]
          },
          {
            foreignKeyName: "consents_parental_authorization_fk"
            columns: ["parental_authorization_id"]
            isOneToOne: false
            referencedRelation: "parental_authorizations"
            referencedColumns: ["id"]
          },
        ]
      }
      disciplines: {
        Row: {
          code: string
          created_at: string
          is_active: boolean
          label: string
          sort_order: number
        }
        Insert: {
          code: string
          created_at?: string
          is_active?: boolean
          label: string
          sort_order?: number
        }
        Update: {
          code?: string
          created_at?: string
          is_active?: boolean
          label?: string
          sort_order?: number
        }
        Relationships: []
      }
      email_log: {
        Row: {
          attempts: number
          club_id: string | null
          created_at: string
          email_type: Database["club"]["Enums"]["email_type"]
          id: string
          last_error: string | null
          next_attempt_at: string
          payload: Json
          provider_message_id: string | null
          recipient: string
          related_id: string
          related_type: Database["club"]["Enums"]["email_related_type"]
          sent_at: string | null
          status: Database["club"]["Enums"]["email_status"]
          updated_at: string
        }
        Insert: {
          attempts?: number
          club_id?: string | null
          created_at?: string
          email_type: Database["club"]["Enums"]["email_type"]
          id?: string
          last_error?: string | null
          next_attempt_at?: string
          payload?: Json
          provider_message_id?: string | null
          recipient: string
          related_id: string
          related_type: Database["club"]["Enums"]["email_related_type"]
          sent_at?: string | null
          status?: Database["club"]["Enums"]["email_status"]
          updated_at?: string
        }
        Update: {
          attempts?: number
          club_id?: string | null
          created_at?: string
          email_type?: Database["club"]["Enums"]["email_type"]
          id?: string
          last_error?: string | null
          next_attempt_at?: string
          payload?: Json
          provider_message_id?: string | null
          recipient?: string
          related_id?: string
          related_type?: Database["club"]["Enums"]["email_related_type"]
          sent_at?: string | null
          status?: Database["club"]["Enums"]["email_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_log_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      event_disciplines: {
        Row: {
          discipline_code: string
          event_id: string
        }
        Insert: {
          discipline_code: string
          event_id: string
        }
        Update: {
          discipline_code?: string
          event_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_disciplines_discipline_code_fkey"
            columns: ["discipline_code"]
            isOneToOne: false
            referencedRelation: "disciplines"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "event_disciplines_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          cancelled_at: string | null
          cancelled_by: string | null
          capacity: number
          club_id: string
          created_at: string
          created_by: string | null
          ends_at: string | null
          id: string
          level: string | null
          location: string
          location_url: string | null
          starts_at: string
          status: Database["club"]["Enums"]["event_status"]
          title: string | null
          updated_at: string
        }
        Insert: {
          cancelled_at?: string | null
          cancelled_by?: string | null
          capacity: number
          club_id: string
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          level?: string | null
          location: string
          location_url?: string | null
          starts_at: string
          status?: Database["club"]["Enums"]["event_status"]
          title?: string | null
          updated_at?: string
        }
        Update: {
          cancelled_at?: string | null
          cancelled_by?: string | null
          capacity?: number
          club_id?: string
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          level?: string | null
          location?: string
          location_url?: string | null
          starts_at?: string
          status?: Database["club"]["Enums"]["event_status"]
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      export_log: {
        Row: {
          admin_profile_id: string
          club_id: string
          event_id: string | null
          exported_at: string
          id: string
          row_count: number
        }
        Insert: {
          admin_profile_id: string
          club_id: string
          event_id?: string | null
          exported_at?: string
          id?: string
          row_count?: number
        }
        Update: {
          admin_profile_id?: string
          club_id?: string
          event_id?: string | null
          exported_at?: string
          id?: string
          row_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "export_log_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "export_log_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      member_profiles: {
        Row: {
          birth_date: string
          created_at: string
          first_name: string
          id: string
          last_name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          birth_date: string
          created_at?: string
          first_name: string
          id: string
          last_name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          birth_date?: string
          created_at?: string
          first_name?: string
          id?: string
          last_name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      parental_authorizations: {
        Row: {
          created_at: string
          decided_at: string | null
          document_code: string
          document_version: string
          hold_expires_at: string
          id: string
          locale: string
          minor_profile_id: string
          parent_email: string
          proof_ip_hash: string | null
          proof_user_agent: string | null
          registration_id: string
          requested_at: string
          status: Database["club"]["Enums"]["parental_authorization_status"]
          token: string
          updated_at: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          decided_at?: string | null
          document_code: string
          document_version: string
          hold_expires_at: string
          id?: string
          locale?: string
          minor_profile_id: string
          parent_email: string
          proof_ip_hash?: string | null
          proof_user_agent?: string | null
          registration_id: string
          requested_at?: string
          status?: Database["club"]["Enums"]["parental_authorization_status"]
          token: string
          updated_at?: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          decided_at?: string | null
          document_code?: string
          document_version?: string
          hold_expires_at?: string
          id?: string
          locale?: string
          minor_profile_id?: string
          parent_email?: string
          proof_ip_hash?: string | null
          proof_user_agent?: string | null
          registration_id?: string
          requested_at?: string
          status?: Database["club"]["Enums"]["parental_authorization_status"]
          token?: string
          updated_at?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parental_authorizations_document_fk"
            columns: ["document_code", "document_version", "locale"]
            isOneToOne: false
            referencedRelation: "consent_documents"
            referencedColumns: ["code", "version", "locale"]
          },
          {
            foreignKeyName: "parental_authorizations_minor_profile_id_fkey"
            columns: ["minor_profile_id"]
            isOneToOne: false
            referencedRelation: "member_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parental_authorizations_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      registrations: {
        Row: {
          cancellation_reason:
            | Database["club"]["Enums"]["cancellation_reason"]
            | null
          cancelled_at: string | null
          confirmed_at: string | null
          created_at: string
          created_by: string | null
          event_id: string
          id: string
          is_minor_at_event: boolean
          is_under_15_at_registration: boolean
          member_profile_id: string
          parent_email: string | null
          status: Database["club"]["Enums"]["registration_status"]
          updated_at: string
        }
        Insert: {
          cancellation_reason?:
            | Database["club"]["Enums"]["cancellation_reason"]
            | null
          cancelled_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          created_by?: string | null
          event_id: string
          id?: string
          is_minor_at_event: boolean
          is_under_15_at_registration: boolean
          member_profile_id: string
          parent_email?: string | null
          status: Database["club"]["Enums"]["registration_status"]
          updated_at?: string
        }
        Update: {
          cancellation_reason?:
            | Database["club"]["Enums"]["cancellation_reason"]
            | null
          cancelled_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          created_by?: string | null
          event_id?: string
          id?: string
          is_minor_at_event?: boolean
          is_under_15_at_registration?: boolean
          member_profile_id?: string
          parent_email?: string | null
          status?: Database["club"]["Enums"]["registration_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registrations_member_profile_id_fkey"
            columns: ["member_profile_id"]
            isOneToOne: false
            referencedRelation: "member_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      _cancel_registration: {
        Args: {
          p_promote?: boolean
          p_reason: Database["club"]["Enums"]["cancellation_reason"]
          p_registration_id: string
        }
        Returns: Json
      }
      _promote_from_waitlist: { Args: { p_event_id: string }; Returns: number }
      _request_parental_authorization: {
        Args: { p_registration_id: string }
        Returns: string
      }
      age_years_on: {
        Args: { p_birth_date: string; p_on: string }
        Returns: number
      }
      cancel_event: { Args: { p_event_id: string }; Returns: Json }
      cancel_registration: {
        Args: { p_registration_id: string }
        Returns: Json
      }
      create_event: {
        Args: {
          p_capacity: number
          p_club_id: string
          p_discipline_codes: string[]
          p_ends_at?: string
          p_level?: string
          p_location: string
          p_starts_at: string
          p_title?: string
        }
        Returns: string
      }
      decide_parental_authorization: {
        Args: {
          p_approve: boolean
          p_ip_hash?: string
          p_token: string
          p_user_agent?: string
        }
        Returns: Json
      }
      enqueue_email: {
        Args: {
          p_club_id: string
          p_email_type: Database["club"]["Enums"]["email_type"]
          p_recipient: string
          p_related_id: string
          p_related_type: Database["club"]["Enums"]["email_related_type"]
        }
        Returns: undefined
      }
      event_club_id: { Args: { p_event_id: string }; Returns: string }
      event_roster: {
        Args: { p_event_id: string }
        Returns: {
          email: string
          first_name: string
          hold_expires_at: string
          is_minor_at_event: boolean
          last_name: string
          parental_status: Database["club"]["Enums"]["parental_authorization_status"]
          registered_at: string
          registration_id: string
          status: Database["club"]["Enums"]["registration_status"]
        }[]
      }
      expire_parental_holds: { Args: never; Returns: number }
      generate_token: { Args: never; Returns: string }
      get_event_public: { Args: { p_event_id: string }; Returns: Json }
      get_parental_authorization: { Args: { p_token: string }; Returns: Json }
      has_own_registration: { Args: { p_event_id: string }; Returns: boolean }
      is_club_admin: { Args: { p_club_id: string }; Returns: boolean }
      is_service_context: { Args: never; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      list_upcoming_events: {
        Args: { p_club_slug: string }
        Returns: {
          capacity: number
          club_slug: string
          discipline_codes: string[]
          discipline_labels: string[]
          ends_at: string
          id: string
          level: string
          location: string
          occupied: number
          places_left: number
          starts_at: string
          title: string
          waitlist_count: number
        }[]
      }
      local_date: {
        Args: { p_at: string; p_timezone: string }
        Returns: string
      }
      log_export: {
        Args: { p_event_id: string; p_row_count: number }
        Returns: string
      }
      member_email: { Args: { p_profile_id: string }; Returns: string }
      purge_expired_member_data: {
        Args: { p_retention?: string }
        Returns: number
      }
      recompute_event_minor_flags: {
        Args: { p_event_id: string }
        Returns: number
      }
      register_for_event: {
        Args: {
          p_event_id: string
          p_member_profile_id?: string
          p_parent_email?: string
        }
        Returns: Json
      }
    }
    Enums: {
      admin_role: "super_admin" | "club_admin"
      cancellation_reason:
        | "member"
        | "admin"
        | "parental_denied"
        | "parental_expired"
        | "event_cancelled"
      consent_grantor: "self" | "parent"
      email_related_type: "registration" | "parental_authorization"
      email_status: "pending" | "sent" | "failed"
      email_type:
        | "registration_confirmed"
        | "waitlist_registered"
        | "waitlist_promoted"
        | "parental_authorization_requested"
        | "parental_authorization_confirmed"
        | "registration_cancelled_by_member"
        | "registration_cancelled_by_admin"
        | "registration_cancelled_parental_denied"
        | "registration_cancelled_parental_expired"
        | "event_cancelled"
      event_status: "published" | "cancelled"
      parental_authorization_status:
        | "pending"
        | "confirmed"
        | "denied"
        | "expired"
      registration_status:
        | "confirmed"
        | "waitlist"
        | "pending_parental_authorization"
        | "cancelled"
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
  club: {
    Enums: {
      admin_role: ["super_admin", "club_admin"],
      cancellation_reason: [
        "member",
        "admin",
        "parental_denied",
        "parental_expired",
        "event_cancelled",
      ],
      consent_grantor: ["self", "parent"],
      email_related_type: ["registration", "parental_authorization"],
      email_status: ["pending", "sent", "failed"],
      email_type: [
        "registration_confirmed",
        "waitlist_registered",
        "waitlist_promoted",
        "parental_authorization_requested",
        "parental_authorization_confirmed",
        "registration_cancelled_by_member",
        "registration_cancelled_by_admin",
        "registration_cancelled_parental_denied",
        "registration_cancelled_parental_expired",
        "event_cancelled",
      ],
      event_status: ["published", "cancelled"],
      parental_authorization_status: [
        "pending",
        "confirmed",
        "denied",
        "expired",
      ],
      registration_status: [
        "confirmed",
        "waitlist",
        "pending_parental_authorization",
        "cancelled",
      ],
    },
  },
} as const

