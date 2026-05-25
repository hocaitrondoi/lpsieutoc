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

