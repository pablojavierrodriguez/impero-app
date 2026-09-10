-- Delta Migration: Add rollover support to budgets and credit_card_view_mode to accounts
-- Date: 2026-09-10

ALTER TABLE public.budgets
  ADD COLUMN IF NOT EXISTS enable_rollover BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS accumulated_rollover NUMERIC NOT NULL DEFAULT 0;

ALTER TABLE public.accounts
  ADD COLUMN IF NOT EXISTS credit_card_view_mode TEXT NOT NULL DEFAULT 'statement_cycles';
