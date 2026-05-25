
-- Admin có thể quản lý bài giảng & khóa học
CREATE POLICY "lessons_admin_all" ON public.lessons FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "courses_admin_all" ON public.courses FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Bảng đơn hàng (lưu form đăng ký mua từ landing page)
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  amount integer NOT NULL DEFAULT 1490000,
  status text NOT NULL DEFAULT 'pending',
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Ai cũng có thể tạo đơn (form công khai), không thể xem
CREATE POLICY "orders_insert_public" ON public.orders FOR INSERT TO anon, authenticated WITH CHECK (true);
-- Chỉ admin xem được
CREATE POLICY "orders_admin_select" ON public.orders FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "orders_admin_update" ON public.orders FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
