export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      challenge_files: {
        Row: {
          challenge_id: string
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
        }
        Insert: {
          challenge_id: string
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
        }
        Update: {
          challenge_id?: string
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "challenge_files_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_progress: {
        Row: {
          challenge_id: string
          company_id: string
          completed_at: string | null
          created_at: string
          id: string
          is_completed: boolean
          progress_value: number
          target_value: number
          updated_at: string
          user_id: string
        }
        Insert: {
          challenge_id: string
          company_id: string
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          progress_value?: number
          target_value: number
          updated_at?: string
          user_id: string
        }
        Update: {
          challenge_id?: string
          company_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          progress_value?: number
          target_value?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_progress_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_progress_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_rewards: {
        Row: {
          challenge_id: string
          claimed_at: string
          company_id: string
          created_at: string
          id: string
          reward_details: Json
          reward_type: string
          user_id: string
        }
        Insert: {
          challenge_id: string
          claimed_at?: string
          company_id: string
          created_at?: string
          id?: string
          reward_details?: Json
          reward_type: string
          user_id: string
        }
        Update: {
          challenge_id?: string
          claimed_at?: string
          company_id?: string
          created_at?: string
          id?: string
          reward_details?: Json
          reward_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_rewards_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_rewards_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          challenge_type: Database["public"]["Enums"]["challenge_type"]
          company_id: string
          created_at: string
          created_by: string
          description: string | null
          end_date: string | null
          id: string
          image_url: string | null
          is_active: boolean
          is_available_for_all_levels: boolean
          max_participants: number | null
          order_index: number
          required_level_id: string | null
          requirements: Json
          reward_type: Database["public"]["Enums"]["reward_type"]
          reward_value: Json
          start_date: string
          title: string
          updated_at: string
        }
        Insert: {
          challenge_type: Database["public"]["Enums"]["challenge_type"]
          company_id: string
          created_at?: string
          created_by: string
          description?: string | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_available_for_all_levels?: boolean
          max_participants?: number | null
          order_index?: number
          required_level_id?: string | null
          requirements?: Json
          reward_type: Database["public"]["Enums"]["reward_type"]
          reward_value?: Json
          start_date?: string
          title: string
          updated_at?: string
        }
        Update: {
          challenge_type?: Database["public"]["Enums"]["challenge_type"]
          company_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_available_for_all_levels?: boolean
          max_participants?: number | null
          order_index?: number
          required_level_id?: string | null
          requirements?: Json
          reward_type?: Database["public"]["Enums"]["reward_type"]
          reward_value?: Json
          start_date?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenges_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenges_required_level_id_fkey"
            columns: ["required_level_id"]
            isOneToOne: false
            referencedRelation: "user_levels"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          address: string | null
          button_text_color: string | null
          city: string | null
          cnpj: string | null
          course_banner_url: string | null
          created_at: string
          custom_domain: string | null
          custom_domain_status: string | null
          custom_domain_verified_at: string | null
          id: string
          logo_url: string | null
          name: string
          phone: string | null
          plan: string | null
          postal_code: string | null
          primary_color: string | null
          state: string | null
          status: string | null
          subdomain: string | null
          text_color: string | null
          theme_config: Json | null
          theme_mode: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          button_text_color?: string | null
          city?: string | null
          cnpj?: string | null
          course_banner_url?: string | null
          created_at?: string
          custom_domain?: string | null
          custom_domain_status?: string | null
          custom_domain_verified_at?: string | null
          id?: string
          logo_url?: string | null
          name: string
          phone?: string | null
          plan?: string | null
          postal_code?: string | null
          primary_color?: string | null
          state?: string | null
          status?: string | null
          subdomain?: string | null
          text_color?: string | null
          theme_config?: Json | null
          theme_mode?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          button_text_color?: string | null
          city?: string | null
          cnpj?: string | null
          course_banner_url?: string | null
          created_at?: string
          custom_domain?: string | null
          custom_domain_status?: string | null
          custom_domain_verified_at?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          plan?: string | null
          postal_code?: string | null
          primary_color?: string | null
          state?: string | null
          status?: string | null
          subdomain?: string | null
          text_color?: string | null
          theme_config?: Json | null
          theme_mode?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      conversation_participants: {
        Row: {
          company_id: string
          conversation_id: string
          id: string
          joined_at: string
          last_read_at: string | null
          user_id: string
        }
        Insert: {
          company_id: string
          conversation_id: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          user_id: string
        }
        Update: {
          company_id?: string
          conversation_id?: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          company_id: string
          created_at: string
          id: string
          last_message_at: string | null
          name: string | null
          type: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          last_message_at?: string | null
          name?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          last_message_at?: string | null
          name?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      course_lessons: {
        Row: {
          content: string | null
          created_at: string
          description: string | null
          difficulty_level: string | null
          duration: number | null
          id: string
          module_id: string
          order_index: number
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          description?: string | null
          difficulty_level?: string | null
          duration?: number | null
          id?: string
          module_id: string
          order_index?: number
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          description?: string | null
          difficulty_level?: string | null
          duration?: number | null
          id?: string
          module_id?: string
          order_index?: number
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      course_modules: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          id: string
          order_index: number
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          id?: string
          order_index?: number
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          id?: string
          order_index?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          company_id: string
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_active: boolean
          order_index: number
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_active?: boolean
          order_index?: number
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean
          order_index?: number
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          lesson_id: string
          parent_comment_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          lesson_id: string
          parent_comment_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          lesson_id?: string
          parent_comment_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_comments_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "lesson_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_favorites: {
        Row: {
          created_at: string
          id: string
          lesson_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lesson_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lesson_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_favorites_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_likes: {
        Row: {
          created_at: string
          id: string
          lesson_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lesson_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lesson_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_likes_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_categories: {
        Row: {
          color: string
          company_id: string
          created_at: string
          created_by: string
          description: string | null
          icon_type: string | null
          icon_value: string | null
          id: string
          is_active: boolean
          name: string
          order_index: number
          updated_at: string
        }
        Insert: {
          color?: string
          company_id: string
          created_at?: string
          created_by: string
          description?: string | null
          icon_type?: string | null
          icon_value?: string | null
          id?: string
          is_active?: boolean
          name: string
          order_index?: number
          updated_at?: string
        }
        Update: {
          color?: string
          company_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          icon_type?: string | null
          icon_value?: string | null
          id?: string
          is_active?: boolean
          name?: string
          order_index?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_items: {
        Row: {
          category_id: string
          company_id: string
          created_at: string
          created_by: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          is_featured: boolean
          name: string
          order_index: number
          price_coins: number
          seller_id: string | null
          seller_type: string
          stock_quantity: number | null
          updated_at: string
        }
        Insert: {
          category_id: string
          company_id: string
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean
          name: string
          order_index?: number
          price_coins: number
          seller_id?: string | null
          seller_type?: string
          stock_quantity?: number | null
          updated_at?: string
        }
        Update: {
          category_id?: string
          company_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean
          name?: string
          order_index?: number
          price_coins?: number
          seller_id?: string | null
          seller_type?: string
          stock_quantity?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "marketplace_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_purchases: {
        Row: {
          company_id: string
          id: string
          item_id: string
          item_name: string
          price_coins: number
          purchased_at: string
          quantity: number
          refunded_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          company_id: string
          id?: string
          item_id: string
          item_name: string
          price_coins: number
          purchased_at?: string
          quantity?: number
          refunded_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          company_id?: string
          id?: string
          item_id?: string
          item_name?: string
          price_coins?: number
          purchased_at?: string
          quantity?: number
          refunded_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_purchases_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_purchases_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "marketplace_items"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          company_id: string
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_edited: boolean
          message_type: string
          reply_to_id: string | null
          sender_id: string
          updated_at: string
        }
        Insert: {
          company_id: string
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_edited?: boolean
          message_type?: string
          reply_to_id?: string | null
          sender_id: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_edited?: boolean
          message_type?: string
          reply_to_id?: string | null
          sender_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          company_id: string
          content: string | null
          created_at: string
          id: string
          is_read: boolean
          reference_id: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id: string
          content?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          reference_id?: string | null
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string
          content?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          reference_id?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      point_transactions: {
        Row: {
          action_type: string
          coins: number
          company_id: string
          created_at: string
          id: string
          points: number
          reference_id: string | null
          user_id: string
        }
        Insert: {
          action_type: string
          coins?: number
          company_id: string
          created_at?: string
          id?: string
          points: number
          reference_id?: string | null
          user_id: string
        }
        Update: {
          action_type?: string
          coins?: number
          company_id?: string
          created_at?: string
          id?: string
          points?: number
          reference_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "point_transactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "point_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      post_interactions: {
        Row: {
          comment_text: string | null
          created_at: string
          id: string
          parent_comment_id: string | null
          post_id: string
          type: string
          user_id: string
        }
        Insert: {
          comment_text?: string | null
          created_at?: string
          id?: string
          parent_comment_id?: string | null
          post_id: string
          type: string
          user_id: string
        }
        Update: {
          comment_text?: string | null
          created_at?: string
          id?: string
          parent_comment_id?: string | null
          post_id?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_interactions_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "post_interactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_interactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_interactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          company_id: string
          content: string
          created_at: string
          id: string
          is_announcement: boolean
          is_pinned: boolean
          space_id: string
          title: string | null
          type: string
          updated_at: string
        }
        Insert: {
          author_id: string
          company_id: string
          content: string
          created_at?: string
          id?: string
          is_announcement?: boolean
          is_pinned?: boolean
          space_id: string
          title?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          company_id?: string
          content?: string
          created_at?: string
          id?: string
          is_announcement?: boolean
          is_pinned?: boolean
          space_id?: string
          title?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "posts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          company_id: string
          created_at: string
          email: string | null
          first_name: string
          id: string
          is_active: boolean
          last_name: string
          phone: string | null
          role: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          email?: string | null
          first_name: string
          id?: string
          is_active?: boolean
          last_name: string
          phone?: string | null
          role?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          email?: string | null
          first_name?: string
          id?: string
          is_active?: boolean
          last_name?: string
          phone?: string | null
          role?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      space_categories: {
        Row: {
          company_id: string
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          order_index: number
          permissions: Json | null
          slug: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          order_index?: number
          permissions?: Json | null
          slug?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          order_index?: number
          permissions?: Json | null
          slug?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "space_categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      space_members: {
        Row: {
          id: string
          joined_at: string
          role: string
          space_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          role?: string
          space_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          role?: string
          space_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "space_members_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "space_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      spaces: {
        Row: {
          category_id: string
          company_id: string
          created_at: string
          created_by: string
          custom_icon_type: string | null
          custom_icon_value: string | null
          description: string | null
          id: string
          is_private: boolean
          name: string
          order_index: number
          type: string
          updated_at: string
          visibility: string | null
        }
        Insert: {
          category_id: string
          company_id: string
          created_at?: string
          created_by: string
          custom_icon_type?: string | null
          custom_icon_value?: string | null
          description?: string | null
          id?: string
          is_private?: boolean
          name: string
          order_index?: number
          type?: string
          updated_at?: string
          visibility?: string | null
        }
        Update: {
          category_id?: string
          company_id?: string
          created_at?: string
          created_by?: string
          custom_icon_type?: string | null
          custom_icon_value?: string | null
          description?: string | null
          id?: string
          is_private?: boolean
          name?: string
          order_index?: number
          type?: string
          updated_at?: string
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "spaces_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "space_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spaces_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          color: string
          company_id: string
          created_at: string
          created_by: string
          description: string | null
          icon_type: string | null
          icon_value: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          color?: string
          company_id: string
          created_at?: string
          created_by: string
          description?: string | null
          icon_type?: string | null
          icon_value?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          color?: string
          company_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          icon_type?: string | null
          icon_value?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_course_progress: {
        Row: {
          completed_at: string
          course_id: string
          id: string
          lesson_id: string
          module_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          course_id: string
          id?: string
          lesson_id: string
          module_id: string
          user_id: string
        }
        Update: {
          completed_at?: string
          course_id?: string
          id?: string
          lesson_id?: string
          module_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_course_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_course_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_course_progress_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      user_current_level: {
        Row: {
          company_id: string
          current_coins: number
          current_level_id: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id: string
          current_coins?: number
          current_level_id?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string
          current_coins?: number
          current_level_id?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_current_level_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_current_level_current_level_id_fkey"
            columns: ["current_level_id"]
            isOneToOne: false
            referencedRelation: "user_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_current_level_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_levels: {
        Row: {
          company_id: string
          created_at: string
          created_by: string
          id: string
          level_color: string
          level_icon: string
          level_name: string
          level_number: number
          max_coins_required: number | null
          min_coins_required: number
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by: string
          id?: string
          level_color?: string
          level_icon?: string
          level_name: string
          level_number: number
          max_coins_required?: number | null
          min_coins_required?: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string
          id?: string
          level_color?: string
          level_icon?: string
          level_name?: string
          level_number?: number
          max_coins_required?: number | null
          min_coins_required?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_levels_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_levels_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_points: {
        Row: {
          company_id: string
          created_at: string
          id: string
          total_coins: number
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          total_coins?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          total_coins?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_points_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_points_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          company_id: string
          created_at: string
          id: string
          preferences: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          preferences?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          preferences?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          company_id: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_tags: {
        Row: {
          assigned_at: string
          assigned_by: string
          company_id: string
          id: string
          tag_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by: string
          company_id: string
          id?: string
          tag_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string
          company_id?: string
          id?: string
          tag_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_existing_users_to_public_spaces: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      add_user_coins: {
        Args: {
          p_user_id: string
          p_company_id: string
          p_action_type: string
          p_reference_id?: string
        }
        Returns: undefined
      }
      add_user_points: {
        Args: {
          p_user_id: string
          p_company_id: string
          p_action_type: string
          p_reference_id?: string
        }
        Returns: undefined
      }
      add_user_to_public_spaces: {
        Args: { p_user_id: string; p_company_id: string }
        Returns: undefined
      }
      calculate_coins_for_action: {
        Args: { action_type: string }
        Returns: number
      }
      calculate_points_for_action: {
        Args: { action_type: string }
        Returns: number
      }
      calculate_user_level: {
        Args: { p_user_id: string; p_company_id: string; p_coins: number }
        Returns: string
      }
      can_user_see_space: {
        Args: { space_id: string; user_id: string }
        Returns: boolean
      }
      create_default_levels: {
        Args: { p_company_id: string; p_created_by: string }
        Returns: undefined
      }
      create_user_profile_for_company: {
        Args: {
          p_user_id: string
          p_company_id: string
          p_first_name: string
          p_last_name: string
          p_email?: string
          p_role?: string
        }
        Returns: string
      }
      deduct_user_coins: {
        Args: {
          p_user_id: string
          p_company_id: string
          p_coins: number
          p_reference_id?: string
        }
        Returns: boolean
      }
      find_or_create_direct_conversation: {
        Args: { p_user1_id: string; p_user2_id: string; p_company_id: string }
        Returns: string
      }
      get_user_companies: {
        Args: { p_user_id: string }
        Returns: {
          company_id: string
          company_name: string
          company_subdomain: string
          company_custom_domain: string
          user_role: string
          profile_created_at: string
        }[]
      }
      get_user_company_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_company_id_for_context: {
        Args: { p_company_id?: string }
        Returns: string
      }
      get_user_profile_for_company: {
        Args: { p_user_id: string; p_company_id: string }
        Returns: {
          id: string
          user_id: string
          company_id: string
          first_name: string
          last_name: string
          email: string
          phone: string
          role: string
          is_active: boolean
          created_at: string
          updated_at: string
        }[]
      }
      is_company_owner: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_space_member: {
        Args: { space_id: string; user_id: string }
        Returns: boolean
      }
      is_user_active: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      process_challenge_reward: {
        Args: {
          p_challenge_id: string
          p_user_id: string
          p_company_id: string
        }
        Returns: undefined
      }
      process_marketplace_purchase: {
        Args: {
          p_user_id: string
          p_company_id: string
          p_item_id: string
          p_quantity?: number
        }
        Returns: Json
      }
      transfer_user_coins: {
        Args: {
          p_from_user_id: string
          p_to_user_id: string
          p_company_id: string
          p_coins: number
          p_reference_id?: string
        }
        Returns: boolean
      }
      update_challenge_progress: {
        Args: {
          p_user_id: string
          p_company_id: string
          p_challenge_type: Database["public"]["Enums"]["challenge_type"]
          p_increment?: number
          p_reference_id?: string
        }
        Returns: undefined
      }
    }
    Enums: {
      challenge_type:
        | "course_completion"
        | "post_creation"
        | "marketplace_purchase"
        | "custom_action"
        | "points_accumulation"
      reward_type:
        | "coins"
        | "course_access"
        | "file_download"
        | "marketplace_item"
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
      challenge_type: [
        "course_completion",
        "post_creation",
        "marketplace_purchase",
        "custom_action",
        "points_accumulation",
      ],
      reward_type: [
        "coins",
        "course_access",
        "file_download",
        "marketplace_item",
      ],
    },
  },
} as const
