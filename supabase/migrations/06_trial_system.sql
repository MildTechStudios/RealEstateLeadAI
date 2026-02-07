-- Add Trial and Stripe Columns
ALTER TABLE public.scraped_agents 
ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Create index for faster filtering of trial status
CREATE INDEX IF NOT EXISTS idx_scraped_agents_trial_started_at 
ON public.scraped_agents(trial_started_at);
