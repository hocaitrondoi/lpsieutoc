-- Create student_courses link table
CREATE TABLE IF NOT EXISTS public.student_courses (
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (student_id, course_id)
);

-- Enable RLS
ALTER TABLE public.student_courses ENABLE ROW LEVEL SECURITY;

-- Policy for student_courses: users can see their own enrollments, admins can see all
CREATE POLICY "student_courses_select" ON public.student_courses 
  FOR SELECT TO authenticated 
  USING (student_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Drop old public policies for courses and lessons
DROP POLICY IF EXISTS "courses_select_auth" ON public.courses;
DROP POLICY IF EXISTS "lessons_select_auth" ON public.lessons;

-- Create secure SELECT policies based on enrollment or admin role
CREATE POLICY "courses_select_auth" ON public.courses 
  FOR SELECT TO authenticated 
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    EXISTS (
      SELECT 1 FROM public.student_courses 
      WHERE student_courses.student_id = auth.uid() 
      AND student_courses.course_id = courses.id
    )
  );

CREATE POLICY "lessons_select_auth" ON public.lessons 
  FOR SELECT TO authenticated 
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    EXISTS (
      SELECT 1 FROM public.student_courses 
      WHERE student_courses.student_id = auth.uid() 
      AND student_courses.course_id = lessons.course_id
    )
  );
