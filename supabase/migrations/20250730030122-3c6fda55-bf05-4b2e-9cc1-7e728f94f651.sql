-- Create news configuration table
CREATE TABLE public.news_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  hours_back INTEGER NOT NULL DEFAULT 24,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.news_config ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own news config" 
ON public.news_config 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own news config" 
ON public.news_config 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own news config" 
ON public.news_config 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_news_config_updated_at
BEFORE UPDATE ON public.news_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();