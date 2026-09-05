-- Enable storage bucket for receipts
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'receipts',
  'receipts',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for storage.objects on 'receipts'
CREATE POLICY "Users can upload their own receipts"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'receipts'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Anyone can view public receipts"
ON storage.objects FOR SELECT
USING (bucket_id = 'receipts');

CREATE POLICY "Users can delete their own receipts"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'receipts'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Function to seed default categories and accounts on user creation
CREATE OR REPLACE FUNCTION public.seed_user_defaults()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID := NEW.id;
  v_salary_id UUID;
  v_food_id UUID;
  v_trans_id UUID;
  v_housing_id UUID;
  v_services_id UUID;
  v_leisure_id UUID;
  v_health_id UUID;
  v_other_exp_id UUID;
BEGIN
  -- 1. Default Categories
  INSERT INTO public.categories (user_id, name, color, type, icon, sort_order)
  VALUES (v_user_id, 'Salario', 'bg-emerald-500', 'income', 'briefcase', 1)
  RETURNING id INTO v_salary_id;

  INSERT INTO public.categories (user_id, name, color, type, icon, sort_order)
  VALUES (v_user_id, 'Otros Ingresos', 'bg-teal-500', 'income', 'wallet', 2);

  INSERT INTO public.categories (user_id, name, color, type, icon, sort_order)
  VALUES (v_user_id, 'Alimentación', 'bg-orange-500', 'expense', 'utensils', 10)
  RETURNING id INTO v_food_id;

  INSERT INTO public.categories (user_id, name, color, type, icon, sort_order)
  VALUES (v_user_id, 'Transporte', 'bg-sky-500', 'expense', 'car', 20)
  RETURNING id INTO v_trans_id;

  INSERT INTO public.categories (user_id, name, color, type, icon, sort_order)
  VALUES (v_user_id, 'Vivienda', 'bg-violet-500', 'expense', 'home', 30)
  RETURNING id INTO v_housing_id;

  INSERT INTO public.categories (user_id, name, color, type, icon, sort_order)
  VALUES (v_user_id, 'Servicios', 'bg-yellow-500', 'expense', 'zap', 40)
  RETURNING id INTO v_services_id;

  INSERT INTO public.categories (user_id, name, color, type, icon, sort_order)
  VALUES (v_user_id, 'Ocio y Salidas', 'bg-pink-500', 'expense', 'film', 50)
  RETURNING id INTO v_leisure_id;

  INSERT INTO public.categories (user_id, name, color, type, icon, sort_order)
  VALUES (v_user_id, 'Salud', 'bg-red-400', 'expense', 'heart-pulse', 60)
  RETURNING id INTO v_health_id;

  -- 2. Default Accounts
  INSERT INTO public.accounts (user_id, name, balance, type, color, icon)
  VALUES
    (v_user_id, 'Efectivo', 0, 'cash', 'bg-emerald-500', 'banknote'),
    (v_user_id, 'Caja de Ahorro', 0, 'savings', 'bg-sky-500', 'landmark'),
    (v_user_id, 'Billetera Virtual', 0, 'checking', 'bg-violet-500', 'wallet');

  -- 3. Default User Settings
  INSERT INTO public.user_settings (user_id, currency, language, daily_budget, theme)
  VALUES (v_user_id, 'ARS', 'es', 15000, 'dark')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Trigger to execute seed on user creation
DROP TRIGGER IF EXISTS on_auth_user_seed_defaults ON auth.users;
CREATE TRIGGER on_auth_user_seed_defaults
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.seed_user_defaults();
