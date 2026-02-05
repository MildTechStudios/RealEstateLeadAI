-- Create a new storage bucket for agent assets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('agent-assets', 'agent-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow public read access
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'agent-assets' );

-- Policy: Allow authenticated insert (we'll rely on service key for now, but good to have)
CREATE POLICY "Authenticated Insert" 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'agent-assets' );
