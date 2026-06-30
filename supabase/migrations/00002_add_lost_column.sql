ALTER TABLE clients ADD COLUMN lost boolean NOT NULL DEFAULT false;
ALTER TABLE clients ADD COLUMN lost_at timestamptz;
ALTER TABLE clients ADD COLUMN lost_reason text;
