import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const createStudentSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(72),
  full_name: z.string().min(1).max(120),
});

export const createStudent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => createStudentSchema.parse(input))
  .handler(async ({ data, context }) => {
    // verify caller is admin
    const { data: roleRow } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) throw new Error("Forbidden: admin only");

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.full_name },
    });
    if (error || !created?.user) throw new Error(error?.message ?? "Cannot create user");

    await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: created.user.id, role: "student" }, { onConflict: "user_id,role" });

    // Use upsert to guarantee a profile is created even if database triggers are disabled
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert({ id: created.user.id, full_name: data.full_name, email: data.email }, { onConflict: "id" });
    
    if (profileError) throw new Error(profileError.message);

    return { ok: true, id: created.user.id };
  });

export const listStudents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: roleRow, error: roleRowError } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (roleRowError) throw new Error(roleRowError.message);
    if (!roleRow) throw new Error("Forbidden: admin only");

    // 1. Get all user IDs with student role
    const { data: roleRows, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("role", "student");

    if (roleError) throw new Error(roleError.message);
    if (!roleRows || roleRows.length === 0) {
      return { students: [] };
    }

    const userIds = roleRows.map(r => r.user_id);

    // 2. Fetch profiles for these user IDs
    const { data: profileRows, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, email, created_at")
      .in("id", userIds)
      .order("created_at", { ascending: false });

    if (profileError) throw new Error(profileError.message);

    return {
      students: (profileRows ?? []).map((p) => ({
        id: p.id,
        full_name: p.full_name,
        email: p.email,
        created_at: p.created_at,
      })),
    };
  });

/* ================================================================
   LESSON MANAGEMENT — Admin CRUD
   ================================================================ */

const createLessonSchema = z.object({
  course_id: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional().default(""),
  video_url: z.string().max(1000).optional().default(""),
});

export const createLesson = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => createLessonSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: roleRow } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) throw new Error("Forbidden: admin only");

    // Get next order_index
    const { data: lastLesson } = await supabaseAdmin
      .from("lessons")
      .select("order_index")
      .eq("course_id", data.course_id)
      .order("order_index", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextIndex = (lastLesson?.order_index ?? -1) + 1;

    const { data: lesson, error } = await supabaseAdmin
      .from("lessons")
      .insert({
        course_id: data.course_id,
        title: data.title,
        description: data.description || null,
        video_url: data.video_url || null,
        order_index: nextIndex,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return { ok: true, lesson };
  });

const updateLessonSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional().default(""),
  video_url: z.string().max(1000).optional().default(""),
});

export const updateLesson = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => updateLessonSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: roleRow } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) throw new Error("Forbidden: admin only");

    const { data: lesson, error } = await supabaseAdmin
      .from("lessons")
      .update({
        title: data.title,
        description: data.description || null,
        video_url: data.video_url || null,
      })
      .eq("id", data.id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return { ok: true, lesson };
  });

const deleteLessonSchema = z.object({
  id: z.string().uuid(),
});

export const deleteLesson = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => deleteLessonSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: roleRow } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) throw new Error("Forbidden: admin only");

    const { error } = await supabaseAdmin
      .from("lessons")
      .delete()
      .eq("id", data.id);

    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ================================================================
   COURSE MANAGEMENT — Admin CRUD
   ================================================================ */

const createCourseSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional().default(""),
});

export const createCourse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => createCourseSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: roleRow } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) throw new Error("Forbidden: admin only");

    const { data: course, error } = await supabaseAdmin
      .from("courses")
      .insert({
        title: data.title,
        description: data.description || null,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return { ok: true, course };
  });

const updateCourseSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional().default(""),
});

export const updateCourse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => updateCourseSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: roleRow } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) throw new Error("Forbidden: admin only");

    const { data: course, error } = await supabaseAdmin
      .from("courses")
      .update({
        title: data.title,
        description: data.description || null,
      })
      .eq("id", data.id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return { ok: true, course };
  });

const deleteCourseSchema = z.object({
  id: z.string().uuid(),
});

export const deleteCourse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => deleteCourseSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: roleRow } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) throw new Error("Forbidden: admin only");

    const { error } = await supabaseAdmin
      .from("courses")
      .delete()
      .eq("id", data.id);

    if (error) throw new Error(error.message);
    return { ok: true };
  });

