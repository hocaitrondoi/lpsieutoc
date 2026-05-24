
-- Enum role
CREATE TYPE public.app_role AS ENUM ('admin', 'student');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- Courses
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- Lessons
CREATE TABLE public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT,
  order_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "user_roles_select_own" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "courses_select_auth" ON public.courses FOR SELECT TO authenticated USING (true);
CREATE POLICY "lessons_select_auth" ON public.lessons FOR SELECT TO authenticated USING (true);

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Seed course + lessons
INSERT INTO public.courses (id, title, description) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Khoá Học PageForge AI - Landing Page Siêu Tốc', 'Học cách dùng AI tạo landing page bán hàng triệu đô trong 60 giây.');

INSERT INTO public.lessons (course_id, title, description, video_url, order_index) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Bài 1: Tổng quan về PageForge AI', 'Giới thiệu về công cụ và các tính năng cốt lõi.', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 1),
  ('11111111-1111-1111-1111-111111111111', 'Bài 2: Cách viết prompt hiệu quả cho AI', 'Công thức prompt 5 lớp tạo copy bán hàng đỉnh cao.', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 2),
  ('11111111-1111-1111-1111-111111111111', 'Bài 3: Thiết kế giao diện chuyển đổi cao', 'Bố cục, màu sắc, typography cho landing page.', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 3),
  ('11111111-1111-1111-1111-111111111111', 'Bài 4: Tích hợp Pancake, Haravan, Sapo', 'Kết nối form và đơn hàng tự động.', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 4),
  ('11111111-1111-1111-1111-111111111111', 'Bài 5: Chạy quảng cáo & tối ưu chuyển đổi', 'Cách scale landing page lên 6-7 con số.', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 5);
