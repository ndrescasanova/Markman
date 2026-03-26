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

    const channel = supabase
      .channel(`messages:${threadId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `thread_id=eq.${threadId}` },
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
          if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          if (!pollingRef.current) pollingRef.current = setInterval(fetchMessages, 5000);
        }
      });

    pollingRef.current = setInterval(fetchMessages, 5000);
    return () => {
      supabase.removeChannel(channel);
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [threadId, fetchMessages, markRead, supabase]);

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
      body: JSON.stringify({ recipient_id: selectedPartner.id, content: newMessage.trim() }),
    });
    setNewMessage("");
    setSending(false);
    fetchMessages();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e as unknown as React.FormEvent);
    }
  }

  if (partners.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center py-16 gap-3">
        {/* Envelope icon */}
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
          stroke="#9CA3AF" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </svg>
        <p className="text-[15px] font-[600] text-[#0A1628]">No conversations yet</p>
        <p className="text-[13px] text-[#9CA3AF] max-w-xs">
          Messages will appear here once you are connected with an attorney or client.
        </p>
      </div>
    );
  }

  // Group messages by date for transcript style
  const grouped: { date: string; msgs: Message[] }[] = [];
  for (const msg of messages) {
    const date = new Date(msg.created_at).toLocaleDateString("en-US", {
      month: "long", day: "numeric", year: "numeric",
    });
    const last = grouped[grouped.length - 1];
    if (last && last.date === date) {
      last.msgs.push(msg);
    } else {
      grouped.push({ date, msgs: [msg] });
    }
  }

  return (
    <div
      className="flex border border-[#E5E7EB] rounded-lg overflow-hidden bg-white"
      style={{ height: "calc(100vh - 200px)", minHeight: 400 }}
    >
      {/* ── Thread list ── */}
      {partners.length > 1 && (
        <div className="w-[200px] shrink-0 border-r border-[#E5E7EB] flex flex-col">
          <div className="px-4 py-3.5 border-b border-[#E5E7EB]">
            <p className="text-[11px] font-[600] tracking-[0.06em] uppercase text-[#6B7280]">
              Conversations
            </p>
          </div>
          <ul className="flex-1 overflow-y-auto">
            {partners.map((partner) => (
              <li key={partner.id}>
                <button
                  onClick={() => setSelectedPartner(partner)}
                  className={`w-full text-left px-4 py-3 text-[13px] transition-colors border-l-2 ${
                    selectedPartner?.id === partner.id
                      ? "border-[#2563EB] text-[#2563EB] font-[500] bg-[#F9FAFB]"
                      : "border-transparent text-[#0A1628] hover:bg-[#F9FAFB]"
                  }`}
                >
                  {partner.displayName}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Message thread ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="px-6 py-3.5 border-b border-[#E5E7EB]">
          <p className="text-[14px] font-[500] text-[#0A1628]">
            {selectedPartner?.displayName}
          </p>
        </div>

        {/* Transcript */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-1">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center gap-2">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                stroke="#9CA3AF" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              <p className="text-[13px] text-[#9CA3AF]">No messages yet. Start the conversation below.</p>
            </div>
          ) : (
            grouped.map(({ date, msgs }) => (
              <div key={date}>
                {/* Date divider */}
                <div className="flex items-center gap-3 py-3">
                  <div className="flex-1 h-px bg-[#F3F4F6]" />
                  <span className="text-[11px] text-[#9CA3AF]">{date}</span>
                  <div className="flex-1 h-px bg-[#F3F4F6]" />
                </div>
                {/* Messages in this group — transcript style, no bubbles */}
                {msgs.map((msg) => {
                  const isOwn = msg.sender_id === currentUser.id;
                  const time = new Date(msg.created_at).toLocaleTimeString([], {
                    hour: "2-digit", minute: "2-digit",
                  });
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 py-1 ${isOwn ? "justify-end" : "justify-start"}`}
                    >
                      {/* Transcript style: left-align other, right-align own. No colored bubbles. */}
                      <div className={`max-w-[70%] space-y-0.5 ${isOwn ? "items-end" : "items-start"} flex flex-col`}>
                        <p className={`text-[14px] leading-relaxed ${isOwn ? "text-[#6B7280]" : "text-[#0A1628]"}`}>
                          {msg.content}
                        </p>
                        <p className="text-[11px] text-[#9CA3AF]">{time}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Composer */}
        <form onSubmit={handleSend} className="border-t border-[#E5E7EB] px-5 py-3 flex gap-2.5 items-end">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message…"
            rows={1}
            maxLength={2000}
            aria-label={`Message ${selectedPartner?.displayName}`}
            className="flex-1 px-3 py-2.5 text-[14px] text-[#0A1628] border border-[#E5E7EB] rounded-md
              focus:outline-none focus:ring-2 focus:ring-[#2563EB] resize-none
              placeholder:text-[#9CA3AF] min-h-[40px] max-h-[96px]"
            disabled={sending}
            style={{ lineHeight: "1.5" }}
          />
          <button
            type="submit"
            disabled={sending || !newMessage.trim()}
            aria-label="Send message"
            className="h-10 px-4 bg-[#2563EB] text-white text-[13px] font-[500] rounded-md
              hover:bg-blue-700 disabled:opacity-40 transition-colors shrink-0"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
