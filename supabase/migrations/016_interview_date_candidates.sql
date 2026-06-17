-- Migration 016: Store all interview date candidates for multi-candidate emails
-- (e.g., emails listing 候補A/B/C date options)
ALTER TABLE applications
ADD COLUMN IF NOT EXISTS interview_date_candidates TEXT[];
