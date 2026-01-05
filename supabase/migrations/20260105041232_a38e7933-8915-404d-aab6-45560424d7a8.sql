-- Create preference_menu_items table for flexible UI organization
CREATE TABLE public.preference_menu_items (
  id SERIAL PRIMARY KEY,
  label VARCHAR(100) NOT NULL,                              -- Display label (e.g., "Major US Sports", "Golf")
  parent_id INTEGER REFERENCES preference_menu_items(id),   -- For nesting (1-2 levels max)
  entity_type VARCHAR(20),                                  -- 'league', 'sport', or NULL for headings
  entity_id INTEGER,                                        -- ID in leagues or sports table
  logo_url TEXT,                                            -- Logo for this menu item
  app_order INTEGER DEFAULT 0,                              -- Display order within parent
  is_submenu BOOLEAN DEFAULT FALSE,                         -- TRUE = navigate to submenu, FALSE = expand inline
  is_visible BOOLEAN DEFAULT TRUE,                          -- Toggle visibility without deleting
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient parent lookups
CREATE INDEX idx_preference_menu_items_parent ON public.preference_menu_items(parent_id);

-- Index for entity lookups
CREATE INDEX idx_preference_menu_items_entity ON public.preference_menu_items(entity_type, entity_id);

-- RLS policies (public read for app, admin write later)
ALTER TABLE public.preference_menu_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on preference_menu_items" 
ON public.preference_menu_items 
FOR SELECT 
USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_preference_menu_items_updated_at
BEFORE UPDATE ON public.preference_menu_items
FOR EACH ROW
EXECUTE FUNCTION touch_updated_at();