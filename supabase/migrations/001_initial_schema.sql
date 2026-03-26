-- ============================================================
-- Markman Phase 1 — Initial Schema
-- Run once in the Supabase SQL editor (or via supabase db push)
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. USERS
-- Extends auth.users. Trigger auto-creates this row on signup.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
  id               UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email            TEXT NOT NULL,
  display_name     TEXT,
  firm_name        TEXT,                        -- attorneys only
  role             TEXT NOT NULL DEFAULT 'founder'
                     CHECK (role IN ('founder', 'attorney')),
  last_cron_synced_at TIMESTAMPTZ,              -- cursor for TODO-007 paginated cron
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Auto-create users row on Supabase auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'founder')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ─────────────────────────────────────────────────────────────
-- 2. ATTORNEY_CLIENTS
-- M2M: attorney ↔ founder. Defined before trademarks for FK order.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.attorney_clients (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attorney_id  UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  client_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  last_viewed_at TIMESTAMPTZ,                   -- set when attorney views client detail
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (attorney_id, client_id)
);

ALTER TABLE public.attorney_clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ac_select_own" ON public.attorney_clients
  FOR SELECT USING (attorney_id = auth.uid() OR client_id = auth.uid());

CREATE POLICY "ac_insert_attorney" ON public.attorney_clients
  FOR INSERT WITH CHECK (attorney_id = auth.uid());

CREATE POLICY "ac_delete_attorney" ON public.attorney_clients
  FOR DELETE USING (attorney_id = auth.uid());

CREATE INDEX idx_attorney_clients_attorney ON public.attorney_clients (attorney_id);
CREATE INDEX idx_attorney_clients_client ON public.attorney_clients (client_id);

-- Attorneys can read their clients' user rows (defined here because attorney_clients must exist first)
CREATE POLICY "users_select_as_attorney" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.attorney_clients ac
      WHERE ac.attorney_id = auth.uid()
        AND ac.client_id = users.id
    )
  );

-- Founders can read their attorney's user row (for messaging sidebar)
CREATE POLICY "users_select_as_client" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.attorney_clients ac
      WHERE ac.client_id = auth.uid()
        AND ac.attorney_id = users.id
    )
  );


-- ─────────────────────────────────────────────────────────────
-- 3. TRADEMARKS
-- One row per mark per founder. Synced from USPTO TSDR daily.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.trademarks (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  serial_number       TEXT NOT NULL,             -- 7-8 digit USPTO serial
  registration_number TEXT,                      -- null for pending marks
  mark_name           TEXT NOT NULL,
  status              TEXT NOT NULL DEFAULT 'PENDING'
                        CHECK (status IN (
                          'PENDING', 'REGISTERED', 'ABANDONED',
                          'OFFICE_ACTION', 'CANCELLED', 'UNKNOWN'
                        )),
  expiration_date     DATE,                      -- null for pending; from TSDR
  owner_name          TEXT,
  goods_services      TEXT,
  international_class TEXT,                      -- comma-separated class numbers
  -- TSDR abstraction layer (D3) — one place to update if USPTO format changes
  sync_status         TEXT NOT NULL DEFAULT 'pending'
                        CHECK (sync_status IN ('ok', 'error', 'pending')),
  sync_error          TEXT,                      -- last error message, cleared on success
  last_synced_at      TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, serial_number)
);

ALTER TABLE public.trademarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trademarks_select_own" ON public.trademarks
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "trademarks_insert_own" ON public.trademarks
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "trademarks_update_own" ON public.trademarks
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "trademarks_delete_own" ON public.trademarks
  FOR DELETE USING (user_id = auth.uid());

-- Attorneys can read/insert trademarks for their clients
CREATE POLICY "trademarks_select_as_attorney" ON public.trademarks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.attorney_clients ac
      WHERE ac.attorney_id = auth.uid()
        AND ac.client_id = trademarks.user_id
    )
  );

