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
      _team_updates: {
        Row: {
          api_id: string | null
          display_name: string
          logo_url: string | null
        }
        Insert: {
          api_id?: string | null
          display_name: string
          logo_url?: string | null
        }
        Update: {
          api_id?: string | null
          display_name?: string
          logo_url?: string | null
        }
        Relationships: []
      }
      article_league_map: {
        Row: {
          article_id: number
          confidence_score: number | null
          created_at: string
          extraction_method: string | null
          league_id: number
          relevance: number | null
          updated_at: string | null
        }
        Insert: {
          article_id: number
          confidence_score?: number | null
          created_at?: string
          extraction_method?: string | null
          league_id: number
          relevance?: number | null
          updated_at?: string | null
        }
        Update: {
          article_id?: number
          confidence_score?: number | null
          created_at?: string
          extraction_method?: string | null
          league_id?: number
          relevance?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "article_league_map_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_league_map_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
        ]
      }
      article_person_map: {
        Row: {
          article_id: number
          confidence_score: number | null
          created_at: string
          detected_name: string | null
          extraction_method: string | null
          first_mention_position: number | null
          in_title: boolean | null
          is_primary_subject: boolean | null
          match_context: string | null
          mention_count: number | null
          person_id: number
          relevance: number | null
          updated_at: string | null
        }
        Insert: {
          article_id: number
          confidence_score?: number | null
          created_at?: string
          detected_name?: string | null
          extraction_method?: string | null
          first_mention_position?: number | null
          in_title?: boolean | null
          is_primary_subject?: boolean | null
          match_context?: string | null
          mention_count?: number | null
          person_id: number
          relevance?: number | null
          updated_at?: string | null
        }
        Update: {
          article_id?: number
          confidence_score?: number | null
          created_at?: string
          detected_name?: string | null
          extraction_method?: string | null
          first_mention_position?: number | null
          in_title?: boolean | null
          is_primary_subject?: boolean | null
          match_context?: string | null
          mention_count?: number | null
          person_id?: number
          relevance?: number | null
          updated_at?: string | null
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
          ingest_run_id: string | null
          last_seen_at: string
        }
        Insert: {
          article_id: number
          discovered_url?: string
          endpoint_id: number
          first_seen_at?: string | null
          ingest_run_id?: string | null
          last_seen_at?: string
        }
        Update: {
          article_id?: number
          discovered_url?: string
          endpoint_id?: number
          first_seen_at?: string | null
          ingest_run_id?: string | null
          last_seen_at?: string
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
            foreignKeyName: "article_sources_endpoint_id_fkey"
            columns: ["endpoint_id"]
            isOneToOne: false
            referencedRelation: "endpoints"
            referencedColumns: ["id"]
          },
        ]
      }
      article_sport_map: {
        Row: {
          article_id: number
          confidence_score: number | null
          created_at: string | null
          extraction_method: string | null
          relevance: number | null
          sport: string | null
          sport_id: number
          updated_at: string | null
        }
        Insert: {
          article_id: number
          confidence_score?: number | null
          created_at?: string | null
          extraction_method?: string | null
          relevance?: number | null
          sport?: string | null
          sport_id: number
          updated_at?: string | null
        }
        Update: {
          article_id?: number
          confidence_score?: number | null
          created_at?: string | null
          extraction_method?: string | null
          relevance?: number | null
          sport?: string | null
          sport_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "article_sport_map_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_sport_map_sport_id_fkey"
            columns: ["sport_id"]
            isOneToOne: false
            referencedRelation: "sports"
            referencedColumns: ["id"]
          },
        ]
      }
      article_team_map: {
        Row: {
          article_id: number
          confidence_score: number | null
          created_at: string
          detected_name: string | null
          extraction_method: string | null
          first_mention_position: number | null
          in_title: boolean | null
          is_primary_subject: boolean | null
          mention_count: number | null
          relevance: number | null
          team_id: number
          updated_at: string | null
        }
        Insert: {
          article_id: number
          confidence_score?: number | null
          created_at?: string
          detected_name?: string | null
          extraction_method?: string | null
          first_mention_position?: number | null
          in_title?: boolean | null
          is_primary_subject?: boolean | null
          mention_count?: number | null
          relevance?: number | null
          team_id: number
          updated_at?: string | null
        }
        Update: {
          article_id?: number
          confidence_score?: number | null
          created_at?: string
          detected_name?: string | null
          extraction_method?: string | null
          first_mention_position?: number | null
          in_title?: boolean | null
          is_primary_subject?: boolean | null
          mention_count?: number | null
          relevance?: number | null
          team_id?: number
          updated_at?: string | null
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
            foreignKeyName: "article_team_map_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      articles: {
        Row: {
          ai_extraction_cost: number | null
          ai_extraction_ms: number | null
          ai_leagues: string[] | null
          ai_model: string | null
          ai_people: string[] | null
          ai_sports: string[] | null
          ai_teams: string[] | null
          author: string | null
          canonical_url: string | null
          content: string | null
          content_hash: string | null
          created_at: string
          domain: string
          duration_seconds: number | null
          excerpt: string | null
          fetched_at: string | null
          first_seen_at: string | null
          guid: string | null
          id: number
          ingest_run_id: string | null
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
          signals: Json | null
          source_display_name: string | null
          sports: string[] | null
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
          ai_leagues?: string[] | null
          ai_model?: string | null
          ai_people?: string[] | null
          ai_sports?: string[] | null
          ai_teams?: string[] | null
          author?: string | null
          canonical_url?: string | null
          content?: string | null
          content_hash?: string | null
          created_at?: string
          domain: string
          duration_seconds?: number | null
          excerpt?: string | null
          fetched_at?: string | null
          first_seen_at?: string | null
          guid?: string | null
          id?: number
          ingest_run_id?: string | null
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
          signals?: Json | null
          source_display_name?: string | null
          sports?: string[] | null
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
          ai_leagues?: string[] | null
          ai_model?: string | null
          ai_people?: string[] | null
          ai_sports?: string[] | null
          ai_teams?: string[] | null
          author?: string | null
          canonical_url?: string | null
          content?: string | null
          content_hash?: string | null
          created_at?: string
          domain?: string
          duration_seconds?: number | null
          excerpt?: string | null
          fetched_at?: string | null
          first_seen_at?: string | null
          guid?: string | null
          id?: number
          ingest_run_id?: string | null
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
          signals?: Json | null
          source_display_name?: string | null
          sports?: string[] | null
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
          last_modified_header: string | null
          league: string | null
          notes: string | null
          poll_tier: number | null
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
          last_modified_header?: string | null
          league?: string | null
          notes?: string | null
          poll_tier?: number | null
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
          last_modified_header?: string | null
          league?: string | null
          notes?: string | null
          poll_tier?: number | null
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
            referencedRelation: "leagues"
            referencedColumns: ["code"]
          },
        ]
      }
      ingest_run_endpoints: {
        Row: {
          ai_calls_made: number | null
          ai_calls_skipped: number | null
          ai_total_cost: number | null
          ai_total_ms: number | null
          articles_found: number | null
          candidates: number | null
          deduped_batch: number | null
          deduped_db: number | null
          duration_seconds: number | null
          endpoint_id: number
          error_message: string | null
          exclusive_articles: number | null
          feed_etag: string | null
          feed_item_count: number | null
          feed_last_modified_at: string | null
          fetched: number | null
          finished_at: string | null
          http_status: number | null
          id: string
          ingest_run_id: string
          inserted: number | null
          known_guid: number | null
          new_candidates: number | null
          newest_item_pub_date: string | null
          oldest_item_pub_date: string | null
          pct_exclusive: number | null
          rejection_reasons: Json | null
          skipped: number | null
          started_at: string
          status: string | null
          syndicated_articles: number | null
          too_old: number | null
          used_etag: boolean | null
        }
        Insert: {
          ai_calls_made?: number | null
          ai_calls_skipped?: number | null
          ai_total_cost?: number | null
          ai_total_ms?: number | null
          articles_found?: number | null
          candidates?: number | null
          deduped_batch?: number | null
          deduped_db?: number | null
          duration_seconds?: number | null
          endpoint_id: number
          error_message?: string | null
          exclusive_articles?: number | null
          feed_etag?: string | null
          feed_item_count?: number | null
          feed_last_modified_at?: string | null
          fetched?: number | null
          finished_at?: string | null
          http_status?: number | null
          id?: string
          ingest_run_id: string
          inserted?: number | null
          known_guid?: number | null
          new_candidates?: number | null
          newest_item_pub_date?: string | null
          oldest_item_pub_date?: string | null
          pct_exclusive?: number | null
          rejection_reasons?: Json | null
          skipped?: number | null
          started_at?: string
          status?: string | null
          syndicated_articles?: number | null
          too_old?: number | null
          used_etag?: boolean | null
        }
        Update: {
          ai_calls_made?: number | null
          ai_calls_skipped?: number | null
          ai_total_cost?: number | null
          ai_total_ms?: number | null
          articles_found?: number | null
          candidates?: number | null
          deduped_batch?: number | null
          deduped_db?: number | null
          duration_seconds?: number | null
          endpoint_id?: number
          error_message?: string | null
          exclusive_articles?: number | null
          feed_etag?: string | null
          feed_item_count?: number | null
          feed_last_modified_at?: string | null
          fetched?: number | null
          finished_at?: string | null
          http_status?: number | null
          id?: string
          ingest_run_id?: string
          inserted?: number | null
          known_guid?: number | null
          new_candidates?: number | null
          newest_item_pub_date?: string | null
          oldest_item_pub_date?: string | null
          pct_exclusive?: number | null
          rejection_reasons?: Json | null
          skipped?: number | null
          started_at?: string
          status?: string | null
          syndicated_articles?: number | null
          too_old?: number | null
          used_etag?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "ingest_run_endpoints_endpoint_id_fkey"
            columns: ["endpoint_id"]
            isOneToOne: false
            referencedRelation: "endpoints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingest_run_endpoints_ingest_run_id_fkey"
            columns: ["ingest_run_id"]
            isOneToOne: false
            referencedRelation: "ingest_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      ingest_runs: {
        Row: {
          argv: Json | null
          articles_duplicates: number | null
          articles_inserted: number | null
          avg_articles_per_endpoint: number | null
          duration_seconds: number | null
          endpoints_error: number | null
          endpoints_ok: number | null
          endpoints_total: number | null
          finished_at: string | null
          id: string
          notes: string | null
          options: Json | null
          started_at: string
          syndication_ratio: number | null
        }
        Insert: {
          argv?: Json | null
          articles_duplicates?: number | null
          articles_inserted?: number | null
          avg_articles_per_endpoint?: number | null
          duration_seconds?: number | null
          endpoints_error?: number | null
          endpoints_ok?: number | null
          endpoints_total?: number | null
          finished_at?: string | null
          id?: string
          notes?: string | null
          options?: Json | null
          started_at?: string
          syndication_ratio?: number | null
        }
        Update: {
          argv?: Json | null
          articles_duplicates?: number | null
          articles_inserted?: number | null
          avg_articles_per_endpoint?: number | null
          duration_seconds?: number | null
          endpoints_error?: number | null
          endpoints_ok?: number | null
          endpoints_total?: number | null
          finished_at?: string | null
          id?: string
          notes?: string | null
          options?: Json | null
          started_at?: string
          syndication_ratio?: number | null
        }
        Relationships: []
      }
      leagues: {
        Row: {
          aliases: string[]
          app_order_id: number | null
          code: string
          created_at: string
          description: string | null
          display_label: string | null
          display_options: Json | null
          id: number
          kind: Database["public"]["Enums"]["topic_kind"]
          logo_url: string | null
          name: string
          sport: string
          updated_at: string
        }
        Insert: {
          aliases?: string[]
          app_order_id?: number | null
          code: string
          created_at?: string
          description?: string | null
          display_label?: string | null
          display_options?: Json | null
          id?: number
          kind: Database["public"]["Enums"]["topic_kind"]
          logo_url?: string | null
          name: string
          sport: string
          updated_at?: string
        }
        Update: {
          aliases?: string[]
          app_order_id?: number | null
          code?: string
          created_at?: string
          description?: string | null
          display_label?: string | null
          display_options?: Json | null
          id?: number
          kind?: Database["public"]["Enums"]["topic_kind"]
          logo_url?: string | null
          name?: string
          sport?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leagues_sport_fkey"
            columns: ["sport"]
            isOneToOne: false
            referencedRelation: "sports"
            referencedColumns: ["sport"]
          },
        ]
      }
      metro_areas: {
        Row: {
          country_code: string | null
          created_at: string | null
          id: number
          metro_name: string
        }
        Insert: {
          country_code?: string | null
          created_at?: string | null
          id?: number
          metro_name: string
        }
        Update: {
          country_code?: string | null
          created_at?: string | null
          id?: number
          metro_name?: string
        }
        Relationships: []
      }
      metro_mapping_import: {
        Row: {
          city_name: string | null
          country_code: string | null
          metro_area: string | null
          state: string | null
        }
        Insert: {
          city_name?: string | null
          country_code?: string | null
          metro_area?: string | null
          state?: string | null
        }
        Update: {
          city_name?: string | null
          country_code?: string | null
          metro_area?: string | null
          state?: string | null
        }
        Relationships: []
      }
      people: {
        Row: {
          api_id: string | null
          api_source: string | null
          created_at: string | null
          id: number
          is_active: boolean | null
          jersey_number: string | null
          last_updated: string | null
          league_id: number | null
          name: string
          normalized_name: string
          position: string | null
          role: string
          sport_id: number | null
          team_id: number | null
        }
        Insert: {
          api_id?: string | null
          api_source?: string | null
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          jersey_number?: string | null
          last_updated?: string | null
          league_id?: number | null
          name: string
          normalized_name: string
          position?: string | null
          role: string
          sport_id?: number | null
          team_id?: number | null
        }
        Update: {
          api_id?: string | null
          api_source?: string | null
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          jersey_number?: string | null
          last_updated?: string | null
          league_id?: number | null
          name?: string
          normalized_name?: string
          position?: string | null
          role?: string
          sport_id?: number | null
          team_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "people_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "people_sport_id_fkey"
            columns: ["sport_id"]
            isOneToOne: false
            referencedRelation: "sports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "people_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      people_discovered: {
        Row: {
          article_id: number | null
          detected_league: string | null
          detected_sport: string | null
          detected_teams: string[] | null
          first_seen_at: string | null
          id: number
          last_seen_at: string | null
          name: string
          normalized_name: string
          times_seen: number | null
        }
        Insert: {
          article_id?: number | null
          detected_league?: string | null
          detected_sport?: string | null
          detected_teams?: string[] | null
          first_seen_at?: string | null
          id?: number
          last_seen_at?: string | null
          name: string
          normalized_name: string
          times_seen?: number | null
        }
        Update: {
          article_id?: number | null
          detected_league?: string | null
          detected_sport?: string | null
          detected_teams?: string[] | null
          first_seen_at?: string | null
          id?: number
          last_seen_at?: string | null
          name?: string
          normalized_name?: string
          times_seen?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "people_discovered_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      roster_api_sources: {
        Row: {
          api_provider: string
          created_at: string | null
          id: number
          is_active: boolean | null
          last_sync_error: string | null
          last_sync_errors: number | null
          last_sync_status: string | null
          last_sync_upserted: number | null
          last_synced_at: string | null
          league_id: number | null
          notes: string | null
          rate_limit_delay_ms: number | null
          request_headers: Json | null
          requires_season: boolean | null
          roster_url_pattern: string
          sport_id: number | null
          sync_priority: number | null
          teams_url: string | null
          updated_at: string | null
          url_params: Json | null
        }
        Insert: {
          api_provider: string
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          last_sync_error?: string | null
          last_sync_errors?: number | null
          last_sync_status?: string | null
          last_sync_upserted?: number | null
          last_synced_at?: string | null
          league_id?: number | null
          notes?: string | null
          rate_limit_delay_ms?: number | null
          request_headers?: Json | null
          requires_season?: boolean | null
          roster_url_pattern: string
          sport_id?: number | null
          sync_priority?: number | null
          teams_url?: string | null
          updated_at?: string | null
          url_params?: Json | null
        }
        Update: {
          api_provider?: string
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          last_sync_error?: string | null
          last_sync_errors?: number | null
          last_sync_status?: string | null
          last_sync_upserted?: number | null
          last_synced_at?: string | null
          league_id?: number | null
          notes?: string | null
          rate_limit_delay_ms?: number | null
          request_headers?: Json | null
          requires_season?: boolean | null
          roster_url_pattern?: string
          sport_id?: number | null
          sync_priority?: number | null
          teams_url?: string | null
          updated_at?: string | null
          url_params?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "roster_api_sources_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roster_api_sources_sport_id_fkey"
            columns: ["sport_id"]
            isOneToOne: false
            referencedRelation: "sports"
            referencedColumns: ["id"]
          },
        ]
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
      sports: {
        Row: {
          app_order_id: number | null
          created_at: string | null
          description: string | null
          display_label: string | null
          display_name: string
          display_options: Json | null
          icon_emoji: string | null
          id: number
          logo_url: string | null
          sport: string
        }
        Insert: {
          app_order_id?: number | null
          created_at?: string | null
          description?: string | null
          display_label?: string | null
          display_name: string
          display_options?: Json | null
          icon_emoji?: string | null
          id?: number
          logo_url?: string | null
          sport: string
        }
        Update: {
          app_order_id?: number | null
          created_at?: string | null
          description?: string | null
          display_label?: string | null
          display_name?: string
          display_options?: Json | null
          icon_emoji?: string | null
          id?: number
          logo_url?: string | null
          sport?: string
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
          abbreviation: string | null
          actual_city: string | null
          aliases: string[]
          api_id: string | null
          api_source: string | null
          city_state_name: string
          country_code: string | null
          created_at: string
          display_name: string
          id: number
          lat: number | null
          league_id: number
          logo_url: string | null
          lon: number | null
          metro_area_id: number | null
          nickname: string | null
          slug: string
          state: string | null
          updated_at: string
          venue: string | null
        }
        Insert: {
          abbreviation?: string | null
          actual_city?: string | null
          aliases?: string[]
          api_id?: string | null
          api_source?: string | null
          city_state_name: string
          country_code?: string | null
          created_at?: string
          display_name: string
          id?: number
          lat?: number | null
          league_id: number
          logo_url?: string | null
          lon?: number | null
          metro_area_id?: number | null
          nickname?: string | null
          slug: string
          state?: string | null
          updated_at?: string
          venue?: string | null
        }
        Update: {
          abbreviation?: string | null
          actual_city?: string | null
          aliases?: string[]
          api_id?: string | null
          api_source?: string | null
          city_state_name?: string
          country_code?: string | null
          created_at?: string
          display_name?: string
          id?: number
          lat?: number | null
          league_id?: number
          logo_url?: string | null
          lon?: number | null
          metro_area_id?: number | null
          nickname?: string | null
          slug?: string
          state?: string | null
          updated_at?: string
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teams_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_metro_area_id_fkey"
            columns: ["metro_area_id"]
            isOneToOne: false
            referencedRelation: "metro_areas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      subscriber_interests_detailed: {
        Row: {
          added_at: string | null
          email: string | null
          icon: string | null
          kind: Database["public"]["Enums"]["interest_kind"] | null
          notification_enabled: boolean | null
          priority: number | null
          subject_code: string | null
          subject_id: number | null
          subject_name: string | null
          subscriber_id: string | null
          subscriber_name: string | null
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
      subscriber_interests_with_details: {
        Row: {
          added_at: string | null
          kind: Database["public"]["Enums"]["interest_kind"] | null
          notification_enabled: boolean | null
          priority: number | null
          subject_id: number | null
          subject_name: string | null
          subscriber_id: string | null
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
      link_article_source: {
        Args: {
          p_article_id: number
          p_discovered_url: string
          p_endpoint_id: number
          p_run_id: string
        }
        Returns: undefined
      }
      link_article_sources_bulk: {
        Args: { p_rows: Json; p_run_id?: string }
        Returns: undefined
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
        Args: { names: string[]; p_league_id?: number }
        Returns: {
          input: string
          team_id: number
        }[]
      }
      toggle_subscriber_interest: {
        Args: {
          p_kind: Database["public"]["Enums"]["interest_kind"]
          p_subject_id: number
        }
        Returns: boolean
      }
      upsert_discovered_person: {
        Args: {
          p_article_id: number
          p_detected_league: string
          p_detected_sport: string
          p_detected_teams: string[]
          p_name: string
          p_normalized_name: string
        }
        Returns: undefined
      }
      url_host: { Args: { u: string }; Returns: string }
    }
    Enums: {
      interest_kind: "team" | "topic" | "person" | "sport" | "league"
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
      interest_kind: ["team", "topic", "person", "sport", "league"],
      media_type: ["article", "video"],
      rule_kind: ["html", "rss", "both"],
      topic_kind: ["league", "topic"],
      validation_mode: ["none", "by_meta", "by_words"],
    },
  },
} as const
