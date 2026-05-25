
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_session_id text;

CREATE TABLE IF NOT EXISTS public.student_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, course_id)
);

ALTER TABLE public.student_courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student_courses_select_own_or_admin" ON public.student_courses FOR SELECT TO authenticated
  USING (student_id = auth.uid() OR has_role(auth.uid(), 'admin'));
CREATE POLICY "student_courses_admin_all" ON public.student_courses FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
