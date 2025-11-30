"use client";

import { useEffect, useState, useCallback } from "react";
import {
	AssistantRuntimeProvider,
	useExternalStoreRuntime,
	type ThreadMessageLike,
	type AppendMessage,
} from "@assistant-ui/react";
import { Thread } from "@/components/assistant-ui/thread";

type DbMessage = {
	id: string;
	role: "user" | "assistant" | "system";
	content: any;
	sequence_index: number;
	created_at: string;
};

type MyMessage = {
	id: string;
	role: "user" | "assistant" | "system";
	content: Array<{ type: "text"; text: string }>;
	created_at?: Date;
};

function ChatThreadRuntime({
	threadId,
	initialMessages,
	onMessageSent,
}: {
	threadId: string;
	initialMessages: MyMessage[];
	onMessageSent?: () => void;
}) {
	const [messages, setMessages] = useState<MyMessage[]>(initialMessages);
	const [isRunning, setIsRunning] = useState(false);

	// Update messages when initialMessages change (e.g., switching threads)
	useEffect(() => {
		setMessages(initialMessages);
	}, [initialMessages]);

	// Convert our message format to ThreadMessageLike format
	const convertMessage = useCallback(
		(message: MyMessage): ThreadMessageLike => ({
			role: message.role,
			content: message.content,
			id: message.id,
			createdAt: message.created_at,
		}),
		[],
	);

	// Handle new messages from the user
	const onNew = useCallback(
		async (message: AppendMessage) => {
			if (message.content[0]?.type !== "text") {
				throw new Error("Only text messages are supported");
			}

			const userMessageId = `user-${Date.now()}`;
			const userMessage: MyMessage = {
				id: userMessageId,
				role: "user",
				content: message.content.map((c) => ({
					type: "text" as const,
					text: c.type === "text" ? c.text : "",
				})),
				created_at: new Date(),
			};

			// Capture current messages before async operation
			let currentMessages: MyMessage[] = [];
			setMessages((prev) => {
				currentMessages = [...prev, userMessage];
				return currentMessages;
			});
			setIsRunning(true);

			// Notify parent that a message was sent (locks model picker)
			onMessageSent?.();

			try {
				// Send to backend with current messages
				const payload = {
					messages: currentMessages.map((m) => ({
						id: m.id,
						role: m.role,
						parts: m.content,
					})),
				};
				
				console.log("[ChatThread] Sending to API:", {
					threadId,
					messageCount: payload.messages.length,
					lastMessage: payload.messages[payload.messages.length - 1],
				});

				const response = await fetch(`/api/chat?threadId=${threadId}`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload),
				});

				if (!response.ok) {
					const errorText = await response.text();
					console.error("[ChatThread] API error response:", errorText);
					throw new Error(`API error: ${response.status} - ${errorText}`);
				}

				// Read the streaming response
				const reader = response.body?.getReader();
				if (!reader) throw new Error("No response body");

				const decoder = new TextDecoder();
				let assistantText = "";
				const assistantMessageId = `assistant-${Date.now()}`;

				console.log("[ChatThread] Starting to read stream...");

				while (true) {
					const { done, value } = await reader.read();
					if (done) {
						console.log("[ChatThread] Stream complete");
						break;
					}

					const chunk = decoder.decode(value);
					console.log("[ChatThread] Received chunk:", chunk.substring(0, 200));
					const lines = chunk.split("\n");

					for (const line of lines) {
						if (!line.trim()) continue;
						
						console.log("[ChatThread] Processing line:", line.substring(0, 100));
						
						// Parse SSE format: "data: {...}"
						if (line.startsWith("data: ")) {
							const dataStr = line.slice(6); // Remove "data: " prefix
							if (dataStr === "[DONE]") continue;
							
							try {
								const data = JSON.parse(dataStr);
								console.log("[ChatThread] Parsed data:", data.type);
								
								if (data.type === "text-delta" && data.delta) {
									assistantText += data.delta;
									console.log("[ChatThread] Updated assistant text, length:", assistantText.length);
									
									// Update assistant message in real-time
									setMessages((prev) => {
										const withoutLastAssistant = prev.filter(
											(m) => m.id !== assistantMessageId,
										);
										return [
											...withoutLastAssistant,
											{
												id: assistantMessageId,
												role: "assistant" as const,
												content: [{ type: "text", text: assistantText }],
												created_at: new Date(),
											},
										];
									});
								}
							} catch (e) {
								console.log("[ChatThread] Parse error:", e);
							}
						}
					}
				}
				
				console.log("[ChatThread] Final assistant text:", assistantText);
			} catch (error) {
				console.error("[ChatThread] Error sending message:", error);
				// Remove optimistic user message on error
				setMessages((prev) => prev.filter((m) => m.id !== userMessageId));
			} finally {
				setIsRunning(false);
			}
		},
		[threadId],
	);

	const runtime = useExternalStoreRuntime({
		messages,
		convertMessage,
		isRunning,
		onNew,
	});

	return (
		<AssistantRuntimeProvider runtime={runtime}>
			<Thread />
		</AssistantRuntimeProvider>
	);
}

export function ChatThread({ 
	threadId,
	onMessageSent,
}: { 
	threadId: string;
	onMessageSent?: () => void;
}) {
	const [initialMessages, setInitialMessages] = useState<MyMessage[] | null>(
		null,
	);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		let isCancelled = false;

		async function loadHistory() {
			setIsLoading(true);
			try {
				const res = await fetch(`/api/threads/${threadId}/messages`);
				if (!res.ok) {
					console.error(
						"[ChatThread] Failed to load messages for thread",
						threadId,
					);
					if (!isCancelled) {
						setInitialMessages([]);
					}
					return;
				}

				const data = await res.json();
				const dbMessages = (data.messages || []) as DbMessage[];
				const myMessages: MyMessage[] = dbMessages.map((m) => {
					let content: Array<{ type: "text"; text: string }> = [];
					if (Array.isArray(m.content)) {
						content = m.content.map((c: any) => ({
							type: "text" as const,
							text: c.text || "",
						}));
					} else if (m.content && Array.isArray((m.content as any).parts)) {
						content = (m.content as any).parts.map((c: any) => ({
							type: "text" as const,
							text: c.text || "",
						}));
					} else if (typeof m.content === "string") {
						content = [{ type: "text" as const, text: m.content }];
					}

					return {
						id: m.id,
						role: m.role,
						content,
						created_at: new Date(m.created_at),
					};
				});

				console.log(
					`[ChatThread] Loaded ${myMessages.length} messages for thread ${threadId}`,
				);

				if (!isCancelled) {
					setInitialMessages(myMessages);
				}
			} catch (error) {
				console.error("[ChatThread] Error loading messages", error);
				if (!isCancelled) {
					setInitialMessages([]);
				}
			} finally {
				if (!isCancelled) {
					setIsLoading(false);
				}
			}
		}

		loadHistory();

		return () => {
			isCancelled = true;
		};
	}, [threadId]);

	if (isLoading || initialMessages === null) {
		return (
			<div className="flex h-full items-center justify-center text-zinc-500">
				<p>Loading chat...</p>
			</div>
		);
	}

	return (
		<ChatThreadRuntime
			threadId={threadId}
			initialMessages={initialMessages}
			onMessageSent={onMessageSent}
		/>
	);
}
