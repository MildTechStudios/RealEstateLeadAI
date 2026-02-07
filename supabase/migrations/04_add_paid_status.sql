-- Add payment tracking column
ALTER TABLE public.scraped_agents 
ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT false;

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_scraped_agents_is_paid 
ON public.scraped_agents(is_paid);
