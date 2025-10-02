-- Add updated_at column to user_teams table
ALTER TABLE public.user_teams 
ADD COLUMN updated_at timestamp with time zone NOT NULL DEFAULT now();

-- Create trigger to automatically update the updated_at column
CREATE TRIGGER update_user_teams_updated_at
  BEFORE UPDATE ON public.user_teams
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();