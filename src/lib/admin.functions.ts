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

    // Ensure profile has full_name (trigger may have set email only)
    await supabaseAdmin
      .from("profiles")
      .update({ full_name: data.full_name, email: data.email })
      .eq("id", created.user.id);

    return { ok: true, id: created.user.id };
  });

export const listStudents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: roleRow } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) throw new Error("Forbidden: admin only");

    const { data: students } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, profiles:profiles!inner(id, full_name, email, created_at)")
      .eq("role", "student")
      .order("user_id");

    return {
      students: (students ?? []).map((r: any) => ({
        id: r.profiles.id,
        full_name: r.profiles.full_name,
        email: r.profiles.email,
        created_at: r.profiles.created_at,
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

