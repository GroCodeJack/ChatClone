import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ChatInterface } from "@/components/chat-interface";

export default async function ChatPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <ChatInterface />;
}
