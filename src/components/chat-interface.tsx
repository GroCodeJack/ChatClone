"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { ChatThread } from "@/components/chat-thread";
import { ModelPicker } from "@/components/model-picker";
import { getDefaultModel } from "@/lib/models/config";
import { Menu, X, Plus } from "lucide-react";

type ThreadType = {
  id: string;
  title: string;
  model_id: string;
  created_at: string;
  updated_at: string;
};

type Message = {
  id: string;
  role: "user" | "assistant" | "system";
  content: any;
  created_at: string;
};

export function ChatInterface() {
  const [threads, setThreads] = useState<ThreadType[]>([]);
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
  const [isLoadingThreads, setIsLoadingThreads] = useState(true);
  const [selectedModelId, setSelectedModelId] = useState<string>(getDefaultModel().id);
  const [currentThreadHasMessages, setCurrentThreadHasMessages] = useState(false);
  const [hiddenThreadId, setHiddenThreadId] = useState<string | null>(null); // Track the "new chat" that shouldn't appear in sidebar yet
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile sidebar state
  const supabase = createClient();

  // Get the model for the current thread (if any)
  const currentThread = threads.find((t) => t.id === currentThreadId);
  const currentThreadModelId = currentThread?.model_id;

  // Load threads from Supabase
  const loadThreads = useCallback(async () => {
    const response = await fetch("/api/threads");
    const data = await response.json();
    setThreads(data.threads || []);
    setIsLoadingThreads(false);
  }, []);

  // Cleanup empty threads on initial load
  const cleanupEmptyThreads = useCallback(async () => {
    try {
      const response = await fetch("/api/threads/cleanup", {
        method: "POST",
      });
      if (response.ok) {
        console.log("[UI] Cleaned up empty threads");
      }
    } catch (error) {
      console.error("[UI] Error cleaning up threads:", error);
    }
  }, []);

  const handleNewThread = useCallback(async () => {
    try {
      const response = await fetch("/api/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          title: "New Chat",
          model_id: selectedModelId,
        }),
      });
      const data = await response.json();
      
      if (!response.ok || data.error) {
        console.error("[UI] Failed to create thread:", data.error || data);
        alert(`Failed to create thread: ${data.error || 'Unknown error'}. Check console for details.`);
        return;
      }
      
      if (!data.thread) {
        console.error("[UI] No thread in response:", data);
        alert('Failed to create thread: Invalid response from server');
        return;
      }
      
      console.log("[UI] Created new thread:", data.thread.id, "with model:", selectedModelId);
      // Don't add to sidebar state - it will be picked up by periodic refresh once it's no longer current
      setCurrentThreadId(data.thread.id);
      setHiddenThreadId(data.thread.id); // Mark this as the hidden "new chat"
      setCurrentThreadHasMessages(false); // New thread has no messages
    } catch (error) {
      console.error("[UI] Error creating thread:", error);
      alert(`Error creating thread: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [selectedModelId]);

  useEffect(() => {
    // Cleanup empty threads from previous sessions, then load threads
    cleanupEmptyThreads().then(() => loadThreads());
  }, [cleanupEmptyThreads, loadThreads]);

  // Auto-create a new thread on initial load if none exists
  useEffect(() => {
    // Only run after threads have loaded
    if (isLoadingThreads) return;
    
    // If there's already a current thread, do nothing
    if (currentThreadId) return;
    
    // Auto-create a new thread for better UX
    console.log("[UI] Auto-creating initial thread");
    handleNewThread();
  }, [isLoadingThreads, currentThreadId, handleNewThread]);

  // Refresh threads list periodically when a thread is active to catch title updates
  useEffect(() => {
    if (!currentThreadId) return;

    const interval = setInterval(() => {
      loadThreads();
    }, 3000); // Refresh every 3 seconds

    return () => clearInterval(interval);
  }, [currentThreadId, loadThreads]);

  const handleSelectThread = async (threadId: string) => {
    setCurrentThreadId(threadId);
    setIsSidebarOpen(false); // Close sidebar on mobile when selecting a thread
    // When clicking a thread from sidebar, it should remain visible
    // Only new chats created with "+ New Chat" button should be hidden
    
    // Check if this thread has messages to determine if model picker should be disabled
    try {
      const response = await fetch(`/api/threads/${threadId}/messages`);
      if (response.ok) {
        const data = await response.json();
        setCurrentThreadHasMessages(data.messages && data.messages.length > 0);
      }
    } catch (error) {
      console.error("[UI] Error checking thread messages:", error);
      // Assume it has messages if we can't check (safer to lock model)
      setCurrentThreadHasMessages(true);
    }
  };

  const handleDeleteThread = async (threadId: string) => {
    await fetch(`/api/threads/${threadId}`, { method: "DELETE" });
    setThreads(threads.filter((t) => t.id !== threadId));
    
    // If deleting the current thread, create a new one
    if (currentThreadId === threadId) {
      console.log("[UI] Deleted current thread, creating new one");
      setCurrentThreadId(null);
      setHiddenThreadId(null);
      setCurrentThreadHasMessages(false);
      // Small delay to ensure state updates
      setTimeout(() => handleNewThread(), 100);
    }
  };

  const handleModelChange = async (newModelId: string) => {
    setSelectedModelId(newModelId);
    
    // If we have a current thread with no messages, update its model_id in the database
    if (currentThreadId && !currentThreadHasMessages) {
      try {
        const response = await fetch(`/api/threads/${currentThreadId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ model_id: newModelId }),
        });
        
        if (response.ok) {
          // Update local state to reflect the change
          setThreads(threads.map(t => 
            t.id === currentThreadId ? { ...t, model_id: newModelId } : t
          ));
          console.log("[UI] Updated thread model to:", newModelId);
        } else {
          console.error("[UI] Failed to update thread model");
        }
      } catch (error) {
        console.error("[UI] Error updating thread model:", error);
      }
    }
  };

  return (
    <div className="flex h-[100dvh] bg-zinc-50 dark:bg-black relative">
      {/* Mobile backdrop overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        w-64 border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 flex flex-col h-[100dvh]
        fixed md:relative z-50 md:z-auto
        transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Fixed Header - New Chat Button */}
        <div className="p-4 flex-shrink-0">
          <button
            onClick={handleNewThread}
            className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            + New Chat
          </button>
        </div>

        {/* Scrollable Chat History */}
        <div className="flex-1 overflow-y-auto px-4 space-y-2">
          {isLoadingThreads ? (
            <p className="text-sm text-zinc-500">Loading threads...</p>
          ) : threads.filter((thread) => thread.id !== hiddenThreadId).length === 0 ? (
            <p className="text-sm text-zinc-500">No chat history yet</p>
          ) : (
            threads
              .filter((thread) => thread.id !== hiddenThreadId) // Hide only the "new chat" that hasn't been promoted yet
              .map((thread) => {
              const isActive = currentThreadId === thread.id; // Highlight the current thread if it's visible
              return (
                <div
                  key={thread.id}
                  className={`group flex items-center justify-between rounded-lg p-2 transition cursor-pointer ${
                    isActive
                      ? "bg-zinc-100 dark:bg-zinc-800"
                      : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  }`}
                  onClick={() => handleSelectThread(thread.id)}
                >
                  <span className="truncate text-sm text-zinc-900 dark:text-white">
                    {thread.title}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteThread(thread.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-xs text-red-600 hover:text-red-800"
                  >
                    ✕
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Fixed Footer - Sign Out Button */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-700 flex-shrink-0">
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Sign Out
            </button>
          </form>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header bar with model picker */}
        <div className="p-3 bg-background flex-shrink-0 flex items-center gap-3">
          {/* Hamburger menu button - mobile only */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition flex-shrink-0"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
          </button>

          {/* Model selector */}
          <div className="min-w-0 max-w-xs">
            <ModelPicker
              selectedModelId={currentThreadModelId || selectedModelId}
              onModelChange={handleModelChange}
              disabled={!!currentThreadId && currentThreadHasMessages}
            />
          </div>

          {/* New chat button - mobile only */}
          <button
            onClick={handleNewThread}
            className="md:hidden p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition flex-shrink-0 ml-auto"
            aria-label="New chat"
          >
            <Plus className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
          </button>
        </div>

        {/* Chat content */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {currentThreadId ? (
            <ChatThread 
              key={currentThreadId} 
              threadId={currentThreadId}
              onMessageSent={() => setCurrentThreadHasMessages(true)}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-zinc-500">
              <p>Select a thread or create a new one to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
