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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      article_person_map: {
        Row: {
          article_id: number
          created_at: string
          detected_name: string | null
          person_id: number
          relevance: number | null
        }
        Insert: {
          article_id: number
          created_at?: string
          detected_name?: string | null
          person_id: number
          relevance?: number | null
        }
        Update: {
          article_id?: number
          created_at?: string
          detected_name?: string | null
          person_id?: number
          relevance?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "article_person_map_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_person_map_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "v_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_person_map_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "v_articles_only"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_person_map_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "v_videos_only"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_person_map_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      article_sources: {
        Row: {
          article_id: number
          discovered_url: string
          endpoint_id: number
          first_seen_at: string | null
        }
        Insert: {
          article_id: number
          discovered_url?: string
          endpoint_id: number
          first_seen_at?: string | null
        }
        Update: {
          article_id?: number
          discovered_url?: string
          endpoint_id?: number
          first_seen_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "article_sources_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_sources_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "v_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_sources_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "v_articles_only"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_sources_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "v_videos_only"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_sources_endpoint_id_fkey"
            columns: ["endpoint_id"]
            isOneToOne: false
            referencedRelation: "endpoints"
            referencedColumns: ["id"]
          },
        ]
      }
      article_team_map: {
        Row: {
          article_id: number
          created_at: string
          detected_name: string | null
          relevance: number | null
          team_id: number
        }
        Insert: {
          article_id: number
          created_at?: string
          detected_name?: string | null
          relevance?: number | null
          team_id: number
        }
        Update: {
          article_id?: number
          created_at?: string
          detected_name?: string | null
          relevance?: number | null
          team_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "article_team_map_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_team_map_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "v_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_team_map_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "v_articles_only"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_team_map_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "v_videos_only"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_team_map_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      article_topic_map: {
        Row: {
          article_id: number
          created_at: string
          topic_id: number
        }
        Insert: {
          article_id: number
          created_at?: string
          topic_id: number
        }
        Update: {
          article_id?: number
          created_at?: string
          topic_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "article_topic_map_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_topic_map_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "v_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_topic_map_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "v_articles_only"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_topic_map_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "v_videos_only"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_topic_map_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      articles: {
        Row: {
          ai_extraction_cost: number | null
          ai_extraction_ms: number | null
          ai_model: string | null
          ai_people: string[] | null
          ai_teams: string[] | null
          author: string | null
          canonical_url: string | null
          cities: string[] | null
          content: string | null
          content_hash: string | null
          created_at: string
          domain: string
          duration_seconds: number | null
          entities: Json | null
          excerpt: string | null
          fetched_at: string | null
          first_seen_at: string | null
          guid: string | null
          id: number
          ingest_run_id: string | null
          keywords: Json | null
          language: string | null
          lead_image_url: string | null
          leagues: string[] | null
          media_type: Database["public"]["Enums"]["media_type"]
          media_url: string | null
          paywalled: boolean | null
          people: string[] | null
          platform: string | null
          published_at: string | null
          published_extracted_from: string | null
          published_fmt: string | null
          published_is_suspect: boolean | null
          rss_categories: Json | null
          score: number | null
          signals: Json | null
          source_display_name: string | null
          teams: string[] | null
          thumbnail_url: string | null
          title: string | null
          updated_at: string
          url: string
          url_domain: string
          url_hash: string | null
          url_key: string | null
          word_count: number | null
        }
        Insert: {
          ai_extraction_cost?: number | null
          ai_extraction_ms?: number | null
          ai_model?: string | null
          ai_people?: string[] | null
          ai_teams?: string[] | null
          author?: string | null
          canonical_url?: string | null
          cities?: string[] | null
          content?: string | null
          content_hash?: string | null
          created_at?: string
          domain: string
          duration_seconds?: number | null
          entities?: Json | null
          excerpt?: string | null
          fetched_at?: string | null
          first_seen_at?: string | null
          guid?: string | null
          id?: number
          ingest_run_id?: string | null
          keywords?: Json | null
          language?: string | null
          lead_image_url?: string | null
          leagues?: string[] | null
          media_type?: Database["public"]["Enums"]["media_type"]
          media_url?: string | null
          paywalled?: boolean | null
          people?: string[] | null
          platform?: string | null
          published_at?: string | null
          published_extracted_from?: string | null
          published_fmt?: string | null
          published_is_suspect?: boolean | null
          rss_categories?: Json | null
          score?: number | null
          signals?: Json | null
          source_display_name?: string | null
          teams?: string[] | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string
          url: string
          url_domain: string
          url_hash?: string | null
          url_key?: string | null
          word_count?: number | null
        }
        Update: {
          ai_extraction_cost?: number | null
          ai_extraction_ms?: number | null
          ai_model?: string | null
          ai_people?: string[] | null
          ai_teams?: string[] | null
          author?: string | null
          canonical_url?: string | null
          cities?: string[] | null
          content?: string | null
          content_hash?: string | null
          created_at?: string
          domain?: string
          duration_seconds?: number | null
          entities?: Json | null
          excerpt?: string | null
          fetched_at?: string | null
          first_seen_at?: string | null
          guid?: string | null
          id?: number
          ingest_run_id?: string | null
          keywords?: Json | null
          language?: string | null
          lead_image_url?: string | null
          leagues?: string[] | null
          media_type?: Database["public"]["Enums"]["media_type"]
          media_url?: string | null
          paywalled?: boolean | null
          people?: string[] | null
          platform?: string | null
          published_at?: string | null
          published_extracted_from?: string | null
          published_fmt?: string | null
          published_is_suspect?: boolean | null
          rss_categories?: Json | null
          score?: number | null
          signals?: Json | null
          source_display_name?: string | null
          teams?: string[] | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string
          url?: string
          url_domain?: string
          url_hash?: string | null
          url_key?: string | null
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "articles_ingest_run_id_fkey"
            columns: ["ingest_run_id"]
            isOneToOne: false
            referencedRelation: "ingest_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      endpoint_checks: {
        Row: {
          checked_at: string
          endpoint_id: number
          error_count: number | null
          id: number
          items_found: number | null
          notes: string | null
          status_code: number | null
        }
        Insert: {
          checked_at?: string
          endpoint_id: number
          error_count?: number | null
          id?: number
          items_found?: number | null
          notes?: string | null
          status_code?: number | null
        }
        Update: {
          checked_at?: string
          endpoint_id?: number
          error_count?: number | null
          id?: number
          items_found?: number | null
          notes?: string | null
          status_code?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "endpoint_checks_endpoint_id_fkey"
            columns: ["endpoint_id"]
            isOneToOne: false
            referencedRelation: "endpoints"
            referencedColumns: ["id"]
          },
        ]
      }
      endpoint_rules: {
        Row: {
          allow_domain: string[] | null
          article_url_selector: string | null
          content_min_words: number | null
          created_at: string
          domain: string | null
          exclude_url_regex: string | null
          extras: Json | null
          hours_back: number
          id: number
          kind: Database["public"]["Enums"]["rule_kind"] | null
          notes: string | null
          per_section_max_items: number | null
          rules_enabled: boolean
          title_min_len: number | null
          title_must_contain: string | null
          title_reject_contain: string | null
          title_required: boolean
          updated_at: string
          url_must_match_regex: string | null
        }
        Insert: {
          allow_domain?: string[] | null
          article_url_selector?: string | null
          content_min_words?: number | null
          created_at?: string
          domain?: string | null
          exclude_url_regex?: string | null
          extras?: Json | null
          hours_back?: number
          id?: number
          kind?: Database["public"]["Enums"]["rule_kind"] | null
          notes?: string | null
          per_section_max_items?: number | null
          rules_enabled?: boolean
          title_min_len?: number | null
          title_must_contain?: string | null
          title_reject_contain?: string | null
          title_required?: boolean
          updated_at?: string
          url_must_match_regex?: string | null
        }
        Update: {
          allow_domain?: string[] | null
          article_url_selector?: string | null
          content_min_words?: number | null
          created_at?: string
          domain?: string | null
          exclude_url_regex?: string | null
          extras?: Json | null
          hours_back?: number
          id?: number
          kind?: Database["public"]["Enums"]["rule_kind"] | null
          notes?: string | null
          per_section_max_items?: number | null
          rules_enabled?: boolean
          title_min_len?: number | null
          title_must_contain?: string | null
          title_reject_contain?: string | null
          title_required?: boolean
          updated_at?: string
          url_must_match_regex?: string | null
        }
        Relationships: []
      }
      endpoints: {
        Row: {
          articles_found_count: number
          created_at: string
          display_name: string | null
          domain: string
          endpoint_url: string
          etag: string | null
          fix_pubdate_via_html: boolean | null
          id: number
          kind: string
          language: string | null
          last_checked_at: string | null
          last_item_published_at: string | null
          last_modified_header: string | null
          league: string | null
          notes: string | null
          priority: number
          sport: string | null
          status_code: number | null
          team: string | null
          updated_at: string
        }
        Insert: {
          articles_found_count?: number
          created_at?: string
          display_name?: string | null
          domain: string
          endpoint_url: string
          etag?: string | null
          fix_pubdate_via_html?: boolean | null
          id?: number
          kind?: string
          language?: string | null
          last_checked_at?: string | null
          last_item_published_at?: string | null
          last_modified_header?: string | null
          league?: string | null
          notes?: string | null
          priority?: number
          sport?: string | null
          status_code?: number | null
          team?: string | null
          updated_at?: string
        }
        Update: {
          articles_found_count?: number
          created_at?: string
          display_name?: string | null
          domain?: string
          endpoint_url?: string
          etag?: string | null
          fix_pubdate_via_html?: boolean | null
          id?: number
          kind?: string
          language?: string | null
          last_checked_at?: string | null
          last_item_published_at?: string | null
          last_modified_header?: string | null
          league?: string | null
          notes?: string | null
          priority?: number
          sport?: string | null
          status_code?: number | null
          team?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_endpoints_league"
            columns: ["league"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["code"]
          },
        ]
      }
      ingest_runs: {
        Row: {
          argv: Json | null
          articles_deduped: number | null
          articles_inserted: number | null
          endpoints_error: number | null
          endpoints_ok: number | null
          endpoints_total: number | null
          finished_at: string | null
          id: string
          notes: string | null
          options: Json | null
          started_at: string
        }
        Insert: {
          argv?: Json | null
          articles_deduped?: number | null
          articles_inserted?: number | null
          endpoints_error?: number | null
          endpoints_ok?: number | null
          endpoints_total?: number | null
          finished_at?: string | null
          id?: string
          notes?: string | null
          options?: Json | null
          started_at?: string
        }
        Update: {
          argv?: Json | null
          articles_deduped?: number | null
          articles_inserted?: number | null
          endpoints_error?: number | null
          endpoints_ok?: number | null
          endpoints_total?: number | null
          finished_at?: string | null
          id?: string
          notes?: string | null
          options?: Json | null
          started_at?: string
        }
        Relationships: []
      }
      people: {
        Row: {
          aliases: string[]
          created_at: string
          display_name: string
          id: number
          position: string | null
          slug: string
          team_id: number | null
          topic_id: number | null
          updated_at: string
        }
        Insert: {
          aliases?: string[]
          created_at?: string
          display_name: string
          id?: number
          position?: string | null
          slug: string
          team_id?: number | null
          topic_id?: number | null
          updated_at?: string
        }
        Update: {
          aliases?: string[]
          created_at?: string
          display_name?: string
          id?: number
          position?: string | null
          slug?: string
          team_id?: number | null
          topic_id?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      site_domains: {
        Row: {
          confidence: number | null
          discovered_at: string | null
          host: string
          id: number
          kind: string
          updated_at: string | null
          url: string
        }
        Insert: {
          confidence?: number | null
          discovered_at?: string | null
          host: string
          id?: number
          kind: string
          updated_at?: string | null
          url: string
        }
        Update: {
          confidence?: number | null
          discovered_at?: string | null
          host?: string
          id?: number
          kind?: string
          updated_at?: string | null
          url?: string
        }
        Relationships: []
      }
      subscriber_interests: {
        Row: {
          added_at: string | null
          kind: Database["public"]["Enums"]["interest_kind"]
          notification_enabled: boolean | null
          priority: number | null
          subject_id: number
          subscriber_id: string
        }
        Insert: {
          added_at?: string | null
          kind: Database["public"]["Enums"]["interest_kind"]
          notification_enabled?: boolean | null
          priority?: number | null
          subject_id: number
          subscriber_id: string
        }
        Update: {
          added_at?: string | null
          kind?: Database["public"]["Enums"]["interest_kind"]
          notification_enabled?: boolean | null
          priority?: number | null
          subject_id?: number
          subscriber_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriber_interests_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "subscribers"
            referencedColumns: ["id"]
          },
        ]
      }
      subscribers: {
        Row: {
          created_at: string | null
          email: string
          id: string
          is_active: boolean | null
          last_active_at: string | null
          name: string | null
          notification_frequency: string | null
          subscription_tier: string | null
          time_zone: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id: string
          is_active?: boolean | null
          last_active_at?: string | null
          name?: string | null
          notification_frequency?: string | null
          subscription_tier?: string | null
          time_zone?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          last_active_at?: string | null
          name?: string | null
          notification_frequency?: string | null
          subscription_tier?: string | null
          time_zone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      teams: {
        Row: {
          actual_city: string | null
          aliases: string[]
          city_state_name: string
          country_code: string | null
          created_at: string
          display_name: string
          id: number
          lat: number | null
          lon: number | null
          nickname: string | null
          slug: string
          state: string | null
          topic_id: number
          updated_at: string
          venue: string | null
        }
        Insert: {
          actual_city?: string | null
          aliases?: string[]
          city_state_name: string
          country_code?: string | null
          created_at?: string
          display_name: string
          id?: number
          lat?: number | null
          lon?: number | null
          nickname?: string | null
          slug: string
          state?: string | null
          topic_id: number
          updated_at?: string
          venue?: string | null
        }
        Update: {
          actual_city?: string | null
          aliases?: string[]
          city_state_name?: string
          country_code?: string | null
          created_at?: string
          display_name?: string
          id?: number
          lat?: number | null
          lon?: number | null
          nickname?: string | null
          slug?: string
          state?: string | null
          topic_id?: number
          updated_at?: string
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teams_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      topics: {
        Row: {
          aliases: string[]
          code: string
          created_at: string
          description: string | null
          id: number
          kind: Database["public"]["Enums"]["topic_kind"]
          name: string
          sport: string
          updated_at: string
        }
        Insert: {
          aliases?: string[]
          code: string
          created_at?: string
          description?: string | null
          id?: number
          kind: Database["public"]["Enums"]["topic_kind"]
          name: string
          sport: string
          updated_at?: string
        }
        Update: {
          aliases?: string[]
          code?: string
          created_at?: string
          description?: string | null
          id?: number
          kind?: Database["public"]["Enums"]["topic_kind"]
          name?: string
          sport?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      v_articles: {
        Row: {
          author: string | null
          canonical_url: string | null
          cities: string[] | null
          content: string | null
          content_hash: string | null
          created_at: string | null
          display_image_url: string | null
          domain: string | null
          duration_seconds: number | null
          entities: Json | null
          excerpt: string | null
          fetched_at: string | null
          first_seen_at: string | null
          guid: string | null
          hours_since: number | null
          id: number | null
          keywords: Json | null
          language: string | null
          lead_image_url: string | null
          leagues: string[] | null
          media_type: Database["public"]["Enums"]["media_type"] | null
          media_url: string | null
          paywalled: boolean | null
          people: string[] | null
          platform: string | null
          published_at: string | null
          published_fmt: string | null
          score: number | null
          source_display_name: string | null
          teams: string[] | null
          thumbnail_url: string | null
          title: string | null
          updated_at: string | null
          url: string | null
          url_hash: string | null
          word_count: number | null
        }
        Insert: {
          author?: string | null
          canonical_url?: string | null
          cities?: string[] | null
          content?: string | null
          content_hash?: string | null
          created_at?: string | null
          display_image_url?: never
          domain?: string | null
          duration_seconds?: number | null
          entities?: Json | null
          excerpt?: string | null
          fetched_at?: string | null
          first_seen_at?: string | null
          guid?: string | null
          hours_since?: never
          id?: number | null
          keywords?: Json | null
          language?: string | null
          lead_image_url?: string | null
          leagues?: string[] | null
          media_type?: Database["public"]["Enums"]["media_type"] | null
          media_url?: string | null
          paywalled?: boolean | null
          people?: string[] | null
          platform?: string | null
          published_at?: string | null
          published_fmt?: string | null
          score?: number | null
          source_display_name?: string | null
          teams?: string[] | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string | null
          url?: string | null
          url_hash?: string | null
          word_count?: number | null
        }
        Update: {
          author?: string | null
          canonical_url?: string | null
          cities?: string[] | null
          content?: string | null
          content_hash?: string | null
          created_at?: string | null
          display_image_url?: never
          domain?: string | null
          duration_seconds?: number | null
          entities?: Json | null
          excerpt?: string | null
          fetched_at?: string | null
          first_seen_at?: string | null
          guid?: string | null
          hours_since?: never
          id?: number | null
          keywords?: Json | null
          language?: string | null
          lead_image_url?: string | null
          leagues?: string[] | null
          media_type?: Database["public"]["Enums"]["media_type"] | null
          media_url?: string | null
          paywalled?: boolean | null
          people?: string[] | null
          platform?: string | null
          published_at?: string | null
          published_fmt?: string | null
          score?: number | null
          source_display_name?: string | null
          teams?: string[] | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string | null
          url?: string | null
          url_hash?: string | null
          word_count?: number | null
        }
        Relationships: []
      }
      v_articles_only: {
        Row: {
          author: string | null
          canonical_url: string | null
          cities: string[] | null
          content: string | null
          content_hash: string | null
          created_at: string | null
          display_image_url: string | null
          domain: string | null
          duration_seconds: number | null
          entities: Json | null
          excerpt: string | null
          fetched_at: string | null
          first_seen_at: string | null
          guid: string | null
          hours_since: number | null
          id: number | null
          keywords: Json | null
          language: string | null
          lead_image_url: string | null
          leagues: string[] | null
          media_type: Database["public"]["Enums"]["media_type"] | null
          media_url: string | null
          paywalled: boolean | null
          people: string[] | null
          platform: string | null
          published_at: string | null
          published_fmt: string | null
          score: number | null
          source_display_name: string | null
          teams: string[] | null
          thumbnail_url: string | null
          title: string | null
          updated_at: string | null
          url: string | null
          url_hash: string | null
          word_count: number | null
        }
        Insert: {
          author?: string | null
          canonical_url?: string | null
          cities?: string[] | null
          content?: string | null
          content_hash?: string | null
          created_at?: string | null
          display_image_url?: never
          domain?: string | null
          duration_seconds?: number | null
          entities?: Json | null
          excerpt?: string | null
          fetched_at?: string | null
          first_seen_at?: string | null
          guid?: string | null
          hours_since?: never
          id?: number | null
          keywords?: Json | null
          language?: string | null
          lead_image_url?: string | null
          leagues?: string[] | null
          media_type?: Database["public"]["Enums"]["media_type"] | null
          media_url?: string | null
          paywalled?: boolean | null
          people?: string[] | null
          platform?: string | null
          published_at?: string | null
          published_fmt?: string | null
          score?: number | null
          source_display_name?: string | null
          teams?: string[] | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string | null
          url?: string | null
          url_hash?: string | null
          word_count?: number | null
        }
        Update: {
          author?: string | null
          canonical_url?: string | null
          cities?: string[] | null
          content?: string | null
          content_hash?: string | null
          created_at?: string | null
          display_image_url?: never
          domain?: string | null
          duration_seconds?: number | null
          entities?: Json | null
          excerpt?: string | null
          fetched_at?: string | null
          first_seen_at?: string | null
          guid?: string | null
          hours_since?: never
          id?: number | null
          keywords?: Json | null
          language?: string | null
          lead_image_url?: string | null
          leagues?: string[] | null
          media_type?: Database["public"]["Enums"]["media_type"] | null
          media_url?: string | null
          paywalled?: boolean | null
          people?: string[] | null
          platform?: string | null
          published_at?: string | null
          published_fmt?: string | null
          score?: number | null
          source_display_name?: string | null
          teams?: string[] | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string | null
          url?: string | null
          url_hash?: string | null
          word_count?: number | null
        }
        Relationships: []
      }
      v_endpoint_checks: {
        Row: {
          check_id: number | null
          checked_at: string | null
          display_name: string | null
          domain: string | null
          endpoint_id: number | null
          endpoint_url: string | null
          error_count: number | null
          items_found: number | null
          kind: string | null
          notes: string | null
          priority: number | null
          status_code: number | null
        }
        Relationships: [
          {
            foreignKeyName: "endpoint_checks_endpoint_id_fkey"
            columns: ["endpoint_id"]
            isOneToOne: false
            referencedRelation: "endpoints"
            referencedColumns: ["id"]
          },
        ]
      }
      v_endpoint_checks_latest: {
        Row: {
          check_id: number | null
          checked_at: string | null
          display_name: string | null
          domain: string | null
          endpoint_id: number | null
          endpoint_url: string | null
          error_count: number | null
          items_found: number | null
          kind: string | null
          notes: string | null
          priority: number | null
          rn: number | null
          status_code: number | null
        }
        Relationships: [
          {
            foreignKeyName: "endpoint_checks_endpoint_id_fkey"
            columns: ["endpoint_id"]
            isOneToOne: false
            referencedRelation: "endpoints"
            referencedColumns: ["id"]
          },
        ]
      }
      v_videos_only: {
        Row: {
          author: string | null
          canonical_url: string | null
          cities: string[] | null
          content: string | null
          content_hash: string | null
          created_at: string | null
          display_image_url: string | null
          domain: string | null
          duration_seconds: number | null
          entities: Json | null
          excerpt: string | null
          fetched_at: string | null
          first_seen_at: string | null
          guid: string | null
          hours_since: number | null
          id: number | null
          keywords: Json | null
          language: string | null
          lead_image_url: string | null
          leagues: string[] | null
          media_type: Database["public"]["Enums"]["media_type"] | null
          media_url: string | null
          paywalled: boolean | null
          people: string[] | null
          platform: string | null
          published_at: string | null
          published_fmt: string | null
          score: number | null
          source_display_name: string | null
          teams: string[] | null
          thumbnail_url: string | null
          title: string | null
          updated_at: string | null
          url: string | null
          url_hash: string | null
          word_count: number | null
        }
        Insert: {
          author?: string | null
          canonical_url?: string | null
          cities?: string[] | null
          content?: string | null
          content_hash?: string | null
          created_at?: string | null
          display_image_url?: never
          domain?: string | null
          duration_seconds?: number | null
          entities?: Json | null
          excerpt?: string | null
          fetched_at?: string | null
          first_seen_at?: string | null
          guid?: string | null
          hours_since?: never
          id?: number | null
          keywords?: Json | null
          language?: string | null
          lead_image_url?: string | null
          leagues?: string[] | null
          media_type?: Database["public"]["Enums"]["media_type"] | null
          media_url?: string | null
          paywalled?: boolean | null
          people?: string[] | null
          platform?: string | null
          published_at?: string | null
          published_fmt?: string | null
          score?: number | null
          source_display_name?: string | null
          teams?: string[] | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string | null
          url?: string | null
          url_hash?: string | null
          word_count?: number | null
        }
        Update: {
          author?: string | null
          canonical_url?: string | null
          cities?: string[] | null
          content?: string | null
          content_hash?: string | null
          created_at?: string | null
          display_image_url?: never
          domain?: string | null
          duration_seconds?: number | null
          entities?: Json | null
          excerpt?: string | null
          fetched_at?: string | null
          first_seen_at?: string | null
          guid?: string | null
          hours_since?: never
          id?: number | null
          keywords?: Json | null
          language?: string | null
          lead_image_url?: string | null
          leagues?: string[] | null
          media_type?: Database["public"]["Enums"]["media_type"] | null
          media_url?: string | null
          paywalled?: boolean | null
          people?: string[] | null
          platform?: string | null
          published_at?: string | null
          published_fmt?: string | null
          score?: number | null
          source_display_name?: string | null
          teams?: string[] | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string | null
          url?: string | null
          url_hash?: string | null
          word_count?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      basic_user_feed: {
        Args: { n?: number; uid: string }
        Returns: {
          domain: string
          id: number
          leagues: string[]
          people: string[]
          published_at: string
          signals: Json
          teams: string[]
          title: string
          url: string
        }[]
      }
      ensure_my_subscriber: { Args: never; Returns: undefined }
      get_subscriber_feed: {
        Args: {
          p_cursor_id?: number
          p_cursor_time?: string
          p_limit?: number
          p_since?: string
          p_subscriber_id: string
        }
        Returns: {
          article_id: number
          domain: string
          published_at: string
          published_effective: string
          thumbnail_url: string
          title: string
          updated_at: string
          url: string
        }[]
      }
      match_url_keys: {
        Args: { keys: string[] }
        Returns: {
          id: number
          url_key: string
        }[]
      }
      personalized_feed: {
        Args: { n?: number; uid: string }
        Returns: {
          cities: string[]
          domain: string
          id: number
          leagues: string[]
          people: string[]
          personalized_score: number
          published_at: string
          score: number
          signals: Json
          teams: string[]
          title: string
          url: string
        }[]
      }
      resolve_teams: {
        Args: { names: string[]; p_topic_id?: number }
        Returns: {
          input: string
          team_id: number
        }[]
      }
      url_host: { Args: { u: string }; Returns: string }
    }
    Enums: {
      interest_kind: "team" | "topic" | "person"
      media_type: "article" | "video"
      rule_kind: "html" | "rss" | "both"
      topic_kind: "league" | "topic"
      validation_mode: "none" | "by_meta" | "by_words"
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
      interest_kind: ["team", "topic", "person"],
      media_type: ["article", "video"],
      rule_kind: ["html", "rss", "both"],
      topic_kind: ["league", "topic"],
      validation_mode: ["none", "by_meta", "by_words"],
    },
  },
} as const
