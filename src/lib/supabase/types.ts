export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          color: string;
          sort_order: number;
          parent_id: string | null;
          icon_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          color?: string;
          sort_order?: number;
          parent_id?: string | null;
          icon_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          color?: string;
          sort_order?: number;
          parent_id?: string | null;
          icon_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      urls: {
        Row: {
          id: string;
          category_id: string;
          user_id: string | null;
          title: string;
          url: string;
          description: string | null;
          icon_url: string | null;
          is_favorite: boolean;
          click_count: number;
          sort_order: number;
          last_opened_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_id: string;
          user_id?: string | null;
          title: string;
          url: string;
          description?: string | null;
          icon_url?: string | null;
          is_favorite?: boolean;
          click_count?: number;
          sort_order?: number;
          last_opened_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category_id?: string;
          user_id?: string | null;
          title?: string;
          url?: string;
          description?: string | null;
          icon_url?: string | null;
          is_favorite?: boolean;
          click_count?: number;
          sort_order?: number;
          last_opened_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "urls_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      url_access_logs: {
        Row: {
          id: string;
          url_id: string;
          user_id: string | null;
          opened_at: string;
        };
        Insert: {
          id?: string;
          url_id: string;
          user_id?: string | null;
          opened_at?: string;
        };
        Update: {
          id?: string;
          url_id?: string;
          user_id?: string | null;
          opened_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "url_access_logs_url_id_fkey";
            columns: ["url_id"];
            isOneToOne: false;
            referencedRelation: "urls";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          role: "admin" | "member";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          display_name?: string | null;
          role?: "admin" | "member";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string | null;
          role?: "admin" | "member";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      tags: {
        Row: {
          id: string;
          name: string;
          color: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          color?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          color?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      url_tags: {
        Row: {
          url_id: string;
          tag_id: string;
        };
        Insert: {
          url_id: string;
          tag_id: string;
        };
        Update: {
          url_id?: string;
          tag_id?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
