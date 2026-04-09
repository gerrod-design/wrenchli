ALTER TABLE public.ad_click_events
ADD CONSTRAINT ad_click_events_destination_check
CHECK (destination IN ('amazon', 'rockauto', 'autozone', 'orielly', 'other'));