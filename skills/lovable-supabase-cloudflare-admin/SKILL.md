---
name: lovable-supabase-cloudflare-admin
description: Reusable workflow for building, cloning, debugging, and deploying Lovable landing pages with Supabase login, student dashboard, admin lesson management, GitHub source control, and Cloudflare production hosting. Use when a user wants to replicate a Lovable -> GitHub -> Cloudflare -> Supabase setup, add admin features, create student accounts, manage lessons/courses, or diagnose recurring Supabase/Cloudflare environment variable errors.
---

# Lovable Supabase Cloudflare Admin

Use this skill to help replicate or debug a website with:

- Lovable landing page
- `/login` for students
- `/dashboard` for students and admins
- Supabase Auth and database
- GitHub as source of truth
- Cloudflare as production host
- Admin actions for creating students and managing lessons

## Core Rule

Admin features require server-side Supabase access. Always verify all production environments have:

```text
SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY
```

Never expose `SUPABASE_SERVICE_ROLE_KEY` to browser code. It must only be used by server functions, server routes, Cloudflare Worker server code, or backend-only code.

## Standard Build Flow

Follow this order:

1. Confirm the current app works in Lovable.
2. Confirm `/login` authenticates through Supabase.
3. Confirm `/dashboard` loads for authenticated users.
4. Push source code to GitHub.
5. Connect GitHub repo to Cloudflare.
6. Add Cloudflare environment variables.
7. Deploy Cloudflare.
8. Create the first admin user.
9. Verify admin role in `user_roles`.
10. Test admin actions on the production dashboard.

## Supabase Schema Expectations

Expect these tables:

- `profiles`: user profile rows keyed by auth user id.
- `user_roles`: rows mapping `user_id` to `admin` or `student`.
- `courses`: course metadata.
- `lessons`: lesson rows linked to courses.

Expect these roles:

```text
admin
student
```

Expect admin checks to happen server-side before privileged actions.

## Admin Feature Checklist

For creating students:

1. Verify current user is authenticated.
2. Verify current user has role `admin`.
3. Use service role server client to call `auth.admin.createUser`.
4. Insert or upsert `user_roles` with role `student`.
5. Insert or upsert `profiles`.
6. Return clear success/error messages.

For managing lessons:

1. Verify current user is authenticated.
2. Verify current user has role `admin`.
3. Use service role server client for insert/update/delete.
4. Keep `course_id` valid.
5. Re-fetch lessons after mutation.

## Cloudflare Environment Checklist

Before debugging code, inspect production variables:

```text
[ ] SUPABASE_URL exists
[ ] SUPABASE_PUBLISHABLE_KEY exists
[ ] SUPABASE_SERVICE_ROLE_KEY exists
[ ] All keys belong to the same Supabase project
[ ] Deployment was rerun after variables changed
```

If Lovable works but Cloudflare fails, suspect Cloudflare env first.

## Error Diagnosis Pattern

When admin actions fail:

1. Check whether `SUPABASE_SERVICE_ROLE_KEY` is missing.
2. Check whether service role key belongs to a different Supabase project than `SUPABASE_URL`.
3. Check whether logged-in user has `admin` role in `user_roles`.
4. Check whether RLS permits normal authenticated reads for students.
5. Check whether server functions read Cloudflare env correctly.

Common symptoms:

- Login works but create student fails: usually missing/wrong service role key.
- Lessons load but add/edit/delete fails: usually missing service role key or missing admin role.
- Lovable works but Cloudflare fails: usually production env not configured.
- User logs in but dashboard empty: usually missing profile, missing course, or RLS select policy.

## Security Rules

Do:

- Keep service role key server-only.
- Remove or lock temporary admin creation routes after setup.
- Verify admin authorization on the server for every privileged action.
- Use upsert for profile/role creation where duplicate setup is possible.

Do not:

- Put service role key in `VITE_` variables.
- Commit secrets to GitHub.
- Rely only on hiding admin UI in the browser.
- Mix keys from multiple Supabase projects.

## Final Verification

Before marking the project complete, verify:

```text
[ ] Landing page opens
[ ] /login opens
[ ] Admin login works
[ ] Dashboard shows ADMIN badge
[ ] Admin can add lesson
[ ] Admin can edit lesson
[ ] Admin can delete lesson
[ ] Admin can create student
[ ] Student can log in
[ ] Student cannot see admin controls
[ ] Production Cloudflare deployment is active
```

## Security & Advanced Configurations

### 1. Concurrent Login Control (Single Session Token)

To prevent account sharing, enforce a single active device session using a session token in the database.

#### DB Schema Changes
Add a text column to track the active session identifier:
```sql
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS current_session_id TEXT;
```

#### Frontend Implementation Flow
1. **On Login (`/login`):**
   - Generate a unique device session token: `const token = crypto.randomUUID();`
   - Store it locally: `localStorage.setItem("device_session_token", token);`
   - Update it on the database profiles:
     ```typescript
     await supabase.from("profiles").update({ current_session_id: token }).eq("id", user.id);
     ```
2. **On Page Load and Activity Check (`/dashboard`):**
   - Query `current_session_id` from the user's profile.
   - Compare with the local storage token `localStorage.getItem("device_session_token")`.
   - If they differ (for non-admin users), trigger logout:
     ```typescript
     alert("Tài khoản đã đăng nhập ở thiết bị khác.");
     await supabase.auth.signOut();
     localStorage.removeItem("device_session_token");
     navigate({ to: "/login" });
     ```
   - Run this check periodically (e.g., using `setInterval` every 10 seconds).

---

### 2. Course Access Control (Enrollments)

To restrict students so they only access courses they purchased or were granted.

#### DB Schema Changes
Create an enrollment link table and update RLS policies:
```sql
-- 1. Create mapping table
CREATE TABLE IF NOT EXISTS public.student_courses (
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (student_id, course_id)
);

ALTER TABLE public.student_courses ENABLE ROW LEVEL SECURITY;

-- 2. Select policy
CREATE POLICY "student_courses_select" ON public.student_courses 
  FOR SELECT TO authenticated 
  USING (student_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- 3. Update Courses & Lessons RLS SELECT policies
DROP POLICY IF EXISTS "courses_select_auth" ON public.courses;
DROP POLICY IF EXISTS "lessons_select_auth" ON public.lessons;

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
```

#### Server Functions Integration
- **Fetch List (`listStudents`):** Query `student_courses` table and aggregate enrolled `course_ids` inside each student profile object.
- **Update Access (`updateStudentCourses`):** Admin action to delete old entries in `student_courses` for a given student ID and insert new ones based on the checked checkboxes.

#### Frontend Dashboard Integration
- Display checklist of courses next to each student in the Admin Student List.
- Toggling a checkbox triggers `updateStudentCourses` API call.
- Filter the main course dropdown/selection for students to only show courses present in `courses` table (which is naturally restricted by the updated RLS SELECT policy).


