import HungerInput from "./HungerInput";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();

  const { data: logs } = await supabase
    .from("hunger_logs")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="p-6 space-y-6">
      <HungerInput />

      <div>
        <h3 className="font-semibold">Recent hunger logs</h3>
        <ul className="space-y-2">
          {logs?.map((log) => (
            <li key={log.id} className="border p-2 rounded">
              Level {log.level} – {new Date(log.created_at).toLocaleString()}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
