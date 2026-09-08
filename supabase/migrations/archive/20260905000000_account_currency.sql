-- Migration: Add currency column to public.accounts
ALTER TABLE public.accounts
ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'ARS';

COMMENT ON COLUMN public.accounts.currency IS 'Currency code for the account (e.g. ARS, USD, EUR, USDT)';
