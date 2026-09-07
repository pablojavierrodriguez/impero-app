-- Shopping Lists
CREATE TABLE public.shopping_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  target_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  target_category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.shopping_lists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own shopping lists" ON public.shopping_lists
  FOR ALL USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
CREATE TRIGGER update_shopping_lists_updated_at BEFORE UPDATE ON public.shopping_lists
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Shopping List Items
CREATE TABLE public.shopping_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID REFERENCES public.shopping_lists(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  is_checked BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.shopping_list_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own shopping list items" ON public.shopping_list_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.shopping_lists sl WHERE sl.id = list_id AND sl.user_id = (select auth.uid()))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.shopping_lists sl WHERE sl.id = list_id AND sl.user_id = (select auth.uid()))
  );

CREATE INDEX idx_shopping_list_items_list ON public.shopping_list_items(list_id);
CREATE INDEX idx_shopping_lists_user ON public.shopping_lists(user_id);
