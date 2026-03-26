import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Lazy-init Stripe to avoid build failures without env vars
  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-02-25.clover",
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (!process.env.STRIPE_PRICE_ID || !process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: "Stripe is not configured yet. Please add STRIPE_SECRET_KEY and STRIPE_PRICE_ID." },
      { status: 503 }
    );
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      client_reference_id: user.id,
      customer_email: user.email,
      success_url: `${appUrl}/upgrade?subscribed=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/upgrade`,
      metadata: {
        user_id: user.id,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json(
      { error: "Failed to create checkout session. Please try again." },
      { status: 500 }
    );
  }
}
