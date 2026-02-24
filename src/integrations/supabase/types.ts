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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ai_processor_runs: {
        Row: {
          ai_calls: number | null
          ai_total_cost: number | null
          ai_total_ms: number | null
          articles_failed: number | null
          articles_processed: number | null
          articles_success: number | null
          duration_seconds: number | null
          finished_at: string | null
          id: string
          last_error: string | null
          leagues_mapped: number | null
          people_mapped: number | null
          sports_mapped: number | null
          started_at: string
          status: string | null
          teams_mapped: number | null
          worker_id: string
        }
        Insert: {
          ai_calls?: number | null
          ai_total_cost?: number | null
          ai_total_ms?: number | null
          articles_failed?: number | null
          articles_processed?: number | null
          articles_success?: number | null
          duration_seconds?: number | null
          finished_at?: string | null
          id?: string
          last_error?: string | null
          leagues_mapped?: number | null
          people_mapped?: number | null
          sports_mapped?: number | null
          started_at?: string
          status?: string | null
          teams_mapped?: number | null
          worker_id: string
        }
        Update: {
          ai_calls?: number | null
          ai_total_cost?: number | null
          ai_total_ms?: number | null
          articles_failed?: number | null
          articles_processed?: number | null
          articles_success?: number | null
          duration_seconds?: number | null
          finished_at?: string | null
          id?: string
          last_error?: string | null
          leagues_mapped?: number | null
          people_mapped?: number | null
          sports_mapped?: number | null
          started_at?: string
          status?: string | null
          teams_mapped?: number | null
          worker_id?: string
        }
        Relationships: []
      }
      article_country_map: {
        Row: {
          article_id: number
          country_id: number
          created_at: string | null
          extraction_method: string | null
        }
        Insert: {
          article_id: number
          country_id: number
          created_at?: string | null
          extraction_method?: string | null
        }
        Update: {
          article_id?: number
          country_id?: number
          created_at?: string | null
          extraction_method?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "article_country_map_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_country_map_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
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
      article_school_map: {
        Row: {
          article_id: number
          created_at: string | null
          extraction_method: string | null
          school_id: number
        }
        Insert: {
          article_id: number
          created_at?: string | null
          extraction_method?: string | null
          school_id: number
        }
        Update: {
          article_id?: number
          created_at?: string | null
          extraction_method?: string | null
          school_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "article_school_map_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_school_map_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
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
          ai_countries: string[] | null
          ai_extraction_cost: number | null
          ai_extraction_ms: number | null
          ai_leagues: string[] | null
          ai_model: string | null
          ai_people: string[] | null
          ai_processed: boolean | null
          ai_retry_count: number
          ai_schools: string[] | null
          ai_sports: string[] | null
          ai_teams: string[] | null
          author: string | null
          canonical_url: string | null
          content: string | null
          content_hash: string | null
          created_at: string
          domain: string
          duplicate_of_id: number | null
          duration_seconds: number | null
          endpoint_school: string | null
          excerpt: string | null
          excerpt_hash: string | null
          fetched_at: string | null
          first_seen_at: string | null
          guid: string | null
          id: number
          ingest_run_id: string | null
          is_duplicate: boolean | null
          is_olympics: boolean | null
          language: string | null
          lead_image_url: string | null
          leagues: string[] | null
          lede_hash: string | null
          media_type: Database["public"]["Enums"]["media_type"]
          media_url: string | null
          normalized_author: string | null
          normalized_title: string | null
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
          unmatched_rss: string[] | null
          updated_at: string
          url: string
          url_domain: string
          url_hash: string | null
          url_key: string | null
          word_count: number | null
        }
        Insert: {
          ai_countries?: string[] | null
          ai_extraction_cost?: number | null
          ai_extraction_ms?: number | null
          ai_leagues?: string[] | null
          ai_model?: string | null
          ai_people?: string[] | null
          ai_processed?: boolean | null
          ai_retry_count?: number
          ai_schools?: string[] | null
          ai_sports?: string[] | null
          ai_teams?: string[] | null
          author?: string | null
          canonical_url?: string | null
          content?: string | null
          content_hash?: string | null
          created_at?: string
          domain: string
          duplicate_of_id?: number | null
          duration_seconds?: number | null
          endpoint_school?: string | null
          excerpt?: string | null
          excerpt_hash?: string | null
          fetched_at?: string | null
          first_seen_at?: string | null
          guid?: string | null
          id?: number
          ingest_run_id?: string | null
          is_duplicate?: boolean | null
          is_olympics?: boolean | null
          language?: string | null
          lead_image_url?: string | null
          leagues?: string[] | null
          lede_hash?: string | null
          media_type?: Database["public"]["Enums"]["media_type"]
          media_url?: string | null
          normalized_author?: string | null
          normalized_title?: string | null
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
          unmatched_rss?: string[] | null
          updated_at?: string
          url: string
          url_domain: string
          url_hash?: string | null
          url_key?: string | null
          word_count?: number | null
        }
        Update: {
          ai_countries?: string[] | null
          ai_extraction_cost?: number | null
          ai_extraction_ms?: number | null
          ai_leagues?: string[] | null
          ai_model?: string | null
          ai_people?: string[] | null
          ai_processed?: boolean | null
          ai_retry_count?: number
          ai_schools?: string[] | null
          ai_sports?: string[] | null
          ai_teams?: string[] | null
          author?: string | null
          canonical_url?: string | null
          content?: string | null
          content_hash?: string | null
          created_at?: string
          domain?: string
          duplicate_of_id?: number | null
          duration_seconds?: number | null
          endpoint_school?: string | null
          excerpt?: string | null
          excerpt_hash?: string | null
          fetched_at?: string | null
          first_seen_at?: string | null
          guid?: string | null
          id?: number
          ingest_run_id?: string | null
          is_duplicate?: boolean | null
          is_olympics?: boolean | null
          language?: string | null
          lead_image_url?: string | null
          leagues?: string[] | null
          lede_hash?: string | null
          media_type?: Database["public"]["Enums"]["media_type"]
          media_url?: string | null
          normalized_author?: string | null
          normalized_title?: string | null
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
          unmatched_rss?: string[] | null
          updated_at?: string
          url?: string
          url_domain?: string
          url_hash?: string | null
          url_key?: string | null
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "articles_duplicate_of_id_fkey"
            columns: ["duplicate_of_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "articles_ingest_run_id_fkey"
            columns: ["ingest_run_id"]
            isOneToOne: false
            referencedRelation: "ingest_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      countries: {
        Row: {
          app_order_id: number | null
          code: string
          created_at: string | null
          id: number
          is_summer_olympics: boolean | null
          is_winter_olympics: boolean | null
          iso2: string | null
          logo_url: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          app_order_id?: number | null
          code: string
          created_at?: string | null
          id?: number
          is_summer_olympics?: boolean | null
          is_winter_olympics?: boolean | null
          iso2?: string | null
          logo_url?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          app_order_id?: number | null
          code?: string
          created_at?: string | null
          id?: number
          is_summer_olympics?: boolean | null
          is_winter_olympics?: boolean | null
          iso2?: string | null
          logo_url?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
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
          fetch_strategy: string | null
          hours_back: number
          id: number
          is_paywalled: boolean
          is_syndicator: boolean
          kind: Database["public"]["Enums"]["rule_kind"] | null
          notes: string | null
          per_section_max_items: number | null
          proxy: string
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
          fetch_strategy?: string | null
          hours_back?: number
          id?: number
          is_paywalled?: boolean
          is_syndicator?: boolean
          kind?: Database["public"]["Enums"]["rule_kind"] | null
          notes?: string | null
          per_section_max_items?: number | null
          proxy?: string
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
          fetch_strategy?: string | null
          hours_back?: number
          id?: number
          is_paywalled?: boolean
          is_syndicator?: boolean
          kind?: Database["public"]["Enums"]["rule_kind"] | null
          notes?: string | null
          per_section_max_items?: number | null
          proxy?: string
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
          epgroup: string | null
          etag: string | null
          fix_pubdate_via_html: boolean | null
          id: number
          kind: string
          language: string | null
          last_checked_at: string | null
          last_modified_header: string | null
          league: string | null
          notes: string | null
          priority: number
          school: string | null
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
          epgroup?: string | null
          etag?: string | null
          fix_pubdate_via_html?: boolean | null
          id?: number
          kind?: string
          language?: string | null
          last_checked_at?: string | null
          last_modified_header?: string | null
          league?: string | null
          notes?: string | null
          priority?: number
          school?: string | null
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
          epgroup?: string | null
          etag?: string | null
          fix_pubdate_via_html?: boolean | null
          id?: number
          kind?: string
          language?: string | null
          last_checked_at?: string | null
          last_modified_header?: string | null
          league?: string | null
          notes?: string | null
          priority?: number
          school?: string | null
          sport?: string | null
          status_code?: number | null
          team?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "endpoints_league_fkey"
            columns: ["league"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "endpoints_sport_fkey"
            columns: ["sport"]
            isOneToOne: false
            referencedRelation: "sports"
            referencedColumns: ["sport"]
          },
          {
            foreignKeyName: "endpoints_sport_fkey"
            columns: ["sport"]
            isOneToOne: false
            referencedRelation: "subscriber_int_view"
            referencedColumns: ["sport_name"]
          },
          {
            foreignKeyName: "endpoints_sport_fkey"
            columns: ["sport"]
            isOneToOne: false
            referencedRelation: "subscriber_interests_view"
            referencedColumns: ["sport_name"]
          },
          {
            foreignKeyName: "fk_endpoints_school"
            columns: ["school"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["short_name"]
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
          fetch_failed: number | null
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
          fetch_failed?: number | null
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
          fetch_failed?: number | null
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
      league_countries: {
        Row: {
          country_id: number
          created_at: string | null
          is_active: boolean | null
          league_id: number
        }
        Insert: {
          country_id: number
          created_at?: string | null
          is_active?: boolean | null
          league_id: number
        }
        Update: {
          country_id?: number
          created_at?: string | null
          is_active?: boolean | null
          league_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "league_countries_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "league_countries_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
        ]
      }
      league_schools: {
        Row: {
          created_at: string | null
          espn_id: string | null
          is_active: boolean | null
          league_id: number
          school_id: number
        }
        Insert: {
          created_at?: string | null
          espn_id?: string | null
          is_active?: boolean | null
          league_id: number
          school_id: number
        }
        Update: {
          created_at?: string | null
          espn_id?: string | null
          is_active?: boolean | null
          league_id?: number
          school_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "league_schools_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "league_schools_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      league_teams: {
        Row: {
          created_at: string | null
          is_primary: boolean | null
          league_id: number
          team_id: number
        }
        Insert: {
          created_at?: string | null
          is_primary?: boolean | null
          league_id: number
          team_id: number
        }
        Update: {
          created_at?: string | null
          is_primary?: boolean | null
          league_id?: number
          team_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "league_teams_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "league_teams_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      leagues: {
        Row: {
          aliases: string[] | null
          app_order_id: number | null
          code: string
          created_at: string | null
          display_label: string | null
          display_options: Json | null
          id: number
          kind: Database["public"]["Enums"]["topic_kind"]
          logo_url: string | null
          name: string
          sport_id: number
          team_type: Database["public"]["Enums"]["team_type_enum"] | null
          teams_from: string | null
          updated_at: string | null
        }
        Insert: {
          aliases?: string[] | null
          app_order_id?: number | null
          code: string
          created_at?: string | null
          display_label?: string | null
          display_options?: Json | null
          id?: number
          kind?: Database["public"]["Enums"]["topic_kind"]
          logo_url?: string | null
          name: string
          sport_id: number
          team_type?: Database["public"]["Enums"]["team_type_enum"] | null
          teams_from?: string | null
          updated_at?: string | null
        }
        Update: {
          aliases?: string[] | null
          app_order_id?: number | null
          code?: string
          created_at?: string | null
          display_label?: string | null
          display_options?: Json | null
          id?: number
          kind?: Database["public"]["Enums"]["topic_kind"]
          logo_url?: string | null
          name?: string
          sport_id?: number
          team_type?: Database["public"]["Enums"]["team_type_enum"] | null
          teams_from?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leagues_new_sport_id_fkey"
            columns: ["sport_id"]
            isOneToOne: false
            referencedRelation: "sports"
            referencedColumns: ["id"]
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
      olympic_sports: {
        Row: {
          app_order_id: number | null
          is_summer: boolean | null
          is_winter: boolean | null
          logo_url: string | null
          sport_id: number
        }
        Insert: {
          app_order_id?: number | null
          is_summer?: boolean | null
          is_winter?: boolean | null
          logo_url?: string | null
          sport_id: number
        }
        Update: {
          app_order_id?: number | null
          is_summer?: boolean | null
          is_winter?: boolean | null
          logo_url?: string | null
          sport_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "olympic_sports_sport_id_fkey"
            columns: ["sport_id"]
            isOneToOne: true
            referencedRelation: "sports"
            referencedColumns: ["id"]
          },
        ]
      }
      people: {
        Row: {
          aliases: string[] | null
          api_id: string | null
          api_source: string | null
          country_code: string | null
          created_at: string | null
          id: number
          jersey_number: string | null
          last_school_espn_id: string | null
          last_updated: string | null
          league_id: number | null
          name: string
          normalized_name: string
          position: string | null
          role: string
          school_id: number | null
          sport_id: number | null
          team_id: number | null
        }
        Insert: {
          aliases?: string[] | null
          api_id?: string | null
          api_source?: string | null
          country_code?: string | null
          created_at?: string | null
          id?: number
          jersey_number?: string | null
          last_school_espn_id?: string | null
          last_updated?: string | null
          league_id?: number | null
          name: string
          normalized_name: string
          position?: string | null
          role: string
          school_id?: number | null
          sport_id?: number | null
          team_id?: number | null
        }
        Update: {
          aliases?: string[] | null
          api_id?: string | null
          api_source?: string | null
          country_code?: string | null
          created_at?: string | null
          id?: number
          jersey_number?: string | null
          last_school_espn_id?: string | null
          last_updated?: string | null
          league_id?: number | null
          name?: string
          normalized_name?: string
          position?: string | null
          role?: string
          school_id?: number | null
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
            foreignKeyName: "people_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
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
          status: string | null
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
          status?: string | null
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
          status?: string | null
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
      preference_menu_items: {
        Row: {
          app_order: number | null
          created_at: string | null
          display_options: Json | null
          entity_id: number | null
          entity_type: string | null
          id: number
          is_submenu: boolean | null
          is_visible: boolean | null
          label: string
          logo_url: string | null
          parent_id: number | null
          updated_at: string | null
        }
        Insert: {
          app_order?: number | null
          created_at?: string | null
          display_options?: Json | null
          entity_id?: number | null
          entity_type?: string | null
          id?: number
          is_submenu?: boolean | null
          is_visible?: boolean | null
          label: string
          logo_url?: string | null
          parent_id?: number | null
          updated_at?: string | null
        }
        Update: {
          app_order?: number | null
          created_at?: string | null
          display_options?: Json | null
          entity_id?: number | null
          entity_type?: string | null
          id?: number
          is_submenu?: boolean | null
          is_visible?: boolean | null
          label?: string
          logo_url?: string | null
          parent_id?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "preference_menu_items_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "preference_menu_items"
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
          is_tournament: boolean | null
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
          skip_coach_sync: boolean | null
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
          is_tournament?: boolean | null
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
          skip_coach_sync?: boolean | null
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
          is_tournament?: boolean | null
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
          skip_coach_sync?: boolean | null
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
      schools: {
        Row: {
          aliases: string[] | null
          api_source: string | null
          app_order_id: number | null
          city: string | null
          created_at: string | null
          espn_id: string | null
          id: number
          logo_url: string | null
          mens_mascot: string | null
          name: string
          short_name: string
          state: string | null
          updated_at: string | null
          womens_mascot: string | null
        }
        Insert: {
          aliases?: string[] | null
          api_source?: string | null
          app_order_id?: number | null
          city?: string | null
          created_at?: string | null
          espn_id?: string | null
          id?: number
          logo_url?: string | null
          mens_mascot?: string | null
          name: string
          short_name: string
          state?: string | null
          updated_at?: string | null
          womens_mascot?: string | null
        }
        Update: {
          aliases?: string[] | null
          api_source?: string | null
          app_order_id?: number | null
          city?: string | null
          created_at?: string | null
          espn_id?: string | null
          id?: number
          logo_url?: string | null
          mens_mascot?: string | null
          name?: string
          short_name?: string
          state?: string | null
          updated_at?: string | null
          womens_mascot?: string | null
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
      skipped_article_urls: {
        Row: {
          article_date: string | null
          domain: string
          endpoint_id: number | null
          last_seen_at: string | null
          reason: string
          skipped_at: string | null
          url: string
          url_hash: string
        }
        Insert: {
          article_date?: string | null
          domain: string
          endpoint_id?: number | null
          last_seen_at?: string | null
          reason: string
          skipped_at?: string | null
          url: string
          url_hash: string
        }
        Update: {
          article_date?: string | null
          domain?: string
          endpoint_id?: number | null
          last_seen_at?: string | null
          reason?: string
          skipped_at?: string | null
          url?: string
          url_hash?: string
        }
        Relationships: []
      }
      sports: {
        Row: {
          aliases: string[] | null
          app_order_id: number | null
          created_at: string | null
          display_label: string | null
          display_options: Json | null
          extract_level: Database["public"]["Enums"]["extract_level"] | null
          id: number
          logo_url: string | null
          parent_id: number | null
          sport: string
          updated_at: string | null
        }
        Insert: {
          aliases?: string[] | null
          app_order_id?: number | null
          created_at?: string | null
          display_label?: string | null
          display_options?: Json | null
          extract_level?: Database["public"]["Enums"]["extract_level"] | null
          id?: number
          logo_url?: string | null
          parent_id?: number | null
          sport: string
          updated_at?: string | null
        }
        Update: {
          aliases?: string[] | null
          app_order_id?: number | null
          created_at?: string | null
          display_label?: string | null
          display_options?: Json | null
          extract_level?: Database["public"]["Enums"]["extract_level"] | null
          id?: number
          logo_url?: string | null
          parent_id?: number | null
          sport?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sports_new_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "sports"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriber_interests: {
        Row: {
          added_at: string | null
          country_id: number | null
          id: number
          is_focused: boolean | null
          is_olympics: boolean | null
          league_id: number | null
          notification_enabled: boolean | null
          person_id: number | null
          priority: number | null
          school_id: number | null
          sport_id: number | null
          subscriber_id: string
          team_id: number | null
        }
        Insert: {
          added_at?: string | null
          country_id?: number | null
          id?: number
          is_focused?: boolean | null
          is_olympics?: boolean | null
          league_id?: number | null
          notification_enabled?: boolean | null
          person_id?: number | null
          priority?: number | null
          school_id?: number | null
          sport_id?: number | null
          subscriber_id: string
          team_id?: number | null
        }
        Update: {
          added_at?: string | null
          country_id?: number | null
          id?: number
          is_focused?: boolean | null
          is_olympics?: boolean | null
          league_id?: number | null
          notification_enabled?: boolean | null
          person_id?: number | null
          priority?: number | null
          school_id?: number | null
          sport_id?: number | null
          subscriber_id?: string
          team_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriber_interests_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriber_interests_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriber_interests_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriber_interests_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriber_interests_sport_id_fkey"
            columns: ["sport_id"]
            isOneToOne: false
            referencedRelation: "sports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriber_interests_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "subscribers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriber_interests_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
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
          welcome_email_sent: boolean
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
          welcome_email_sent?: boolean
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
          welcome_email_sent?: boolean
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
          city_state_name: string | null
          country_code: string | null
          created_at: string
          display_name: string
          id: number
          lat: number | null
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
          city_state_name?: string | null
          country_code?: string | null
          created_at?: string
          display_name: string
          id?: number
          lat?: number | null
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
          city_state_name?: string | null
          country_code?: string | null
          created_at?: string
          display_name?: string
          id?: number
          lat?: number | null
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
            foreignKeyName: "teams_metro_area_id_fkey"
            columns: ["metro_area_id"]
            isOneToOne: false
            referencedRelation: "metro_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      transition_queue: {
        Row: {
          created_at: string | null
          direction: string
          from_name: string | null
          from_person_id: number | null
          id: number
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          to_api_id: string | null
          to_league_id: number | null
          to_team_name: string | null
          transition_type: string
        }
        Insert: {
          created_at?: string | null
          direction?: string
          from_name?: string | null
          from_person_id?: number | null
          id?: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          to_api_id?: string | null
          to_league_id?: number | null
          to_team_name?: string | null
          transition_type: string
        }
        Update: {
          created_at?: string | null
          direction?: string
          from_name?: string | null
          from_person_id?: number | null
          id?: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          to_api_id?: string | null
          to_league_id?: number | null
          to_team_name?: string | null
          transition_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "transition_queue_from_person_id_fkey"
            columns: ["from_person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transition_queue_to_league_id_fkey"
            columns: ["to_league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      subscriber_int_view: {
        Row: {
          added_at: string | null
          country_name: string | null
          id: number | null
          is_focused: boolean | null
          is_olympics: boolean | null
          league_name: string | null
          notification_enabled: boolean | null
          person_name: string | null
          priority: number | null
          school_name: string | null
          sport_name: string | null
          subscriber_email: string | null
          subscriber_id: string | null
          team_name: string | null
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
      subscriber_interests_view: {
        Row: {
          added_at: string | null
          country_id: number | null
          country_name: string | null
          id: number | null
          is_focused: boolean | null
          is_olympics: boolean | null
          league_id: number | null
          league_name: string | null
          notification_enabled: boolean | null
          person_id: number | null
          person_name: string | null
          priority: number | null
          school_id: number | null
          school_name: string | null
          sport_id: number | null
          sport_name: string | null
          subscriber_email: string | null
          subscriber_id: string | null
          team_id: number | null
          team_location: string | null
          team_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriber_interests_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriber_interests_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriber_interests_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriber_interests_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriber_interests_sport_id_fkey"
            columns: ["sport_id"]
            isOneToOne: false
            referencedRelation: "sports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriber_interests_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "subscribers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriber_interests_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
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
      claim_articles_for_processing: {
        Args: { p_batch_size?: number; p_worker_id?: string }
        Returns: {
          ai_countries: string[] | null
          ai_extraction_cost: number | null
          ai_extraction_ms: number | null
          ai_leagues: string[] | null
          ai_model: string | null
          ai_people: string[] | null
          ai_processed: boolean | null
          ai_retry_count: number
          ai_schools: string[] | null
          ai_sports: string[] | null
          ai_teams: string[] | null
          author: string | null
          canonical_url: string | null
          content: string | null
          content_hash: string | null
          created_at: string
          domain: string
          duplicate_of_id: number | null
          duration_seconds: number | null
          endpoint_school: string | null
          excerpt: string | null
          excerpt_hash: string | null
          fetched_at: string | null
          first_seen_at: string | null
          guid: string | null
          id: number
          ingest_run_id: string | null
          is_duplicate: boolean | null
          is_olympics: boolean | null
          language: string | null
          lead_image_url: string | null
          leagues: string[] | null
          lede_hash: string | null
          media_type: Database["public"]["Enums"]["media_type"]
          media_url: string | null
          normalized_author: string | null
          normalized_title: string | null
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
          unmatched_rss: string[] | null
          updated_at: string
          url: string
          url_domain: string
          url_hash: string | null
          url_key: string | null
          word_count: number | null
        }[]
        SetofOptions: {
          from: "*"
          to: "articles"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      clear_all_focus: { Args: never; Returns: undefined }
      ensure_my_subscriber: { Args: never; Returns: undefined }
      extract_domain: { Args: { url: string }; Returns: string }
      get_sport_with_children: {
        Args: { p_sport_id: number }
        Returns: number[]
      }
      get_subscriber_feed: {
        Args: {
          p_cursor_id?: number
          p_cursor_time?: string
          p_entity_id?: number
          p_entity_type?: string
          p_focus_league_id?: number
          p_interest_id?: number
          p_limit?: number
          p_subscriber_id: string
        }
        Returns: {
          article_id: number
          domain: string
          matched_interests: string[]
          published_effective: string
          thumbnail_url: string
          title: string
          url: string
          url_domain: string
        }[]
      }
      get_trending_people: {
        Args: { p_hours?: number; p_limit?: number }
        Returns: {
          article_count: number
          country_logo_url: string
          league_code: string
          league_logo_url: string
          person_country_code: string
          person_id: number
          person_name: string
          person_position: string
          person_role: string
          school_logo_url: string
          school_short_name: string
          sport_logo_url: string
          sport_name: string
          team_logo_url: string
          team_name: string
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
      normalize_person_name: { Args: { name: string }; Returns: string }
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
      unaccent: { Args: { "": string }; Returns: string }
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
      extract_level: "full" | "league_only" | "sport_only"
      extract_level_league: "league" | "teams"
      media_type: "article" | "video"
      rule_kind: "html" | "rss" | "both" | "article"
      team_type_enum: "team" | "school" | "country"
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
      extract_level: ["full", "league_only", "sport_only"],
      extract_level_league: ["league", "teams"],
      media_type: ["article", "video"],
      rule_kind: ["html", "rss", "both", "article"],
      team_type_enum: ["team", "school", "country"],
      topic_kind: ["league", "topic"],
      validation_mode: ["none", "by_meta", "by_words"],
    },
  },
} as const
