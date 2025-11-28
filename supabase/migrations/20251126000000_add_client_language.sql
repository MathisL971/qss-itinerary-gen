-- Add language field to clients table
-- Supports 'en' (English) and 'fr' (French), extensible for future languages

ALTER TABLE clients 
  ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en' CHECK (language IN ('en', 'fr'));

-- Create index for language queries
CREATE INDEX IF NOT EXISTS idx_clients_language ON clients(language);

-- Update existing clients to have default language (English)
UPDATE clients SET language = 'en' WHERE language IS NULL;


