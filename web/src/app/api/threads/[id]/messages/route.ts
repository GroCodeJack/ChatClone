import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET /api/threads/[id]/messages - Get all messages for a thread
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // First verify the thread belongs to the user
  const { data: thread, error: threadError } = await supabase
    .from("threads")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (threadError || !thread) {
    return NextResponse.json({ error: "Thread not found" }, { status: 404 });
  }

  // Get all messages for this thread
  const { data: messages, error } = await supabase
    .from("messages")
    .select("*")
    .eq("thread_id", id)
    .order("sequence_index", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ messages });
}
