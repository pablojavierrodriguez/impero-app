-- Migration: Add currency column to public.transactions and public.recurring_transactions
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'ARS';

COMMENT ON COLUMN public.transactions.currency IS 'Currency code for the transaction (e.g. ARS, USD, EUR)';

ALTER TABLE public.recurring_transactions
ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'ARS';

COMMENT ON COLUMN public.recurring_transactions.currency IS 'Currency code for the recurring transaction (e.g. ARS, USD, EUR)';
