-- ============================================================
-- Migration 002: Update score_history check constraint to 0-100
--
-- The score system was updated from Phase 1 max of 80 to a full
-- 0-100 scale. The original CHECK constraint capped at 80, causing
-- silent insert failures for any score above 80.
--
-- Run this in the Supabase SQL editor on existing databases.
-- New databases should run 001_initial_schema.sql which already
-- uses the correct 0-100 constraint.
-- ============================================================

ALTER TABLE public.score_history
  DROP CONSTRAINT IF EXISTS score_history_score_check;

ALTER TABLE public.score_history
  ADD CONSTRAINT score_history_score_check
  CHECK (score >= 0 AND score <= 100);
