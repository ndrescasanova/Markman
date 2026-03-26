/**
 * POST /api/webhooks/stripe
 *
 * CRITICAL: body MUST be read as raw text BEFORE constructEvent().
 * JSON parsing before verification corrupts the signature and fails silently. (CRITICAL-1)
 *
 * Events handled:
 *  - invoice.paid → activate subscription (idempotent — skips if already active)
 *  - customer.subscription.deleted → deactivate subscription
 *  - customer.subscription.updated → sync status
 */

import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

let _stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-02-25.clover",
    });
  }
  return _stripe;
}

export async function POST(request: Request) {
  // CRITICAL: read as text BEFORE any parsing (CRITICAL-1)
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${(err as Error).message}` },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  switch (event.type) {
    case "invoice.paid": {
      const invoice = event.data.object as unknown as {
        customer: string;
        subscription: string;
        created: number;
      };

      // Idempotency: skip if subscription already active (HIGH-5)
      const { data: existing } = await admin
        .from("subscriptions")
        .select("id, status, updated_at")
        .eq("stripe_customer_id", invoice.customer)
        .maybeSingle();

      if (existing?.status === "active") {
        // Check if this is a newer event to avoid reprocessing old webhooks
        const existingTs = existing.updated_at
          ? new Date(existing.updated_at).getTime() / 1000
          : 0;
        if (invoice.created <= existingTs) break;
      }

      await admin
        .from("subscriptions")
        .upsert(
          {
            stripe_customer_id: invoice.customer,
            stripe_subscription_id: invoice.subscription,
            status: "active",
            plan: "founder_annual",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "stripe_customer_id" }
        );
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as unknown as { customer: string };
      await admin
        .from("subscriptions")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("stripe_customer_id", sub.customer);
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as unknown as {
        customer: string;
        status: string;
        current_period_end: number;
      };

      const status =
        sub.status === "active"
          ? "active"
          : sub.status === "past_due"
          ? "past_due"
          : sub.status === "canceled"
          ? "cancelled"
          : "inactive";

      await admin
        .from("subscriptions")
        .update({
          status,
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_customer_id", sub.customer);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
