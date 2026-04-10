
CREATE TABLE public.webhook_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  status text DEFAULT 'pending' NOT NULL,
  attempts integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  sent_at timestamptz
);

CREATE INDEX idx_webhook_queue_status ON public.webhook_queue(status);

ALTER TABLE public.webhook_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages webhook queue"
  ON public.webhook_queue
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
