import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET /api/threads - List all threads for authenticated user that have messages
export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get all threads with their message counts
  const { data: threads, error } = await supabase
    .from("threads")
    .select("*, messages(count)")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Filter to only include threads that have at least one message
  const threadsWithMessages = threads?.filter(
    (thread: any) => thread.messages && thread.messages.length > 0 && thread.messages[0].count > 0
  ) || [];

  return NextResponse.json({ threads: threadsWithMessages });
}

// POST /api/threads - Create a new thread
export async function POST(req: Request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, model_id } = await req.json();

  const { data: thread, error } = await supabase
    .from("threads")
    .insert({
      user_id: user.id,
      title: title || "New Chat",
      model_id: model_id || "gpt-4o",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ thread });
}
