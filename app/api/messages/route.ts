/**
 * GET  /api/messages?thread_id=...  — fetch messages for a thread
 * POST /api/messages                — send a message
 *
 * F-15: Route explicitly filters sender_id OR recipient_id = auth user.
 * Thread_id generated server-side only (lib/messages/thread.ts).
 */

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateThreadId } from "@/lib/messages/thread";
import { sendMessageNotification } from "@/lib/email/resend";
import { NextResponse } from "next/server";

const MESSAGE_NOTIFICATION_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour (HIGH-4)
const READ_RECENCY_WINDOW_MS = 5 * 60 * 1000;            // 5 minutes (HIGH-4)

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const threadId = searchParams.get("thread_id");

  if (!threadId) {
    return NextResponse.json({ error: "Missing thread_id" }, { status: 400 });
  }

  // F-15: explicit participant filter (defense in depth beyond RLS)
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("thread_id", threadId)
    .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { recipient_id: string; content: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { recipient_id, content } = body;

  if (!recipient_id || !content?.trim()) {
    return NextResponse.json({ error: "recipient_id and content are required" }, { status: 400 });
  }

  // Generate deterministic thread_id (server-side only — F-08)
  const threadId = generateThreadId(user.id, recipient_id);

  const { data: message, error: insertError } = await supabase
    .from("messages")
    .insert({
      thread_id: threadId,
      sender_id: user.id,
      recipient_id,
      content: content.trim(),
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }

  // Rate-limited email notification (HIGH-4)
  await maybeNotifyRecipient(recipient_id, user.id, content);

  return NextResponse.json(message, { status: 201 });
}

async function maybeNotifyRecipient(
  recipientId: string,
  senderId: string,
  content: string
) {
  const admin = createAdminClient();
  const now = Date.now();

  // Check if recipient read the thread recently (within 5 min — they're active)
  const { data: recentRead } = await admin
    .from("messages")
    .select("read_at")
    .eq("recipient_id", recipientId)
    .eq("sender_id", senderId)
    .not("read_at", "is", null)
    .order("read_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (recentRead?.read_at) {
    const readAge = now - new Date(recentRead.read_at).getTime();
    if (readAge < READ_RECENCY_WINDOW_MS) return; // Active user — skip email
  }

  // Check if we already sent a notification in the last hour
  const { data: recentNotif } = await admin
    .from("notifications")
    .select("sent_at")
    .eq("user_id", recipientId)
    .eq("event_type", "message")
    .order("sent_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (recentNotif?.sent_at) {
    const age = now - new Date(recentNotif.sent_at).getTime();
    if (age < MESSAGE_NOTIFICATION_COOLDOWN_MS) return; // Cooldown active
  }

  // Get recipient email and sender name
  const { data: userRows } = await admin
    .from("users")
    .select("id, email, display_name")
    .in("id", [recipientId, senderId]);

  const users = userRows ?? [];
  if (users.length < 2) return;

  const recipientUser = users.find((u) => u.id === recipientId);
  const senderUser = users.find((u) => u.id === senderId);

  if (!recipientUser?.email || !senderUser) return;

  // Send notification (fire and forget)
  sendMessageNotification({
    to: recipientUser.email,
    senderName: senderUser.display_name || senderUser.email,
    messagePreview: content.slice(0, 80),
  }).catch(() => {}); // Don't fail the request if email fails

  // Log notification for dedup
  await admin
    .from("notifications")
    .insert({
      user_id: recipientId,
      event_type: "message",
      serial_number: null,
    })
    .throwOnError();
}