CREATE POLICY "trademarks_insert_as_attorney" ON public.trademarks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.attorney_clients ac
      WHERE ac.attorney_id = auth.uid()
        AND ac.client_id = trademarks.user_id
    )
  );

CREATE INDEX idx_trademarks_user ON public.trademarks (user_id);
CREATE INDEX idx_trademarks_serial ON public.trademarks (serial_number);
CREATE INDEX idx_trademarks_status ON public.trademarks (status);
CREATE INDEX idx_trademarks_expiration ON public.trademarks (expiration_date)
  WHERE expiration_date IS NOT NULL;


-- ─────────────────────────────────────────────────────────────
-- 4. INVITES
-- Attorney creates invite token → founder signs up via /invite/[token]
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.invites (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attorney_id  UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  client_email TEXT NOT NULL,
  token        TEXT NOT NULL UNIQUE DEFAULT gen_random_uuid()::TEXT,
  used_at      TIMESTAMPTZ,                      -- null = not yet used
  expires_at   TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '72 hours'),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invites_select_attorney" ON public.invites
  FOR SELECT USING (attorney_id = auth.uid());

CREATE POLICY "invites_insert_attorney" ON public.invites
  FOR INSERT WITH CHECK (attorney_id = auth.uid());

CREATE POLICY "invites_delete_attorney" ON public.invites
  FOR DELETE USING (attorney_id = auth.uid());

CREATE INDEX idx_invites_attorney ON public.invites (attorney_id);
CREATE INDEX idx_invites_token ON public.invites (token);


-- ─────────────────────────────────────────────────────────────
-- 5. SUBSCRIPTIONS
-- One row per founder. Attorneys never have a row (always free).
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  stripe_customer_id       TEXT,
  stripe_subscription_id   TEXT,
  status                   TEXT NOT NULL DEFAULT 'inactive'
                             CHECK (status IN (
                               'active', 'inactive', 'past_due', 'cancelled'
                             )),
  plan                     TEXT NOT NULL DEFAULT 'free',
  current_period_end       TIMESTAMPTZ,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscriptions_select_own" ON public.subscriptions
  FOR SELECT USING (user_id = auth.uid());

-- No INSERT/UPDATE from clients — service role only (Stripe webhook handler)

CREATE INDEX idx_subscriptions_stripe_customer ON public.subscriptions (stripe_customer_id);
CREATE INDEX idx_subscriptions_stripe_sub ON public.subscriptions (stripe_subscription_id);


-- ─────────────────────────────────────────────────────────────
-- 6. SCORE_HISTORY
-- Append-only. No seed row. No client inserts (service role only).
-- null score → "Add your first trademark to see your score"
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.score_history (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  score       INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.score_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "score_history_select_own" ON public.score_history
  FOR SELECT USING (user_id = auth.uid());

-- Attorneys can read their clients' score history
CREATE POLICY "score_history_select_as_attorney" ON public.score_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.attorney_clients ac
      WHERE ac.attorney_id = auth.uid()
        AND ac.client_id = score_history.user_id
    )
  );

-- No INSERT policy for authenticated users — service role only

CREATE INDEX idx_score_history_user ON public.score_history (user_id, computed_at DESC);


-- ─────────────────────────────────────────────────────────────
-- 7. MESSAGES
-- thread_id = UUID v5 (deterministic from sorted attorney+founder UUIDs)
-- Generated server-side only (lib/messages/thread.ts)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.messages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id    UUID NOT NULL,
  sender_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content      TEXT NOT NULL,
  read_at      TIMESTAMPTZ,                      -- null = unread
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- F-15: Explicit sender_id/recipient_id filter — not relying on RLS alone
CREATE POLICY "messages_select_participant" ON public.messages
  FOR SELECT USING (
    sender_id = auth.uid() OR recipient_id = auth.uid()
  );

CREATE POLICY "messages_insert_sender" ON public.messages
  FOR INSERT WITH CHECK (sender_id = auth.uid());

CREATE POLICY "messages_update_recipient" ON public.messages
  FOR UPDATE USING (recipient_id = auth.uid());  -- for marking read_at

