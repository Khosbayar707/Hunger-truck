import { redirect } from "next/navigation";
import HungerInput from "./HungerInput";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: logs, error } = await supabase
    .from("hunger_logs")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load hunger logs:", error);
  }

  return (
    <div className="p-6 space-y-6">
      <HungerInput />

      <div>
        <h3 className="font-semibold">Recent hunger logs</h3>

        {logs?.length ? (
          <ul className="space-y-2">
            {logs.map((log) => (
              <li key={log.id} className="border p-2 rounded">
                Level {log.level} – {new Date(log.created_at).toLocaleString()}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No hunger logs yet.</p>
        )}
      </div>
    </div>
  );
}
