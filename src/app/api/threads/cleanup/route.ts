import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// POST /api/threads/cleanup - Delete threads with no messages
export async function POST() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get all threads for this user
    const { data: allThreads, error: threadsError } = await supabase
      .from("threads")
      .select("id")
      .eq("user_id", user.id);

    if (threadsError) {
      return NextResponse.json({ error: threadsError.message }, { status: 500 });
    }

    if (!allThreads || allThreads.length === 0) {
      return NextResponse.json({ deleted: 0 });
    }

    // For each thread, check if it has messages
    const emptyThreadIds: string[] = [];
    
    for (const thread of allThreads) {
      const { count, error: countError } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("thread_id", thread.id);

      if (!countError && (count === null || count === 0)) {
        emptyThreadIds.push(thread.id);
      }
    }

    // Delete all empty threads
    if (emptyThreadIds.length > 0) {
      const { error: deleteError } = await supabase
        .from("threads")
        .delete()
        .in("id", emptyThreadIds);

      if (deleteError) {
        return NextResponse.json({ error: deleteError.message }, { status: 500 });
      }

      console.log(`[API] Deleted ${emptyThreadIds.length} empty threads`);
    }

    return NextResponse.json({ deleted: emptyThreadIds.length });
  } catch (error) {
    console.error("[API] Error in cleanup:", error);
    return NextResponse.json(
      { error: "Failed to cleanup threads" },
      { status: 500 }
    );
  }
}
