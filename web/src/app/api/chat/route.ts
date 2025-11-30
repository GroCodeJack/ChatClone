import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { streamText } from "ai";
import type { UIMessage } from "ai";
import { createClient } from "@/lib/supabase/server";
import { getModelById } from "@/lib/models/config";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    // Get threadId from query params
    const url = new URL(req.url);
    const threadIdFromQuery = url.searchParams.get("threadId");

    const { messages, system, tools, threadId: threadIdFromBody } = (await req.json()) as {
      messages: UIMessage[];
      system?: string;
      tools?: any;
      threadId?: string;
    };

  // Use threadId from query params or fallback to body
  const threadId = threadIdFromQuery || threadIdFromBody;

  console.log("[API] Chat request - threadId:", threadId);
  console.log("[API] Messages count:", messages?.length);
  console.log("[API] Messages:", JSON.stringify(messages, null, 2));

  // If no threadId provided, return error - threads must be created explicitly
  if (!threadId) {
    return new Response(
      JSON.stringify({ error: "threadId is required. Create a thread first." }),
      { status: 400 }
    );
  }

  const currentThreadId = threadId;

  // Fetch thread to get model_id
  const { data: thread, error: threadError } = await supabase
    .from("threads")
    .select("model_id")
    .eq("id", currentThreadId)
    .single();

  if (threadError || !thread) {
    return new Response(
      JSON.stringify({ error: "Thread not found" }),
      { status: 404 }
    );
  }

  const modelId = thread.model_id;
  const modelConfig = getModelById(modelId);
  
  if (!modelConfig) {
    return new Response(
      JSON.stringify({ error: `Invalid model: ${modelId}` }),
      { status: 400 }
    );
  }

  console.log("[API] Using model:", modelId, "provider:", modelConfig.provider);

  // Get the last user message to save
  const lastMessage = messages[messages.length - 1];
  if (lastMessage && lastMessage.role === "user") {
    console.log("[API] Last message:", JSON.stringify(lastMessage));
    
    // Get current message count for sequence_index
    const { count } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("thread_id", currentThreadId);

    const sequenceIndex = count || 0;

    // Extract content - handle both UIMessage.parts and legacy formats
    let content: any;
    if (lastMessage.parts) {
      content = lastMessage.parts;
    } else if ((lastMessage as any).content) {
      content = (lastMessage as any).content;
    } else {
      console.error("[API] Message has no parts or content:", lastMessage);
      content = [];
    }

    // Save user message
    const { error: insertError } = await supabase.from("messages").insert({
      thread_id: currentThreadId,
      role: "user",
      content,
      sequence_index: sequenceIndex,
    });

    if (insertError) {
      console.error("[API] Error saving user message:", insertError);
    } else {
      console.log("[API] Saved user message to thread:", currentThreadId);
    }
  }

  // Get the appropriate model based on provider
  let model;
  if (modelConfig.provider === "anthropic") {
    // Map our model IDs to Anthropic's API model names
    const anthropicModelMap: Record<string, string> = {
      "haiku-4-5": "claude-3-5-haiku-20241022",
    };
    const anthropicModelName = anthropicModelMap[modelId] || "claude-3-5-haiku-20241022";
    model = anthropic(anthropicModelName);
    console.log("[API] Using Anthropic model:", anthropicModelName);
  } else if (modelConfig.provider === "openrouter") {
    // OpenRouter models use the full model ID as-is (e.g., "anthropic/claude-3.5-sonnet")
    const openrouter = createOpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY,
    });
    model = openrouter(modelId);
    console.log("[API] Using OpenRouter model:", modelId);
  } else {
    // OpenAI models
    const openaiModelMap: Record<string, string> = {
      "gpt-4o": "gpt-4o",
      "gpt-4o-mini": "gpt-4o-mini",
    };
    const openaiModelName = openaiModelMap[modelId] || "gpt-4o";
    model = openai(openaiModelName);
    console.log("[API] Using OpenAI model:", openaiModelName);
  }
  
  const result = streamText({
    model,
    messages: messages.map((msg) => {
      let content = "";
      if (msg.parts) {
        const textParts = msg.parts.filter((p: any) => p.type === "text");
        content = textParts.map((p: any) => p.text).join("");
      }
      return {
        role: msg.role,
        content,
      };
    }),
    system,
    onFinish: async ({ text }) => {
      // Save assistant message after streaming completes
      const { count } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("thread_id", currentThreadId);

      const sequenceIndex = count || 0;

      const { error: insertError } = await supabase.from("messages").insert({
        thread_id: currentThreadId,
        role: "assistant",
        content: [{ type: "text", text }],
        model_name: modelId,
        sequence_index: sequenceIndex,
      });

      if (insertError) {
        console.error("[API] Error saving assistant message:", insertError);
      } else {
        console.log("[API] Saved assistant message to thread:", currentThreadId);
      }

      // Generate title if this is the first assistant message (sequence_index == 1)
      if (sequenceIndex === 1) {
        try {
          console.log("[API] First assistant message - generating title...");
          
          // Get the first user message
          const { data: firstUserMessage } = await supabase
            .from("messages")
            .select("content")
            .eq("thread_id", currentThreadId)
            .eq("role", "user")
            .order("sequence_index", { ascending: true })
            .limit(1)
            .single();

          if (firstUserMessage) {
            // Extract text from user message
            let userText = "";
            if (Array.isArray(firstUserMessage.content)) {
              const textParts = firstUserMessage.content.filter((p: any) => p.type === "text");
              userText = textParts.map((p: any) => p.text).join("");
            }

            // Generate a concise title using the LLM
            const titlePrompt = `Based on this conversation, generate a brief, descriptive title (5-7 words max). Only respond with the title, nothing else.

User: ${userText}
Assistant: ${text}`;

            const { openai } = await import("@ai-sdk/openai");
            const { generateText } = await import("ai");
            
            const titleResult = await generateText({
              model: openai("gpt-4o-mini"),
              prompt: titlePrompt,
            });

            const generatedTitle = titleResult.text.trim().replace(/^["']|["']$/g, '');
            
            console.log("[API] Generated title:", generatedTitle);

            // Update the thread title
            await supabase
              .from("threads")
              .update({ 
                title: generatedTitle,
                updated_at: new Date().toISOString() 
              })
              .eq("id", currentThreadId);

            console.log("[API] Updated thread title to:", generatedTitle);
          }
        } catch (error) {
          console.error("[API] Error generating title:", error);
          // Don't fail the request if title generation fails
          await supabase
            .from("threads")
            .update({ updated_at: new Date().toISOString() })
            .eq("id", currentThreadId);
        }
      } else {
        // Update thread's updated_at timestamp for non-first messages
        await supabase
          .from("threads")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", currentThreadId);
      }
    },
  });

  // Create custom SSE stream that frontend expects
  const encoder = new TextEncoder();
  const stream = result.textStream;

  const customStream = new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode('data: {"type":"start"}\n\n'));
      controller.enqueue(encoder.encode('data: {"type":"start-step"}\n\n'));
      
      const messageId = "msg_" + Date.now();
      controller.enqueue(
        encoder.encode(`data: {"type":"text-start","id":"${messageId}"}\n\n`)
      );

      try {
        for await (const chunk of stream) {
          controller.enqueue(
            encoder.encode(
              `data: {"type":"text-delta","id":"${messageId}","delta":${JSON.stringify(chunk)}}\n\n`
            )
          );
        }

        controller.enqueue(
          encoder.encode(`data: {"type":"text-end","id":"${messageId}"}\n\n`)
        );
        controller.enqueue(encoder.encode('data: {"type":"finish-step"}\n\n'));
        controller.enqueue(
          encoder.encode('data: {"type":"finish","finishReason":"stop"}\n\n')
        );
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (error) {
        console.error("[API] Stream error:", error);
        controller.error(error);
      }
    },
  });

  return new Response(customStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
  } catch (error) {
    console.error("[API] Error in chat route:", error);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error)
      }), 
      { status: 500 }
    );
  }
}
