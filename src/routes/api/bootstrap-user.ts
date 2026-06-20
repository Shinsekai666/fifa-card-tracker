import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/bootstrap-user")({
  server: {
    handlers: {
      POST: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const email = "lionel@panini.local";
        const password = "zermani";

        // Idempotent : check existing
        const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers();
        if (listErr) return new Response(JSON.stringify({ error: listErr.message }), { status: 500 });
        const existing = list.users.find((u) => u.email === email);
        if (existing) {
          await supabaseAdmin.auth.admin.updateUserById(existing.id, { password, email_confirm: true });
          return new Response(JSON.stringify({ ok: true, updated: true }));
        }

        const { error } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
        });
        if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
        return new Response(JSON.stringify({ ok: true, created: true }));
      },
    },
  },
});
