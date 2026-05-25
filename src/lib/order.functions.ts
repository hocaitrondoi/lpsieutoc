import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const createOrderSchema = z.object({
  full_name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(8).max(20).regex(/^[0-9+\-\s().]+$/, "Số điện thoại không hợp lệ"),
});

export const createOrder = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => createOrderSchema.parse(input))
  .handler(async ({ data }) => {
    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .insert({
        full_name: data.full_name,
        email: data.email,
        phone: data.phone,
        amount: 1490000,
        status: "pending",
        note: `${data.phone} ${data.full_name}`,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { ok: true, id: order.id, note: order.note };
  });