CREATE INDEX idx_messages_thread ON public.messages (thread_id, created_at ASC);
CREATE INDEX idx_messages_recipient_unread ON public.messages (recipient_id, read_at)
  WHERE read_at IS NULL;


-- ─────────────────────────────────────────────────────────────
-- 8. NOTIFICATIONS
-- Email send log for deduplication.
-- F-06: Unique per (user, event_type, COALESCE(serial_number,''), date UTC)
-- Milestone emails have serial_number=NULL → deduped per-day per-user
-- Renewal emails have serial_number set → deduped per-trademark per-day
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  event_type   TEXT NOT NULL
                 CHECK (event_type IN (
                   'renewal_30d', 'renewal_7d', 'milestone', 'message', 'invite'
                 )),
  serial_number TEXT,                            -- null for milestone/message/invite events
  sent_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

-- No INSERT policy for clients — service role only

-- Deduplication index (F-06)
CREATE UNIQUE INDEX notifications_dedup ON public.notifications (
  user_id,
  event_type,
  COALESCE(serial_number, ''),
  DATE(sent_at AT TIME ZONE 'UTC')
);

CREATE INDEX idx_notifications_user ON public.notifications (user_id, sent_at DESC);


-- ─────────────────────────────────────────────────────────────
-- 9. OFFICE_ACTIONS
-- Phase 2 only: table created now to avoid breaking migration later (E4).
-- Do NOT populate this table or deduct from score until Phase 2.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.office_actions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trademark_id  UUID NOT NULL REFERENCES public.trademarks(id) ON DELETE CASCADE,
  action_type   TEXT NOT NULL,                   -- e.g. 'OFFICE_ACTION', 'EXTENSION_OF_TIME'
  deadline      DATE,
  response_text TEXT,
  status        TEXT NOT NULL DEFAULT 'open'
                  CHECK (status IN ('open', 'responded', 'closed')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.office_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "office_actions_select_via_trademark" ON public.office_actions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.trademarks t
      WHERE t.id = office_actions.trademark_id
        AND t.user_id = auth.uid()
    )
  );

CREATE INDEX idx_office_actions_trademark ON public.office_actions (trademark_id);


-- ─────────────────────────────────────────────────────────────
-- 10. BULK COMMIT RPC FUNCTION (F-12)
-- All-or-nothing transaction for bulk trademark import.
-- SECURITY DEFINER so it runs as the function owner (bypasses RLS).
-- Called by the bulk-commit API route using the service role key.
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.bulk_commit_trademarks(
  p_rows JSONB
)
RETURNS TABLE (serial_number TEXT, result TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  r            JSONB;
  v_serial     TEXT;
  v_user_id    UUID;
BEGIN
  FOR r IN SELECT * FROM jsonb_array_elements(p_rows) LOOP
    v_serial  := r->>'serial_number';
    v_user_id := (r->>'user_id')::UUID;

    INSERT INTO public.trademarks (
      user_id,
      serial_number,
      registration_number,
      mark_name,
      status,
      expiration_date,
      owner_name,
      goods_services,
      international_class,
      sync_status,
      last_synced_at
    ) VALUES (
      v_user_id,
      v_serial,
      NULLIF(r->>'registration_number', ''),
      COALESCE(r->>'mark_name', 'Unknown'),
      COALESCE(r->>'status', 'UNKNOWN'),
      CASE
        WHEN r->>'expiration_date' IS NOT NULL AND r->>'expiration_date' != ''
        THEN (r->>'expiration_date')::DATE
        ELSE NULL
      END,
      r->>'owner_name',
      r->>'goods_services',
      r->>'international_class',
      'ok',
      NOW()
    )
    ON CONFLICT (user_id, serial_number) DO NOTHING;

    RETURN QUERY SELECT v_serial, 'inserted'::TEXT;
  END LOOP;
END;
$$;


-- ─────────────────────────────────────────────────────────────
-- 11. REALTIME — enable for live messaging
-- ─────────────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
