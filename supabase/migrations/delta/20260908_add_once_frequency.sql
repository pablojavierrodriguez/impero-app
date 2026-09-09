-- =============================================================================
-- m3 Money Master — Add 'once' frequency to bill_reminders and recurring_transactions
-- Fecha: 2026-09-08
-- =============================================================================
-- Permite compromisos y vencimientos de única vez ('once') tanto en bill_reminders
-- como en recurring_transactions, alineando el schema con la UX de vencimientos eventuales.
-- =============================================================================

DO $$
BEGIN
  -- bill_reminders
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'bill_reminders_frequency_check'
  ) THEN
    ALTER TABLE public.bill_reminders DROP CONSTRAINT bill_reminders_frequency_check;
  END IF;

  ALTER TABLE public.bill_reminders
    ADD CONSTRAINT bill_reminders_frequency_check
    CHECK (frequency IN ('once', 'daily', 'weekly', 'biweekly', 'monthly', 'yearly'));

  -- recurring_transactions
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'recurring_transactions_frequency_check'
  ) THEN
    ALTER TABLE public.recurring_transactions DROP CONSTRAINT recurring_transactions_frequency_check;
  END IF;

  ALTER TABLE public.recurring_transactions
    ADD CONSTRAINT recurring_transactions_frequency_check
    CHECK (frequency IN ('once', 'daily', 'weekly', 'biweekly', 'monthly', 'yearly'));
END $$;
