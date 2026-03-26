"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { generateThreadId } from "@/lib/messages/thread";

interface Message {
  id: string;
  thread_id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

interface Props {
  currentUser: { id: string; displayName: string };
  partners: { id: string; displayName: string }[];
}

export default function MessagesClient({ currentUser, partners }: Props) {
  const [selectedPartner, setSelectedPartner] = useState(partners[0] ?? null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const realtimeRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const threadId = selectedPartner
    ? generateThreadId(currentUser.id, selectedPartner.id)
    : null;

  const fetchMessages = useCallback(async () => {
    if (!threadId) return;
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("thread_id", threadId)
      .or(`sender_id.eq.${currentUser.id},recipient_id.eq.${currentUser.id}`)
      .order("created_at", { ascending: true });

    if (data) setMessages(data);
  }, [threadId, currentUser.id, supabase]);

  // Mark messages as read
  const markRead = useCallback(async () => {
    if (!threadId || !selectedPartner) return;
    await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("thread_id", threadId)
      .eq("recipient_id", currentUser.id)
      .is("read_at", null);
  }, [threadId, currentUser.id, selectedPartner, supabase]);

  useEffect(() => {
    if (!threadId) return;

    fetchMessages();
    markRead();

    // Realtime subscription
    const channel = supabase
      .channel(`messages:${threadId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `thread_id=eq.${threadId}`,
        },
        (payload) => {
          setMessages((prev) => {
            if (prev.find((m) => m.id === payload.new.id)) return prev;
            return [...prev, payload.new as Message];
          });
          markRead();
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          // Realtime connected — clear polling fallback
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          // Realtime failed — start 5s polling fallback
          if (!pollingRef.current) {
            pollingRef.current = setInterval(fetchMessages, 5000);
          }
        }
      });

    realtimeRef.current = channel;

    // Start polling as fallback — Realtime will cancel it on connect
    pollingRef.current = setInterval(fetchMessages, 5000);

    return () => {
      supabase.removeChannel(channel);
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [threadId, fetchMessages, markRead, supabase]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !selectedPartner) return;

    setSending(true);
    await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient_id: selectedPartner.id,
        content: newMessage.trim(),
      }),
    });

    setNewMessage("");
    setSending(false);
    fetchMessages();
  }

  if (partners.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-sm font-medium text-[#0A1628]">No conversations yet</p>
        <p className="text-xs text-[#9CA3AF] mt-1">
          Messages will appear here once you are connected with an attorney or client.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-[600px] border border-[#E5E7EB] rounded-lg overflow-hidden bg-white">
      {/* Partner list */}
      <div className="w-56 border-r border-[#E5E7EB] flex-shrink-0">
        <div className="px-4 py-3 border-b border-[#E5E7EB]">
          <h2 className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">
            Messages
          </h2>
        </div>
        <ul>
          {partners.map((partner) => (
            <li key={partner.id}>
              <button
                onClick={() => setSelectedPartner(partner)}
                className={`w-full text-left px-4 py-3 text-sm hover:bg-[#F9FAFB] transition-colors ${
                  selectedPartner?.id === partner.id
                    ? "bg-[#EFF6FF] text-[#1D4ED8] font-medium"
                    : "text-[#0A1628]"
                }`}
              >
                {partner.displayName}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Message thread */}
      <div className="flex-1 flex flex-col">
        <div className="px-4 py-3 border-b border-[#E5E7EB]">
          <p className="text-sm font-medium text-[#0A1628]">
            {selectedPartner?.displayName}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <p className="text-center text-xs text-[#9CA3AF] pt-8">
              No messages yet. Send the first one.
            </p>
          ) : (
            messages.map((msg) => {
              const isOwn = msg.sender_id === currentUser.id;
              return (
                <div
                  key={msg.id}
                  className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                      isOwn
                        ? "bg-[#2563EB] text-white"
                        : "bg-[#F3F4F6] text-[#0A1628]"
                    }`}
                  >
                    <p>{msg.content}</p>
                    <p
                      className={`text-[10px] mt-1 ${
                        isOwn ? "text-blue-200" : "text-[#9CA3AF]"
                      }`}
                    >
                      {new Date(msg.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <form
          onSubmit={handleSend}
          className="border-t border-[#E5E7EB] px-4 py-3 flex gap-2"
        >
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message…"
            className="flex-1 px-3 py-2 text-sm border border-[#E5E7EB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className="px-3 py-2 bg-[#2563EB] text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
