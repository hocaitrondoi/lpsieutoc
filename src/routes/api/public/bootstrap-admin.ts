import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const ADMIN_EMAIL = "quocminhai@gmail.com";
const ADMIN_PASSWORD = "Vietyod@ad";

export const Route = createFileRoute("/api/public/bootstrap-admin")({
  server: {
    handlers: {
      POST: async () => {
        const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
          email_confirm: true,
          user_metadata: { full_name: "Quốc Minh AI (Admin)" },
        });

        let userId = created?.user?.id;

        if (!userId) {
          const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
          const found = list?.users.find((u) => u.email === ADMIN_EMAIL);
          userId = found?.id;
          if (userId) {
            await supabaseAdmin.auth.admin.updateUserById(userId, {
              password: ADMIN_PASSWORD,
              email_confirm: true,
            });
          }
        }

        if (!userId) {
          return new Response(
            JSON.stringify({ ok: false, error: createErr?.message ?? "Cannot create admin" }),
            { status: 500, headers: { "content-type": "application/json" } },
          );
        }

        await supabaseAdmin
          .from("user_roles")
          .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });

        return new Response(JSON.stringify({ ok: true, userId }), {
          headers: { "content-type": "application/json" },
        });
      },
    },
  },
});
